import { useEffect, useState } from 'react'
import { Building2, Plus, Edit, Trash2, Eye, Users, MapPin, Calendar, CheckCircle, XCircle, AlertCircle, Search, Filter } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function AgentGroups() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showRegisterGroup, setShowRegisterGroup] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showGroupDetails, setShowGroupDetails] = useState(false)

  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const { data } = await api.get('/groups')
        if (mounted && data?.success) {
          // Map backend group shape to UI expectations where needed
          const mapped = (data.data || []).map(g => ({
            id: g.id,
            name: g.name,
            district: g.district || '',
            sector: g.sector || '',
            registrationDate: g.createdAt ? new Date(g.createdAt).toISOString().split('T')[0] : '',
            status: g.status || 'active',
            members: Array.isArray(g.members) ? g.members.length : (g.totalMembers || 0),
            admin: g.adminName || (g.agent?.name || ''),
            cashier: '',
            secretary: '',
            totalContributions: Number(g.totalSavings || g.totalContributions || 0),
            totalLoans: Number(g.totalLoans || 0),
            complianceScore: 100
          }))
          setGroups(mapped)
        } else if (mounted) {
          console.warn('Groups response was not successful:', data)
          setGroups([])
        }
      } catch (e) {
        console.error('Failed to load groups:', e)
        if (mounted) {
          setGroups([])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const [newGroup, setNewGroup] = useState({
    name: '',
    code: '',
    district: '',
    sector: '',
    registrationDate: new Date().toISOString().split('T')[0],
    description: '',
    adminName: '',
    adminPhone: '',
    adminEmail: '',
    adminNationalId: '',
    adminPassword: '',
    cashierName: '',
    cashierPhone: '',
    cashierEmail: '',
    cashierNationalId: '',
    cashierPassword: '',
    secretaryName: '',
    secretaryPhone: '',
    secretaryEmail: '',
    secretaryNationalId: '',
    secretaryPassword: '',
    rules: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const filteredGroups = groups.filter(group => {
    const matchesStatus = filterStatus === 'all' || group.status === filterStatus
    const matchesSearch = 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'inactive': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleRegisterGroup = async () => {
    if (!newGroup.name || !newGroup.code) {
      alert('Group name and code are required')
      return
    }

    if (!newGroup.adminName || !newGroup.adminPhone || !newGroup.adminEmail || !newGroup.adminNationalId || !newGroup.adminPassword) {
      alert('Group Admin information is required (name, phone, email, national ID, password)')
      return
    }

    setSubmitting(true)
    try {
      // Generate unique group code if not provided
      const groupCode = newGroup.code || `GRP${Date.now()}`

      // Step 1: Create the group
      const groupRes = await api.post('/groups', {
        name: newGroup.name,
        code: groupCode,
        description: newGroup.description || newGroup.rules,
        district: newGroup.district,
        sector: newGroup.sector,
        contributionFrequency: 'monthly'
      })

      if (!groupRes.data?.success) {
        throw new Error(groupRes.data?.message || 'Failed to create group')
      }

      const groupId = groupRes.data.data.id

      // Step 2: Create Group Admin user
      await api.post('/system-admin/users', {
        name: newGroup.adminName,
        phone: newGroup.adminPhone,
        email: newGroup.adminEmail,
        nationalId: newGroup.adminNationalId,
        password: newGroup.adminPassword,
        role: 'Group Admin',
        groupId: groupId
      })

      // Step 3: Create Cashier user (if provided)
      if (newGroup.cashierName && newGroup.cashierPhone && newGroup.cashierEmail && newGroup.cashierNationalId && newGroup.cashierPassword) {
        await api.post('/system-admin/users', {
          name: newGroup.cashierName,
          phone: newGroup.cashierPhone,
          email: newGroup.cashierEmail,
          nationalId: newGroup.cashierNationalId,
          password: newGroup.cashierPassword,
          role: 'Cashier',
          groupId: groupId
        })
      }

      // Step 4: Create Secretary user (if provided)
      if (newGroup.secretaryName && newGroup.secretaryPhone && newGroup.secretaryEmail && newGroup.secretaryNationalId && newGroup.secretaryPassword) {
        await api.post('/system-admin/users', {
          name: newGroup.secretaryName,
          phone: newGroup.secretaryPhone,
          email: newGroup.secretaryEmail,
          nationalId: newGroup.secretaryNationalId,
          password: newGroup.secretaryPassword,
          role: 'Secretary',
          groupId: groupId
        })
      }

      alert('Group and leadership team registered successfully!')
      setShowRegisterGroup(false)
      
      // Reset form
      setNewGroup({
        name: '',
        code: '',
        district: '',
        sector: '',
        registrationDate: new Date().toISOString().split('T')[0],
        description: '',
        adminName: '',
        adminPhone: '',
        adminEmail: '',
        adminNationalId: '',
        adminPassword: '',
        cashierName: '',
        cashierPhone: '',
        cashierEmail: '',
        cashierNationalId: '',
        cashierPassword: '',
        secretaryName: '',
        secretaryPhone: '',
        secretaryEmail: '',
        secretaryNationalId: '',
        secretaryPassword: '',
        rules: ''
      })

      // Reload groups list
      try {
        const { data } = await api.get('/groups')
        if (data?.success) {
          const mapped = (data.data || []).map(g => ({
            id: g.id,
            name: g.name,
            district: g.district || '',
            sector: g.sector || '',
            registrationDate: g.createdAt ? new Date(g.createdAt).toISOString().split('T')[0] : '',
            status: g.status || 'active',
            members: Array.isArray(g.members) ? g.members.length : (g.totalMembers || 0),
            admin: g.adminName || (g.agent?.name || ''),
            cashier: '',
            secretary: '',
            totalContributions: Number(g.totalSavings || g.totalContributions || 0),
            totalLoans: Number(g.totalLoans || 0),
            complianceScore: 100
          }))
          setGroups(mapped)
        }
      } catch (reloadErr) {
        console.error('Failed to reload groups after registration:', reloadErr)
      }
    } catch (err) {
      console.error('Failed to register group:', err)
      alert(err.response?.data?.message || err.message || 'Failed to register group. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewGroupDetails = (group) => {
    setSelectedGroup(group)
    setShowGroupDetails(true)
  }

  const handleActivateGroup = async (groupId) => {
    try {
      // Update group status via PUT /api/groups/:id
      const { data } = await api.put(`/groups/${groupId}`, { status: 'active' })
      if (data?.success) {
        alert('Group activated successfully!')
        // Reload groups
        const res = await api.get('/groups')
        if (res.data?.success) {
          const mapped = (res.data.data || []).map(g => ({
            id: g.id,
            name: g.name,
            district: g.district || '',
            sector: g.sector || '',
            registrationDate: g.createdAt ? new Date(g.createdAt).toISOString().split('T')[0] : '',
            status: g.status || 'active',
            members: g.totalMembers || 0,
            admin: '',
            cashier: '',
            secretary: '',
            totalContributions: Number(g.totalSavings || 0),
            totalLoans: 0,
            complianceScore: 100
          }))
          setGroups(mapped)
        }
      }
    } catch (err) {
      console.error('Failed to activate group:', err)
      alert(err.response?.data?.message || 'Failed to activate group')
    }
  }

  const handleDeactivateGroup = async (groupId) => {
    try {
      const { data } = await api.put(`/groups/${groupId}`, { status: 'inactive' })
      if (data?.success) {
        alert('Group deactivated successfully!')
        // Reload groups
        const res = await api.get('/groups')
        if (res.data?.success) {
          const mapped = (res.data.data || []).map(g => ({
            id: g.id,
            name: g.name,
            district: g.district || '',
            sector: g.sector || '',
            registrationDate: g.createdAt ? new Date(g.createdAt).toISOString().split('T')[0] : '',
            status: g.status || 'active',
            members: g.totalMembers || 0,
            admin: '',
            cashier: '',
            secretary: '',
            totalContributions: Number(g.totalSavings || 0),
            totalLoans: 0,
            complianceScore: 100
          }))
          setGroups(mapped)
        }
      }
    } catch (err) {
      console.error('Failed to deactivate group:', err)
      alert(err.response?.data?.message || 'Failed to deactivate group')
    }
  }

  const handleEditGroup = async (groupId) => {
    // TODO: Implement edit group functionality
    const group = groups.find(g => g.id === groupId)
    if (group) {
      alert('Edit group functionality will be implemented. Currently, please use the backend API directly.')
    }
  }

  const handleMergeGroups = (groupId) => {
    // TODO: Implement merge groups functionality
    alert('Group merge functionality will be implemented later.')
  }

  return (
    <Layout userRole="Agent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Group (Ikimina) Registration & Management</h1>
            <p className="text-gray-600 mt-1">Register new Ibimina and manage existing groups</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRegisterGroup(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> Register New Group
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Eye size={18} /> View All Groups
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Groups</p>
                <p className="text-2xl font-bold text-gray-800">{groups.length}</p>
              </div>
              <Building2 className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Groups</p>
                <p className="text-2xl font-bold text-green-600">
                  {groups.filter(g => g.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {groups.filter(g => g.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Members</p>
                <p className="text-2xl font-bold text-purple-600">
                  {groups.reduce((sum, g) => sum + g.members, 0)}
                </p>
              </div>
              <Users className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Groups
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, district, sector, or ID..."
                  className="input-field pl-10"
                />
              </div>
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
                <option value="all">All Groups</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Groups List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Group Records ({filteredGroups.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading groups...
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {groups.length === 0 ? (
                <p>No groups found. Register a new group to get started.</p>
              ) : (
                <p>No groups match your search criteria. Try adjusting your filters.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {group.name?.[0]?.toUpperCase() || 'G'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{group.name}</h3>
                      <p className="text-sm text-gray-600">{group.district}, {group.sector}</p>
                      <p className="text-sm text-gray-500">ID: {group.id} • Registered: {group.registrationDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(group.status)}`}>
                      {group.status}
                    </span>
                    <span className="text-sm text-gray-600">
                      {group.complianceScore}% compliance
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Members</p>
                    <p className="font-semibold">{group.members}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Admin</p>
                    <p className="font-semibold">{group.admin}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Contributions</p>
                    <p className="font-semibold">{(group.totalContributions || 0).toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Loans</p>
                    <p className="font-semibold">{(group.totalLoans || 0).toLocaleString()} RWF</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewGroupDetails(group)}
                    className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Eye size={16} /> View Details
                  </button>
                  <button
                    onClick={() => handleEditGroup(group.id)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Edit size={16} /> Edit
                  </button>
                  {group.status === 'active' && (
                    <button
                      onClick={() => handleDeactivateGroup(group.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <XCircle size={16} /> Deactivate
                    </button>
                  )}
                  {group.status === 'inactive' && (
                    <button
                      onClick={() => handleActivateGroup(group.id)}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle size={16} /> Activate
                    </button>
                  )}
                  <button
                    onClick={() => handleMergeGroups(group.id)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Building2 size={16} /> Merge
                  </button>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>

        {/* Register Group Modal */}
        {showRegisterGroup && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Register New Group (Ikimina)</h2>
                <button
                  onClick={() => setShowRegisterGroup(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Group Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Group Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Group Name
                      </label>
                      <input
                        type="text"
                        value={newGroup.name}
                        onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                        className="input-field"
                        placeholder="Enter group name..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        District
                      </label>
                      <input
                        type="text"
                        value={newGroup.district}
                        onChange={(e) => setNewGroup({ ...newGroup, district: e.target.value })}
                        className="input-field"
                        placeholder="Enter district..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Sector
                      </label>
                      <input
                        type="text"
                        value={newGroup.sector}
                        onChange={(e) => setNewGroup({ ...newGroup, sector: e.target.value })}
                        className="input-field"
                        placeholder="Enter sector..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Group Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newGroup.code}
                        onChange={(e) => setNewGroup({ ...newGroup, code: e.target.value })}
                        className="input-field"
                        placeholder="Enter unique group code..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={newGroup.description}
                        onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                        className="input-field h-24 resize-none"
                        placeholder="Enter group description..."
                      />
                    </div>
                  </div>
                </div>

                {/* Leadership Assignment */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Assign Leadership Roles</h3>
                  <p className="text-sm text-gray-600 mb-4">Group Admin is required. Cashier and Secretary are optional.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Group Admin */}
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <h4 className="font-semibold text-blue-800 mb-3">Group Admin <span className="text-red-500">*</span></h4>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newGroup.adminName}
                          onChange={(e) => setNewGroup({ ...newGroup, adminName: e.target.value })}
                          className="input-field"
                          placeholder="Admin name..."
                          required
                        />
                        <input
                          type="tel"
                          value={newGroup.adminPhone}
                          onChange={(e) => setNewGroup({ ...newGroup, adminPhone: e.target.value })}
                          className="input-field"
                          placeholder="Admin phone..."
                          required
                        />
                        <input
                          type="email"
                          value={newGroup.adminEmail}
                          onChange={(e) => setNewGroup({ ...newGroup, adminEmail: e.target.value })}
                          className="input-field"
                          placeholder="Admin email..."
                          required
                        />
                        <input
                          type="text"
                          value={newGroup.adminNationalId}
                          onChange={(e) => setNewGroup({ ...newGroup, adminNationalId: e.target.value })}
                          className="input-field"
                          placeholder="National ID..."
                          required
                        />
                        <input
                          type="password"
                          value={newGroup.adminPassword}
                          onChange={(e) => setNewGroup({ ...newGroup, adminPassword: e.target.value })}
                          className="input-field"
                          placeholder="Password..."
                          required
                        />
                      </div>
                    </div>

                    {/* Cashier */}
                    <div className="p-4 bg-green-50 rounded-xl">
                      <h4 className="font-semibold text-green-800 mb-3">Cashier</h4>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newGroup.cashierName}
                          onChange={(e) => setNewGroup({ ...newGroup, cashierName: e.target.value })}
                          className="input-field"
                          placeholder="Cashier name..."
                        />
                        <input
                          type="tel"
                          value={newGroup.cashierPhone}
                          onChange={(e) => setNewGroup({ ...newGroup, cashierPhone: e.target.value })}
                          className="input-field"
                          placeholder="Cashier phone..."
                        />
                        <input
                          type="email"
                          value={newGroup.cashierEmail}
                          onChange={(e) => setNewGroup({ ...newGroup, cashierEmail: e.target.value })}
                          className="input-field"
                          placeholder="Cashier email..."
                        />
                        <input
                          type="text"
                          value={newGroup.cashierNationalId}
                          onChange={(e) => setNewGroup({ ...newGroup, cashierNationalId: e.target.value })}
                          className="input-field"
                          placeholder="National ID..."
                        />
                        <input
                          type="password"
                          value={newGroup.cashierPassword}
                          onChange={(e) => setNewGroup({ ...newGroup, cashierPassword: e.target.value })}
                          className="input-field"
                          placeholder="Password..."
                        />
                      </div>
                    </div>

                    {/* Secretary */}
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <h4 className="font-semibold text-purple-800 mb-3">Secretary</h4>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newGroup.secretaryName}
                          onChange={(e) => setNewGroup({ ...newGroup, secretaryName: e.target.value })}
                          className="input-field"
                          placeholder="Secretary name..."
                        />
                        <input
                          type="tel"
                          value={newGroup.secretaryPhone}
                          onChange={(e) => setNewGroup({ ...newGroup, secretaryPhone: e.target.value })}
                          className="input-field"
                          placeholder="Secretary phone..."
                        />
                        <input
                          type="email"
                          value={newGroup.secretaryEmail}
                          onChange={(e) => setNewGroup({ ...newGroup, secretaryEmail: e.target.value })}
                          className="input-field"
                          placeholder="Secretary email..."
                        />
                        <input
                          type="text"
                          value={newGroup.secretaryNationalId}
                          onChange={(e) => setNewGroup({ ...newGroup, secretaryNationalId: e.target.value })}
                          className="input-field"
                          placeholder="National ID..."
                        />
                        <input
                          type="password"
                          value={newGroup.secretaryPassword}
                          onChange={(e) => setNewGroup({ ...newGroup, secretaryPassword: e.target.value })}
                          className="input-field"
                          placeholder="Password..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group Rules */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Group Rules & Guidelines
                  </label>
                  <textarea
                    value={newGroup.rules}
                    onChange={(e) => setNewGroup({ ...newGroup, rules: e.target.value })}
                    className="input-field h-32 resize-none"
                    placeholder="Enter group rules and guidelines..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowRegisterGroup(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegisterGroup}
                    disabled={submitting}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Registering...' : 'Register Group'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Group Details Modal */}
        {showGroupDetails && selectedGroup && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Group Details</h2>
                <button
                  onClick={() => setShowGroupDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                    {selectedGroup.name?.[0]?.toUpperCase() || 'G'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedGroup.name}</h3>
                    <p className="text-gray-600">{selectedGroup.district}, {selectedGroup.sector}</p>
                    <p className="text-sm text-gray-500">Group ID: {selectedGroup.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Group Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Registration Date:</span>
                        <span className="font-semibold">{selectedGroup.registrationDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedGroup.status)}`}>
                          {selectedGroup.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Members:</span>
                        <span className="font-semibold">{selectedGroup.members}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Compliance Score:</span>
                        <span className="font-semibold">{selectedGroup.complianceScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Leadership Team</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Admin:</span>
                        <span className="font-semibold">{selectedGroup.admin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cashier:</span>
                        <span className="font-semibold">{selectedGroup.cashier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Secretary:</span>
                        <span className="font-semibold">{selectedGroup.secretary}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800">Financial Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Users className="text-green-600" size={24} />
                        <div>
                          <p className="text-sm text-gray-600">Total Contributions</p>
                          <p className="text-xl font-bold text-green-600">
                            {(selectedGroup.totalContributions || 0).toLocaleString()} RWF
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Building2 className="text-blue-600" size={24} />
                        <div>
                          <p className="text-sm text-gray-600">Total Loans</p>
                          <p className="text-xl font-bold text-blue-600">
                            {(selectedGroup.totalLoans || 0).toLocaleString()} RWF
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowGroupDetails(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleEditGroup(selectedGroup.id)}
                    className="btn-primary flex-1"
                  >
                    Edit Group
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

export default AgentGroups
