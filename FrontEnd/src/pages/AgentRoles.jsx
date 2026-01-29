import { useState, useEffect, useContext } from 'react'
import { UserCheck, Users, Shield, Edit, Eye, CheckCircle, XCircle, AlertCircle, Search, Filter, ArrowRightLeft, Crown, DollarSign, FileText, Download, Trash2 } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { UserContext } from '../App'
import { PERMISSIONS, hasPermission } from '../utils/permissions'

function AgentRoles() {
  const { t } = useTranslation('common')
  const { t: tAgent } = useTranslation('agent')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAssignRole, setShowAssignRole] = useState(false)
  const [showTransferUser, setShowTransferUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useContext(UserContext)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    pendingUsers: 0
  })

  // Load statistics from database
  const loadStats = async () => {
    try {
      const { data } = await api.get('/agent/dashboard/stats')
      if (data?.success) {
        setStats({
          totalUsers: data.data.totalMembers || data.data.totalUsers || 0,
          activeUsers: data.data.activeMembers || data.data.activeUsers || 0,
          suspendedUsers: data.data.suspended || data.data.suspendedUsers || 0,
          pendingUsers: data.data.pendingApprovals || data.data.pendingUsers || 0
        })
      }
    } catch (err) {
      console.error('Failed to load statistics:', err)
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      // Fetch all members from agent/members endpoint (same as member management)
      const { data } = await api.get('/agent/members')
      if (data?.success) {
        const allUsers = (data.data || []).map(u => ({
          id: u.id,
          name: u.name,
          phone: u.phone,
          email: u.email || '',
          nationalId: u.nationalId || '',
          group: u.group?.name || 'No Group',
          groupId: u.groupId,
          role: u.role,
          status: u.status || 'active',
          privileges: [],
          assignedDate: u.registrationDate || (u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : ''),
          lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString().split('T')[0] : null,
          loginCount: 0
        }))
        setUsers(allUsers)
      }
    } catch (err) {
      console.error('Failed to load users:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const loadGroups = async () => {
    try {
      const { data } = await api.get('/groups?viewAll=true')
      if (data?.success) {
        setGroups((data.data || []).map(g => ({ id: g.id, name: g.name })))
      }
    } catch (err) {
      console.error('Failed to load groups:', err)
      setGroups([])
    }
  }

  useEffect(() => {
    let mounted = true
    async function loadData() {
      await loadStats()
      await loadGroups()
      await loadUsers()
    }
    loadData()
    return () => { mounted = false }
  }, [])

  const users_OLD = [
    {
      id: 'U001',
      name: 'Kamikazi Marie',
      phone: '+250788123456',
      email: 'kamikazi@email.com',
      group: 'Abakunzi Cooperative',
      groupId: 'G001',
      role: 'Admin',
      status: 'active',
      privileges: ['manage_members', 'approve_loans', 'view_reports', 'manage_group'],
      assignedDate: '2023-01-15',
      lastLogin: '2024-01-25',
      loginCount: 45
    },
    {
      id: 'U002',
      name: 'Mukamana Alice',
      phone: '+250788234567',
      email: 'mukamana@email.com',
      group: 'Abakunzi Cooperative',
      groupId: 'G001',
      role: 'Cashier',
      status: 'active',
      privileges: ['process_payments', 'view_transactions', 'manage_contributions'],
      assignedDate: '2023-01-16',
      lastLogin: '2024-01-24',
      loginCount: 38
    },
    {
      id: 'U003',
      name: 'Ikirezi Jane',
      phone: '+250788345678',
      email: 'ikirezi@email.com',
      group: 'Abakunzi Cooperative',
      groupId: 'G001',
      role: 'Secretary',
      status: 'active',
      privileges: ['manage_documents', 'send_announcements', 'record_meetings'],
      assignedDate: '2023-01-17',
      lastLogin: '2024-01-23',
      loginCount: 42
    },
    {
      id: 'U004',
      name: 'Mutabazi Paul',
      phone: '+250788456789',
      email: 'mutabazi@email.com',
      group: 'Twitezimbere Group',
      groupId: 'G002',
      role: 'Admin',
      status: 'suspended',
      privileges: [],
      assignedDate: '2023-02-20',
      lastLogin: '2024-01-15',
      loginCount: 25
    },
    {
      id: 'U005',
      name: 'Uwimana Grace',
      phone: '+250788567890',
      email: 'uwimana@email.com',
      group: 'Twitezimbere Group',
      groupId: 'G002',
      role: 'Cashier',
      status: 'active',
      privileges: ['process_payments', 'view_transactions', 'manage_contributions'],
      assignedDate: '2023-02-21',
      lastLogin: '2024-01-22',
      loginCount: 35
    },
    {
      id: 'U006',
      name: 'Nkurunziza Peter',
      phone: '+250788678901',
      email: 'nkurunziza@email.com',
      group: 'Umutima Wacu',
      groupId: 'G003',
      role: 'Secretary',
      status: 'pending',
      privileges: [],
      assignedDate: '2023-03-10',
      lastLogin: null,
      loginCount: 0
    }
  ]

  // Groups are now loaded from database in useEffect

  const rolePrivileges = {
    'Group Admin': ['manage_members', 'approve_loans', 'view_reports', 'manage_group', 'manage_settings'],
    Cashier: ['process_payments', 'view_transactions', 'manage_contributions', 'generate_reports'],
    Secretary: ['manage_documents', 'send_announcements', 'record_meetings', 'view_members']
  }

  const [newRoleAssignment, setNewRoleAssignment] = useState({
    groupId: '',
    userId: '',
    role: 'Member',
    privileges: []
  })
  const [groupMembers, setGroupMembers] = useState([])

  const [userTransfer, setUserTransfer] = useState({
    step: 1, // 1: Select source group, 2: Select member, 3: Select destination group
    fromGroupId: '',
    fromGroupName: '',
    userId: '',
    userName: '',
    userEmail: '',
    toGroupId: '',
    toGroupName: '',
    reason: ''
  })
  const [transferGroupSearch, setTransferGroupSearch] = useState('')
  const [transferMemberSearch, setTransferMemberSearch] = useState('')
  const [transferDestinationGroupSearch, setTransferDestinationGroupSearch] = useState('')
  const [transferGroupMembers, setTransferGroupMembers] = useState([])

  const filteredUsers = users.filter(user => {
    const matchesGroup = filterGroup === 'all' || (user.groupId && user.groupId.toString() === filterGroup.toString())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      user.name.toLowerCase().includes(searchLower) ||
      user.phone?.includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.id.toString().includes(searchTerm) ||
      user.group?.toLowerCase().includes(searchLower) ||
      (user.nationalId && user.nationalId.includes(searchTerm))
    return matchesGroup && matchesRole && matchesStatus && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'suspended': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'Group Admin': return 'bg-blue-100 text-blue-700'
      case 'Cashier': return 'bg-green-100 text-green-700'
      case 'Secretary': return 'bg-purple-100 text-purple-700'
      case 'Member': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Group Admin': return <Crown className="text-blue-600" size={20} />
      case 'Cashier': return <DollarSign className="text-green-600" size={20} />
      case 'Secretary': return <FileText className="text-purple-600" size={20} />
      default: return <Users className="text-gray-600" size={20} />
    }
  }

  // Load members when group is selected (for assign role)
  useEffect(() => {
    async function loadGroupMembers() {
      if (!newRoleAssignment.groupId) {
        setGroupMembers([])
        return
      }
      try {
        const { data } = await api.get(`/groups/${newRoleAssignment.groupId}/members`, {
          params: { allMembers: 'true' }
        })
        if (data?.success) {
          setGroupMembers(data.data || [])
        }
      } catch (err) {
        console.error('Failed to load group members:', err)
        setGroupMembers([])
      }
    }
    loadGroupMembers()
  }, [newRoleAssignment.groupId])


  const handleAssignRole = async () => {
    if (!newRoleAssignment.userId || !newRoleAssignment.groupId || !newRoleAssignment.role) {
      alert('Please select group, user, and role')
      return
    }

    try {
      // Update user role and group via PUT /api/system-admin/users/:id
      const { data } = await api.put(`/system-admin/users/${newRoleAssignment.userId}`, {
        role: newRoleAssignment.role,
        groupId: newRoleAssignment.groupId
      })

      if (!data?.success) {
        throw new Error(data?.message || 'Failed to assign role')
      }

      alert('Role assigned successfully! An email has been sent to the user.')
      setShowAssignRole(false)
      setNewRoleAssignment({
        groupId: '',
        userId: '',
        role: 'Member',
        privileges: []
      })
      setGroupMembers([])

      // Reload statistics and users
      await loadStats()
      await loadUsers()
    } catch (err) {
      console.error('Failed to assign role:', err)
      alert(err.response?.data?.message || err.message || 'Failed to assign role')
    }
  }

  // State for transfer groups (separate from main groups list)
  const [transferGroups, setTransferGroups] = useState([])

  // Load groups with search from database
  const loadTransferGroups = async (searchTerm = '') => {
    try {
      const params = { viewAll: 'true' }
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim()
      }
      console.log('[loadTransferGroups] Fetching groups with params:', params)
      const { data } = await api.get('/groups', { params })
      console.log('[loadTransferGroups] Response:', data)
      if (data?.success) {
        const groups = data.data || []
        console.log('[loadTransferGroups] Found groups:', groups.length)
        // Ensure code is included in the response
        return groups.map(g => ({
          ...g,
          code: g.code || ''
        }))
      }
      console.warn('[loadTransferGroups] No success in response')
      return []
    } catch (err) {
      console.error('Failed to load groups:', err)
      console.error('Error details:', err.response?.data || err.message)
      return []
    }
  }

  // Load members when source group is selected
  const loadTransferGroupMembers = async (groupId, searchTerm = '') => {
    try {
      const params = { allMembers: 'true' }
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim()
      }
      const { data } = await api.get(`/groups/${groupId}/members`, { params })
      if (data?.success) {
        return data.data || []
      }
      return []
    } catch (err) {
      console.error('Failed to load group members:', err)
      return []
    }
  }

  // Load all groups when modal opens (Step 1) - no auto-search
  useEffect(() => {
    if (showTransferUser && userTransfer.step === 1 && transferGroups.length === 0) {
      // Load all groups initially when modal opens
      loadTransferGroups('').then(groupsList => {
        setTransferGroups(groupsList.map(g => ({ id: g.id, name: g.name, code: g.code })))
      }).catch(err => {
        console.error('Failed to load initial groups:', err)
      })
    }
  }, [showTransferUser, userTransfer.step])

  // Handle search button click
  const handleSearchGroups = async () => {
    try {
      const groupsList = await loadTransferGroups(transferGroupSearch)
      setTransferGroups(groupsList.map(g => ({ id: g.id, name: g.name, code: g.code })))
    } catch (err) {
      console.error('Search failed:', err)
      alert('Failed to search groups. Please try again.')
    }
  }

  // Load members when group is selected and search term changes (Step 2)
  useEffect(() => {
    if (!showTransferUser || userTransfer.step !== 2 || !userTransfer.fromGroupId) {
      setTransferGroupMembers([])
      return
    }

    let mounted = true
    let timeoutId

    async function searchMembers() {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => {
        const membersList = await loadTransferGroupMembers(userTransfer.fromGroupId, transferMemberSearch)
        if (mounted) {
          setTransferGroupMembers(membersList)
        }
      }, 300) // Debounce search
    }

    // Load immediately when group is selected
    searchMembers()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [userTransfer.fromGroupId, userTransfer.step, transferMemberSearch, showTransferUser])

  // Load destination groups when step 3 is reached
  useEffect(() => {
    if (showTransferUser && userTransfer.step === 3) {
      // Load all groups when moving to step 3, then filter out source group
      loadTransferGroups('').then(groupsList => {
        const filtered = groupsList
          .filter(g => g.id.toString() !== userTransfer.fromGroupId?.toString())
          .map(g => ({ id: g.id, name: g.name, code: g.code }))
        setTransferGroups(filtered)
      }).catch(err => {
        console.error('Failed to load destination groups:', err)
      })
    }
  }, [userTransfer.step, showTransferUser, userTransfer.fromGroupId])

  // Handle destination group search button click
  const handleSearchDestinationGroups = async () => {
    try {
      const groupsList = await loadTransferGroups(transferDestinationGroupSearch)
      const filtered = groupsList
        .filter(g => g.id.toString() !== userTransfer.fromGroupId?.toString())
        .map(g => ({ id: g.id, name: g.name, code: g.code }))
      setTransferGroups(filtered)
    } catch (err) {
      console.error('Search failed:', err)
      alert('Failed to search groups. Please try again.')
    }
  }

  const handleTransferUser = async () => {
    if (!userTransfer.userId || !userTransfer.toGroupId) {
      alert('Please complete all steps: select source group, member, and destination group')
      return
    }

    if (!userTransfer.userEmail) {
      alert('Please enter the user\'s email address to notify them of the transfer')
      return
    }

    try {
      // Transfer user via POST /api/system-admin/users/transfer
      const { data } = await api.post('/system-admin/users/transfer', {
        userId: userTransfer.userId,
        fromGroupId: userTransfer.fromGroupId || null,
        toGroupId: userTransfer.toGroupId,
        reason: userTransfer.reason || '',
        userEmail: userTransfer.userEmail
      })

      if (!data?.success) {
        throw new Error(data?.message || 'Failed to transfer user')
      }

      alert('User transferred successfully! The user and destination group admin have been notified.')
      setShowTransferUser(false)
      setUserTransfer({
        step: 1,
        fromGroupId: '',
        fromGroupName: '',
        userId: '',
        userName: '',
        userEmail: '',
        toGroupId: '',
        toGroupName: '',
        reason: ''
      })
      setTransferGroupSearch('')
      setTransferMemberSearch('')
      setTransferDestinationGroupSearch('')
      setTransferGroupMembers([])

      // Reload statistics and users to reflect new group assignments
      await loadStats()
      await loadUsers()
    } catch (err) {
      console.error('Failed to transfer user:', err)
      alert(err.response?.data?.message || err.message || 'Failed to transfer user')
    }
  }

  // Groups are loaded from database with search
  const filteredTransferGroups = transferGroups

  // Members are loaded from database with search
  const filteredTransferMembers = transferGroupMembers

  // Destination groups are loaded from database with search and filtered on backend
  const filteredDestinationGroups = transferGroups

  const handleViewUserDetails = (user) => {
    setSelectedUser(user)
    setShowUserDetails(true)
  }

  const handleEditUser = (user) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email || '',
      nationalId: user.nationalId || '',
      role: user.role,
      status: user.status,
      groupId: user.groupId
    })
    setShowEditUser(true)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    setSubmitting(true)
    try {
      const { data } = await api.put(`/system-admin/users/${editingUser.id}`, {
        name: editingUser.name,
        phone: editingUser.phone,
        email: editingUser.email,
        nationalId: editingUser.nationalId,
        role: editingUser.role,
        status: editingUser.status
      })

      if (data?.success) {
        alert('User updated successfully!')
        setShowEditUser(false)
        setEditingUser(null)
        await loadStats()
        await loadUsers()
        if (selectedUser && selectedUser.id === editingUser.id) {
          await loadUsers() // Reload to update selected user
        }
      } else {
        throw new Error(data?.message || 'Failed to update user')
      }
    } catch (err) {
      console.error('Failed to update user:', err)
      alert(err.response?.data?.message || err.message || 'Failed to update user. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSuspendUser = async (userId) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    if (!window.confirm(`Are you sure you want to suspend ${user.name}?`)) {
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.put(`/system-admin/users/${userId}`, { status: 'suspended' })
      if (data?.success) {
        alert('User suspended successfully!')
        await loadStats()
        await loadUsers()
      } else {
        throw new Error(data?.message || 'Failed to suspend user')
      }
    } catch (err) {
      console.error('Failed to suspend user:', err)
      alert(err.response?.data?.message || err.message || 'Failed to suspend user. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReinstateUser = async (userId) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    if (!window.confirm(`Are you sure you want to reinstate ${user.name}?`)) {
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.put(`/system-admin/users/${userId}`, { status: 'active' })
      if (data?.success) {
        alert('User reinstated successfully!')
        await loadStats()
        await loadUsers()
      } else {
        throw new Error(data?.message || 'Failed to reinstate user')
      }
    } catch (err) {
      console.error('Failed to reinstate user:', err)
      alert(err.response?.data?.message || err.message || 'Failed to reinstate user. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveUser = async (userId) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    if (!window.confirm(`Are you sure you want to approve ${user.name}?`)) {
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.put(`/system-admin/users/${userId}`, { status: 'active' })
      if (data?.success) {
        alert('User approved successfully!')
        await loadStats()
        await loadUsers()
      } else {
        throw new Error(data?.message || 'Failed to approve user')
      }
    } catch (err) {
      console.error('Failed to approve user:', err)
      alert(err.response?.data?.message || err.message || 'Failed to approve user. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBurnAccount = async (userId) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    const isBurning = user.status !== 'burned'
    const confirmMessage = isBurning
      ? `⚠️ WARNING: This will burn (suspend) the account for ${user.name}.\n\nThey will not be able to access their account until reactivated.\n\nAre you sure you want to proceed?`
      : `Are you sure you want to reactivate the account for ${user.name}?`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.put(`/agent/members/${userId}/toggle-status`)

      if (data?.success) {
        alert(data.message || (isBurning ? 'Account burned successfully!' : 'Account reactivated successfully!'))
        await loadStats()
        await loadUsers()
        if (showUserDetails) {
          setShowUserDetails(false)
          setSelectedUser(null)
        }
      } else {
        throw new Error(data?.message || 'Failed to update account status')
      }
    } catch (err) {
      console.error('Failed to update account status:', err)
      alert(err.response?.data?.message || err.message || 'Failed to update account status. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExportUsers = async () => {
    try {
      // Export only filtered/searched users (current view)
      const usersToExport = filteredUsers.map(u => ({
        name: u.name,
        phone: u.phone,
        email: u.email || '',
        nationalId: u.nationalId || '',
        group: u.group,
        role: u.role,
        status: u.status,
        assignedDate: u.assignedDate
      }))

      if (usersToExport.length === 0) {
        alert('No users to export. Please adjust your filters.')
        return
      }

      // Generate CSV content
      let csvContent = 'IKIMINA WALLET - USER ROLE MANAGEMENT REPORT\n'
      csvContent += `Generated: ${new Date().toLocaleString()}\n`
      csvContent += `Total Users: ${usersToExport.length}\n`
      const selectedGroup = groups.find(g => g.id.toString() === filterGroup.toString())
      csvContent += `Filters: Group=${filterGroup === 'all' ? 'All' : selectedGroup?.name || filterGroup}, Role=${filterRole === 'all' ? 'All' : filterRole}, Status=${filterStatus === 'all' ? 'All' : filterStatus}, Search=${searchTerm || 'None'}\n\n`
      csvContent += 'Name,Phone,Email,National ID,Group,Role,Status,Assigned Date\n'

      usersToExport.forEach(u => {
        csvContent += `"${u.name}","${u.phone}","${u.email}","${u.nationalId}","${u.group}","${u.role}","${u.status}","${u.assignedDate}"\n`
      })

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `user-role-management-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('User data exported successfully!')
    } catch (err) {
      console.error('Failed to export users:', err)
      alert('Failed to export user data. Please try again.')
    }
  }

  const handleReplaceAdmin = async (userId) => {
    const currentUser = users.find(u => u.id === userId)
    if (!currentUser || currentUser.role !== 'Group Admin') {
      alert('Selected user is not a Group Admin')
      return
    }

    const newAdminId = prompt(`Enter the ID of the new Group Admin to replace ${currentUser.name} in ${currentUser.group}`)
    if (!newAdminId) return

    try {
      // Update old admin to Member
      await api.put(`/system-admin/users/${userId}`, { role: 'Member' })
      // Update new admin to Group Admin
      await api.put(`/system-admin/users/${newAdminId}`, {
        role: 'Group Admin',
        groupId: currentUser.groupId
      })
      alert('Admin replaced successfully!')
      // Reload users
      window.location.reload()
    } catch (err) {
      console.error('Failed to replace admin:', err)
      alert(err.response?.data?.message || 'Failed to replace admin')
    }
  }

  const handleUpdatePrivileges = (userId) => {
    // Privileges would need a separate endpoint/field in the database
    alert('Privilege management will be implemented when the backend supports it.')
  }

  return (
    <Layout userRole="Agent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">User Role & Privilege Management</h1>
            <p className="text-gray-600 mt-1">Manage user roles and permissions across groups</p>
          </div>
          <div className="flex gap-2">
            {hasPermission(user, PERMISSIONS.VIEW_REPORTS) && (
              <button
                onClick={handleExportUsers}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={18} /> Export Data
              </button>
            )}
            {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
              <>
                <button
                  onClick={() => setShowAssignRole(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <UserCheck size={18} /> Assign Role
                </button>
                <button
                  onClick={() => setShowTransferUser(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ArrowRightLeft size={18} /> Transfer User
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
              </div>
              <Users className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.activeUsers}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Suspended Users</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.suspendedUsers}
                </p>
              </div>
              <XCircle className="text-red-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Approvals</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pendingUsers}
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
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, phone, email, national ID, or ID..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Group
              </label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="input-field"
              >
                <option value="all">All Groups</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Role
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="input-field"
              >
                <option value="all">All Roles</option>
                <option value="Group Admin">Group Admin</option>
                <option value="Cashier">Cashier</option>
                <option value="Secretary">Secretary</option>
                <option value="Member">Member</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              User Accounts ({filteredUsers.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No users found. Users will appear here once they are registered.</p>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {user.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.group}</p>
                      <p className="text-sm text-gray-500">ID: {user.id} • Assigned: {user.assignedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-semibold">{user.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-semibold">{user.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">National ID</p>
                    <p className="font-semibold">{user.nationalId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Login</p>
                    <p className="font-semibold">{user.lastLogin || 'Never'}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Privileges:</p>
                  <div className="flex flex-wrap gap-2">
                    {user.privileges.map((privilege, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {privilege.replace('_', ' ')}
                      </span>
                    ))}
                    {user.privileges.length === 0 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        No privileges
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleViewUserDetails(u)}
                    className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Eye size={16} /> View Details
                  </button>
                  {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
                    <button
                      onClick={() => handleEditUser(u)}
                      className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <Edit size={16} /> Edit Profile
                    </button>
                  )}
                  {u.status === 'pending' && hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
                    <button
                      onClick={() => handleApproveUser(u.id)}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                  )}
                  {u.status === 'active' && hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
                    <button
                      onClick={() => handleSuspendUser(u.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <XCircle size={16} /> Suspend
                    </button>
                  )}
                  {u.status === 'suspended' && hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
                    <button
                      onClick={() => handleReinstateUser(u.id)}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle size={16} /> Reinstate
                    </button>
                  )}
                  {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
                    <button
                      onClick={() => handleBurnAccount(u.id)}
                      className="bg-red-700 hover:bg-red-800 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={16} /> Burn Account
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Assign Role Modal */}
        {showAssignRole && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Assign Role to User</h2>
                <button
                  onClick={() => setShowAssignRole(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Step 1: Select Group
                    </label>
                    <select
                      value={newRoleAssignment.groupId}
                      onChange={(e) => {
                        setNewRoleAssignment({
                          ...newRoleAssignment,
                          groupId: e.target.value,
                          userId: '' // Reset user when group changes
                        })
                      }}
                      className="input-field"
                    >
                      <option value="">Select Group</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>

                  {newRoleAssignment.groupId && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Step 2: Select Member from Group
                      </label>
                      <select
                        value={newRoleAssignment.userId}
                        onChange={(e) => setNewRoleAssignment({ ...newRoleAssignment, userId: e.target.value })}
                        className="input-field"
                        disabled={!newRoleAssignment.groupId}
                      >
                        <option value="">Select Member</option>
                        {groupMembers.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.phone}) - Current Role: {member.role}
                          </option>
                        ))}
                      </select>
                      {groupMembers.length === 0 && newRoleAssignment.groupId && (
                        <p className="text-sm text-gray-500 mt-2">No members found in this group</p>
                      )}
                    </div>
                  )}

                  {newRoleAssignment.userId && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Step 3: Select Role to Assign
                      </label>
                      <select
                        value={newRoleAssignment.role}
                        onChange={(e) => setNewRoleAssignment({
                          ...newRoleAssignment,
                          role: e.target.value,
                          privileges: rolePrivileges[e.target.value] || []
                        })}
                        className="input-field"
                      >
                        <option value="Member">Member</option>
                        <option value="Group Admin">Group Admin</option>
                        <option value="Cashier">Cashier</option>
                        <option value="Secretary">Secretary</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role Privileges
                  </label>
                  <div className="space-y-2">
                    {rolePrivileges[newRoleAssignment.role]?.map((privilege, index) => (
                      <label key={index} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={newRoleAssignment.privileges.includes(privilege)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRoleAssignment({
                                ...newRoleAssignment,
                                privileges: [...newRoleAssignment.privileges, privilege]
                              })
                            } else {
                              setNewRoleAssignment({
                                ...newRoleAssignment,
                                privileges: newRoleAssignment.privileges.filter(p => p !== privilege)
                              })
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">{privilege.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAssignRole(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignRole}
                    className="btn-primary flex-1"
                  >
                    Assign Role
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transfer User Modal */}
        {showTransferUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Transfer User Between Groups</h2>
                <button
                  onClick={() => {
                    setShowTransferUser(false)
                    setUserTransfer({
                      step: 1,
                      fromGroupId: '',
                      fromGroupName: '',
                      userId: '',
                      userName: '',
                      userEmail: '',
                      toGroupId: '',
                      toGroupName: '',
                      reason: ''
                    })
                    setTransferGroupSearch('')
                    setTransferMemberSearch('')
                    setTransferDestinationGroupSearch('')
                    setTransferGroupMembers([])
                    setTransferGroups([])
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Step Indicator */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`flex items-center ${userTransfer.step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${userTransfer.step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                      1
                    </div>
                    <span className="ml-2 font-semibold">Source Group</span>
                  </div>
                  <div className={`flex-1 h-1 mx-2 ${userTransfer.step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
                  <div className={`flex items-center ${userTransfer.step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${userTransfer.step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                      2
                    </div>
                    <span className="ml-2 font-semibold">Select Member</span>
                  </div>
                  <div className={`flex-1 h-1 mx-2 ${userTransfer.step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
                  <div className={`flex items-center ${userTransfer.step >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${userTransfer.step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                      3
                    </div>
                    <span className="ml-2 font-semibold">Destination</span>
                  </div>
                </div>

                {/* Step 1: Select Source Group */}
                {userTransfer.step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Step 1: Search and Select Source Group
                      </label>
                      <div className="flex gap-2 mb-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            value={transferGroupSearch}
                            onChange={(e) => setTransferGroupSearch(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSearchGroups()
                              }
                            }}
                            placeholder="Enter group name to search..."
                            className="input-field pl-10"
                            autoFocus
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSearchGroups}
                          className="btn-primary px-6 whitespace-nowrap"
                        >
                          <Search size={18} className="mr-2" />
                          Search
                        </button>
                      </div>

                      {/* Display search results as clickable items */}
                      {filteredTransferGroups.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-3">
                            Found {filteredTransferGroups.length} group{filteredTransferGroups.length !== 1 ? 's' : ''}
                            {transferGroupSearch && ` matching "${transferGroupSearch}"`}
                          </p>
                          <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                            {filteredTransferGroups.map(group => (
                              <div
                                key={group.id}
                                onClick={() => {
                                  setUserTransfer({
                                    ...userTransfer,
                                    fromGroupId: group.id.toString(),
                                    fromGroupName: group.name || ''
                                  })
                                }}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${userTransfer.fromGroupId === group.id.toString()
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-gray-800">{group.name}</p>
                                    {group.code && (
                                      <p className="text-sm text-gray-600">Code: {group.code}</p>
                                    )}
                                    {group.district && (
                                      <p className="text-xs text-gray-500">District: {group.district}</p>
                                    )}
                                  </div>
                                  {userTransfer.fromGroupId === group.id.toString() && (
                                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                                      <CheckCircle className="text-white" size={16} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {filteredTransferGroups.length === 0 && transferGroupSearch && (
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            No groups found matching "{transferGroupSearch}". Please try a different search term.
                          </p>
                        </div>
                      )}

                      {!transferGroupSearch && filteredTransferGroups.length === 0 && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            Enter a group name and click "Search" to find groups.
                          </p>
                        </div>
                      )}

                      {/* Show selected group */}
                      {userTransfer.fromGroupId && userTransfer.fromGroupName && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-semibold text-green-800 mb-1">Selected Group:</p>
                          <p className="text-sm text-green-700">{userTransfer.fromGroupName}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          setShowTransferUser(false)
                          setUserTransfer({
                            step: 1,
                            fromGroupId: '',
                            fromGroupName: '',
                            userId: '',
                            userName: '',
                            userEmail: '',
                            toGroupId: '',
                            toGroupName: '',
                            reason: ''
                          })
                          setTransferGroupSearch('')
                          setTransferMemberSearch('')
                          setTransferDestinationGroupSearch('')
                          setTransferGroupMembers([])
                          setTransferGroups([])
                        }}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!userTransfer.fromGroupId) {
                            alert('Please select a source group')
                            return
                          }
                          // Load all members when moving to step 2
                          const membersList = await loadTransferGroupMembers(userTransfer.fromGroupId, '')
                          setTransferGroupMembers(membersList)
                          setUserTransfer({ ...userTransfer, step: 2 })
                        }}
                        className="btn-primary flex-1"
                      >
                        Next: Select Member
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Select Member from Source Group */}
                {userTransfer.step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Step 2: Search and Select Member from "{userTransfer.fromGroupName}"
                      </label>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={transferMemberSearch}
                          onChange={(e) => setTransferMemberSearch(e.target.value)}
                          placeholder="Search members by name, phone, email, or ID..."
                          className="input-field pl-10"
                        />
                      </div>
                      <select
                        value={userTransfer.userId}
                        onChange={(e) => {
                          const selectedMember = transferGroupMembers.find(m => m.id.toString() === e.target.value)
                          setUserTransfer({
                            ...userTransfer,
                            userId: e.target.value,
                            userName: selectedMember?.name || '',
                            userEmail: selectedMember?.email || ''
                          })
                        }}
                        className="input-field"
                      >
                        <option value="">Select Member</option>
                        {filteredTransferMembers.length === 0 && transferMemberSearch && (
                          <option value="" disabled>No members found. Try a different search term.</option>
                        )}
                        {filteredTransferMembers.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.phone}) - {member.role || 'Member'}
                          </option>
                        ))}
                      </select>
                      {!transferMemberSearch && filteredTransferMembers.length === 0 && userTransfer.fromGroupId && (
                        <p className="text-sm text-gray-500 mt-2">Type to search members in this group...</p>
                      )}
                      {transferGroupMembers.length === 0 && userTransfer.fromGroupId && transferMemberSearch && (
                        <p className="text-sm text-gray-500 mt-2">No members found matching your search</p>
                      )}
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={async () => {
                          // Reload groups when going back to step 1
                          const groupsList = await loadTransferGroups(transferGroupSearch)
                          setTransferGroups(groupsList.map(g => ({ id: g.id, name: g.name })))
                          setUserTransfer({ ...userTransfer, step: 1 })
                        }}
                        className="btn-secondary flex-1"
                      >
                        Back
                      </button>
                      <button
                        onClick={async () => {
                          if (!userTransfer.userId) {
                            alert('Please select a member')
                            return
                          }
                          // Load destination groups immediately when moving to step 3
                          const groupsList = await loadTransferGroups('')
                          const filtered = groupsList
                            .filter(g => g.id.toString() !== userTransfer.fromGroupId?.toString())
                            .map(g => ({ id: g.id, name: g.name }))
                          setTransferGroups(filtered)
                          setUserTransfer({ ...userTransfer, step: 3 })
                        }}
                        className="btn-primary flex-1"
                      >
                        Next: Select Destination
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Select Destination Group and Complete Transfer */}
                {userTransfer.step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Step 3: Search and Select Destination Group
                      </label>
                      <div className="flex gap-2 mb-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            value={transferDestinationGroupSearch}
                            onChange={(e) => setTransferDestinationGroupSearch(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSearchDestinationGroups()
                              }
                            }}
                            placeholder="Enter destination group name to search..."
                            className="input-field pl-10"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSearchDestinationGroups}
                          className="btn-primary px-6 whitespace-nowrap"
                        >
                          <Search size={18} className="mr-2" />
                          Search
                        </button>
                      </div>

                      {/* Display search results as clickable items */}
                      {filteredDestinationGroups.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-3">
                            Found {filteredDestinationGroups.length} group{filteredDestinationGroups.length !== 1 ? 's' : ''}
                            {transferDestinationGroupSearch && ` matching "${transferDestinationGroupSearch}"`}
                          </p>
                          <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                            {filteredDestinationGroups.map(group => (
                              <div
                                key={group.id}
                                onClick={() => {
                                  setUserTransfer({
                                    ...userTransfer,
                                    toGroupId: group.id.toString(),
                                    toGroupName: group.name || ''
                                  })
                                }}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${userTransfer.toGroupId === group.id.toString()
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-gray-800">{group.name}</p>
                                    {group.code && (
                                      <p className="text-sm text-gray-600">Code: {group.code}</p>
                                    )}
                                    {group.district && (
                                      <p className="text-xs text-gray-500">District: {group.district}</p>
                                    )}
                                  </div>
                                  {userTransfer.toGroupId === group.id.toString() && (
                                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                                      <CheckCircle className="text-white" size={16} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {filteredDestinationGroups.length === 0 && transferDestinationGroupSearch && (
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            No groups found matching "{transferDestinationGroupSearch}". Please try a different search term.
                          </p>
                        </div>
                      )}

                      {!transferDestinationGroupSearch && filteredDestinationGroups.length === 0 && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            Enter a group name and click "Search" to find destination groups.
                          </p>
                        </div>
                      )}

                      {/* Show selected destination group */}
                      {userTransfer.toGroupId && userTransfer.toGroupName && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-semibold text-green-800 mb-1">Selected Destination Group:</p>
                          <p className="text-sm text-green-700">{userTransfer.toGroupName}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        User Email (for notification)
                      </label>
                      <input
                        type="email"
                        value={userTransfer.userEmail}
                        onChange={(e) => setUserTransfer({ ...userTransfer, userEmail: e.target.value })}
                        className="input-field"
                        placeholder="Enter user's email address"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">The user will receive an email notification about the transfer</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Transfer Reason
                      </label>
                      <textarea
                        value={userTransfer.reason}
                        onChange={(e) => setUserTransfer({ ...userTransfer, reason: e.target.value })}
                        className="input-field h-24 resize-none"
                        placeholder="Enter reason for transfer..."
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Transfer Summary</h4>
                      <p className="text-sm text-blue-700">
                        <strong>Member:</strong> {userTransfer.userName}<br />
                        <strong>From Group:</strong> {userTransfer.fromGroupName}<br />
                        <strong>To Group:</strong> {userTransfer.toGroupName || 'Not selected'}
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={async () => {
                          // Reload members when going back to step 2
                          if (userTransfer.fromGroupId) {
                            const membersList = await loadTransferGroupMembers(userTransfer.fromGroupId, transferMemberSearch)
                            setTransferGroupMembers(membersList)
                          }
                          setUserTransfer({ ...userTransfer, step: 2 })
                        }}
                        className="btn-secondary flex-1"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleTransferUser}
                        disabled={!userTransfer.toGroupId || !userTransfer.userEmail}
                        className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Complete Transfer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">User Details</h2>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                    {selectedUser.name[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedUser.name}</h3>
                    <p className="text-gray-600">{selectedUser.group}</p>
                    <p className="text-sm text-gray-500">User ID: {selectedUser.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Account Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-semibold">{selectedUser.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-semibold">{selectedUser.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(selectedUser.role)}`}>
                          {selectedUser.role}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedUser.status)}`}>
                          {selectedUser.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assigned Date:</span>
                        <span className="font-semibold">{selectedUser.assignedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Activity Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Login:</span>
                        <span className="font-semibold">{selectedUser.lastLogin || 'Never'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Login Count:</span>
                        <span className="font-semibold">{selectedUser.loginCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800">Privileges</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.privileges.map((privilege, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                        {privilege.replace('_', ' ')}
                      </span>
                    ))}
                    {selectedUser.privileges.length === 0 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        No privileges assigned
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 flex-wrap">
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
                    <>
                      <button
                        onClick={() => {
                          setShowUserDetails(false)
                          handleEditUser(selectedUser)
                        }}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        <Edit size={16} /> Edit Profile
                      </button>
                      {selectedUser.status === 'pending' && (
                        <button
                          onClick={() => {
                            setShowUserDetails(false)
                            handleApproveUser(selectedUser.id)
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white flex-1 flex items-center justify-center gap-2 transition-colors"
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                      )}
                      {selectedUser.status === 'active' && (
                        <button
                          onClick={() => {
                            setShowUserDetails(false)
                            handleSuspendUser(selectedUser.id)
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white flex-1 flex items-center justify-center gap-2 transition-colors"
                        >
                          <XCircle size={16} /> Suspend
                        </button>
                      )}
                      {selectedUser.status === 'suspended' && (
                        <button
                          onClick={() => {
                            setShowUserDetails(false)
                            handleReinstateUser(selectedUser.id)
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white flex-1 flex items-center justify-center gap-2 transition-colors"
                        >
                          <CheckCircle size={16} /> Reinstate
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowUserDetails(false)
                          handleBurnAccount(selectedUser.id)
                        }}
                        className="bg-red-700 hover:bg-red-800 text-white flex-1 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Trash2 size={16} /> Burn Account
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUser && editingUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Edit User Profile</h2>
                <button
                  onClick={() => {
                    setShowEditUser(false)
                    setEditingUser(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      National ID
                    </label>
                    <input
                      type="text"
                      value={editingUser.nationalId || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, nationalId: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="input-field"
                    >
                      <option value="Member">Member</option>
                      <option value="Group Admin">Group Admin</option>
                      <option value="Cashier">Cashier</option>
                      <option value="Secretary">Secretary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                      className="input-field"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEditUser(false)
                      setEditingUser(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUser}
                    disabled={submitting}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
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

export default AgentRoles

