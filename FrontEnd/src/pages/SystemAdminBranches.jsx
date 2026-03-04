import { useState, useEffect } from 'react'
import { Building2, Plus, Edit, Eye, Search, XCircle, Users, MapPin, UserPlus, UserCheck } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function SystemAdminBranches() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [showBranchDetails, setShowBranchDetails] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState([])
  const [loadingAgents, setLoadingAgents] = useState(false)
  const [agentAssignmentMode, setAgentAssignmentMode] = useState('existing') // 'existing' or 'new' or 'none'

  const [newBranch, setNewBranch] = useState({
    name: '',
    location: '',
    type: 'Rural',
    manager: '',
    phone: '',
    email: '',
    establishedDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  })

  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [newAgent, setNewAgent] = useState({
    name: '',
    email: '',
    phone: '',
    nationalId: '',
    password: ''
  })

  useEffect(() => {
    let isMounted = true
    async function fetchBranches() {
      try {
        setLoading(true)
        const { data } = await api.get('/branches')
        if (isMounted) setBranches(data?.data || [])
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchBranches()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    if (showAddBranch && agentAssignmentMode === 'existing') {
      fetchAgents()
    }
  }, [showAddBranch, agentAssignmentMode])

  const fetchAgents = async () => {
    setLoadingAgents(true)
    try {
      const { data } = await api.get('/system-admin/users', { params: { role: 'Agent' } })
      // Filter agents that don't have a branch assigned or allow reassignment
      const availableAgents = (data?.data || []).filter(agent => agent.status === 'active')
      setAgents(availableAgents)
    } catch (error) {
      console.error('Failed to fetch agents:', error)
      setAgents([])
    } finally {
      setLoadingAgents(false)
    }
  }

  const filteredBranches = (branches || []).filter(branch => {
    const matchesStatus = filterStatus === 'all' || (branch.status || 'Active') === filterStatus
    const matchesSearch = [branch.name, branch.location].filter(Boolean).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  const refresh = async () => {
    const { data } = await api.get('/branches').catch(()=>({data:{data:[]}}))
    setBranches(data?.data || [])
  }

  const handleAddBranch = async () => {
    if (!newBranch.name) {
      alert(t('provideBranchName', { defaultValue: 'Please provide branch name.' }))
      return
    }

    // Validate agent assignment if mode is set
    if (agentAssignmentMode === 'existing' && !selectedAgentId) {
      alert('Please select an agent to assign to this branch.')
      return
    }

    if (agentAssignmentMode === 'new') {
      if (!newAgent.name || !newAgent.phone || !newAgent.nationalId) {
        alert('Please provide agent name, phone, and national ID to create a new agent.')
        return
      }
      if (!newAgent.password) {
        alert('Please provide a password for the new agent.')
        return
      }
    }

    try {
      // Step 1: Create the branch
      const branchRes = await api.post('/branches', { 
        name: newBranch.name, 
        code: undefined, 
        address: newBranch.location 
      })

      if (!branchRes.data?.success) {
        throw new Error(branchRes.data?.message || 'Failed to create branch')
      }

      const branchId = branchRes.data.data.id

      // Step 2: Handle agent assignment
      try {
        if (agentAssignmentMode === 'existing' && selectedAgentId) {
          // Assign existing agent to branch
          console.log('[handleAddBranch] Assigning existing agent:', selectedAgentId, 'to branch:', branchId)
          await api.put(`/system-admin/users/${selectedAgentId}`, { branchId })
          console.log('[handleAddBranch] Agent assigned successfully')
        } else if (agentAssignmentMode === 'new') {
          // Create new agent and assign to branch
          console.log('[handleAddBranch] Creating new agent for branch:', branchId)
          await api.post('/system-admin/users', {
            name: newAgent.name,
            email: newAgent.email || undefined,
            phone: newAgent.phone,
            nationalId: newAgent.nationalId,
            role: 'Agent',
            password: newAgent.password,
            branchId: branchId
          })
          console.log('[handleAddBranch] New agent created successfully')
        }
      } catch (agentError) {
        console.error('[handleAddBranch] Error assigning/creating agent:', agentError)
        // Don't fail the entire operation if agent assignment fails
        // The branch was created successfully, so we'll just warn the user
        alert('Branch created successfully, but there was an issue assigning the agent. You can assign an agent later.')
      }

      await refresh()
      setShowAddBranch(false)
      // Reset form
      setNewBranch({ name: '', location: '', type: 'Rural', manager: '', phone: '', email: '', establishedDate: new Date().toISOString().split('T')[0], status: 'Active' })
      setSelectedAgentId('')
      setNewAgent({ name: '', email: '', phone: '', nationalId: '', password: '' })
      setAgentAssignmentMode('existing')
      
      alert(agentAssignmentMode === 'new' 
        ? 'Branch created successfully and new agent assigned!' 
        : agentAssignmentMode === 'existing'
        ? 'Branch created successfully and agent assigned!'
        : 'Branch created successfully!')
    } catch (e) {
      console.error('Error creating branch:', e)
      const errorMessage = e?.response?.data?.message || 
                          e?.response?.data?.error || 
                          e?.message || 
                          t('failedToCreateBranch', { defaultValue: 'Failed to create branch' })
      alert(`Error: ${errorMessage}`)
    }
  }

  const handleViewBranchDetails = (branch) => {
    setSelectedBranch(branch)
    setShowBranchDetails(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700'
      case 'Pending': return 'bg-yellow-100 text-yellow-700'
      case 'Suspended': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'Urban': return 'bg-blue-100 text-blue-700'
      case 'Rural': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPerformanceColor = (performance) => {
    const score = parseInt(performance)
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('branchLocationManagement', { defaultValue: 'Branch & Location Management' })}</h1>

        {/* Search and Filter */}
        <div className="card flex flex-col md:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('searchBranchesByNameLocation', { defaultValue: 'Search branches by name or location...' })}
              className="input-field pl-9 py-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto">
            <select
              className="input-field py-2 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">{t('allStatuses', { defaultValue: 'All Statuses' })}</option>
              <option value="Active">{t('active', { defaultValue: 'Active' })}</option>
              <option value="Pending">{tCommon('pending')}</option>
              <option value="Suspended">{t('suspended', { defaultValue: 'Suspended' })}</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddBranch(true)}
            className="btn-primary flex items-center gap-1 px-2 py-2 text-sm w-full md:w-auto"
          >
            <Plus size={16} /> {t('createBranch', { defaultValue: 'Create' })}
          </button>
        </div>

        {/* Branch List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('allBranches', { defaultValue: 'All Branches' })}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('branchName', { defaultValue: 'Branch Name' })}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('location', { defaultValue: 'Location' })}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status', { defaultValue: 'Status' })}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{tCommon('actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">{tCommon('loading')}</td></tr>
                ) : filteredBranches.length > 0 ? (
                  filteredBranches.map(branch => (
                    <tr key={branch.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{branch.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{branch.address || branch.location || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor('Active')}`}>
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewBranchDetails(branch)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Details"
                        >
                          <Eye size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">{t('noBranchesFound', { defaultValue: 'No branches found.' })}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add New Branch Modal */}
        {showAddBranch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl my-8 p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('createNewBranch', { defaultValue: 'Create New Branch' })}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('enterNewBranchDetails', { defaultValue: 'Enter the new branch details and assign an agent.' })}</p>
                </div>
                <button onClick={() => {
                  setShowAddBranch(false)
                  setAgentAssignmentMode('existing')
                  setSelectedAgentId('')
                  setNewAgent({ name: '', email: '', phone: '', nationalId: '', password: '' })
                }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  <XCircle size={24} />
                </button>
              </div>

              {/* Branch Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <Building2 size={20} /> Branch Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('branchName', { defaultValue: 'Branch Name' })} <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={newBranch.name} 
                      onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })} 
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                      placeholder="Kigali Central Branch" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={newBranch.location} 
                      onChange={(e) => setNewBranch({ ...newBranch, location: e.target.value })} 
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                      placeholder="Kigali City Center, Rwanda" 
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Agent Assignment Section */}
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <Users size={20} /> Agent Assignment
                </h3>
                
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="agentMode"
                        value="none"
                        checked={agentAssignmentMode === 'none'}
                        onChange={(e) => setAgentAssignmentMode(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">No Agent (Assign Later)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="agentMode"
                        value="existing"
                        checked={agentAssignmentMode === 'existing'}
                        onChange={(e) => setAgentAssignmentMode(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <UserCheck size={16} /> Assign Existing Agent
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="agentMode"
                        value="new"
                        checked={agentAssignmentMode === 'new'}
                        onChange={(e) => setAgentAssignmentMode(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <UserPlus size={16} /> Create New Agent
                      </span>
                    </label>
                  </div>

                  {/* Existing Agent Selection */}
                  {agentAssignmentMode === 'existing' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Select Agent <span className="text-red-500">*</span>
                      </label>
                      {loadingAgents ? (
                        <div className="text-center py-4">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading agents...</p>
                        </div>
                      ) : agents.length > 0 ? (
                        <select
                          value={selectedAgentId}
                          onChange={(e) => setSelectedAgentId(e.target.value)}
                          className="input-field w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          required
                        >
                          <option value="">-- Select an Agent --</option>
                          {agents.map(agent => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name} {agent.branchId ? `(Currently at Branch ID: ${agent.branchId})` : '(Available)'}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400">No available agents found. Please create a new agent.</p>
                      )}
                    </div>
                  )}

                  {/* New Agent Creation Form */}
                  {agentAssignmentMode === 'new' && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">New Agent Details</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newAgent.name}
                            onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                            className="input-field w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            placeholder="John Doe"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newAgent.phone}
                            onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                            className="input-field w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            placeholder="+250788123456"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Email (Optional)
                          </label>
                          <input
                            type="email"
                            value={newAgent.email}
                            onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                            className="input-field w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            placeholder="john.doe@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            National ID <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newAgent.nationalId}
                            onChange={(e) => setNewAgent({ ...newAgent, nationalId: e.target.value })}
                            className="input-field w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            placeholder="1199887766554433"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            value={newAgent.password}
                            onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                            className="input-field w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            placeholder="Enter secure password"
                            required
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">The agent will use this password to log in.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => {
                    setShowAddBranch(false)
                    setAgentAssignmentMode('existing')
                    setSelectedAgentId('')
                    setNewAgent({ name: '', email: '', phone: '', nationalId: '', password: '' })
                  }} 
                  className="btn-secondary flex-1"
                >
                  {tCommon('cancel')}
                </button>
                <button 
                  onClick={handleAddBranch} 
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> {t('createBranch', { defaultValue: 'Create Branch' })}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Branch Details Modal */}
        {showBranchDetails && selectedBranch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Branch Details</h2>
                <button onClick={() => setShowBranchDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700"><span className="font-semibold">ID:</span> {selectedBranch.id}</p>
                <p className="text-gray-700"><span className="font-semibold">Name:</span> {selectedBranch.name}</p>
                <p className="text-gray-700 flex items-center gap-2"><span className="font-semibold">Location:</span> <MapPin size={16} /> {selectedBranch.address || selectedBranch.location || '-'}</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowBranchDetails(false)} className="btn-secondary">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminBranches
