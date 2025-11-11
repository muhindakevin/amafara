import { useState, useEffect } from 'react'
import { UserCheck, Users, Shield, Edit, Eye, CheckCircle, XCircle, AlertCircle, Search, Filter, ArrowRightLeft, Crown, DollarSign, FileText } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function AgentRoles() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAssignRole, setShowAssignRole] = useState(false)
  const [showTransferUser, setShowTransferUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        setLoading(true)
        // Fetch all users (excluding Agents and System Admins)
        const { data: usersRes } = await api.get('/system-admin/users')
        // Fetch all groups
        const { data: groupsRes } = await api.get('/groups')

        if (!mounted) return

        // Filter out Agents and System Admins
        const allUsers = (usersRes.data || []).filter(u => 
          u.role !== 'Agent' && u.role !== 'System Admin'
        )

        // Fetch group names for each user
        const usersWithGroups = await Promise.all(allUsers.map(async (u) => {
          let groupName = 'No Group'
          if (u.groupId) {
            try {
              const { data: groupData } = await api.get(`/groups/${u.groupId}`)
              if (groupData?.success) {
                groupName = groupData.data.name
              }
            } catch (err) {
              console.warn(`Failed to fetch group ${u.groupId}:`, err)
            }
          }

          return {
            id: u.id,
            name: u.name,
            phone: u.phone,
            email: u.email || '',
            group: groupName,
            groupId: u.groupId,
            role: u.role,
            status: u.status || 'active',
            privileges: [], // Privileges would need a separate endpoint or field
            assignedDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
            lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString().split('T')[0] : null,
            loginCount: 0 // This would need tracking
          }
        }))

        setUsers(usersWithGroups)
        setGroups((groupsRes.data || []).map(g => ({ id: g.id, name: g.name })))
      } catch (err) {
        console.error('Failed to load users and groups:', err)
      } finally {
        if (mounted) setLoading(false)
      }
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
    Admin: ['manage_members', 'approve_loans', 'view_reports', 'manage_group', 'manage_settings'],
    Cashier: ['process_payments', 'view_transactions', 'manage_contributions', 'generate_reports'],
    Secretary: ['manage_documents', 'send_announcements', 'record_meetings', 'view_members']
  }

  const [newRoleAssignment, setNewRoleAssignment] = useState({
    userId: '',
    role: 'Member',
    groupId: '',
    privileges: []
  })

  const [userTransfer, setUserTransfer] = useState({
    userId: '',
    fromGroup: '',
    toGroup: '',
    reason: ''
  })

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRole && matchesStatus && matchesSearch
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
      case 'Admin': return 'bg-blue-100 text-blue-700'
      case 'Cashier': return 'bg-green-100 text-green-700'
      case 'Secretary': return 'bg-purple-100 text-purple-700'
      case 'Member': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin': return <Crown className="text-blue-600" size={20} />
      case 'Cashier': return <DollarSign className="text-green-600" size={20} />
      case 'Secretary': return <FileText className="text-purple-600" size={20} />
      default: return <Users className="text-gray-600" size={20} />
    }
  }

  const handleAssignRole = async () => {
    if (!newRoleAssignment.userId || !newRoleAssignment.groupId || !newRoleAssignment.role) {
      alert('Please select user, group, and role')
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

      alert('Role assigned successfully!')
      setShowAssignRole(false)
      setNewRoleAssignment({
        userId: '',
        role: 'Member',
        groupId: '',
        privileges: []
      })

      // Reload users
      const { data: usersRes } = await api.get('/system-admin/users')
      const allUsers = (usersRes.data || []).filter(u => 
        u.role !== 'Agent' && u.role !== 'System Admin'
      )
      const usersWithGroups = await Promise.all(allUsers.map(async (u) => {
        let groupName = 'No Group'
        if (u.groupId) {
          try {
            const { data: groupData } = await api.get(`/groups/${u.groupId}`)
            if (groupData?.success) {
              groupName = groupData.data.name
            }
          } catch (err) {
            console.warn(`Failed to fetch group ${u.groupId}:`, err)
          }
        }
        return {
          id: u.id,
          name: u.name,
          phone: u.phone,
          email: u.email || '',
          group: groupName,
          groupId: u.groupId,
          role: u.role,
          status: u.status || 'active',
          privileges: [],
          assignedDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
          lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString().split('T')[0] : null,
          loginCount: 0
        }
      }))
      setUsers(usersWithGroups)
    } catch (err) {
      console.error('Failed to assign role:', err)
      alert(err.response?.data?.message || err.message || 'Failed to assign role')
    }
  }

  const handleTransferUser = async () => {
    if (!userTransfer.userId || !userTransfer.toGroup) {
      alert('Please select user and destination group')
      return
    }

    try {
      // Update user's groupId via PUT /api/system-admin/users/:id
      const { data } = await api.put(`/system-admin/users/${userTransfer.userId}`, {
        groupId: userTransfer.toGroup
      })

      if (!data?.success) {
        throw new Error(data?.message || 'Failed to transfer user')
      }

      alert('User transferred successfully!')
      setShowTransferUser(false)
      setUserTransfer({
        userId: '',
        fromGroup: '',
        toGroup: '',
        reason: ''
      })

      // Reload users to reflect new group assignments
      const { data: usersRes } = await api.get('/system-admin/users')
      const allUsers = (usersRes.data || []).filter(u => 
        u.role !== 'Agent' && u.role !== 'System Admin'
      )
      const usersWithGroups = await Promise.all(allUsers.map(async (u) => {
        let groupName = 'No Group'
        if (u.groupId) {
          try {
            const { data: groupData } = await api.get(`/groups/${u.groupId}`)
            if (groupData?.success) {
              groupName = groupData.data.name
            }
          } catch (err) {
            console.warn(`Failed to fetch group ${u.groupId}:`, err)
          }
        }
        return {
          id: u.id,
          name: u.name,
          phone: u.phone,
          email: u.email || '',
          group: groupName,
          groupId: u.groupId,
          role: u.role,
          status: u.status || 'active',
          privileges: [],
          assignedDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
          lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString().split('T')[0] : null,
          loginCount: 0
        }
      }))
      setUsers(usersWithGroups)
    } catch (err) {
      console.error('Failed to transfer user:', err)
      alert(err.response?.data?.message || err.message || 'Failed to transfer user')
    }
  }

  const handleViewUserDetails = (user) => {
    setSelectedUser(user)
    setShowUserDetails(true)
  }

  const handleSuspendUser = async (userId) => {
    try {
      const { data } = await api.put(`/system-admin/users/${userId}`, { status: 'suspended' })
      if (data?.success) {
        alert('User suspended successfully!')
        // Reload users
        const { data: usersRes } = await api.get('/system-admin/users')
        const allUsers = (usersRes.data || []).filter(u => 
          u.role !== 'Agent' && u.role !== 'System Admin'
        )
        const usersWithGroups = await Promise.all(allUsers.map(async (u) => {
          let groupName = 'No Group'
          if (u.groupId) {
            try {
              const { data: groupData } = await api.get(`/groups/${u.groupId}`)
              if (groupData?.success) {
                groupName = groupData.data.name
              }
            } catch (err) {
              console.warn(`Failed to fetch group ${u.groupId}:`, err)
            }
          }
          return {
            id: u.id,
            name: u.name,
            phone: u.phone,
            email: u.email || '',
            group: groupName,
            groupId: u.groupId,
            role: u.role,
            status: u.status || 'active',
            privileges: [],
            assignedDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
            lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString().split('T')[0] : null,
            loginCount: 0
          }
        }))
        setUsers(usersWithGroups)
      }
    } catch (err) {
      console.error('Failed to suspend user:', err)
      alert(err.response?.data?.message || 'Failed to suspend user')
    }
  }

  const handleReinstateUser = async (userId) => {
    try {
      const { data } = await api.put(`/system-admin/users/${userId}`, { status: 'active' })
      if (data?.success) {
        alert('User reinstated successfully!')
        // Reload users (same as suspend)
        const { data: usersRes } = await api.get('/system-admin/users')
        const allUsers = (usersRes.data || []).filter(u => 
          u.role !== 'Agent' && u.role !== 'System Admin'
        )
        const usersWithGroups = await Promise.all(allUsers.map(async (u) => {
          let groupName = 'No Group'
          if (u.groupId) {
            try {
              const { data: groupData } = await api.get(`/groups/${u.groupId}`)
              if (groupData?.success) {
                groupName = groupData.data.name
              }
            } catch (err) {
              console.warn(`Failed to fetch group ${u.groupId}:`, err)
            }
          }
          return {
            id: u.id,
            name: u.name,
            phone: u.phone,
            email: u.email || '',
            group: groupName,
            groupId: u.groupId,
            role: u.role,
            status: u.status || 'active',
            privileges: [],
            assignedDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
            lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString().split('T')[0] : null,
            loginCount: 0
          }
        }))
        setUsers(usersWithGroups)
      }
    } catch (err) {
      console.error('Failed to reinstate user:', err)
      alert(err.response?.data?.message || 'Failed to reinstate user')
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
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{users.length}</p>
              </div>
              <Users className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.status === 'active').length}
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
                  {users.filter(u => u.status === 'suspended').length}
                </p>
              </div>
              <XCircle className="text-red-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Assignments</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {users.filter(u => u.status === 'pending').length}
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
                  placeholder="Search by name, phone, email, or ID..."
                  className="input-field pl-10"
                />
              </div>
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
                <option value="Admin">Admin</option>
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
                    <p className="font-semibold">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Login</p>
                    <p className="font-semibold">{user.lastLogin || 'Never'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Login Count</p>
                    <p className="font-semibold">{user.loginCount}</p>
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

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewUserDetails(user)}
                    className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Eye size={16} /> View Details
                  </button>
                  <button
                    onClick={() => handleUpdatePrivileges(user.id)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Shield size={16} /> Update Privileges
                  </button>
                  {user.role === 'Admin' && (
                    <button
                      onClick={() => handleReplaceAdmin(user.id)}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Crown size={16} /> Replace Admin
                    </button>
                  )}
                  {user.status === 'active' && (
                    <button
                      onClick={() => handleSuspendUser(user.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <XCircle size={16} /> Suspend
                    </button>
                  )}
                  {user.status === 'suspended' && (
                    <button
                      onClick={() => handleReinstateUser(user.id)}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle size={16} /> Reinstate
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select User
                    </label>
                    <select
                      value={newRoleAssignment.userId}
                      onChange={(e) => setNewRoleAssignment({ ...newRoleAssignment, userId: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select User</option>
                      {users.filter(u => u.status === 'active').map(user => (
                        <option key={user.id} value={user.id}>{user.name} - {user.group}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Role
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
                      <option value="Admin">Admin</option>
                      <option value="Cashier">Cashier</option>
                      <option value="Secretary">Secretary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Assign to Group
                    </label>
                    <select
                      value={newRoleAssignment.groupId}
                      onChange={(e) => setNewRoleAssignment({ ...newRoleAssignment, groupId: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Group</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
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
                  onClick={() => setShowTransferUser(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select User
                    </label>
                    <select
                      value={userTransfer.userId}
                      onChange={(e) => setUserTransfer({ ...userTransfer, userId: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select User</option>
                      {users.filter(u => u.status === 'active').map(user => (
                        <option key={user.id} value={user.id}>{user.name} - {user.group}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      From Group
                    </label>
                    <select
                      value={userTransfer.fromGroup}
                      onChange={(e) => setUserTransfer({ ...userTransfer, fromGroup: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Source Group</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      To Group
                    </label>
                    <select
                      value={userTransfer.toGroup}
                      onChange={(e) => setUserTransfer({ ...userTransfer, toGroup: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Destination Group</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
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

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowTransferUser(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTransferUser}
                    className="btn-primary flex-1"
                  >
                    Transfer User
                  </button>
                </div>
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

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleUpdatePrivileges(selectedUser.id)}
                    className="btn-primary flex-1"
                  >
                    Update Privileges
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
