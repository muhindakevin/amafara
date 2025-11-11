import { useState } from 'react'
import { Users, Edit, Download, Search, Filter, CheckCircle, XCircle, AlertCircle, Eye, Plus, Trash2, Shield } from 'lucide-react'
import Layout from '../components/Layout'

function SecretaryMembers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showMemberDetails, setShowMemberDetails] = useState(false)

  const members = [
    {
      id: 'M001',
      name: 'Kamikazi Marie',
      phone: '+250788123456',
      email: 'kamikazi.marie@email.com',
      role: 'Member',
      registrationDate: '2023-01-15',
      status: 'active',
      contributionStatus: 'current',
      totalContributions: 150000,
      lastContribution: '2024-01-20',
      isBurned: false,
      burnedDate: null,
      reactivatedDate: null
    },
    {
      id: 'M002',
      name: 'Mukamana Alice',
      phone: '+250788234567',
      email: 'mukamana.alice@email.com',
      role: 'Member',
      registrationDate: '2023-02-20',
      status: 'active',
      contributionStatus: 'current',
      totalContributions: 120000,
      lastContribution: '2024-01-18',
      isBurned: false,
      burnedDate: null,
      reactivatedDate: null
    },
    {
      id: 'M003',
      name: 'Mutabazi Paul',
      phone: '+250788345678',
      email: 'mutabazi.paul@email.com',
      role: 'Member',
      registrationDate: '2023-03-10',
      status: 'burned',
      contributionStatus: 'overdue',
      totalContributions: 80000,
      lastContribution: '2023-12-15',
      isBurned: true,
      burnedDate: '2024-01-10',
      reactivatedDate: null
    },
    {
      id: 'M004',
      name: 'Ikirezi Jane',
      phone: '+250788456789',
      email: 'ikirezi.jane@email.com',
      role: 'Member',
      registrationDate: '2023-04-05',
      status: 'pending',
      contributionStatus: 'pending',
      totalContributions: 50000,
      lastContribution: '2024-01-15',
      isBurned: false,
      burnedDate: null,
      reactivatedDate: null
    }
  ]

  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'Member',
    registrationDate: '',
    notes: ''
  })

  const filteredMembers = members.filter(member => {
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'burned': return 'bg-red-100 text-red-700'
      case 'suspended': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getContributionStatusColor = (status) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-700'
      case 'overdue': return 'bg-red-100 text-red-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleAddMember = () => {
    console.log('Adding new member:', newMember)
    alert('Member added successfully!')
    setShowAddMember(false)
    setNewMember({
      name: '',
      phone: '',
      email: '',
      role: 'Member',
      registrationDate: '',
      notes: ''
    })
  }

  const handleViewMemberDetails = (member) => {
    setSelectedMember(member)
    setShowMemberDetails(true)
  }

  const handleBurnMember = (memberId) => {
    console.log('Burning member:', memberId)
    alert('Member account burned successfully!')
  }

  const handleReactivateMember = (memberId) => {
    console.log('Reactivating member:', memberId)
    alert('Member account reactivated successfully!')
  }

  const handleUpdateMember = (memberId) => {
    console.log('Updating member:', memberId)
    alert('Member information updated successfully!')
  }

  const handleExportMembers = () => {
    console.log('Exporting member data')
    alert('Member data exported successfully!')
  }

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Member Records & Data Management</h1>
            <p className="text-gray-600 mt-1">Maintain comprehensive member records and information</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddMember(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> Add Member
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
                <p className="text-sm text-gray-600 mb-2">Burned Members</p>
                <p className="text-2xl font-bold text-red-600">
                  {members.filter(m => m.status === 'burned').length}
                </p>
              </div>
              <XCircle className="text-red-600" size={32} />
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
                  placeholder="Search by name, ID, phone, or email..."
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
                <option value="all">All Members</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="burned">Burned</option>
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
                      <p className="text-sm text-gray-500">ID: {member.id} • Registered: {member.registrationDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getContributionStatusColor(member.contributionStatus)}`}>
                      {member.contributionStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Role</p>
                    <p className="font-semibold">{member.role}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Contributions</p>
                    <p className="font-semibold">{member.totalContributions.toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Contribution</p>
                    <p className="font-semibold">{member.lastContribution}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Burned Status</p>
                    <p className="font-semibold">{member.isBurned ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {member.isBurned && (
                  <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="text-red-600" size={16} />
                      <span className="font-semibold text-red-800">Account Burned</span>
                    </div>
                    <p className="text-sm text-red-700">
                      Burned on: {member.burnedDate} • 
                      {member.reactivatedDate ? ` Reactivated on: ${member.reactivatedDate}` : ' Not reactivated'}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewMemberDetails(member)}
                    className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Eye size={16} /> View Details
                  </button>
                  <button
                    onClick={() => handleUpdateMember(member.id)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Edit size={16} /> Update
                  </button>
                  {member.status === 'active' && (
                    <button
                      onClick={() => handleBurnMember(member.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <XCircle size={16} /> Burn Account
                    </button>
                  )}
                  {member.status === 'burned' && (
                    <button
                      onClick={() => handleReactivateMember(member.id)}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle size={16} /> Reactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
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
                      placeholder="Enter phone number..."
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
                      placeholder="Enter email address..."
                    />
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={newMember.notes}
                    onChange={(e) => setNewMember({ ...newMember, notes: e.target.value })}
                    className="input-field h-24 resize-none"
                    placeholder="Enter any additional notes..."
                  />
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
                    className="btn-primary flex-1"
                  >
                    Add Member
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
                    {selectedMember.name[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedMember.name}</h3>
                    <p className="text-gray-600">{selectedMember.phone} • {selectedMember.email}</p>
                    <p className="text-sm text-gray-500">Member ID: {selectedMember.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Personal Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span className="font-semibold">{selectedMember.role}</span>
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
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Financial Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Contributions:</span>
                        <span className="font-semibold">{selectedMember.totalContributions.toLocaleString()} RWF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Contribution:</span>
                        <span className="font-semibold">{selectedMember.lastContribution}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contribution Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getContributionStatusColor(selectedMember.contributionStatus)}`}>
                          {selectedMember.contributionStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedMember.isBurned && (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                    <h4 className="text-lg font-semibold text-red-800 mb-2">Account Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-red-600">Burned Date:</span>
                        <span className="font-semibold text-red-800">{selectedMember.burnedDate}</span>
                      </div>
                      {selectedMember.reactivatedDate && (
                        <div className="flex justify-between">
                          <span className="text-red-600">Reactivated Date:</span>
                          <span className="font-semibold text-red-800">{selectedMember.reactivatedDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowMemberDetails(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleUpdateMember(selectedMember.id)}
                    className="btn-primary flex-1"
                  >
                    Update Information
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

export default SecretaryMembers
