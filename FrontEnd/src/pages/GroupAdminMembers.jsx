import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Trash2, UserX, UserCheck, Search, Filter, Eye, Edit, Phone, Mail, Calendar, DollarSign, FileText, XCircle } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function GroupAdminMembers() {
  const navigate = useNavigate()
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showMemberDetails, setShowMemberDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [groupId, setGroupId] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const me = await api.get('/auth/me')
        const gid = me.data?.data?.groupId
        if (!gid || !mounted) return
        setGroupId(gid)
        
        const groupRes = await api.get(`/groups/${gid}`)
        if (mounted && groupRes.data?.success) {
          const groupMembers = (groupRes.data.data.members || [])
            .filter(m => m.role === 'Member')
            .map(m => ({
              id: m.id,
              name: m.name,
              phone: m.phone || '',
              email: m.email || '',
              nationalId: m.nationalId || '',
              joinDate: m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : '',
              status: m.status || 'active',
              totalSavings: Number(m.totalSavings || 0),
              activeLoans: 0, // Will calculate from loans
              contributionHistory: 'good', // Will calculate from contributions
              lastContribution: null
            }))
          setMembers(groupMembers)
        }
      } catch (e) {
        console.error('Failed to load members:', e)
        if (mounted) setMembers([])
      } finally {
        if (mounted) setLoading(false)
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
    dateOfBirth: '',
    address: '',
    occupation: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'burned': return 'bg-red-100 text-red-700'
      case 'inactive': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm) ||
    member.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.phone || !newMember.email || !newMember.nationalId || !newMember.password) {
      alert('Please fill in all required fields: name, phone, email, national ID, and password')
      return
    }

    if (newMember.password.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    if (!groupId) {
      alert('Group ID not found. Please refresh the page.')
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
        role: 'Member',
        groupId: groupId,
        address: newMember.address,
        occupation: newMember.occupation,
        dateOfBirth: newMember.dateOfBirth ? new Date(newMember.dateOfBirth).toISOString() : null
      })

      if (!data?.success) {
        throw new Error(data?.message || 'Failed to create member')
      }

      alert(`Member created successfully!\n\nThey can now login with:\n- Email/Phone: ${newMember.email || newMember.phone}\n- Password: ${newMember.password}\n\n(Please inform the member of these credentials)`)
    setShowAddMember(false)
    setNewMember({
        name: '',
      phone: '',
      email: '',
      nationalId: '',
        password: '',
      dateOfBirth: '',
      address: '',
      occupation: ''
    })

      // Reload members list
      const groupRes = await api.get(`/groups/${groupId}`)
      if (groupRes.data?.success) {
        const groupMembers = (groupRes.data.data.members || [])
          .filter(m => m.role === 'Member')
          .map(m => ({
            id: m.id,
            name: m.name,
            phone: m.phone || '',
            email: m.email || '',
            nationalId: m.nationalId || '',
            joinDate: m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : '',
            status: m.status || 'active',
            totalSavings: Number(m.totalSavings || 0),
            activeLoans: 0,
            contributionHistory: 'good',
            lastContribution: null
          }))
        setMembers(groupMembers)
      }
    } catch (err) {
      console.error('Failed to create member:', err)
      alert(err.response?.data?.message || err.message || 'Failed to create member. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBurnMember = (memberId) => {
    console.log('Burning member:', memberId)
    alert('Member account burned (suspended)!')
  }

  const handleUnburnMember = (memberId) => {
    console.log('Unburning member:', memberId)
    alert('Member account reactivated!')
  }

  const handleDeleteMember = (memberId) => {
    if (confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      console.log('Deleting member:', memberId)
      alert('Member deleted successfully!')
    }
  }

  const handleViewMemberDetails = (member) => {
    setSelectedMember(member)
    setShowMemberDetails(true)
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Members Management</h1>
            <p className="text-gray-600 mt-1">Manage group members and their accounts</p>
          </div>
          <button
            onClick={() => navigate('/admin/add-member')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Add New Member
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Members</p>
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
                <p className="text-sm text-gray-600 mb-2">Active Members</p>
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
                <p className="text-sm text-gray-600 mb-2">Burned Members</p>
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
                <p className="text-sm text-gray-600 mb-2">Total Savings</p>
                <p className="text-2xl font-bold text-purple-600">
                  {members.reduce((sum, m) => sum + m.totalSavings, 0).toLocaleString()} RWF
                </p>
              </div>
              <Calendar className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
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
                  placeholder="Search by name, phone, or member ID..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Status
              </label>
              <select className="input-field">
                <option value="all">All Members</option>
                <option value="active">Active</option>
                <option value="burned">Burned</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Members ({filteredMembers.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading members...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {members.length === 0 ? (
                <p>No members found. Add a new member to get started.</p>
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
                    onClick={() => handleViewMemberDetails(member)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Edit size={16} /> Edit
                  </button>
                  {member.status === 'active' ? (
                    <button
                      onClick={() => handleBurnMember(member.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <UserX size={16} /> Burn Account
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnburnMember(member.id)}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <UserCheck size={16} /> Unburn Account
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="bg-gray-500 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
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
                <h2 className="text-2xl font-bold text-gray-800">Add New Member</h2>
                <button
                  onClick={() => setShowAddMember(false)}
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
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      className="input-field"
                      required
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
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      className="input-field"
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
                      required
                      placeholder="Enter password for member login"
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">Member will use this password with their email/phone to login</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={newMember.dateOfBirth}
                      onChange={(e) => setNewMember({ ...newMember, dateOfBirth: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={newMember.address}
                      onChange={(e) => setNewMember({ ...newMember, address: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={newMember.occupation}
                      onChange={(e) => setNewMember({ ...newMember, occupation: e.target.value })}
                      className="input-field"
                    />
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                {/* Member Info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {selectedMember.name[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{selectedMember.name}</h3>
                    <p className="text-gray-600">{selectedMember.phone}</p>
                    <p className="text-sm text-gray-500">Member ID: {selectedMember.id}</p>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <DollarSign className="text-green-600" size={24} />
                      <div>
                        <p className="text-sm text-gray-600">Total Savings</p>
                        <p className="text-xl font-bold text-gray-800">
                          {selectedMember.totalSavings.toLocaleString()} RWF
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <FileText className="text-blue-600" size={24} />
                      <div>
                        <p className="text-sm text-gray-600">Active Loans</p>
                        <p className="text-xl font-bold text-gray-800">
                          {selectedMember.activeLoans}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Member Actions */}
                <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowMemberDetails(false)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    setShowMemberDetails(false)
                    // Navigate to edit member page or open edit modal
                    alert('Edit member functionality - would open edit form')
                  }}
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

export default GroupAdminMembers

