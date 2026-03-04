import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Trash2, UserX, UserCheck, Search, Filter, Eye, Edit, Phone, Mail, Calendar, DollarSign, FileText, XCircle, TrendingUp, Download, Clock, RefreshCw } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { createPDFDocument, addTable, addFormattedTable, addSummarySection, addFooter, savePDF, formatCurrency, formatDate, formatDateTime, formatDateTimeFull, exportToExcel } from '../utils/pdfExport'
import { UserContext } from '../App'
import { PERMISSIONS, hasPermission } from '../utils/permissions'

function GroupAdminMembers() {
  const navigate = useNavigate()
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tForms } = useTranslation('forms')
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showMemberDetails, setShowMemberDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [groupId, setGroupId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0) // Force re-render trigger
  const { user } = useContext(UserContext)

  const loadMembers = async () => {
    try {
      setLoading(true)
      const me = await api.get('/auth/me')
      const gid = me.data?.data?.groupId
      if (!gid) return
      setGroupId(gid)

      const groupRes = await api.get(`/groups/${gid}`)
      if (groupRes.data?.success) {
        const groupMembers = (groupRes.data.data.members || [])
          .filter(m => m.role === 'Member' || m.role === 'Secretary' || m.role === 'Cashier')
          .map(m => ({
            id: m.id,
            name: m.name,
            phone: m.phone || '',
            email: m.email || '',
            nationalId: m.nationalId || '',
            joinDate: m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : '',
            status: (m.status || 'active').toLowerCase(),
            totalSavings: Number(m.totalSavings || 0),
            activeLoans: 0, // Will calculate from loans
            contributionHistory: 'good', // Will calculate from contributions
            lastContribution: null
          }))
        setMembers(groupMembers)
      }
    } catch (e) {
      console.error('Failed to load members:', e)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    if (mounted) {
      loadMembers()
    }
    return () => { mounted = false }
  }, [])

  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    nationalId: '',
    dateOfBirth: '',
    location: '',
    password: '',
    confirmPassword: ''
  })
  const [validationErrors, setValidationErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'burned': return 'bg-red-100 text-red-700'
      case 'inactive': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredMembers = members.filter(member => {
    // Status filter
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus

    // Search filter
    const matchesSearch = !searchTerm || (
      (member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.phone || '').includes(searchTerm) ||
      String(member.id || '').includes(searchTerm) ||
      (member.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.nationalId || '').includes(searchTerm)
    )

    return matchesStatus && matchesSearch
  })

  const validateForm = () => {
    const errors = {}

    // First name validation
    if (!newMember.firstName || !newMember.firstName.trim()) {
      errors.firstName = 'First name is required'
    }

    // Last name validation
    if (!newMember.lastName || !newMember.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }

    // Phone validation - must be exactly 10 digits
    if (!newMember.phone || !newMember.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else {
      const phoneDigits = newMember.phone.replace(/\D/g, '')
      if (phoneDigits.length !== 10) {
        errors.phone = 'Phone number must be exactly 10 digits'
      }
    }

    // National ID validation - must be exactly 16 digits
    if (!newMember.nationalId || !newMember.nationalId.trim()) {
      errors.nationalId = 'National ID is required'
    } else {
      const nationalIdDigits = newMember.nationalId.replace(/\D/g, '')
      if (nationalIdDigits.length !== 16) {
        errors.nationalId = 'National ID must be exactly 16 digits'
      }
    }

    // Date of birth validation - must not be future and must be at least 10 years old
    if (!newMember.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required'
    } else {
      const birthDate = new Date(newMember.dateOfBirth)
      const today = new Date()
      const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate())

      if (birthDate > today) {
        errors.dateOfBirth = 'Date of birth cannot be in the future'
      } else if (birthDate > tenYearsAgo) {
        errors.dateOfBirth = 'Member must be at least 10 years old'
      }
    }

    // Location validation
    if (!newMember.location || !newMember.location.trim()) {
      errors.location = 'Location is required'
    }

    // Password validation
    if (!newMember.password || !newMember.password.trim()) {
      errors.password = 'Password is required'
    } else if (newMember.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long'
    }

    // Confirm password validation
    if (!newMember.confirmPassword || !newMember.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (newMember.password !== newMember.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddMember = async () => {
    // Validate form
    if (!validateForm()) {
      alert('Please fix the validation errors before submitting')
      return
    }

    if (!groupId) {
      alert(tCommon('groupIdNotFound', { defaultValue: 'Group ID not found. Please refresh the page.' }))
      return
    }

    setSubmitting(true)
    try {
      // Generate email from firstname.lastname format (sanitize for valid email)
      const sanitizeForEmail = (str) => {
        return str.toLowerCase()
          .trim()
          .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
          .substring(0, 50) // Limit length
      }
      const firstNameClean = sanitizeForEmail(newMember.firstName) || 'user'
      const lastNameClean = sanitizeForEmail(newMember.lastName) || 'member'
      const email = `${firstNameClean}.${lastNameClean}@umurengewallet.com`

      // Create member via system-admin/users endpoint
      const { data } = await api.post('/system-admin/users', {
        name: `${newMember.firstName.trim()} ${newMember.lastName.trim()}`,
        phone: newMember.phone.replace(/\D/g, ''),
        email: email,
        nationalId: newMember.nationalId.replace(/\D/g, ''),
        password: newMember.password,
        role: 'Member',
        groupId: groupId,
        address: newMember.location,
        dateOfBirth: newMember.dateOfBirth ? new Date(newMember.dateOfBirth).toISOString() : null
      })

      if (!data?.success) {
        throw new Error(data?.message || 'Failed to create member')
      }

      alert(t('memberCreatedSuccessfully', {
        defaultValue: 'Member created successfully!\n\nA welcome email with login credentials has been sent to the member.',
        email: email,
        password: newMember.password
      }))

      setShowAddMember(false)
      setNewMember({
        firstName: '',
        lastName: '',
        phone: '',
        nationalId: '',
        dateOfBirth: '',
        location: '',
        password: '',
        confirmPassword: ''
      })
      setValidationErrors({})

      // Reload members list
      const groupRes = await api.get(`/groups/${groupId}`)
      if (groupRes.data?.success) {
        const groupMembers = (groupRes.data.data.members || [])
          .filter(m => m.role === 'Member' || m.role === 'Secretary' || m.role === 'Cashier')
          .map(m => ({
            id: m.id,
            name: m.name,
            phone: m.phone || '',
            email: m.email || '',
            nationalId: m.nationalId || '',
            joinDate: m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : '',
            status: (m.status || 'active').toLowerCase(),
            totalSavings: Number(m.totalSavings || 0),
            activeLoans: 0,
            contributionHistory: 'good',
            lastContribution: null
          }))
        setMembers(groupMembers)
      }
    } catch (err) {
      console.error('Failed to create member:', err)
      alert(err.response?.data?.message || err.message || t('failedToCreateMember', { defaultValue: 'Failed to create member. Please try again.' }))
    } finally {
      setSubmitting(false)
    }
  }

  const handleBurnMember = async (memberId) => {
    const member = members.find(m => m.id === memberId || m.id === parseInt(memberId) || String(m.id) === String(memberId))
    if (!member) {
      console.error('[handleBurnMember] Member not found:', memberId, 'Available members:', members.map(m => ({ id: m.id, type: typeof m.id })))
      return
    }

    const confirmMessage = `⚠️ WARNING: This will burn (suspend) the account for ${member.name}.\n\nThey will not be able to access their account, make contributions, or apply for loans.\n\nAre you sure you want to proceed?`
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setLoading(true)
      const response = await api.put(`/groups/members/${memberId}/burn`, { action: 'burn' })

      if (response.data?.success) {
        // Immediately reload members from backend to get updated status
        await loadMembers()

        // Force a re-render by updating refresh key
        setRefreshKey(prev => prev + 1)

        alert(t('memberAccountBurned', { defaultValue: 'Member account burned successfully! Email and notifications have been sent.' }))
      } else {
        throw new Error(response.data?.message || 'Failed to burn account')
      }
    } catch (error) {
      console.error('[handleBurnMember] Error:', error)
      alert(error?.response?.data?.message || error.message || t('failedToBurnAccount', { defaultValue: 'Failed to burn account. Please try again.' }))
    } finally {
      setLoading(false)
    }
  }

  const handleUnburnMember = async (memberId) => {
    const member = members.find(m => m.id === memberId || m.id === parseInt(memberId) || String(m.id) === String(memberId))
    if (!member) {
      console.error('[handleUnburnMember] Member not found:', memberId, 'Available members:', members.map(m => ({ id: m.id, type: typeof m.id })))
      return
    }

    const confirmMessage = `Are you sure you want to reactivate the account for ${member.name}?`
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setLoading(true)
      const response = await api.put(`/groups/members/${memberId}/burn`, { action: 'unburn' })

      if (response.data?.success) {
        // Immediately reload members from backend to get updated status
        await loadMembers()

        // Force a re-render by updating refresh key
        setRefreshKey(prev => prev + 1)

        alert(t('memberAccountReactivated', { defaultValue: 'Member account reactivated successfully! Email and notifications have been sent.' }))
      } else {
        throw new Error(response.data?.message || 'Failed to reactivate account')
      }
    } catch (error) {
      console.error('[handleUnburnMember] Error:', error)
      alert(error?.response?.data?.message || error.message || t('failedToReactivateAccount', { defaultValue: 'Failed to reactivate account. Please try again.' }))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMember = async (memberId) => {
    const member = members.find(m => m.id === memberId || m.id === parseInt(memberId) || String(m.id) === String(memberId))
    if (!member) {
      console.error('[handleDeleteMember] Member not found:', memberId)
      return
    }

    const confirmMessage = `⚠️ WARNING: Are you sure you want to DELETE ${member.name}?\n\nThis action cannot be undone. The member will be permanently removed from the group.\n\nAre you absolutely sure?`
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setLoading(true)
      // Use system-admin endpoint to delete user (Group Admin has permission)
      const response = await api.delete(`/system-admin/users/${memberId}`)

      if (response.data?.success) {
        // Remove member from list immediately
        setMembers(prevMembers => prevMembers.filter(m => {
          const mIdNum = typeof m.id === 'string' ? parseInt(m.id, 10) : m.id
          const targetIdNum = typeof memberId === 'string' ? parseInt(memberId, 10) : memberId
          return !(m.id === memberId || m.id === targetIdNum || mIdNum === targetIdNum || String(m.id) === String(memberId))
        }))

        // Force a re-render
        setRefreshKey(prev => prev + 1)

        // Reload members to sync with backend
        await loadMembers()

        alert(t('memberDeletedSuccessfully', { defaultValue: 'Member deleted successfully!' }))
      } else {
        throw new Error(response.data?.message || 'Failed to delete member')
      }
    } catch (error) {
      console.error('[handleDeleteMember] Error:', error)
      alert(error?.response?.data?.message || error.message || t('failedToDeleteMember', { defaultValue: 'Failed to delete member. Please try again.' }))
    } finally {
      setLoading(false)
    }
  }

  const handleViewMemberDetails = async (member) => {
    try {
      setLoading(true)
      console.log('[GroupAdminMembers] Loading member details for:', member.id)

      // Fetch full user details from backend
      const [userRes, loansRes, contributionsRes] = await Promise.allSettled([
        api.get(`/system-admin/users/${member.id}`),
        api.get(`/loans/member?memberId=${member.id}`).catch(() => ({ data: { success: false, data: [] } })),
        api.get(`/contributions/member?memberId=${member.id}`).catch(() => ({ data: { success: false, data: [] } }))
      ])

      let fullUserData = { ...member }

      if (userRes.status === 'fulfilled' && userRes.value.data?.success) {
        const userData = userRes.value.data.data
        fullUserData = {
          ...fullUserData,
          name: userData.name || member.name,
          phone: userData.phone || member.phone || '',
          email: userData.email || member.email || '',
          nationalId: userData.nationalId || member.nationalId || '',
          address: userData.address || '',
          occupation: userData.occupation || '',
          dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
          role: userData.role || 'Member',
          status: userData.status || member.status || 'active',
          creditScore: userData.creditScore || 0,
          createdAt: userData.createdAt ? new Date(userData.createdAt).toISOString().split('T')[0] : member.joinDate || '',
          language: userData.language || 'en',
          totalSavings: userData.totalSavings !== undefined ? Number(userData.totalSavings) : member.totalSavings || 0
        }
      }

      // Get active loans count
      if (loansRes.status === 'fulfilled' && loansRes.value.data?.success) {
        const loans = loansRes.value.data.data || []
        const activeLoans = loans.filter(l => ['disbursed', 'active'].includes(l.status) && Number(l.remainingAmount || 0) > 0)
        fullUserData.activeLoans = activeLoans.length
      } else {
        fullUserData.activeLoans = member.activeLoans || 0
      }

      // Get contribution history
      if (contributionsRes.status === 'fulfilled' && contributionsRes.value.data?.success) {
        const contributions = contributionsRes.value.data.data || []
        const approvedContributions = contributions.filter(c => c.status === 'approved')
        fullUserData.contributionHistory = approvedContributions.length > 0 ? 'good' : 'none'
        if (approvedContributions.length > 0) {
          const lastContrib = approvedContributions.sort((a, b) =>
            new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
          )[0]
          fullUserData.lastContribution = lastContrib.createdAt || lastContrib.date
        }
      }

      console.log('[GroupAdminMembers] Member details loaded:', fullUserData)
      setSelectedMember(fullUserData)
      setShowMemberDetails(true)
    } catch (err) {
      console.error('Failed to load member details:', err)
      alert(err.response?.data?.message || 'Failed to load member details')
    } finally {
      setLoading(false)
    }
  }

  const [editingMember, setEditingMember] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [memberTransactions, setMemberTransactions] = useState([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [transactionDateRange, setTransactionDateRange] = useState({ startDate: '', endDate: '' })

  const handleEditMember = async (member) => {
    try {
      setLoading(true)
      // Fetch full user details
      const { data } = await api.get(`/system-admin/users/${member.id}`)

      if (data?.success) {
        const fullUserData = {
          id: data.data.id,
          name: data.data.name || '',
          phone: data.data.phone || '',
          email: data.data.email || '',
          nationalId: data.data.nationalId || '',
          address: data.data.address || '',
          occupation: data.data.occupation || '',
          dateOfBirth: data.data.dateOfBirth ? new Date(data.data.dateOfBirth).toISOString().split('T')[0] : '',
          role: data.data.role || 'Member',
          status: data.data.status || 'active'
        }
        setEditingMember(fullUserData)
        setShowEditModal(true)
      } else {
        alert('Failed to load member details for editing')
      }
    } catch (err) {
      console.error('Failed to load member details:', err)
      alert(err.response?.data?.message || 'Failed to load member details')
    } finally {
      setLoading(false)
    }
  }

  // View member transactions
  const handleViewMemberTransactions = async (member) => {
    try {
      setLoadingTransactions(true)
      setShowTransactionsModal(true)
      setSelectedMember(member)

      const memberUserId = member.id
      console.log(`[GroupAdminMembers] Loading transactions for member userId: ${memberUserId}`)

      // Fetch transactions for this specific member by userId
      const { data } = await api.get('/transactions', {
        params: {
          userId: memberUserId // Explicitly pass the member's userId
        }
      })

      if (data?.success) {
        const rawTransactions = data.data || []

        // STRICT verification: ALL transactions MUST belong to this member
        const memberTransactions = rawTransactions.filter(t => {
          const transactionUserId = t.userId || t.user?.id
          const matches = transactionUserId === memberUserId
          if (!matches && transactionUserId) {
            console.error(`[GroupAdminMembers] SECURITY: Transaction ${t.id} belongs to userId ${transactionUserId}, not member ${memberUserId}. Filtering out.`)
          }
          return matches
        })

        console.log(`[GroupAdminMembers] Member ${memberUserId}: Total received: ${rawTransactions.length}, After filter: ${memberTransactions.length}`)

        // Process transactions with correct amount signs
        const transactions = memberTransactions.map(t => {
          const rawAmount = Number(t.amount || 0)
          let displayAmount = rawAmount

          // Loan disbursement = negative (money borrowed)
          if (t.type === 'loan_disbursement') {
            displayAmount = -rawAmount
          }
          // Loan payment = positive (paying back)
          else if (t.type === 'loan_payment') {
            displayAmount = rawAmount
          }
          // Contributions, interest = positive (money in)
          else if (['contribution', 'interest', 'refund'].includes(t.type)) {
            displayAmount = rawAmount
          }
          // Fines, fees = negative (money out)
          else if (['fine_payment', 'fee'].includes(t.type)) {
            displayAmount = -rawAmount
          }

          return {
            id: t.id,
            type: t.type || 'Transaction',
            description: t.description || t.type || '',
            amount: displayAmount,
            rawAmount: rawAmount,
            date: t.transactionDate || t.createdAt ? new Date(t.transactionDate || t.createdAt).toISOString().split('T')[0] : '',
            time: t.transactionDate || t.createdAt ? new Date(t.transactionDate || t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            status: t.status || 'completed',
            method: t.paymentMethod || 'N/A',
            reference: t.referenceId || `TXN-${t.id}`
          }
        })

        setMemberTransactions(transactions)

        // Log if member has zero transactions
        if (transactions.length === 0) {
          console.log(`[GroupAdminMembers] Member ${memberUserId} (${member.name}) has no transactions in database`)
        }
      } else {
        setMemberTransactions([])
      }
    } catch (err) {
      console.error('[GroupAdminMembers] Failed to load member transactions:', err)
      setMemberTransactions([])
    } finally {
      setLoadingTransactions(false)
    }
  }

  // Filter transactions by date range
  const getFilteredTransactions = () => {
    let filtered = memberTransactions

    if (transactionDateRange.startDate) {
      filtered = filtered.filter(t => {
        const transDate = new Date(t.date)
        const startDate = new Date(transactionDateRange.startDate)
        return transDate >= startDate
      })
    }

    if (transactionDateRange.endDate) {
      filtered = filtered.filter(t => {
        const transDate = new Date(t.date)
        const endDate = new Date(transactionDateRange.endDate)
        endDate.setHours(23, 59, 59, 999) // Include entire end date
        return transDate <= endDate
      })
    }

    return filtered
  }

  // Export member transaction history - Full table format with all formats
  // This uses the SAME data source and processing as the modal view
  const exportMemberTransactionHistory = async (format = 'pdf') => {
    try {
      if (!selectedMember || !selectedMember.id) {
        alert('Member information not available')
        return
      }

      const memberUserId = selectedMember.id
      console.log(`[GroupAdminMembers] Exporting transactions for member userId: ${memberUserId} in ${format} format`)

      // IMPORTANT: Use the SAME endpoint and params as the view modal
      // This ensures the export matches exactly what's displayed
      const params = {
        userId: memberUserId, // Explicitly filter by this member's userId
        startDate: transactionDateRange.startDate || undefined,
        endDate: transactionDateRange.endDate || undefined,
        status: 'all'
      }

      // Use the SAME endpoint as handleViewMemberTransactions
      const { data } = await api.get('/transactions', { params })

      if (!data?.success) {
        alert('Failed to fetch transactions. Please try again.')
        return
      }

      const rawTransactions = data.data || []

      // STRICT verification: ALL transactions MUST belong to this member (same as view)
      const memberTransactions = rawTransactions.filter(t => {
        const transactionUserId = t.userId || t.user?.id
        const matches = transactionUserId === memberUserId
        if (!matches && transactionUserId) {
          console.error(`[GroupAdminMembers] SECURITY: Transaction ${t.id} belongs to userId ${transactionUserId}, not member ${memberUserId}. Filtering out.`)
        }
        return matches
      })

      console.log(`[GroupAdminMembers] Export - Member ${memberUserId}: Total received: ${rawTransactions.length}, After filter: ${memberTransactions.length}`)

      // Process transactions with the SAME amount sign logic as the view
      const processedTransactions = memberTransactions.map(t => {
        const rawAmount = Number(t.amount || 0)
        let displayAmount = rawAmount

        // Loan disbursement = negative (money borrowed) - SAME LOGIC AS VIEW
        if (t.type === 'loan_disbursement') {
          displayAmount = -rawAmount
        }
        // Loan payment = positive (paying back)
        else if (t.type === 'loan_payment') {
          displayAmount = rawAmount
        }
        // Contributions, interest = positive (money in)
        else if (['contribution', 'interest', 'refund'].includes(t.type)) {
          displayAmount = rawAmount
        }
        // Fines, fees = negative (money out)
        else if (['fine_payment', 'fee'].includes(t.type)) {
          displayAmount = -rawAmount
        }

        return {
          id: t.id,
          transactionId: t.id,
          type: t.type || 'Transaction',
          rawType: t.type,
          description: t.description || t.type || '',
          amount: displayAmount,
          rawAmount: rawAmount,
          date: t.transactionDate || t.createdAt ? new Date(t.transactionDate || t.createdAt).toISOString().split('T')[0] : '',
          transactionDate: t.transactionDate || t.createdAt, // Full date for sorting
          time: t.transactionDate || t.createdAt ? new Date(t.transactionDate || t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '',
          status: t.status || 'completed',
          paymentMethod: t.paymentMethod || 'N/A',
          reference: t.referenceId || `TXN-${t.id}`,
          referenceId: t.referenceId
        }
      })

      // Apply date range filter (same as getFilteredTransactions)
      let filteredTransactions = processedTransactions
      if (transactionDateRange.startDate) {
        filteredTransactions = filteredTransactions.filter(t => {
          const transDate = new Date(t.date)
          const startDate = new Date(transactionDateRange.startDate)
          return transDate >= startDate
        })
      }
      if (transactionDateRange.endDate) {
        filteredTransactions = filteredTransactions.filter(t => {
          const transDate = new Date(t.date)
          const endDate = new Date(transactionDateRange.endDate)
          endDate.setHours(23, 59, 59, 999)
          return transDate <= endDate
        })
      }

      // Sort by date (oldest first for chronological order)
      const sortedData = [...filteredTransactions].sort((a, b) => {
        const dateA = new Date(a.transactionDate || a.date || 0)
        const dateB = new Date(b.transactionDate || b.date || 0)
        return dateA - dateB
      })

      // Calculate summary from the SAME filtered data that's displayed
      const totalTransactions = sortedData.length
      const totalAmount = sortedData.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const totalSavings = sortedData
        .filter(t => t.type === 'contribution')
        .reduce((sum, t) => sum + Math.max(0, t.amount), 0)

      const byType = {}
      const byStatus = { completed: 0, pending: 0 }
      const byPaymentMethod = {}

      sortedData.forEach(t => {
        // Count by type
        if (!byType[t.rawType]) {
          byType[t.rawType] = { count: 0, totalAmount: 0 }
        }
        byType[t.rawType].count++
        byType[t.rawType].totalAmount += Math.abs(t.amount)

        // Count by status
        if (t.status === 'completed') {
          byStatus.completed++
        } else if (t.status === 'pending') {
          byStatus.pending++
        }

        // Count by payment method
        const method = t.paymentMethod || 'N/A'
        byPaymentMethod[method] = (byPaymentMethod[method] || 0) + 1
      })

      const reportSummary = {
        totalTransactions,
        totalAmount,
        totalSavings,
        byType,
        byStatus,
        byPaymentMethod
      }

      // Use member info from selectedMember (already loaded from database)
      const reportMemberInfo = {
        id: memberUserId,
        name: selectedMember.name || 'Unknown',
        phone: selectedMember.phone || 'N/A',
        email: selectedMember.email || 'N/A'
      }

      const dateRange = {
        startDate: transactionDateRange.startDate || null,
        endDate: transactionDateRange.endDate || null
      }

      console.log(`[GroupAdminMembers] Export for userId ${memberUserId}:`, {
        transactionsCount: sortedData.length,
        totalAmount: reportSummary.totalAmount,
        totalSavings: reportSummary.totalSavings,
        memberInfo: reportMemberInfo,
        dateRange
      })

      // Helper function to format transaction type
      const formatTransactionType = (type) => {
        const typeMap = {
          'contribution': 'Contribution',
          'loan_payment': 'Loan Payment',
          'loan_disbursement': 'Loan Request',
          'fine_payment': 'Fine Payment',
          'interest': 'Interest',
          'refund': 'Refund',
          'fee': 'Fee'
        }
        return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }

      if (format === 'csv') {
        // Export to CSV - Excel-compatible format
        const escapeCSV = (value) => {
          if (value === null || value === undefined) return ''
          const stringValue = String(value)
          // If value contains comma, quote, or newline, wrap in quotes and escape quotes
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }

        const csvRows = []

        // Add report header
        csvRows.push(`Transaction History Report - ${reportMemberInfo.name || 'Member'}`)
        csvRows.push('')

        // Add member info section - Use data from database
        csvRows.push('Member Information')
        csvRows.push(`Name,${escapeCSV(reportMemberInfo.name || 'N/A')}`)
        csvRows.push(`Phone,${escapeCSV(reportMemberInfo.phone || 'N/A')}`)
        csvRows.push(`Email,${escapeCSV(reportMemberInfo.email || 'N/A')}`)
        csvRows.push(`User ID,${memberUserId}`)
        if (dateRange.startDate || dateRange.endDate) {
          const dateRangeStr = dateRange.startDate && dateRange.endDate
            ? `${dateRange.startDate} to ${dateRange.endDate}`
            : dateRange.startDate
              ? `From: ${dateRange.startDate}`
              : `To: ${dateRange.endDate}`
          csvRows.push(`Date Range,${escapeCSV(dateRangeStr)}`)
        }
        csvRows.push(`Generated,${escapeCSV(new Date().toLocaleString())}`)
        csvRows.push('')

        // Add summary section
        csvRows.push('Summary')
        csvRows.push(`Total Transactions,${reportSummary.totalTransactions || 0}`)
        csvRows.push(`Total Amount,${reportSummary.totalAmount || 0} RWF`)
        csvRows.push(`Completed,${reportSummary.byStatus?.completed || 0}`)
        csvRows.push(`Pending,${reportSummary.byStatus?.pending || 0}`)
        csvRows.push('')

        // Add transaction data table - Excel-like format with Date & Time
        const csvHeaders = ['Transaction ID', 'Date & Time', 'Transaction Type', 'Amount', 'Payment Method', 'Status', 'Description / Notes']
        csvRows.push(csvHeaders.map(h => escapeCSV(h)).join(','))

        // Add all transaction rows, sorted by date (oldest first)
        // If no transactions, add a row indicating zero transactions
        if (sortedData.length === 0) {
          csvRows.push(['No transactions', 'N/A', 'N/A', '0', 'N/A', 'N/A', 'This member has not made any transactions yet.'].map(cell => escapeCSV(cell)).join(','))
        } else {
          sortedData.forEach(t => {
            // Format date and time for CSV
            let dateTimeStr = 'N/A'
            if (t.date) {
              const transDate = t.transactionDate ? new Date(t.transactionDate) : new Date(t.date)
              if (!isNaN(transDate.getTime())) {
                const dateStr = transDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })
                const timeStr = transDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })
                dateTimeStr = `${dateStr} ${timeStr}`
              } else {
                dateTimeStr = t.date
              }
            }

            const row = [
              t.transactionId || t.id,
              dateTimeStr,
              formatTransactionType(t.rawType || t.type) || 'N/A',
              t.amount,
              t.paymentMethod || 'N/A',
              (t.status || 'completed').toUpperCase(),
              t.description || 'N/A'
            ]
            csvRows.push(row.map(cell => escapeCSV(cell)).join(','))
          })
        }

        // Add transaction type breakdown
        if (reportSummary.byType && Object.keys(reportSummary.byType).length > 0) {
          csvRows.push('')
          csvRows.push('Transaction Type Breakdown')
          Object.keys(reportSummary.byType).forEach(type => {
            const typeInfo = reportSummary.byType[type]
            const typeName = formatTransactionType(type)
            csvRows.push(`${escapeCSV(typeName)},Count: ${typeInfo.count || 0},Amount: ${typeInfo.totalAmount || 0} RWF`)
          })
        }

        const csvContent = csvRows.join('\n')
        // Add BOM for UTF-8 to ensure Excel opens it correctly
        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `Transaction_History_${reportMemberInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        return
      }

      if (format === 'excel') {
        // Export to Excel - Full table format with Date & Time
        const headers = ['Transaction ID', 'Date & Time', 'Transaction Type', 'Amount', 'Payment Method', 'Status', 'Description / Notes']
        // If no transactions, create a row with zero/empty values
        const rows = sortedData.length === 0
          ? [['No transactions', 'N/A', 'N/A', 0, 'N/A', 'N/A', 'This member has not made any transactions yet.']]
          : sortedData.map(t => {
            // Format date and time for Excel
            let dateTimeStr = 'N/A'
            if (t.date) {
              const transDate = t.transactionDate ? new Date(t.transactionDate) : new Date(t.date)
              if (!isNaN(transDate.getTime())) {
                const dateStr = transDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })
                const timeStr = transDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })
                dateTimeStr = `${dateStr} ${timeStr}`
              } else {
                dateTimeStr = t.date
              }
            }

            return [
              t.transactionId || t.id,
              dateTimeStr,
              formatTransactionType(t.rawType || t.type) || 'N/A',
              t.amount,
              t.paymentMethod || 'N/A',
              (t.status || 'completed').toUpperCase(),
              t.description || 'N/A'
            ]
          })

        exportToExcel(rows, headers, `Transaction_History_${reportMemberInfo.name.replace(/\s+/g, '_')}`, {
          title: `Transaction History - ${reportMemberInfo.name}`,
          groupName: null,
          dateRange,
          summary: {
            ...reportSummary,
            memberInfo: {
              name: reportMemberInfo.name,
              phone: reportMemberInfo.phone,
              email: reportMemberInfo.email,
              userId: memberUserId
            }
          }
        })
        return
      }

      // Export to PDF - Full table format
      const { doc, pageWidth, pageHeight } = createPDFDocument(
        `Transaction History - ${reportMemberInfo.name || 'Member'}`,
        'Member Transaction Report'
      )

      // Member info section - Use data from database
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...[30, 64, 175])
      let infoY = 60
      doc.text('Member Information', 15, infoY)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...[31, 41, 55])
      infoY += 7
      doc.text(`Name: ${reportMemberInfo.name || 'N/A'}`, 15, infoY)
      infoY += 7
      doc.text(`Phone: ${reportMemberInfo.phone || 'N/A'}`, 15, infoY)
      infoY += 7
      doc.text(`Email: ${reportMemberInfo.email || 'N/A'}`, 15, infoY)
      infoY += 7
      doc.text(`User ID: ${memberUserId}`, 15, infoY)
      infoY += 7
      if (dateRange.startDate || dateRange.endDate) {
        const dateRangeStr = dateRange.startDate && dateRange.endDate
          ? `${dateRange.startDate} to ${dateRange.endDate}`
          : dateRange.startDate
            ? `From: ${dateRange.startDate}`
            : `To: ${dateRange.endDate}`
        doc.text(`Date Range: ${dateRangeStr}`, 15, infoY)
        infoY += 7
      }
      doc.text(`Report Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 15, infoY)
      infoY += 15

      // Summary section
      const summaries = [
        { label: 'Total Transactions', value: reportSummary.totalTransactions || 0 },
        { label: 'Total Amount', value: formatCurrency(reportSummary.totalAmount || 0) },
        { label: 'Completed', value: reportSummary.byStatus?.completed || 0 },
        { label: 'Pending', value: reportSummary.byStatus?.pending || 0 }
      ]

      let currentY = addSummarySection(doc, summaries, infoY, pageWidth)
      currentY += 15

      // Full Transaction History Table - Google Forms style with borders and grid lines
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...[30, 64, 175])
      doc.text('Transaction History', 15, currentY)
      currentY += 10

      // Get date and time from transaction data
      const headers = ['Transaction ID', 'Date & Time', 'Transaction Type', 'Amount', 'Payment Method', 'Status', 'Description / Notes']
      // If no transactions, create a row with zero/empty values
      const tableRows = sortedData.length === 0
        ? [['No transactions', 'N/A', 'N/A', '0.00 RWF', 'N/A', 'N/A', 'This member has not made any transactions yet.']]
        : sortedData.map(trans => {
          // Format date and time properly
          let dateTimeStr = 'N/A'
          if (trans.date || trans.transactionDate) {
            // Try to get time from transactionDate if available
            const transDate = trans.transactionDate ? new Date(trans.transactionDate) : new Date(trans.date)
            if (!isNaN(transDate.getTime())) {
              const dateStr = transDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })
              const timeStr = transDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })
              dateTimeStr = `${dateStr} ${timeStr}`
            } else {
              dateTimeStr = trans.date
            }
          }

          return [
            (trans.transactionId || trans.id).toString(),
            dateTimeStr,
            formatTransactionType(trans.rawType || trans.type) || 'N/A',
            formatCurrency(trans.amount),
            trans.paymentMethod || 'N/A',
            (trans.status || 'completed').toUpperCase(),
            trans.description || 'N/A' // Full description, auto-wraps
          ]
        })

      // Use formatted table with borders and grid lines (Google Forms style)
      currentY = addFormattedTable(doc, { headers, rows: tableRows }, currentY, pageWidth, {
        columnWidths: [10, 18, 18, 12, 15, 10, 17], // Adjusted for Date & Time column
        fontSize: 8,
        cellPadding: 3
      })

      // Add transaction summary breakdown
      currentY += 10
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...[30, 64, 175])
      doc.text('Transaction Summary Breakdown', 15, currentY)
      currentY += 8

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...[31, 41, 55])

      if (reportSummary.byType) {
        Object.keys(reportSummary.byType).forEach(type => {
          const typeInfo = reportSummary.byType[type]
          const typeName = formatTransactionType(type)
          doc.text(`${typeName}: ${typeInfo.count} transactions, ${formatCurrency(typeInfo.totalAmount)}`, 15, currentY)
          currentY += 6
        })
      }

      // Add footer to all pages
      const totalPages = doc.internal.pages.length - 1
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        addFooter(doc, pageWidth, pageHeight, i, totalPages)
      }

      const memberName = (reportMemberInfo.name || 'Member').replace(/[^a-zA-Z0-9]/g, '_')
      savePDF(doc, `${memberName}_Transaction_History`)
    } catch (error) {
      console.error('[GroupAdminMembers] Error exporting transaction history:', error)
      alert('Failed to export transaction history. Please try again.')
    }
  }

  const formatTransactionType = (type) => {
    const typeMap = {
      'contribution': 'Contribution',
      'loan_payment': 'Loan Payment',
      'loan_disbursement': 'Loan Request',
      'fine_payment': 'Fine Payment',
      'interest': 'Interest',
      'refund': 'Refund',
      'fee': 'Fee'
    }
    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const handleResetPassword = async (userId) => {
    if (!confirm('Are you sure you want to send password reset instructions to this member?')) return

    try {
      setLoading(true)
      const { data } = await api.post(`/system-admin/users/${userId}/remind-password`)
      if (data?.success) {
        alert(data.message || 'Password reset link sent successfully')
      } else {
        alert(data?.message || 'Failed to send reset instructions')
      }
    } catch (err) {
      console.error('Reset password error:', err)
      alert(err.response?.data?.message || 'Failed to send reset instructions')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMember = async () => {
    if (!editingMember || !editingMember.id) {
      alert('Member data is missing')
      return
    }

    if (!editingMember.name || !editingMember.phone) {
      alert('Name and phone are required')
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.put(`/system-admin/users/${editingMember.id}`, {
        name: editingMember.name,
        phone: editingMember.phone,
        email: editingMember.email || null,
        nationalId: editingMember.nationalId || null,
        address: editingMember.address || null,
        occupation: editingMember.occupation || null,
        dateOfBirth: editingMember.dateOfBirth ? new Date(editingMember.dateOfBirth).toISOString() : null,
        role: editingMember.role,
        status: editingMember.status
      })

      if (data?.success) {
        alert('Member updated successfully!')
        setShowEditModal(false)
        setEditingMember(null)

        // Reload members list
        const groupRes = await api.get(`/groups/${groupId}`)
        if (groupRes.data?.success) {
          const groupMembers = (groupRes.data.data.members || [])
            .filter(m => m.role === 'Member' || m.role === 'Secretary' || m.role === 'Cashier')
            .map(m => ({
              id: m.id,
              name: m.name,
              phone: m.phone || '',
              email: m.email || '',
              nationalId: m.nationalId || '',
              joinDate: m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : '',
              status: (m.status || 'active').toLowerCase(),
              role: m.role || 'Member',
              totalSavings: Number(m.totalSavings || 0),
              activeLoans: 0,
              contributionHistory: 'good',
              lastContribution: null
            }))
          setMembers(groupMembers)
        }
      } else {
        throw new Error(data?.message || 'Failed to update member')
      }
    } catch (err) {
      console.error('Failed to update member:', err)
      alert(err.response?.data?.message || err.message || 'Failed to update member')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('membersManagement', { defaultValue: 'Members Management' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('manageGroupMembers', { defaultValue: 'Manage group members and their accounts' })}</p>
          </div>
          {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
            <button
              onClick={() => navigate('/admin/add-member')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> {t('addNewMember')}
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalMembers')}</p>
                <p className="text-2xl font-bold text-gray-800">
                  {members.length}
                </p>
              </div>
              <Users className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('activeMembers', { defaultValue: 'Active Members' })}</p>
                <p className="text-2xl font-bold text-green-600">
                  {members.filter(m => m.status === 'active').length}
                </p>
              </div>
              <UserCheck className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('burnedMembers', { defaultValue: 'Burned Members' })}</p>
                <p className="text-2xl font-bold text-red-600">
                  {members.filter(m => m.status === 'burned').length}
                </p>
              </div>
              <UserX className="text-red-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalSavings')}</p>
                <p className="text-2xl font-bold text-purple-600">
                  {members.reduce((sum, m) => sum + m.totalSavings, 0).toLocaleString()} RWF
                </p>
              </div>
              <Calendar className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card flex flex-col md:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchPlaceholder', { defaultValue: 'Search by name, phone, or member ID...' })}
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
          <div className="w-full md:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field py-2 text-sm"
            >
              <option value="all">{t('allMembers', { defaultValue: 'All Members' })}</option>
              <option value="active">{tCommon('active')}</option>
              <option value="burned">{t('burned', { defaultValue: 'Burned' })}</option>
              <option value="inactive">{tCommon('inactive')}</option>
              <option value="suspended">{t('suspended', { defaultValue: 'Suspended' })}</option>
              <option value="pending">{tCommon('pending')}</option>
            </select>
          </div>
        </div>

        {/* Members List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {t('members')} ({filteredMembers.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('loadingMembers', { defaultValue: 'Loading members...' })}</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {members.length === 0 ? (
                <p className="dark:text-gray-400">{t('noMembersFound', { defaultValue: 'No members found. Add a new member to get started.' })}</p>
              ) : (
                <p className="dark:text-gray-400">{t('noMembersMatch', { defaultValue: 'No members match your search criteria. Try adjusting your filters.' })}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div
                  key={`${member.id}-${refreshKey}`}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {member.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{member.name}</h3>
                        <p className="text-sm text-gray-600">{member.phone} • {member.email}</p>
                        <p className="text-sm text-gray-500">ID: {member.id} • Joined: {member.joinDate}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-600">Total Savings</p>
                      <p className="font-semibold">{member.totalSavings.toLocaleString()} RWF</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Active Loans</p>
                      <p className="font-semibold">{member.activeLoans}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Contribution History</p>
                      <p className="font-semibold">{member.contributionHistory}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Last Contribution</p>
                      <p className="font-semibold">{member.lastContribution}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewMemberDetails(member)}
                      className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <Eye size={16} /> View Details
                    </button>
                    <button
                      onClick={() => handleViewMemberTransactions(member)}
                      className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <FileText size={16} /> Transactions
                    </button>
                    {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
                      <button
                        onClick={() => handleEditMember(member)}
                        className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <Edit size={16} /> Edit
                      </button>
                    )}
                    {(() => {
                      // Normalize status to lowercase for comparison
                      const currentStatus = String(member.status || 'active').toLowerCase().trim()
                      const isActive = currentStatus === 'active'
                      const isBurned = currentStatus === 'burned'

                      if (isActive) {
                        return hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
                          <button
                            onClick={() => {
                              console.log('[Button Click] Burning member:', member.id, 'Current status:', member.status)
                              handleBurnMember(member.id)
                            }}
                            disabled={loading}
                            className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <UserX size={16} /> Burn Account
                          </button>
                        )
                      } else if (isBurned) {
                        return hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
                          <button
                            onClick={() => {
                              console.log('[Button Click] Activating member:', member.id, 'Current status:', member.status)
                              handleUnburnMember(member.id)
                            }}
                            disabled={loading}
                            className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <UserCheck size={16} /> Activate Account
                          </button>
                        )
                      }
                      // If status is neither active nor burned, show nothing
                      return null
                    })()}
                    {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
                      <>
                        <button
                          onClick={() => handleResetPassword(member.id)}
                          className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <RefreshCw size={16} /> Reset Password
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="bg-gray-500 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('addNewMember')}</h2>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMember.firstName}
                      onChange={(e) => {
                        setNewMember({ ...newMember, firstName: e.target.value })
                        setValidationErrors({ ...validationErrors, firstName: '' })
                      }}
                      className={`input-field ${validationErrors.firstName ? 'border-red-500' : ''}`}
                      required
                    />
                    {validationErrors.firstName && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMember.lastName}
                      onChange={(e) => {
                        setNewMember({ ...newMember, lastName: e.target.value })
                        setValidationErrors({ ...validationErrors, lastName: '' })
                      }}
                      className={`input-field ${validationErrors.lastName ? 'border-red-500' : ''}`}
                      required
                    />
                    {validationErrors.lastName && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      National ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMember.nationalId}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        setNewMember({ ...newMember, nationalId: value })
                        setValidationErrors({ ...validationErrors, nationalId: '' })
                      }}
                      className={`input-field ${validationErrors.nationalId ? 'border-red-500' : ''}`}
                      required
                      maxLength={16}
                      placeholder="16 digits"
                    />
                    {validationErrors.nationalId && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.nationalId}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Must be exactly 16 digits</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newMember.dateOfBirth}
                      onChange={(e) => {
                        setNewMember({ ...newMember, dateOfBirth: e.target.value })
                        setValidationErrors({ ...validationErrors, dateOfBirth: '' })
                      }}
                      className={`input-field ${validationErrors.dateOfBirth ? 'border-red-500' : ''}`}
                      required
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split('T')[0]}
                    />
                    {validationErrors.dateOfBirth && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.dateOfBirth}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Member must be at least 10 years old</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Telephone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setNewMember({ ...newMember, phone: value })
                        setValidationErrors({ ...validationErrors, phone: '' })
                      }}
                      className={`input-field ${validationErrors.phone ? 'border-red-500' : ''}`}
                      required
                      maxLength={10}
                      placeholder="0781234567"
                    />
                    {validationErrors.phone && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Must be exactly 10 digits</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMember.location}
                      onChange={(e) => {
                        setNewMember({ ...newMember, location: e.target.value })
                        setValidationErrors({ ...validationErrors, location: '' })
                      }}
                      className={`input-field ${validationErrors.location ? 'border-red-500' : ''}`}
                      required
                      placeholder="Enter location/address"
                    />
                    {validationErrors.location && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.location}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={newMember.password}
                      onChange={(e) => {
                        setNewMember({ ...newMember, password: e.target.value })
                        setValidationErrors({ ...validationErrors, password: '', confirmPassword: '' })
                      }}
                      className={`input-field ${validationErrors.password ? 'border-red-500' : ''}`}
                      required
                      placeholder="Enter password"
                      minLength={6}
                    />
                    {validationErrors.password && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.password}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={newMember.confirmPassword}
                      onChange={(e) => {
                        setNewMember({ ...newMember, confirmPassword: e.target.value })
                        setValidationErrors({ ...validationErrors, confirmPassword: '' })
                      }}
                      className={`input-field ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
                      required
                      placeholder="Confirm password"
                      minLength={6}
                    />
                    {validationErrors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddMember(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMember}
                    disabled={submitting}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Creating...' : 'Add Member'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Member Details Modal */}
        {showMemberDetails && selectedMember && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Member Details</h2>
                <button
                  onClick={() => {
                    setShowMemberDetails(false)
                    setSelectedMember(null)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Member Info Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                    {selectedMember.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedMember.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2 mt-1">
                      <Phone size={16} /> {selectedMember.phone}
                    </p>
                    {selectedMember.email && (
                      <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2 mt-1">
                        <Mail size={16} /> {selectedMember.email}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Member ID: {selectedMember.id}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedMember.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                      selectedMember.status === 'burned' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                      {selectedMember.status}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      <span className="font-semibold">Role:</span> {selectedMember.role}
                    </p>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Users size={18} /> Personal Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Full Name:</span>
                        <p className="font-semibold text-gray-800 dark:text-white">{selectedMember.name}</p>
                      </div>
                      {selectedMember.nationalId && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">National ID:</span>
                          <p className="font-semibold text-gray-800 dark:text-white">{selectedMember.nationalId}</p>
                        </div>
                      )}
                      {selectedMember.dateOfBirth && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Date of Birth:</span>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {new Date(selectedMember.dateOfBirth).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {selectedMember.occupation && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Occupation:</span>
                          <p className="font-semibold text-gray-800 dark:text-white">{selectedMember.occupation}</p>
                        </div>
                      )}
                      {selectedMember.address && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Address:</span>
                          <p className="font-semibold text-gray-800 dark:text-white">{selectedMember.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="card">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Phone size={18} /> Contact Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Phone Number:</span>
                        <p className="font-semibold text-gray-800 dark:text-white">{selectedMember.phone}</p>
                      </div>
                      {selectedMember.email && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Email Address:</span>
                          <p className="font-semibold text-gray-800 dark:text-white">{selectedMember.email}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Language:</span>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {selectedMember.language === 'rw' ? 'Kinyarwanda' : 'English'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <DollarSign className="text-green-600 dark:text-green-400" size={24} />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Savings</p>
                        <p className="text-xl font-bold text-gray-800 dark:text-white">
                          {selectedMember.totalSavings?.toLocaleString() || '0'} RWF
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <FileText className="text-blue-600 dark:text-blue-400" size={24} />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Active Loans</p>
                        <p className="text-xl font-bold text-gray-800 dark:text-white">
                          {selectedMember.activeLoans || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="text-purple-600 dark:text-purple-400" size={24} />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Credit Score</p>
                        <p className="text-xl font-bold text-gray-800 dark:text-white">
                          {selectedMember.creditScore || 0}/100
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="card">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Calendar size={18} /> Account Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Member Since:</span>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {selectedMember.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Current Role:</span>
                      <p className="font-semibold text-gray-800 dark:text-white">{selectedMember.role}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Account Status:</span>
                      <p className="font-semibold text-gray-800 dark:text-white capitalize">{selectedMember.status}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Member ID:</span>
                      <p className="font-semibold text-gray-800 dark:text-white">{selectedMember.id}</p>
                    </div>
                  </div>
                </div>

                {/* Member Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowMemberDetails(false)
                      setSelectedMember(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  <button
                    onClick={async () => {
                      setShowMemberDetails(false)
                      await handleViewMemberTransactions(selectedMember)
                    }}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <FileText size={18} />
                    View Transactions
                  </button>
                  <button
                    onClick={() => handleResetPassword(selectedMember.id)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 flex-1 transition-colors"
                  >
                    <RefreshCw size={18} /> Reset Password
                  </button>
                  <button
                    onClick={() => {
                      setShowMemberDetails(false)
                      handleEditMember(selectedMember)
                    }}
                    className="btn-primary flex-1"
                  >
                    <Edit size={18} className="inline mr-2" />
                    Edit Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Member Modal */}
        {showEditModal && editingMember && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-800">Edit Member</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingMember(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingMember.name}
                      onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={editingMember.phone}
                      onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editingMember.email || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      National ID
                    </label>
                    <input
                      type="text"
                      value={editingMember.nationalId || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, nationalId: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingMember.role}
                      onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="Member">Member</option>
                      <option value="Secretary">Secretary</option>
                      <option value="Cashier">Cashier</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Change member role after group agreement
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={editingMember.status}
                      onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value })}
                      className="input-field"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={editingMember.dateOfBirth || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, dateOfBirth: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={editingMember.address || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, address: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={editingMember.occupation || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, occupation: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingMember(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateMember}
                    disabled={submitting}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Updating...' : 'Update Member'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Member Transactions Modal */}
        {showTransactionsModal && selectedMember && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedMember.name} - {selectedMember.phone}</p>
                </div>
                <button
                  onClick={() => {
                    setShowTransactionsModal(false)
                    setSelectedMember(null)
                    setMemberTransactions([])
                    setTransactionDateRange({ startDate: '', endDate: '' })
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Date Range Filter */}
                <div className="card bg-blue-50 border-2 border-blue-200">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="text-blue-600" size={20} />
                    Filter by Date Range
                  </h3>
                  <div className="space-y-4">
                    {/* Date Inputs Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={transactionDateRange.startDate}
                          onChange={(e) => setTransactionDateRange({ ...transactionDateRange, startDate: e.target.value })}
                          className="input-field w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={transactionDateRange.endDate}
                          onChange={(e) => setTransactionDateRange({ ...transactionDateRange, endDate: e.target.value })}
                          className="input-field w-full"
                        />
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setTransactionDateRange({ startDate: '', endDate: '' })}
                        className="btn-secondary flex items-center justify-center gap-2 px-4 py-2"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => exportMemberTransactionHistory('pdf')}
                        className="btn-primary flex items-center justify-center gap-2 px-4 py-2"
                      >
                        <Download size={18} />
                        Export PDF
                      </button>
                      <button
                        onClick={() => exportMemberTransactionHistory('excel')}
                        className="btn-secondary flex items-center justify-center gap-2 px-4 py-2"
                      >
                        <Download size={18} />
                        Export Excel
                      </button>
                      <button
                        onClick={() => exportMemberTransactionHistory('csv')}
                        className="btn-secondary flex items-center justify-center gap-2 px-4 py-2"
                      >
                        <Download size={18} />
                        Export CSV
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transactions Summary */}
                {(() => {
                  const filtered = getFilteredTransactions()
                  // Total Amount should be net from all transactions for display
                  const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0)
                  // Total Savings should be ONLY from contributions (loans don't affect savings)
                  const totalSavings = filtered
                    .filter(t => t.type === 'contribution')
                    .reduce((sum, t) => sum + Math.max(0, t.amount), 0)
                  const completedCount = filtered.filter(t => t.status === 'completed').length

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="card">
                        <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                        <p className="text-xl font-bold text-gray-800">{filtered.length}</p>
                      </div>
                      <div className="card">
                        <p className="text-sm text-gray-600 mb-1">Total Savings</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(totalSavings)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">From contributions only</p>
                      </div>
                      <div className="card">
                        <p className="text-sm text-gray-600 mb-1">Completed</p>
                        <p className="text-xl font-bold text-blue-600">{completedCount}</p>
                      </div>
                      <div className="card">
                        <p className="text-sm text-gray-600 mb-1">Pending</p>
                        <p className="text-xl font-bold text-yellow-600">{filtered.filter(t => t.status === 'pending').length}</p>
                      </div>
                    </div>
                  )
                })()}

                {/* Transactions List */}
                <div className="card">
                  <h3 className="font-bold text-gray-800 mb-4">Transactions</h3>
                  {loadingTransactions ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                      <p>Loading transactions...</p>
                    </div>
                  ) : (() => {
                    const filtered = getFilteredTransactions()
                    return filtered.length === 0 && memberTransactions.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <FileText size={64} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-semibold mb-2">No Transactions Yet</p>
                        <p className="text-sm">This member has not made any transactions yet.</p>
                        <p className="text-xs text-gray-400 mt-2">Transactions will appear here when the member makes contributions, loan payments, or other financial activities.</p>
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                        <p>No transactions found for the selected date range.</p>
                        <p className="text-sm mt-2">Try adjusting your date filters.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filtered.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-white transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`p-2 rounded-lg ${transaction.type === 'contribution' ? 'bg-green-100' :
                                    transaction.type === 'loan_payment' ? 'bg-blue-100' :
                                      transaction.type === 'loan_disbursement' ? 'bg-purple-100' :
                                        'bg-gray-100'
                                    }`}>
                                    {transaction.type === 'contribution' ? <DollarSign className="text-green-600" size={18} /> :
                                      transaction.type === 'loan_payment' ? <FileText className="text-blue-600" size={18} /> :
                                        <TrendingUp className="text-gray-600" size={18} />}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800 capitalize">
                                      {transaction.type?.replace('_', ' ') || 'Transaction'}
                                    </h4>
                                    <p className="text-sm text-gray-600">{transaction.description || 'No description'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                                  <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {formatDate(transaction.date)} {transaction.time}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    {transaction.method}
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                    {transaction.status.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-lg font-bold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                  {transaction.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Ref: {transaction.reference}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowTransactionsModal(false)
                      setSelectedMember(null)
                      setMemberTransactions([])
                      setTransactionDateRange({ startDate: '', endDate: '' })
                    }}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => exportMemberTransactionHistory('pdf')}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Export PDF
                  </button>
                  <button
                    onClick={() => exportMemberTransactionHistory('excel')}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Export Excel
                  </button>
                  <button
                    onClick={() => exportMemberTransactionHistory('csv')}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default GroupAdminMembers

