import React, { useState, useEffect, useCallback, useContext } from 'react'
import { AlertCircle, DollarSign, Search, Filter, Users, TrendingUp, Download, CheckCircle, XCircle, Edit, Settings, Calendar, X, Save } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { formatCurrency, formatDate, formatDateTimeFull, exportToExcel } from '../utils/pdfExport'
import { UserContext } from '../App'
import { PERMISSIONS, hasPermission } from '../utils/permissions'

function GroupAdminFines() {
  const { user } = useContext(UserContext)
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFineRules, setShowFineRules] = useState(false)
  const [showWaiveModal, setShowWaiveModal] = useState(null)
  const [fines, setFines] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupId, setGroupId] = useState(null)
  const [groupName, setGroupName] = useState('')
  const [editingRule, setEditingRule] = useState(null)
  const [savingRules, setSavingRules] = useState(false)

  useEffect(() => {
    let mounted = true
    async function loadFines() {
      try {
        setLoading(true)
        const me = await api.get('/auth/me')
        const currentGroupId = me.data?.data?.groupId
        if (!currentGroupId || !mounted) return

        setGroupId(currentGroupId)

        // Fetch group name
        try {
          const groupRes = await api.get(`/groups/${currentGroupId}`)
          if (groupRes.data?.success && groupRes.data?.data) {
            setGroupName(groupRes.data.data.name || '')
          }
        } catch (err) {
          console.error('[GroupAdminFines] Error fetching group name:', err)
        }

        // Fetch fines - get all fines for the group, filtering will be done client-side
        const response = await api.get('/fines', {
          params: { groupId: currentGroupId }
        })

        if (mounted && response.data?.success) {
          const items = (response.data.data || []).map(f => ({
            id: f.id,
            memberId: f.memberId,
            memberName: f.member?.name || 'Member',
            phone: f.member?.phone || '',
            reason: f.reason || '',
            amount: Number(f.amount || 0),
            dueDate: f.dueDate ? new Date(f.dueDate).toISOString().split('T')[0] : '',
            status: f.status || 'pending',
            imposedBy: f.issuedBy || 'Admin',
            imposedDate: f.issuedDate || f.createdAt ? new Date(f.issuedDate || f.createdAt).toISOString().split('T')[0] : '',
            imposedDateTime: f.issuedDate || f.createdAt ? new Date(f.issuedDate || f.createdAt) : null,
            paidDate: f.paidDate ? new Date(f.paidDate).toISOString().split('T')[0] : null,
            paidDateTime: f.paidDate ? new Date(f.paidDate) : null,
            paymentMethod: f.paymentMethod || null,
            waivedBy: f.waivedBy || null,
            waivedDate: f.waivedDate ? new Date(f.waivedDate).toISOString().split('T')[0] : null,
            waivedReason: f.waiverReason || f.waivedReason || null
          }))
          setFines(items)
          console.log(`[GroupAdminFines] Loaded ${items.length} fines for group ${currentGroupId}`)
        }
      } catch (error) {
        console.error('[GroupAdminFines] Error loading fines:', error)
        if (mounted) setFines([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadFines()

    return () => {
      mounted = false
    }
  }, []) // Load all fines on mount, then filter client-side

  // Function to reload fines
  const reloadFines = useCallback(async () => {
    if (!groupId) return
    try {
      const response = await api.get('/fines', {
        params: { groupId }
      })

      if (response.data?.success) {
        const items = (response.data.data || []).map(f => ({
          id: f.id,
          memberId: f.memberId,
          memberName: f.member?.name || 'Member',
          phone: f.member?.phone || '',
          reason: f.reason || '',
          amount: Number(f.amount || 0),
          dueDate: f.dueDate ? new Date(f.dueDate).toISOString().split('T')[0] : '',
          status: f.status || 'pending',
          imposedBy: f.issuedBy || 'Admin',
          imposedDate: f.issuedDate || f.createdAt ? new Date(f.issuedDate || f.createdAt).toISOString().split('T')[0] : '',
          imposedDateTime: f.issuedDate || f.createdAt ? new Date(f.issuedDate || f.createdAt) : null,
          paidDate: f.paidDate ? new Date(f.paidDate).toISOString().split('T')[0] : null,
          paidDateTime: f.paidDate ? new Date(f.paidDate) : null,
          paymentMethod: f.paymentMethod || null,
          waivedBy: f.waivedBy || null,
          waivedDate: f.waivedDate ? new Date(f.waivedDate).toISOString().split('T')[0] : null,
          waivedReason: f.waiverReason || f.waivedReason || null
        }))
        setFines(items)
        console.log(`[GroupAdminFines] Reloaded ${items.length} fines`)
      }
    } catch (error) {
      console.error('[GroupAdminFines] Error reloading fines:', error)
    }
  }, [groupId])

  // Set up periodic refresh to catch new fines (every 30 seconds)
  useEffect(() => {
    if (!groupId) return

    const refreshInterval = setInterval(() => {
      reloadFines()
    }, 30000)

    return () => clearInterval(refreshInterval)
  }, [groupId, reloadFines])

  // Get filtered fines (used by both display and export)
  const getFilteredFines = () => {
    return fines.filter(f => {
      const matchesStatus = filterStatus === 'all' || f.status === filterStatus
      const matchesSearch = !searchTerm ||
        f.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.phone || '').includes(searchTerm) ||
        String(f.memberId || '').includes(searchTerm)
      return matchesStatus && matchesSearch
    })
  }

  // Export fines report to Excel
  const exportFinesReport = () => {
    try {
      const filteredFines = getFilteredFines()

      // Sort by imposed date (oldest first)
      const sortedFines = [...filteredFines].sort((a, b) => {
        const dateA = a.imposedDateTime ? new Date(a.imposedDateTime) : new Date(a.imposedDate || 0)
        const dateB = b.imposedDateTime ? new Date(b.imposedDateTime) : new Date(b.imposedDate || 0)
        return dateA - dateB
      })

      const headers = [t('fineId', { defaultValue: 'Fine ID' }), t('dateAndTime', { defaultValue: 'Date & Time' }), t('memberName', { defaultValue: 'Member Name' }), t('memberId', { defaultValue: 'Member ID' }), t('phone', { defaultValue: 'Phone' }), t('reason', { defaultValue: 'Reason' }), t('amount', { defaultValue: 'Amount' }), t('dueDate', { defaultValue: 'Due Date' }), t('status', { defaultValue: 'Status' }), t('imposedBy', { defaultValue: 'Imposed By' }), t('imposedDate', { defaultValue: 'Imposed Date' }), t('paidDate', { defaultValue: 'Paid Date' }), t('paymentMethod', { defaultValue: 'Payment Method' }), t('waivedDate', { defaultValue: 'Waived Date' }), t('waivedReason', { defaultValue: 'Waived Reason' })]

      const rows = sortedFines.length === 0
        ? [['No fines', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 0, 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A']]
        : sortedFines.map(fine => {
          // Format date and time
          let dateTimeStr = 'N/A'
          if (fine.imposedDateTime || fine.imposedDate) {
            const imposedDate = fine.imposedDateTime ? new Date(fine.imposedDateTime) : new Date(fine.imposedDate)
            if (!isNaN(imposedDate.getTime())) {
              dateTimeStr = formatDateTimeFull(imposedDate)
            } else {
              dateTimeStr = fine.imposedDate || 'N/A'
            }
          }

          return [
            fine.id || 'N/A',
            dateTimeStr,
            fine.memberName || 'N/A',
            fine.memberId || 'N/A',
            fine.phone || 'N/A',
            fine.reason || 'N/A',
            fine.amount || 0,
            fine.dueDate || 'N/A',
            (fine.status || 'pending').toUpperCase(),
            fine.imposedBy || 'N/A',
            fine.imposedDate || 'N/A',
            fine.paidDate || 'N/A',
            fine.paymentMethod || 'N/A',
            fine.waivedDate || 'N/A',
            fine.waivedReason || 'N/A'
          ]
        })

      const totalFines = filteredFines.reduce((sum, f) => sum + f.amount, 0)
      const paidFines = filteredFines.filter(f => f.status === 'paid').length
      const pendingFines = filteredFines.filter(f => f.status === 'pending').length
      const waivedFines = filteredFines.filter(f => f.status === 'waived').length
      const totalCollected = filteredFines.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0)

      const summary = {
        totalFines: filteredFines.length,
        totalAmount: totalFines,
        paid: paidFines,
        pending: pendingFines,
        waived: waivedFines,
        totalCollected
      }

      exportToExcel(rows, headers, `Fines_Report_${groupName?.replace(/\s+/g, '_') || 'Group'}`, {
        title: `Fines & Penalties Report - ${groupName || 'Group'}`,
        groupName: groupName || 'N/A',
        dateRange: null,
        summary
      })
    } catch (error) {
      console.error('[GroupAdminFines] Error exporting Excel:', error)
      alert(tCommon('exportFailed', { defaultValue: 'Failed to export report. Please try again.' }))
    }
  }

  const [fineRules, setFineRules] = useState([
    {
      id: 1,
      type: t('lateContributionPayment', { defaultValue: 'Late Contribution Payment' }),
      amount: 500,
      description: 'Applied when a member pays their contribution after the due date',
      conditions: 'Must be paid within 5 days of due date',
      maxLimit: 5000,
      enabled: true
    },
    {
      id: 2,
      type: t('missedGroupMeeting', { defaultValue: 'Missed Group Meeting' }),
      amount: 1000,
      description: 'Applied when a member misses a scheduled group meeting',
      conditions: 'No valid excuse provided',
      maxLimit: 5000,
      enabled: true
    },
    {
      id: 3,
      type: t('lateLoanPayment', { defaultValue: 'Late Loan Payment' }),
      amount: 750,
      description: 'Applied when a member delays loan repayment',
      conditions: 'Per week of delay',
      maxLimit: 10000,
      enabled: true
    },
    {
      id: 4,
      type: t('incompleteContribution', { defaultValue: 'Incomplete Contribution' }),
      amount: 300,
      description: 'Applied when a member pays less than the minimum required amount',
      conditions: 'Difference between required and paid amount',
      maxLimit: 3000,
      enabled: true
    },
    {
      id: 5,
      type: t('ruleViolation', { defaultValue: 'Rule Violation' }),
      amount: 2000,
      description: 'Applied for violations of group rules and regulations',
      conditions: 'As per group constitution',
      maxLimit: 10000,
      enabled: true
    }
  ])

  // Load fine rules from localStorage or use defaults
  useEffect(() => {
    if (groupId) {
      // Try to load fine rules from localStorage (group-specific)
      try {
        const savedRules = localStorage.getItem(`fineRules_${groupId}`)
        if (savedRules) {
          const parsed = JSON.parse(savedRules)
          setFineRules(parsed)
          console.log('[GroupAdminFines] Loaded fine rules from storage')
        }
      } catch (err) {
        console.log('[GroupAdminFines] Using default fine rules')
      }
    }
  }, [groupId])

  // Handle edit rule
  const handleEditRule = (rule) => {
    setEditingRule({ ...rule })
  }

  // Handle save rule changes
  const handleSaveRule = (updatedRule) => {
    setFineRules(rules => rules.map(r => r.id === updatedRule.id ? updatedRule : r))
    setEditingRule(null)
  }

  // Handle save all fine rules
  const handleSaveFineRules = async () => {
    if (!groupId) {
      alert(t('groupInformationNotAvailable', { defaultValue: 'Group information not available' }))
      return
    }

    try {
      setSavingRules(true)

      // Save fine rules to localStorage (group-specific)
      localStorage.setItem(`fineRules_${groupId}`, JSON.stringify(fineRules))
      console.log('[GroupAdminFines] Saved fine rules to localStorage')

      // Create announcement about fine rules update
      const enabledRules = fineRules.filter(r => r.enabled)
      const rulesSummary = enabledRules
        .map(r => `• ${r.type}: ${r.amount.toLocaleString()} RWF (Max: ${r.maxLimit.toLocaleString()} RWF)`)
        .join('\n')

      const announcementMessage = `Fine Rules have been updated for ${groupName || 'the group'}. Please review the new rules:\n\n${rulesSummary}\n\nThese rules will be applied when fines are imposed by Cashier or Secretary.`

      const announcementRes = await api.post('/announcements', {
        groupId,
        title: 'Fine Rules Updated',
        content: announcementMessage,
        priority: 'high'
      })

      if (announcementRes.data?.success) {
        // Send the announcement to all group members
        await api.put(`/announcements/${announcementRes.data.data.id}/send`)
        console.log('[GroupAdminFines] Announcement sent to all group members')
      }

      alert('Fine rules saved successfully! All group members have been notified via announcement.')
      setShowFineRules(false)
      setEditingRule(null)
    } catch (error) {
      console.error('[GroupAdminFines] Error saving fine rules:', error)
      alert('Failed to save fine rules. Please try again.')
    } finally {
      setSavingRules(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'waived': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Use the same filtering function for consistency
  const filteredFines = getFilteredFines()

  const summaryStats = {
    totalFines: fines.length,
    pendingFines: fines.filter(f => f.status === 'pending').length,
    paidFines: fines.filter(f => f.status === 'paid').length,
    totalCollected: fines.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0),
    totalPending: fines.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0)
  }

  const handleWaiveFine = async (fineId, reason) => {
    try {
      const response = await api.put(`/fines/${fineId}/waive`, { reason })
      if (response.data?.success) {
        alert('Fine waived successfully!')
        setShowWaiveModal(null)
        reloadFines() // Refresh the list
      } else {
        alert('Failed to waive fine. Please try again.')
      }
    } catch (error) {
      console.error('[GroupAdminFines] Error waiving fine:', error)
      alert('Failed to waive fine. Please try again.')
    }
  }

  const handleApproveFine = async (fineId) => {
    try {
      const response = await api.put(`/fines/${fineId}/approve`)
      if (response.data?.success) {
        alert('Fine approved successfully!')
        reloadFines() // Refresh the list
      } else {
        alert('Failed to approve fine. Please try again.')
      }
    } catch (error) {
      console.error('[GroupAdminFines] Error approving fine:', error)
      alert('Failed to approve fine. Please try again.')
    }
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('finesAndPenalties')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('manageApproveFines', { defaultValue: 'Manage and approve fines imposed on members' })}</p>
          </div>
          <div className="flex gap-2">
            {hasPermission(user, PERMISSIONS.MANAGE_GROUPS) && (
              <button
                onClick={() => setShowFineRules(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Settings size={18} /> {t('fineRules', { defaultValue: 'Fine Rules' })}
              </button>
            )}
            {hasPermission(user, PERMISSIONS.VIEW_REPORTS) && (
              <button
                onClick={exportFinesReport}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={18} /> {tCommon('exportReport')}
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalFines')}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {summaryStats.totalFines}
                </p>
              </div>
              <AlertCircle className="text-gray-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tCommon('pending')}</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {summaryStats.pendingFines}
                </p>
              </div>
              <Calendar className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {summaryStats.paidFines}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">
                  {summaryStats.totalCollected.toLocaleString()} RWF
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {summaryStats.totalPending.toLocaleString()} RWF
                </p>
              </div>
              <AlertCircle className="text-yellow-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">All Fines</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="waived">Waived</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Members
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, phone, or ID..."
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">Loading fines...</p>
          </div>
        ) : (
          <>
            {/* Fines List */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Fine Records ({filteredFines.length})
                </h2>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Filter size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredFines.map((fine) => (
                  <div
                    key={fine.id}
                    className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                          {fine.memberName[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{fine.memberName}</h3>
                          <p className="text-sm text-gray-600">{fine.phone} • {fine.memberId}</p>
                          <p className="text-sm text-gray-500">Reason: {fine.reason}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(fine.status)}`}>
                        {fine.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-600">Amount</p>
                        <p className="font-semibold">{fine.amount.toLocaleString()} RWF</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Due Date</p>
                        <p className="font-semibold">{fine.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Imposed By</p>
                        <p className="font-semibold">{fine.imposedBy}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Imposed Date</p>
                        <p className="font-semibold">{fine.imposedDate}</p>
                      </div>
                    </div>

                    {fine.status === 'waived' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-blue-800">
                          <strong>Waived by:</strong> {fine.waivedBy} on {fine.waivedDate}
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          <strong>Reason:</strong> {fine.waivedReason}
                        </p>
                      </div>
                    )}

                    {fine.status === 'paid' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-green-800">
                          <strong>Paid on:</strong> {fine.paidDate} via {fine.paymentMethod}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {fine.status === 'pending' && hasPermission(user, PERMISSIONS.MANAGE_CONTRIBUTIONS) && (
                        <>
                          <button
                            onClick={() => handleApproveFine(fine.id)}
                            className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                          >
                            <CheckCircle size={16} /> Approve
                          </button>
                          <button
                            onClick={() => setShowWaiveModal(fine.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <XCircle size={16} /> Waive Fine
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fine Trends Chart */}
            <div className="card bg-gradient-to-r from-primary-50 to-purple-50">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="text-primary-600" size={24} />
                Fine Trends & Recovery
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-2">Monthly Collection</p>
                  <p className="text-2xl font-bold text-gray-800">3,550 RWF</p>
                  <p className="text-xs text-green-600 mt-1">↑ 15% from last month</p>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-2">Recovery Rate</p>
                  <p className="text-2xl font-bold text-gray-800">75%</p>
                  <p className="text-xs text-blue-600 mt-1">3 out of 4 fines paid</p>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-2">Most Common Fine</p>
                  <p className="text-2xl font-bold text-gray-800">Late Payment</p>
                  <p className="text-xs text-orange-600 mt-1">60% of all fines</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Fine Rules Modal */}
        {showFineRules && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold text-gray-800">Fine Rules Configuration</h2>
                <button
                  onClick={() => {
                    setShowFineRules(false)
                    setEditingRule(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-gray-600 mb-4">
                  Manage fine types, amounts, and conditions. These rules are used when Cashier or Secretary imposes fines.
                </p>

                <div className="space-y-3">
                  {fineRules.map((rule) => (
                    <div key={rule.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      {editingRule?.id === rule.id ? (
                        // Edit mode
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Fine Type</label>
                            <input
                              type="text"
                              value={editingRule.type}
                              onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value })}
                              className="input-field w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                            <textarea
                              value={editingRule.description}
                              onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                              className="input-field w-full"
                              rows={2}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (RWF)</label>
                              <input
                                type="number"
                                value={editingRule.amount}
                                onChange={(e) => setEditingRule({ ...editingRule, amount: parseFloat(e.target.value) || 0 })}
                                className="input-field w-full"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Max Limit (RWF)</label>
                              <input
                                type="number"
                                value={editingRule.maxLimit}
                                onChange={(e) => setEditingRule({ ...editingRule, maxLimit: parseFloat(e.target.value) || 0 })}
                                className="input-field w-full"
                                min="0"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Conditions</label>
                            <input
                              type="text"
                              value={editingRule.conditions}
                              onChange={(e) => setEditingRule({ ...editingRule, conditions: e.target.value })}
                              className="input-field w-full"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingRule.enabled}
                                onChange={(e) => setEditingRule({ ...editingRule, enabled: e.target.checked })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-gray-700">Enabled</span>
                            </label>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => setEditingRule(null)}
                              className="btn-secondary text-sm px-4 py-2"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveRule(editingRule)}
                              className="btn-primary text-sm px-4 py-2"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800">{rule.type}</h3>
                            <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Amount: </span>
                                <span className="font-semibold">{rule.amount.toLocaleString()} RWF</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Max Limit: </span>
                                <span className="font-semibold">{rule.maxLimit.toLocaleString()} RWF</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Conditions: {rule.conditions}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditRule(rule)}
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <Edit size={18} className="text-blue-600" />
                            </button>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                              {rule.enabled ? 'Enabled' : 'Disabled'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowFineRules(false)
                      setEditingRule(null)
                    }}
                    className="btn-secondary flex-1"
                    disabled={savingRules}
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSaveFineRules}
                    disabled={savingRules || editingRule !== null}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {savingRules ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Waive Fine Modal */}
        {showWaiveModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Waive Fine</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for Waiving
                  </label>
                  <textarea
                    placeholder="Enter reason (e.g., illness, emergency, group decision)..."
                    className="input-field"
                    rows="4"
                    id="waiveReason"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowWaiveModal(null)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const reason = document.getElementById('waiveReason').value
                      if (reason.trim()) {
                        handleWaiveFine(showWaiveModal, reason)
                      } else {
                        alert('Please provide a reason for waiving the fine')
                      }
                    }}
                    className="btn-primary flex-1"
                  >
                    Waive Fine
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

export default GroupAdminFines

