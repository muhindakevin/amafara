import { useState, useEffect } from 'react'
import { Users, Plus, Edit, Eye, Search, XCircle, Download, Phone, Mail, Shield } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function SystemAdminUsers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddUser, setShowAddUser] = useState(false)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])

  const ALLOWED_ROLES = ['System Admin', 'Agent', 'Group Admin', 'Secretary', 'Cashier', 'Member']

  useEffect(() => {
    let isMounted = true
    async function fetchAll() {
      try {
        setLoading(true)
        const [usersRes, groupsRes] = await Promise.all([
          api.get('/system-admin/users').catch(() => ({ data: { data: [] } })),
          api.get('/public/groups').catch(() => ({ data: { data: [] } }))
        ])
        if (isMounted) {
          setUsers(usersRes?.data?.data || [])
          setGroups(groupsRes?.data?.data || [])
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchAll()
    return () => { isMounted = false }
  }, [])

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    nationalId: '',
    role: 'Member',
    groupId: '',
    password: ''
  })
  const [newGroupName, setNewGroupName] = useState('')

  const filteredUsers = (users || []).filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || (user.status || '').toLowerCase() === filterStatus.toLowerCase()
    const matchesSearch = [user.name, user.email, user.phone, user?.group?.name]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesRole && matchesStatus && matchesSearch
  })

  const refreshUsers = async () => {
    const res = await api.get('/system-admin/users').catch(() => ({ data: { data: [] } }))
    setUsers(res?.data?.data || [])
  }

  const handleAddUser = async () => {
    if (!newUser.name || (!newUser.email && !newUser.phone) || !newUser.role || !newUser.nationalId) {
      alert('Please provide name, national ID, and at least email or phone, and role.')
      return
    }
    if (newUser.role === 'Group Admin' && !newUser.groupId && !newGroupName.trim()) {
      alert('For Group Admin, select an existing group or enter a new group name.')
      return
    }
    try {
      const payload = {
        name: newUser.name,
        email: newUser.email || undefined,
        phone: newUser.phone || undefined,
        nationalId: newUser.nationalId,
        role: newUser.role,
        groupId: newGroupName.trim() ? undefined : (newUser.groupId || undefined),
        groupName: newUser.role === 'Group Admin' && newGroupName.trim() ? newGroupName.trim() : undefined,
        password: newUser.password || undefined
      }
      await api.post('/system-admin/users', payload)
      await refreshUsers()
      setShowAddUser(false)
      setNewUser({ name: '', email: '', phone: '', nationalId: '', role: 'Member', groupId: '', password: '' })
      setNewGroupName('')
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to create user')
    }
  }

  const handleViewUserDetails = (user) => {
    setSelectedUser(user)
    setShowUserDetails(true)
  }

  const handleUpdateStatus = async (userId, status) => {
    try {
      await api.put(`/system-admin/users/${userId}`, { status })
      await refreshUsers()
    } catch (e) {
      alert('Failed to update status')
    }
  }

  const handleResetPassword = async (userId) => {
    try {
      const { data } = await api.post(`/system-admin/users/${userId}/remind-password`)
      const temp = data?.data?.temp
      alert(temp ? `Temporary password (dev): ${temp}` : 'Temporary password sent to user')
    } catch (e) {
      alert('Failed to send password reminder')
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'Agent': return 'bg-blue-100 text-blue-700'
      case 'Member': return 'bg-green-100 text-green-700'
      case 'Group Admin': return 'bg-purple-100 text-purple-700'
      case 'Secretary': return 'bg-yellow-100 text-yellow-700'
      case 'Cashier': return 'bg-orange-100 text-orange-700'
      case 'System Admin': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'suspended': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>

        {/* Search and Filter */}
        <div className="card flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users by name, email, phone, or group..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto">
            <select
              className="input-field"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              {ALLOWED_ROLES.map(r => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <div className="w-full md:w-auto">
            <select
              className="input-field"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="btn-primary flex items-center gap-2 w-full md:w-auto"
          >
            <Plus size={20} /> Register User
          </button>
          <button className="btn-secondary flex items-center gap-2 w-full md:w-auto">
            <Download size={20} /> Export
          </button>
        </div>

        {/* User List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">All Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">Loading…</td></tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user?.group?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                          {user.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewUserDetails(user)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                          title="View Details"
                        >
                          <Eye size={20} />
                        </button>
                        {user.status !== 'active' ? (
                          <button onClick={() => handleUpdateStatus(user.id, 'active')} className="text-green-600 hover:text-green-900 mr-3" title="Activate">
                            Activate
                          </button>
                        ) : (
                          <button onClick={() => handleUpdateStatus(user.id, 'suspended')} className="text-yellow-600 hover:text-yellow-900 mr-3" title="Suspend">
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Reset Password"
                        >
                          <Shield size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add New User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Register New User</h2>
                <button onClick={() => setShowAddUser(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <p className="text-gray-600">Enter the new user's details and assign their role.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="input-field" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="input-field" placeholder="john.doe@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input type="text" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} className="input-field" placeholder="07XXXXXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">National ID</label>
                  <input type="text" value={newUser.nationalId} onChange={(e) => setNewUser({ ...newUser, nationalId: e.target.value })} className="input-field" placeholder="National ID" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                  <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="input-field">
                    {ALLOWED_ROLES.map(r => (<option key={r} value={r}>{r}</option>))}
                  </select>
                </div>
                {(newUser.role === 'Group Admin' || newUser.role === 'Secretary' || newUser.role === 'Cashier' || newUser.role === 'Member') && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Assign Group</label>
                    <select value={newUser.groupId} onChange={(e) => setNewUser({ ...newUser, groupId: e.target.value })} className="input-field">
                      <option value="">Select Group</option>
                      {groups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                    </select>
                    {newUser.role === 'Group Admin' && (
                      <div className="mt-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Or create new group (name)</label>
                        <input type="text" value={newGroupName} onChange={(e)=>setNewGroupName(e.target.value)} className="input-field" placeholder="New group name" />
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Password</label>
                  <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="input-field" placeholder="Set user password" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddUser(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleAddUser} className="btn-primary flex-1">Register User</button>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">User Details</h2>
                <button onClick={() => setShowUserDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700"><span className="font-semibold">ID:</span> {selectedUser.id}</p>
                <p className="text-gray-700"><span className="font-semibold">Name:</span> {selectedUser.name}</p>
                <p className="text-gray-700 flex items-center gap-2"><span className="font-semibold">Email:</span> <Mail size={16} /> {selectedUser.email}</p>
                <p className="text-gray-700 flex items-center gap-2"><span className="font-semibold">Phone:</span> <Phone size={16} /> {selectedUser.phone}</p>
                <p className="text-gray-700"><span className="font-semibold">Role:</span>
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                </p>
                <p className="text-gray-700"><span className="font-semibold">Group:</span> {selectedUser?.group?.name || '-'}</p>
                <p className="text-gray-700"><span className="font-semibold">Status:</span>
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedUser.status)}`}>
                    {selectedUser.status || 'pending'}
                  </span>
                </p>
                <p className="text-gray-700"><span className="font-semibold">Last Login:</span> {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : '-'}</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowUserDetails(false)} className="btn-secondary">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminUsers
