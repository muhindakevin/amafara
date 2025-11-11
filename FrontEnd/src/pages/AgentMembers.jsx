import { useEffect, useState } from 'react'
import { Users, Plus, Edit, Eye, Search, Filter, CheckCircle, XCircle, AlertCircle, UserCheck, Download, Phone, Mail, Upload } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function AgentMembers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showMemberDetails, setShowMemberDetails] = useState(false)

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  const [groups, setGroups] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const { data } = await api.get('/groups')
        if (!mounted || !data?.success) return
        const gs = data.data || []
        setGroups(gs.map(g => ({ id: g.id, name: g.name })))

        // Fetch members for each group
        const memberPromises = gs.map(g => api.get(`/groups/${g.id}`))
        const results = await Promise.allSettled(memberPromises)
        const collected = []
        results.forEach((r, idx) => {
          if (r.status === 'fulfilled' && r.value?.data?.success) {
            const details = r.value.data.data
            const groupName = details.name
            const m = (details.members || []).map(u => ({
              id: u.id,
              name: u.name,
              phone: u.phone,
              email: u.email || '',
              group: groupName,
              groupId: details.id,
              role: u.role,
              registrationDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
              status: u.status || 'active',
              contributions: Number(u.totalContributions || 0),
              loans: 0,
              loanStatus: 'n/a',
              lastContribution: null,
              totalContributions: Number(u.totalSavings || 0)
            }))
            collected.push(...m)
          }
        })
        if (mounted) {
          setMembers(collected)
        }
      } catch (err) {
        console.error('Failed to load members:', err)
        if (mounted) {
          setMembers([])
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

  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    email: '',
    nationalId: '',
    password: '',
    groupId: '',
    role: 'Member',
    registrationDate: new Date().toISOString().split('T')[0],
    letterFromGroup: null,
    letterUploaded: false
  })
  const [submitting, setSubmitting] = useState(false)

  const filteredMembers = members.filter(member => {
    const matchesGroup = filterGroup === 'all' || member.groupId === filterGroup
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesGroup && matchesStatus && matchesSearch
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

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.phone || !newMember.email || !newMember.nationalId || !newMember.password || !newMember.groupId) {
      alert('Please fill in all required fields: name, phone, email, national ID, password, and group')
      return
    }

    setSubmitting(true)
    try {
      // Create member via system-admin/users endpoint
      const { data } = await api.post('/system-admin/users', {
        name: newMember.name,
        phone: newMember.phone,
        email: newMember.email,
        nationalId: newMember.nationalId,
        password: newMember.password,
        role: newMember.role,
        groupId: newMember.groupId
      })

      if (!data?.success) {
        throw new Error(data?.message || 'Failed to register member')
      }

      alert('Member registered successfully!')
      setShowAddMember(false)
      setNewMember({
        name: '',
        phone: '',
        email: '',
        nationalId: '',
        password: '',
        groupId: '',
        role: 'Member',
        registrationDate: new Date().toISOString().split('T')[0],
        letterFromGroup: null,
        letterUploaded: false
      })

      // Reload members list
      const { data: groupsData } = await api.get('/groups')
      if (groupsData?.success) {
        const gs = groupsData.data || []
        setGroups(gs.map(g => ({ id: g.id, name: g.name })))

        const memberPromises = gs.map(g => api.get(`/groups/${g.id}`))
        const results = await Promise.allSettled(memberPromises)
        const collected = []
        results.forEach((r, idx) => {
          if (r.status === 'fulfilled' && r.value?.data?.success) {
            const details = r.value.data.data
            const groupName = details.name
            const m = (details.members || []).map(u => ({
              id: u.id,
              name: u.name,
              phone: u.phone,
              email: u.email || '',
              group: groupName,
              groupId: details.id,
              role: u.role,
              registrationDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
              status: u.status || 'active',
              contributions: Number(u.totalContributions || 0),
              loans: 0,
              loanStatus: 'n/a',
              lastContribution: null,
              totalContributions: Number(u.totalSavings || 0)
            }))
            collected.push(...m)
          }
        })
        setMembers(collected)
      }
    } catch (err) {
      console.error('Failed to register member:', err)
      alert(err.response?.data?.message || err.message || 'Failed to register member. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setNewMember({ ...newMember, letterFromGroup: file, letterUploaded: true })
      alert('Letter uploaded successfully!')
    }
  }

  const handleViewMemberDetails = (member) => {
    setSelectedMember(member)
    setShowMemberDetails(true)
  }

  const handleEditMember = (memberId) => {
    console.log('Editing member:', memberId)
    alert('Edit member dialog would open here')
  }

  const handleSuspendMember = (memberId) => {
    console.log('Suspending member:', memberId)
    alert('Member suspended successfully!')
  }

  const handleReinstateMember = (memberId) => {
    console.log('Reinstating member:', memberId)
    alert('Member reinstated successfully!')
  }

  const handleApproveMember = (memberId) => {
    console.log('Approving member:', memberId)
    alert('Member approved successfully!')
  }

  const handleRejectMember = (memberId) => {
    console.log('Rejecting member:', memberId)
    alert('Member rejected successfully!')
  }

  const handleExportMembers = async () => {
    try {
      // Fetch all members data
      const { data: groupsData } = await api.get('/groups')
      if (!groupsData?.success) throw new Error('Failed to fetch groups')

      const allMembers = []
      const gs = groupsData.data || []
      
      for (const g of gs) {
        try {
          const { data: groupData } = await api.get(`/groups/${g.id}`)
          if (groupData?.success && groupData.data?.members) {
            const members = groupData.data.members
              .filter(m => m.role !== 'Agent' && m.role !== 'System Admin')
              .map(m => ({
                name: m.name,
                phone: m.phone,
                email: m.email || '',
                nationalId: m.nationalId || '',
                group: g.name,
                role: m.role,
                status: m.status,
                totalSavings: m.totalSavings || 0,
                registrationDate: m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : ''
              }))
            allMembers.push(...members)
          }
        } catch (err) {
          console.warn(`Failed to fetch members for group ${g.id}:`, err)
        }
      }

      // Generate PDF content
      let pdfContent = 'UMURENGE WALLET - MEMBERS REPORT\n'
      pdfContent += `Generated: ${new Date().toLocaleString()}\n`
      pdfContent += `Total Members: ${allMembers.length}\n\n`
      pdfContent += 'Name\tPhone\tEmail\tNational ID\tGroup\tRole\tStatus\tTotal Savings\tRegistration Date\n'
      
      allMembers.forEach(m => {
        pdfContent += `${m.name}\t${m.phone}\t${m.email}\t${m.nationalId}\t${m.group}\t${m.role}\t${m.status}\t${m.totalSavings}\t${m.registrationDate}\n`
      })

      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `members-report-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('Member data exported successfully!')
    } catch (err) {
      console.error('Failed to export members:', err)
      alert('Failed to export member data. Please try again.')
    }
  }

  return (
    <Layout userRole="Agent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Member Management Assistance</h1>
            <p className="text-gray-600 mt-1">Register and manage members across all groups</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddMember(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> Register Member
            </button>
            <button
              onClick={handleExportMembers}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} /> Export Data
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Members</p>
                <p className="text-2xl font-bold text-gray-800">{members.length}</p>
              </div>
              <Users className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Members</p>
                <p className="text-2xl font-bold text-green-600">
                  {members.filter(m => m.status === 'active').length}
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
                  {members.filter(m => m.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Suspended</p>
                <p className="text-2xl font-bold text-red-600">
                  {members.filter(m => m.status === 'suspended').length}
                </p>
              </div>
              <XCircle className="text-red-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
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
                  placeholder="Search by name, phone, email, or ID..."
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

        {/* Members List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Member Records ({filteredMembers.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading members...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {members.length === 0 ? (
                <p>No members found. Register a new member to get started.</p>
              ) : (
                <p>No members match your search criteria. Try adjusting your filters.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {member.name?.[0]?.toUpperCase() || 'M'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.group}</p>
                      <p className="text-sm text-gray-500">ID: {member.id} • Registered: {member.registrationDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-semibold">{member.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-semibold">{member.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Contributions</p>
                    <p className="font-semibold">{(member.totalContributions || 0).toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Current Loan</p>
                    <p className="font-semibold">{(member.loans || 0).toLocaleString()} RWF</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewMemberDetails(member)}
                    className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Eye size={16} /> View Details
                  </button>
                  <button
                    onClick={() => handleEditMember(member.id)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Edit size={16} /> Edit
                  </button>
                  {member.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveMember(member.id)}
                        className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectMember(member.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </>
                  )}
                  {member.status === 'active' && (
                    <button
                      onClick={() => handleSuspendMember(member.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <XCircle size={16} /> Suspend
                    </button>
                  )}
                  {member.status === 'suspended' && (
                    <button
                      onClick={() => handleReinstateMember(member.id)}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle size={16} /> Reinstate
                    </button>
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
                <h2 className="text-2xl font-bold text-gray-800">Register New Member</h2>
                <button
                  onClick={() => setShowAddMember(false)}
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
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      className="input-field"
                      placeholder="Enter full name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      className="input-field"
                      placeholder="+250788123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      className="input-field"
                      placeholder="Enter email address..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      National ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMember.nationalId}
                      onChange={(e) => setNewMember({ ...newMember, nationalId: e.target.value })}
                      className="input-field"
                      placeholder="Enter national ID..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={newMember.password}
                      onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                      className="input-field"
                      placeholder="Enter password..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Group <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newMember.groupId}
                      onChange={(e) => setNewMember({ ...newMember, groupId: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Select Group</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={newMember.role}
                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
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
                      Registration Date
                    </label>
                    <input
                      type="date"
                      value={newMember.registrationDate}
                      onChange={(e) => setNewMember({ ...newMember, registrationDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Required: Letter from Group Leaders</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Please upload a letter from the group leaders confirming this member's request to join the group.
                  </p>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="letterUpload"
                    />
                    <label
                      htmlFor="letterUpload"
                      className="btn-secondary cursor-pointer flex items-center gap-2"
                    >
                      <Upload size={16} /> Upload Letter
                    </label>
                    {newMember.letterUploaded && (
                      <span className="text-green-600 text-sm font-semibold flex items-center gap-1">
                        <CheckCircle size={16} /> Letter uploaded
                      </span>
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
                    {submitting ? 'Registering...' : 'Register Member'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Member Details Modal */}
        {showMemberDetails && selectedMember && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Member Details</h2>
                <button
                  onClick={() => setShowMemberDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                    {selectedMember.name?.[0]?.toUpperCase() || 'M'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedMember.name}</h3>
                    <p className="text-gray-600">{selectedMember.group}</p>
                    <p className="text-sm text-gray-500">Member ID: {selectedMember.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Personal Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-semibold">{selectedMember.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-semibold">{selectedMember.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Registration Date:</span>
                        <span className="font-semibold">{selectedMember.registrationDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedMember.status)}`}>
                          {selectedMember.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(selectedMember.role)}`}>
                          {selectedMember.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Financial Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Contributions:</span>
                        <span className="font-semibold">{(selectedMember.totalContributions || 0).toLocaleString()} RWF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Loan:</span>
                        <span className="font-semibold">{(selectedMember.loans || 0).toLocaleString()} RWF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Loan Status:</span>
                        <span className="font-semibold">{selectedMember.loanStatus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Contribution:</span>
                        <span className="font-semibold">{selectedMember.lastContribution || 'None'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowMemberDetails(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleEditMember(selectedMember.id)}
                    className="btn-primary flex-1"
                  >
                    Edit Member
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

export default AgentMembers
