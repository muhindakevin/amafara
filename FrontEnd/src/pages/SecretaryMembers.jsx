import { useState, useEffect } from 'react'
import { Users, Edit, Download, Search, Filter, CheckCircle, XCircle, AlertCircle, Eye, Plus, Trash2, Shield, Copy, RefreshCw } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function SecretaryMembers() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showMemberDetails, setShowMemberDetails] = useState(false)
  const [showEditMember, setShowEditMember] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [generatedCredentials, setGeneratedCredentials] = useState(null)
  const [members, setMembers] = useState([])
  const [summary, setSummary] = useState({ total: 0, active: 0, burned: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [memberDetails, setMemberDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    email: '',
    nationalId: '',
    address: '',
    role: 'Member'
  })

  const [editMember, setEditMember] = useState({
    name: '',
    phone: '',
    email: '',
    nationalId: '',
    address: ''
  })

  // Fetch members
  useEffect(() => {
    fetchMembers()
  }, [filterStatus, searchTerm, startDate, endDate])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await api.get(`/secretary/members?${params.toString()}`)
      if (response.data.success) {
        setMembers(response.data.data.members)
        setSummary(response.data.data.summary)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMemberDetails = async (memberId) => {
    try {
      setLoadingDetails(true)
      console.log('[SecretaryMembers] Fetching member details for ID:', memberId)
      const response = await api.get(`/secretary/members/${memberId}`)
      console.log('[SecretaryMembers] Member details response:', response.data)
      if (response.data.success) {
        setMemberDetails(response.data.data)
      } else {
        console.error('[SecretaryMembers] Response not successful:', response.data)
        alert(response.data?.message || 'Failed to fetch member details')
      }
    } catch (error) {
      console.error('[SecretaryMembers] Error fetching member details:', error)
      console.error('[SecretaryMembers] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      alert(error.response?.data?.message || error.message || 'Failed to fetch member details')
    } finally {
      setLoadingDetails(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'burned': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'suspended': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getContributionStatusColor = (status) => {
    switch (status) {
      case 'current': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'overdue': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const handleAddMember = async () => {
    try {
      if (!newMember.name || !newMember.phone || !newMember.email || !newMember.nationalId) {
        alert('Please fill in all required fields (Name, Phone, Email, National ID)')
        return
      }

      const response = await api.post('/secretary/members', newMember)
      if (response.data.success) {
        setGeneratedCredentials(response.data.data.credentials)
        setShowCredentialsModal(true)
        setShowAddMember(false)
        setNewMember({
          name: '',
          phone: '',
          email: '',
          nationalId: '',
          address: '',
          role: 'Member'
        })
        fetchMembers()
      }
    } catch (error) {
      console.error('Error adding member:', error)
      alert(error.response?.data?.message || 'Failed to add member')
    }
  }

  const handleViewMemberDetails = async (member) => {
    setSelectedMember(member)
    setShowMemberDetails(true)
    await fetchMemberDetails(member.id)
  }

  const handleEditMember = async (member) => {
    setSelectedMember(member)
    // Fetch fresh member data for editing
    try {
      const response = await api.get(`/secretary/members/${member.id}`)
      if (response.data.success) {
        const memberData = response.data.data.member
        setEditMember({
          name: memberData.name || '',
          phone: memberData.phone || '',
          email: memberData.email || '',
          nationalId: memberData.nationalId || '',
          address: memberData.address || ''
        })
      } else {
        // Fallback to displayed member data
        setEditMember({
          name: member.name || '',
          phone: member.phone || '',
          email: member.email || '',
          nationalId: member.nationalId || '',
          address: ''
        })
      }
    } catch (error) {
      // Fallback to displayed member data
      setEditMember({
        name: member.name || '',
        phone: member.phone || '',
        email: member.email || '',
        nationalId: member.nationalId || '',
        address: ''
      })
    }
    setShowEditMember(true)
  }

  const handleUpdateMember = async () => {
    try {
      const response = await api.put(`/secretary/members/${selectedMember.id}`, editMember)
      if (response.data.success) {
        alert('Member updated successfully!')
        setShowEditMember(false)
        fetchMembers()
      }
    } catch (error) {
      console.error('Error updating member:', error)
      alert(error.response?.data?.message || 'Failed to update member')
    }
  }

  const handleBurnMember = async (memberId) => {
    if (!confirm('Are you sure you want to ban this member?')) return

    try {
      const response = await api.put(`/secretary/members/${memberId}/status`, { status: 'suspended' })
      if (response.data.success) {
        alert('Member banned successfully!')
        fetchMembers()
      }
    } catch (error) {
      console.error('Error banning member:', error)
      alert(error.response?.data?.message || 'Failed to ban member')
    }
  }

  const handleReactivateMember = async (memberId) => {
    if (!confirm('Are you sure you want to reactivate this member?')) return

    try {
      const response = await api.put(`/secretary/members/${memberId}/status`, { status: 'active' })
      if (response.data.success) {
        alert('Member reactivated successfully!')
        fetchMembers()
      }
    } catch (error) {
      console.error('Error reactivating member:', error)
      alert(error.response?.data?.message || 'Failed to reactivate member')
    }
  }

  const handleSuspendMember = async (memberId) => {
    if (!confirm('Are you sure you want to suspend this member?')) return

    try {
      const response = await api.put(`/secretary/members/${memberId}/status`, { status: 'suspended' })
      if (response.data.success) {
        alert('Member suspended successfully!')
        fetchMembers()
      }
    } catch (error) {
      console.error('Error suspending member:', error)
      alert(error.response?.data?.message || 'Failed to suspend member')
    }
  }

  const handleResetPassword = async (userId) => {
    if (!confirm('Are you sure you want to send password reset instructions to this member?')) return

    try {
      const { data } = await api.post(`/system-admin/users/${userId}/remind-password`)
      if (data?.success) {
        alert(data.message || 'Password reset link sent successfully')
      } else {
        alert(data?.message || 'Failed to send reset instructions')
      }
    } catch (err) {
      console.error('Reset password error:', err)
      alert(err.response?.data?.message || 'Failed to send reset instructions')
    }
  }

  const handleExportMembers = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await api.get(`/secretary/members/export?${params.toString()}`, {
        responseType: 'blob'
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `members_export_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting members:', error)
      alert('Failed to export members')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  if (loading) {
    return (
      <Layout userRole="Secretary">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading members...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('memberRecordsDataManagement', { defaultValue: 'Member Records & Data Management' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('maintainComprehensiveMemberRecords', { defaultValue: 'Maintain comprehensive member records and information' })}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddMember(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> {t('addMember', { defaultValue: 'Add Member' })}
            </button>
            <button
              onClick={handleExportMembers}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} /> {t('exportData', { defaultValue: 'Export Data' })}
            </button>
            <button
              onClick={fetchMembers}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalMembers')}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{summary.total}</p>
              </div>
              <Users className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('activeMembers')}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.active}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Burned Members</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.burned}</p>
              </div>
              <XCircle className="text-red-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.pending}</p>
              </div>
              <AlertCircle className="text-yellow-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Member Records ({members.length})
            </h2>
          </div>

          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="mx-auto mb-2" size={32} />
              <p>No members found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {member.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{member.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{member.phone} • {member.email}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">ID: {member.id} • Registered: {member.registrationDate}</p>
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
                      <p className="text-gray-600 dark:text-gray-400">Role</p>
                      <p className="font-semibold dark:text-white">{member.role}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Total Contributions</p>
                      <p className="font-semibold dark:text-white">{member.totalContributions.toLocaleString()} RWF</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Last Contribution</p>
                      <p className="font-semibold dark:text-white">{member.lastContribution || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Burned Status</p>
                      <p className="font-semibold dark:text-white">{member.isBurned ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {member.isBurned && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="text-red-600 dark:text-red-400" size={16} />
                        <span className="font-semibold text-red-800 dark:text-red-300">Account Burned</span>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        Burned on: {member.burnedDate || 'N/A'}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleViewMemberDetails(member)}
                      className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <Eye size={16} /> View Details
                    </button>
                    <button
                      onClick={() => handleEditMember(member)}
                      className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <Edit size={16} /> Update
                    </button>
                    {member.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleBurnMember(member.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <XCircle size={16} /> Ban Account
                        </button>
                        <button
                          onClick={() => handleSuspendMember(member.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Shield size={16} /> Suspend
                        </button>
                        <button
                          onClick={() => handleResetPassword(member.id)}
                          className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <RefreshCw size={16} /> Reset Password
                        </button>
                      </>
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
          )}
        </div>

        {/* Add Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Add New Member</h2>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      className="input-field"
                      placeholder="Enter full name..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      className="input-field"
                      placeholder="Enter phone number..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={newMember.address}
                      onChange={(e) => setNewMember({ ...newMember, address: e.target.value })}
                      className="input-field"
                      placeholder="Enter address..."
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
                    className="btn-primary flex-1"
                  >
                    Add Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Credentials Modal */}
        {showCredentialsModal && generatedCredentials && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Member Created Successfully!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Please share these credentials with the new member:</p>

                <div className="space-y-3 mb-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email:</label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="flex-1 font-mono text-sm">{generatedCredentials.email}</p>
                      <button
                        onClick={() => copyToClipboard(generatedCredentials.email)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phone:</label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="flex-1 font-mono text-sm">{generatedCredentials.phone}</p>
                      <button
                        onClick={() => copyToClipboard(generatedCredentials.phone)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <label className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Generated Password:</label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="flex-1 font-mono text-sm font-bold">{generatedCredentials.password}</p>
                      <button
                        onClick={() => copyToClipboard(generatedCredentials.password)}
                        className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">⚠️ Save this password securely. It cannot be retrieved later.</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowCredentialsModal(false)
                    setGeneratedCredentials(null)
                  }}
                  className="btn-primary w-full"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Member Modal */}
        {showEditMember && selectedMember && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Member</h2>
                <button
                  onClick={() => setShowEditMember(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editMember.name}
                      onChange={(e) => setEditMember({ ...editMember, name: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editMember.phone}
                      onChange={(e) => setEditMember({ ...editMember, phone: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editMember.email}
                      onChange={(e) => setEditMember({ ...editMember, email: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      National ID
                    </label>
                    <input
                      type="text"
                      value={editMember.nationalId}
                      onChange={(e) => setEditMember({ ...editMember, nationalId: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={editMember.address}
                      onChange={(e) => setEditMember({ ...editMember, address: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowEditMember(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateMember}
                    className="btn-primary flex-1"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Member Details Modal */}
        {showMemberDetails && selectedMember && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Member Details</h2>
                <button
                  onClick={() => {
                    setShowMemberDetails(false)
                    setMemberDetails(null)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {loadingDetails ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Loading details...</p>
                </div>
              ) : memberDetails ? (
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                      {memberDetails.member?.name?.[0] || selectedMember?.name?.[0] || 'M'}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {memberDetails.member?.name || selectedMember?.name || 'Unknown Member'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {memberDetails.member?.phone || selectedMember?.phone || 'N/A'} • {memberDetails.member?.email || selectedMember?.email || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Member ID: {memberDetails.member?.id || selectedMember?.id || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Personal Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Role:</span>
                          <span className="font-semibold dark:text-white">{memberDetails.member?.role || selectedMember?.role || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">National ID:</span>
                          <span className="font-semibold dark:text-white">{memberDetails.member?.nationalId || selectedMember?.nationalId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Address:</span>
                          <span className="font-semibold dark:text-white">{memberDetails.member?.address || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Registration Date:</span>
                          <span className="font-semibold dark:text-white">
                            {memberDetails.member?.createdAt
                              ? new Date(memberDetails.member.createdAt).toLocaleDateString()
                              : selectedMember?.registrationDate || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(memberDetails.member?.status || selectedMember?.status || 'active')}`}>
                            {memberDetails.member?.status || selectedMember?.status || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Financial Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Contributions:</span>
                          <span className="font-semibold dark:text-white">
                            {(memberDetails.financial?.totalContributions || 0).toLocaleString()} RWF
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Savings:</span>
                          <span className="font-semibold dark:text-white">
                            {(memberDetails.financial?.totalSavings || 0).toLocaleString()} RWF
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Loans:</span>
                          <span className="font-semibold dark:text-white">
                            {(memberDetails.financial?.totalLoans || 0).toLocaleString()} RWF
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Outstanding Loans:</span>
                          <span className="font-semibold dark:text-white">
                            {(memberDetails.financial?.outstandingLoans || 0).toLocaleString()} RWF
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Fines:</span>
                          <span className="font-semibold dark:text-white">
                            {(memberDetails.financial?.totalFines || 0).toLocaleString()} RWF
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Meetings Attended:</span>
                          <span className="font-semibold dark:text-white">{memberDetails.meetingsAttended || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {memberDetails.recentContributions && memberDetails.recentContributions.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Recent Contributions ({memberDetails.recentContributions.length})</h4>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {memberDetails.recentContributions.map((contrib) => (
                          <div key={contrib.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between">
                            <div>
                              <p className="font-semibold dark:text-white">{(contrib.amount || 0).toLocaleString()} RWF</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {contrib.createdAt ? new Date(contrib.createdAt).toLocaleDateString() : 'N/A'} • {contrib.paymentMethod || 'N/A'}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-500">Receipt: {contrib.receiptNumber || 'N/A'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {memberDetails.recentLoans && memberDetails.recentLoans.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Recent Loans</h4>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {memberDetails.recentLoans.map((loan) => (
                          <div key={loan.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between">
                            <div>
                              <p className="font-semibold dark:text-white">{(loan.amount || 0).toLocaleString()} RWF</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {loan.requestDate ? new Date(loan.requestDate).toLocaleDateString() : 'N/A'} • {loan.status || 'N/A'}
                              </p>
                              {loan.purpose && (
                                <p className="text-xs text-gray-500 dark:text-gray-500">Purpose: {loan.purpose}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {memberDetails.activityHistory && memberDetails.activityHistory.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Activity History</h4>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {memberDetails.activityHistory.map((activity) => (
                          <div key={activity.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-semibold dark:text-white capitalize">{activity.type?.replace('_', ' ') || 'Transaction'}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {activity.description || 'No description'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  {activity.transactionDate ? new Date(activity.transactionDate).toLocaleString() : 'N/A'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold dark:text-white">
                                  {(activity.amount || 0).toLocaleString()} RWF
                                </p>
                                <span className={`text-xs px-2 py-1 rounded-full ${activity.status === 'completed'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : activity.status === 'pending'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  }`}>
                                  {activity.status || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {memberDetails.member?.group && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Group Information</h4>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold dark:text-white">{memberDetails.member.group.name || 'N/A'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Code: {memberDetails.member.group.code || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowMemberDetails(false)
                        setMemberDetails(null)
                      }}
                      className="btn-secondary flex-1"
                    >
                      Close
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
                      Update Information
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <p>Failed to load member details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SecretaryMembers
