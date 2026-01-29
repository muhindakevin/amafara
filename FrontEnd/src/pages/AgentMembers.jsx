import { useEffect, useState } from 'react'
import { Users, Plus, Edit, Eye, Search, Filter, CheckCircle, XCircle, AlertCircle, UserCheck, Download, Phone, Mail, Upload } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

function AgentMembers() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tAgent } = useTranslation('agent')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showMemberDetails, setShowMemberDetails] = useState(false)
  const [showEditMember, setShowEditMember] = useState(false)
  const [editingMember, setEditingMember] = useState(null)

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingApprovals: 0,
    suspended: 0
  })
  const [groups, setGroups] = useState([])

  // Load statistics from database
  const loadStats = async () => {
    try {
      const { data } = await api.get('/agent/dashboard/stats')
      if (data?.success) {
        setStats({
          totalMembers: data.data.totalMembers || 0,
          activeMembers: data.data.activeMembers || 0,
          pendingApprovals: data.data.pendingApprovals || 0,
          suspended: data.data.suspended || 0
        })
      }
    } catch (err) {
      console.error('Failed to load statistics:', err)
      // Fallback to zero if API fails
      setStats({ totalMembers: 0, activeMembers: 0, pendingApprovals: 0, suspended: 0 })
    }
  }

  const loadMembers = async (filterGroupId = null, filterStatusValue = null, search = '') => {
    try {
      setLoading(true)
      // Fetch all members from new endpoint with filters
      const params = {}
      if (filterGroupId && filterGroupId !== 'all') {
        params.groupId = filterGroupId
      }
      if (filterStatusValue && filterStatusValue !== 'all') {
        params.status = filterStatusValue
      }
      if (search) {
        params.search = search
      }

      const { data } = await api.get('/agent/members', { params })
      if (data?.success) {
        const allMembers = (data.data || []).map(m => ({
          id: m.id,
          name: m.name,
          phone: m.phone,
          email: m.email || '',
          nationalId: m.nationalId || '',
          group: m.group?.name || 'No Group',
          groupId: m.groupId,
          role: m.role,
          registrationDate: m.registrationDate,
          status: m.status || 'active',
          totalContributions: m.totalSavings || 0,
          creditScore: m.creditScore || 0,
          loans: 0,
          loanStatus: 'n/a',
          lastContribution: null
        }))
        setMembers(allMembers)
      }
    } catch (err) {
      console.error('Failed to load members:', err)
      setMembers([])
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
    async function load() {
      await loadGroups()
      await loadStats()
      await loadMembers()
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
    const groupMatch = filterGroup === 'all' || (member.groupId && member.groupId.toString() === filterGroup.toString())
    const statusMatch = filterStatus === 'all' || member.status === filterStatus
    const searchMatch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.phone && member.phone.includes(searchTerm)) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.nationalId && member.nationalId.includes(searchTerm)) ||
      member.id.toString().includes(searchTerm)
    return groupMatch && statusMatch && searchMatch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'suspended': return 'bg-red-100 text-red-700'
      case 'burned': return 'bg-red-200 text-red-800 border border-red-300'
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
      alert(tAgent('pleaseFillAllRequiredFields', { defaultValue: 'Please fill in all required fields: name, phone, email, national ID, password, and group' }))
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
        throw new Error(data?.message || tAgent('failedToRegisterMember', { defaultValue: 'Failed to register member' }))
      }

      alert(tAgent('memberRegisteredSuccessfully', { defaultValue: 'Member registered successfully!' }))
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
      await loadMembers()
    } catch (err) {
      console.error('Failed to register member:', err)
      alert(err.response?.data?.message || err.message || tAgent('failedToRegisterMemberTryAgain', { defaultValue: 'Failed to register member. Please try again.' }))
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setNewMember({ ...newMember, letterFromGroup: file, letterUploaded: true })
      alert(tAgent('letterUploadedSuccessfully', { defaultValue: 'Letter uploaded successfully!' }))
    }
  }

  const handleViewMemberDetails = (member) => {
    setSelectedMember(member)
    setShowMemberDetails(true)
  }

  const handleEditMember = (member) => {
    setEditingMember({
      id: member.id,
      name: member.name,
      phone: member.phone,
      email: member.email,
      nationalId: member.nationalId || '',
      role: member.role,
      status: member.status,
      groupId: member.groupId
    })
    setShowEditMember(true)
  }

  const handleSaveMember = async () => {
    if (!editingMember) return

    setSubmitting(true)
    try {
      const { data } = await api.put(`/system-admin/users/${editingMember.id}`, {
        name: editingMember.name,
        phone: editingMember.phone,
        email: editingMember.email,
        nationalId: editingMember.nationalId,
        role: editingMember.role,
        status: editingMember.status
      })

      if (data?.success) {
        alert('Member updated successfully!')
        setShowEditMember(false)
        setEditingMember(null)
        await loadStats()
        await loadMembers()
        if (selectedMember && selectedMember.id === editingMember.id) {
          await loadMembers() // Reload to update selected member
        }
      } else {
        throw new Error(data?.message || 'Failed to update member')
      }
    } catch (err) {
      console.error('Failed to update member:', err)
      alert(err.response?.data?.message || err.message || 'Failed to update member. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSuspendMember = async (memberId) => {
    const member = members.find(m => m.id === memberId)
    if (!member) return

    if (!window.confirm(`Are you sure you want to suspend ${member.name}?`)) {
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.put(`/system-admin/users/${memberId}`, {
        status: 'suspended'
      })

      if (data?.success) {
        alert('Member suspended successfully!')
        await loadStats()
        await loadMembers()
      } else {
        throw new Error(data?.message || 'Failed to suspend member')
      }
    } catch (err) {
      console.error('Failed to suspend member:', err)
      alert(err.response?.data?.message || err.message || 'Failed to suspend member. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReinstateMember = async (memberId) => {
    const member = members.find(m => m.id === memberId)
    if (!member) return

    if (!window.confirm(`Are you sure you want to reinstate ${member.name}?`)) {
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.put(`/system-admin/users/${memberId}`, {
        status: 'active'
      })

      if (data?.success) {
        alert('Member reinstated successfully!')
        await loadStats()
        await loadMembers()
      } else {
        throw new Error(data?.message || 'Failed to reinstate member')
      }
    } catch (err) {
      console.error('Failed to reinstate member:', err)
      alert(err.response?.data?.message || err.message || 'Failed to reinstate member. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveMember = async (memberId) => {
    const member = members.find(m => m.id === memberId)
    if (!member) return

    if (!window.confirm(`Are you sure you want to approve ${member.name}?`)) {
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.put(`/system-admin/users/${memberId}`, {
        status: 'active'
      })

      if (data?.success) {
        alert('Member approved successfully!')
        await loadStats()
        await loadMembers()
      } else {
        throw new Error(data?.message || 'Failed to approve member')
      }
    } catch (err) {
      console.error('Failed to approve member:', err)
      alert(err.response?.data?.message || err.message || 'Failed to approve member. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRejectMember = async (memberId) => {
    const member = members.find(m => m.id === memberId)
    if (!member) return

    if (!window.confirm(`Are you sure you want to reject ${member.name}? This will suspend their account.`)) {
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.put(`/system-admin/users/${memberId}`, {
        status: 'suspended'
      })

      if (data?.success) {
        alert('Member rejected successfully!')
        await loadStats()
        await loadMembers()
      } else {
        throw new Error(data?.message || 'Failed to reject member')
      }
    } catch (err) {
      console.error('Failed to reject member:', err)
      alert(err.response?.data?.message || err.message || 'Failed to reject member. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleBurnStatus = async (memberId, currentStatus) => {
    const member = members.find(m => m.id === memberId)
    if (!member) return

    const isBurning = currentStatus !== 'burned'
    const confirmMessage = isBurning
      ? `Are you sure you want to BURN the account for ${member.name}? This will block their login.`
      : `Are you sure you want to ACTIVATE the account for ${member.name}?`

    if (!window.confirm(confirmMessage)) return

    setSubmitting(true)
    try {
      const { data } = await api.put(`/agent/members/${memberId}/toggle-status`)

      if (data?.success) {
        alert(data.message)
        await loadStats()
        await loadMembers(filterGroup, filterStatus, searchTerm)
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

  const handleExportMembers = async () => {
    try {
      // Export only filtered/searched members (current view)
      const membersToExport = filteredMembers.map(m => ({
        name: m.name,
        phone: m.phone,
        email: m.email || '',
        nationalId: m.nationalId || '',
        group: m.group,
        role: m.role,
        status: m.status,
        totalSavings: m.totalContributions || 0,
        creditScore: m.creditScore || 0,
        registrationDate: m.registrationDate
      }))

      if (membersToExport.length === 0) {
        alert('No members to export. Please adjust your filters.')
        return
      }

      // Generate Excel content using XLSX library (if available) or CSV
      let csvContent = 'IKIMINA WALLET - MEMBERS REPORT\n'
      csvContent += `Generated: ${new Date().toLocaleString()}\n`
      csvContent += `Total Members: ${membersToExport.length}\n`
      const selectedGroup = groups.find(g => g.id.toString() === filterGroup.toString())
      csvContent += `Filters: Group=${filterGroup === 'all' ? 'All' : selectedGroup?.name || filterGroup}, Status=${filterStatus === 'all' ? 'All' : filterStatus}, Search=${searchTerm || 'None'}\n\n`
      csvContent += 'Name,Phone,Email,National ID,Group,Role,Status,Total Savings,Credit Score,Registration Date\n'

      membersToExport.forEach(m => {
        csvContent += `"${m.name}","${m.phone}","${m.email}","${m.nationalId}","${m.group}","${m.role}","${m.status}",${m.totalSavings},${m.creditScore},"${m.registrationDate}"\n`
      })

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `members-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert(tAgent('memberDataExportedSuccessfully', { defaultValue: 'Member data exported successfully!' }))
    } catch (err) {
      console.error('Failed to export members:', err)
      alert(tAgent('failedToExportMemberData', { defaultValue: 'Failed to export member data. Please try again.' }))
    }
  }

  return (
    <Layout userRole="Agent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{tAgent('memberManagementAssistance', { defaultValue: 'Member Management Assistance' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{tAgent('registerAndManageMembers', { defaultValue: 'Register and manage members across all groups' })}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddMember(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> {tAgent('registerMember', { defaultValue: 'Register Member' })}
            </button>
            <button
              onClick={handleExportMembers}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} /> {tAgent('exportData', { defaultValue: 'Export Data' })}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalMembers')}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalMembers}</p>
              </div>
              <Users className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tAgent('activeMembers', { defaultValue: 'Active Members' })}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.activeMembers}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('pendingApprovals')}</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.pendingApprovals}
                </p>
              </div>
              <AlertCircle className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tAgent('suspended', { defaultValue: 'Suspended' })}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.suspended}
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {tAgent('searchMembers', { defaultValue: 'Search Members' })}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={tAgent('searchByNamePhoneEmail', { defaultValue: 'Search by name, phone, email, or ID...' })}
                  className="input-field pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {tAgent('filterByGroup', { defaultValue: 'Filter by Group' })}
              </label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="all">{tAgent('allGroups', { defaultValue: 'All Groups' })}</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id.toString()}>{group.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {tAgent('filterByStatus', { defaultValue: 'Filter by Status' })}
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="all">{tAgent('allStatus', { defaultValue: 'All Status' })}</option>
                <option value="active">{tCommon('active')}</option>
                <option value="pending">{tCommon('pending')}</option>
                <option value="suspended">{tAgent('suspended')}</option>
                <option value="burned">{tAgent('burned', { defaultValue: 'Burned' })}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {tAgent('memberRecords', { defaultValue: 'Member Records' })} ({filteredMembers.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="default" text={tAgent('loadingMembers', { defaultValue: 'Loading members...' })} />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {members.length === 0 ? (
                <p>{tAgent('noMembersFoundRegisterNew', { defaultValue: 'No members found. Register a new member to get started.' })}</p>
              ) : (
                <p>{tAgent('noMembersMatchSearchCriteria', { defaultValue: 'No members match your search criteria. Try adjusting your filters.' })}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {member.name?.[0]?.toUpperCase() || 'M'}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{member.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{member.group}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{tAgent('id', { defaultValue: 'ID' })}: {member.id} • {tAgent('registered', { defaultValue: 'Registered' })}: {member.registrationDate}</p>
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
                      <p className="text-gray-600 dark:text-gray-400">{tCommon('phone')}</p>
                      <p className="font-semibold dark:text-white">{member.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{tCommon('email')}</p>
                      <p className="font-semibold dark:text-white">{member.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('totalContributions')}</p>
                      <p className="font-semibold dark:text-white">{(member.totalContributions || 0).toLocaleString()} RWF</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{tAgent('creditScore', { defaultValue: 'Credit Score' })}</p>
                      <p className="font-semibold dark:text-white">{member.creditScore || 0}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewMemberDetails(member)}
                      className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <Eye size={16} /> {tCommon('view')} {tCommon('details', { defaultValue: 'Details' })}
                    </button>
                    <button
                      onClick={() => handleEditMember(member)}
                      className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <Edit size={16} /> {tCommon('edit')}
                    </button>
                    <button
                      onClick={() => handleToggleBurnStatus(member.id, member.status)}
                      className={`${member.status === 'burned' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}
                      title={member.status === 'burned' ? 'Activate member account' : 'Burn member account'}
                    >
                      {member.status === 'burned' ? <UserCheck size={16} /> : <XCircle size={16} />}
                      {member.status === 'burned' ? 'Activate Account' : 'Burn Account'}
                    </button>
                    {member.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveMember(member.id)}
                          className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <CheckCircle size={16} /> {tCommon('approve')}
                        </button>
                        <button
                          onClick={() => handleRejectMember(member.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <XCircle size={16} /> {tCommon('reject')}
                        </button>
                      </>
                    )}
                    {member.status === 'active' && (
                      <button
                        onClick={() => handleSuspendMember(member.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <XCircle size={16} /> {tAgent('suspend', { defaultValue: 'Suspend' })}
                      </button>
                    )}
                    {member.status === 'suspended' && (
                      <button
                        onClick={() => handleReinstateMember(member.id)}
                        className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <CheckCircle size={16} /> {tAgent('reinstate', { defaultValue: 'Reinstate' })}
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
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{tAgent('registerNewMember', { defaultValue: 'Register New Member' })}</h2>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {tCommon('fullName', { defaultValue: 'Full Name' })}
                    </label>
                    <input
                      type="text"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder={tAgent('enterFullName', { defaultValue: 'Enter full name...' })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {tCommon('phone')} {tCommon('number', { defaultValue: 'Number' })}
                    </label>
                    <input
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder="+250788123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {tCommon('email')} {tCommon('address', { defaultValue: 'Address' })} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder={tAgent('enterEmailAddress', { defaultValue: 'Enter email address...' })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {tAgent('nationalId', { defaultValue: 'National ID' })} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMember.nationalId}
                      onChange={(e) => setNewMember({ ...newMember, nationalId: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder={tAgent('enterNationalId', { defaultValue: 'Enter national ID...' })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {tCommon('password')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={newMember.password}
                      onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder={tAgent('enterPassword', { defaultValue: 'Enter password...' })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('group')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newMember.groupId}
                      onChange={(e) => setNewMember({ ...newMember, groupId: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      required
                    >
                      <option value="">{tAgent('selectGroup', { defaultValue: 'Select Group' })}</option>
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Member Details</h2>
                <button
                  onClick={() => setShowMemberDetails(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedMember.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{selectedMember.group}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Member ID: {selectedMember.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Personal Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                        <span className="font-semibold dark:text-white">{selectedMember.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                        <span className="font-semibold dark:text-white">{selectedMember.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">National ID:</span>
                        <span className="font-semibold dark:text-white">{selectedMember.nationalId || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Registration Date:</span>
                        <span className="font-semibold dark:text-white">{selectedMember.registrationDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedMember.status)}`}>
                          {selectedMember.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Role:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(selectedMember.role)}`}>
                          {selectedMember.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Financial Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Contributions:</span>
                        <span className="font-semibold dark:text-white">{(selectedMember.totalContributions || 0).toLocaleString()} RWF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Credit Score:</span>
                        <span className="font-semibold dark:text-white">{selectedMember.creditScore || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Current Loan:</span>
                        <span className="font-semibold dark:text-white">{(selectedMember.loans || 0).toLocaleString()} RWF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Loan Status:</span>
                        <span className="font-semibold dark:text-white">{selectedMember.loanStatus || 'N/A'}</span>
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
                    onClick={() => {
                      setShowMemberDetails(false)
                      handleEditMember(selectedMember)
                    }}
                    className="btn-primary flex-1"
                  >
                    Edit Member
                  </button>
                  <button
                    onClick={() => handleToggleBurnStatus(selectedMember.id, selectedMember.status)}
                    className={`${selectedMember.status === 'burned' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white flex-1 px-4 py-2 rounded-lg transition-colors`}
                  >
                    {selectedMember.status === 'burned' ? 'Activate Account' : 'Burn Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Member Modal */}
        {showEditMember && editingMember && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Member Profile</h2>
                <button
                  onClick={() => {
                    setShowEditMember(false)
                    setEditingMember(null)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingMember.name}
                      onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
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
                      value={editingMember.phone}
                      onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder="+250788123456"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editingMember.email}
                      onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder="Enter email address..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      National ID
                    </label>
                    <input
                      type="text"
                      value={editingMember.nationalId}
                      onChange={(e) => setEditingMember({ ...editingMember, nationalId: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder="Enter national ID..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Role
                    </label>
                    <select
                      value={editingMember.role}
                      onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    >
                      <option value="Member">Member</option>
                      <option value="Group Admin">Group Admin</option>
                      <option value="Cashier">Cashier</option>
                      <option value="Secretary">Secretary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={editingMember.status}
                      onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">⚠️ Important</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    All changes will be logged and reported to system administrators. Role changes should only be made when requested by the group.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEditMember(false)
                      setEditingMember(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMember}
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

export default AgentMembers
