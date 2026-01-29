import { useState, useEffect } from 'react'
import { UserCheck, Plus, Eye, Search, XCircle, Phone, Mail, Users, BookOpen, Activity, TrendingUp, Calendar, MapPin, CheckCircle, Clock, X } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function SystemAdminAgents() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddAgent, setShowAddAgent] = useState(false)
  const [showAgentDetails, setShowAgentDetails] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)

  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [agentActions, setAgentActions] = useState(null)
  const [loadingActions, setLoadingActions] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const [newAgent, setNewAgent] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active'
  })

  const fetchAgents = async () => {
    const { data } = await api.get('/system-admin/users?role=Agent').catch(()=>({data:{data:[]}}))
    setAgents(data?.data || [])
  }

  useEffect(() => {
    let mounted = true
    ;(async ()=>{ setLoading(true); await fetchAgents(); if(mounted) setLoading(false) })()
    return () => { mounted = false }
  }, [])

  const filteredAgents = (agents || []).filter(agent => {
    const matchesStatus = filterStatus === 'all' || (agent.status || '').toLowerCase() === filterStatus
    const matchesSearch = [agent.name, agent.email, agent.phone].filter(Boolean).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  const handleAddAgent = async () => {
    if (!newAgent.name || (!newAgent.email && !newAgent.phone)) {
      alert(t('provideNameEmailOrPhone', { defaultValue: 'Please provide name and at least email or phone.' }))
      return
    }
    try {
      await api.post('/system-admin/users', { name: newAgent.name, email: newAgent.email || undefined, phone: newAgent.phone || undefined, role: 'Agent', password: undefined })
      await fetchAgents()
    setShowAddAgent(false)
      setNewAgent({ name: '', email: '', phone: '', status: 'active' })
    } catch (e) {
      alert(e?.response?.data?.message || t('failedToCreateAgent', { defaultValue: 'Failed to create agent' }))
    }
  }

  const handleViewAgentDetails = async (agent) => {
    setSelectedAgent(agent)
    setShowAgentDetails(true)
    setActiveTab('overview')
    setLoadingActions(true)
    setAgentActions(null)
    try {
      const { data } = await api.get(`/system-admin/agents/${agent.id}/actions`)
      if (data?.success) {
        setAgentActions(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch agent actions:', error)
      setAgentActions(null)
    } finally {
      setLoadingActions(false)
    }
  }

  const handleUpdateStatus = async (agentId, status) => {
    try { await api.put(`/system-admin/users/${agentId}`, { status }); await fetchAgents() } catch { alert(t('failedToUpdateStatus', { defaultValue: 'Failed to update status' })) }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('agentManagement', { defaultValue: 'Agent Management' })}</h1>

        {/* Controls */}
        <div className="card flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder={t('searchAgentsByNameEmailPhone', { defaultValue: 'Search agents by name, email, or phone...' })} className="input-field pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
          </div>
          <div className="w-full md:w-auto">
            <select className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)}>
              <option value="all">{t('allStatuses')}</option>
              <option value="active">{t('active')}</option>
              <option value="pending">{tCommon('pending')}</option>
              <option value="suspended">{t('suspended')}</option>
            </select>
          </div>
          <button onClick={()=>setShowAddAgent(true)} className="btn-primary flex items-center gap-2 w-full md:w-auto">
            <Plus size={20} /> {t('registerAgent', { defaultValue: 'Register Agent' })}
          </button>
        </div>

        {/* List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('allAgents', { defaultValue: 'All Agents' })}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tCommon('name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('email', { defaultValue: 'Email' })}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('phone', { defaultValue: 'Phone' })}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status', { defaultValue: 'Status' })}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{tCommon('actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">{tCommon('loading')}</td></tr>
                ) : filteredAgents.length > 0 ? (
                  filteredAgents.map(agent => (
                    <tr 
                      key={agent.id} 
                      onClick={() => handleViewAgentDetails(agent)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{agent.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{agent.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{agent.phone || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ (agent.status||'').toLowerCase()==='active' ? 'bg-green-100 text-green-700' : (agent.status||'').toLowerCase()==='pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700' }`}>
                          {agent.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <button onClick={()=>handleViewAgentDetails(agent)} className="text-primary-600 hover:text-primary-900 mr-3" title="View Details"><Eye size={20} /></button>
                        { (agent.status||'').toLowerCase() !== 'active' ? (
                          <button onClick={()=>handleUpdateStatus(agent.id,'active')} className="text-green-600 hover:text-green-900 mr-3" title={t('activate', { defaultValue: 'Activate' })}>{t('activate', { defaultValue: 'Activate' })}</button>
                        ) : (
                          <button onClick={()=>handleUpdateStatus(agent.id,'suspended')} className="text-yellow-600 hover:text-yellow-900 mr-3" title={t('suspend', { defaultValue: 'Suspend' })}>{t('suspend', { defaultValue: 'Suspend' })}</button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">{t('noAgentsFound', { defaultValue: 'No agents found.' })}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Agent Modal */}
        {showAddAgent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{t('registerNewAgent', { defaultValue: 'Register New Agent' })}</h2>
                <button onClick={() => setShowAddAgent(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <p className="text-gray-600">{t('enterAgentDetails', { defaultValue: 'Enter agent details.' })}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('fullName', { defaultValue: 'Full Name' })}</label>
                  <input type="text" value={newAgent.name} onChange={(e)=>setNewAgent({ ...newAgent, name: e.target.value })} className="input-field" placeholder={t('fullNamePlaceholder', { defaultValue: 'Jane Doe' })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('email', { defaultValue: 'Email' })}</label>
                  <input type="email" value={newAgent.email} onChange={(e)=>setNewAgent({ ...newAgent, email: e.target.value })} className="input-field" placeholder={t('emailPlaceholder', { defaultValue: 'jane@example.com' })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('phone', { defaultValue: 'Phone' })}</label>
                  <input type="text" value={newAgent.phone} onChange={(e)=>setNewAgent({ ...newAgent, phone: e.target.value })} className="input-field" placeholder={t('phonePlaceholder', { defaultValue: '07XXXXXXXX' })} />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddAgent(false)} className="btn-secondary flex-1">{tCommon('cancel')}</button>
                <button onClick={handleAddAgent} className="btn-primary flex-1">{t('registerAgent', { defaultValue: 'Register Agent' })}</button>
              </div>
            </div>
          </div>
        )}

        {/* Agent Details Modal */}
        {showAgentDetails && selectedAgent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl my-8 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedAgent.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Agent ID: {selectedAgent.id}</p>
                </div>
                <button onClick={() => { setShowAgentDetails(false); setAgentActions(null); setActiveTab('overview'); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <XCircle size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700 px-6">
                <div className="flex space-x-1 overflow-x-auto">
                  {['overview', 'groups', 'members', 'training', 'actions'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab === 'overview' && 'Overview'}
                      {tab === 'groups' && `Groups (${agentActions?.stats?.groupsCreated || 0})`}
                      {tab === 'members' && `Members (${(agentActions?.stats?.membersAdded || 0) - (agentActions?.stats?.membersRemoved || 0)})`}
                      {tab === 'training' && `Training (${agentActions?.stats?.trainingCompleted || 0})`}
                      {tab === 'actions' && `All Actions (${agentActions?.stats?.totalActions || 0})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {loadingActions ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <>
                    {/* Overview Tab */}
                    {activeTab === 'overview' && agentActions && (
                      <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="card p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                              <Mail size={18} /> {agentActions.agent.email || '-'}
                            </p>
                          </div>
                          <div className="card p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                              <Phone size={18} /> {agentActions.agent.phone || '-'}
                            </p>
                          </div>
                          <div className="card p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white">
                              <span className={`px-2 py-1 rounded-full text-sm ${agentActions.agent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {agentActions.agent.status || 'pending'}
                              </span>
                            </p>
                          </div>
                          <div className="card p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Joined</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                              <Calendar size={18} /> {new Date(agentActions.agent.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="card p-4 text-center">
                            <Users className="mx-auto mb-2 text-primary-600" size={32} />
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{agentActions.stats.groupsCreated}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Groups Created</p>
                          </div>
                          <div className="card p-4 text-center">
                            <TrendingUp className="mx-auto mb-2 text-green-600" size={32} />
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{agentActions.stats.membersAdded}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Members Added</p>
                          </div>
                          <div className="card p-4 text-center">
                            <X className="mx-auto mb-2 text-red-600" size={32} />
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{agentActions.stats.membersRemoved}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Members Removed</p>
                          </div>
                          <div className="card p-4 text-center">
                            <BookOpen className="mx-auto mb-2 text-blue-600" size={32} />
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{agentActions.stats.trainingCompleted}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Training Completed</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Groups Tab */}
                    {activeTab === 'groups' && agentActions && (
                      <div className="space-y-4">
                        {agentActions.groupsCreated.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {agentActions.groupsCreated.map(group => (
                              <div key={group.id} className="card p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{group.name}</h3>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">#{group.code}</span>
                                </div>
                                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                  {group.district && (
                                    <p className="flex items-center gap-2">
                                      <MapPin size={14} /> {group.district}, {group.sector}
                                    </p>
                                  )}
                                  <p className="flex items-center gap-2">
                                    <Users size={14} /> {group.totalMembers || 0} members
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <Calendar size={14} /> Created {new Date(group.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500 dark:text-gray-400">No groups created yet</div>
                        )}
                      </div>
                    )}

                    {/* Members Tab */}
                    {activeTab === 'members' && agentActions && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                              <CheckCircle className="text-green-600" size={20} /> Members Added ({agentActions.stats.membersAdded})
                            </h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {agentActions.actionsByType.members.filter(a => a.action === 'CREATE_USER').length > 0 ? (
                                agentActions.actionsByType.members.filter(a => a.action === 'CREATE_USER').slice(0, 50).map((action, idx) => (
                                  <div key={idx} className="card p-3 text-sm">
                                    <p className="font-medium text-gray-800 dark:text-white">{action.details?.name || 'Unknown Member'}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {new Date(action.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">No members added</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                              <X className="text-red-600" size={20} /> Members Removed ({agentActions.stats.membersRemoved})
                            </h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {agentActions.actionsByType.members.filter(a => a.action === 'DELETE_USER' || a.action === 'REMOVE_MEMBER').length > 0 ? (
                                agentActions.actionsByType.members.filter(a => a.action === 'DELETE_USER' || a.action === 'REMOVE_MEMBER').slice(0, 50).map((action, idx) => (
                                  <div key={idx} className="card p-3 text-sm">
                                    <p className="font-medium text-gray-800 dark:text-white">{action.details?.name || 'Unknown Member'}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {new Date(action.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">No members removed</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Training Tab */}
                    {activeTab === 'training' && agentActions && (
                      <div className="space-y-4">
                        {agentActions.trainingProgress.length > 0 ? (
                          <div className="space-y-3">
                            {agentActions.trainingProgress.map(progress => (
                              <div key={progress.id} className="card p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{progress.contentTitle}</h3>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    progress.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    progress.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {progress.status === 'completed' ? <CheckCircle size={12} className="inline mr-1" /> : 
                                     progress.status === 'in_progress' ? <Clock size={12} className="inline mr-1" /> : 'Not Started'}
                                  </span>
                                </div>
                                <div className="mt-2">
                                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                                    <span>Progress</span>
                                    <span>{progress.progressPercentage}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-primary-600 h-2 rounded-full transition-all"
                                      style={{ width: `${progress.progressPercentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                                {progress.timeSpent > 0 && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Time spent: {Math.floor(progress.timeSpent / 60)}h {progress.timeSpent % 60}m
                                  </p>
                                )}
                                {progress.completedAt && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Completed: {new Date(progress.completedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500 dark:text-gray-400">No training progress yet</div>
                        )}
                      </div>
                    )}

                    {/* Actions Tab */}
                    {activeTab === 'actions' && agentActions && (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {agentActions.allActions.length > 0 ? (
                          agentActions.allActions.map(action => (
                            <div key={action.id} className="card p-4 border-l-4 border-primary-500">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-800 dark:text-white">{action.action}</p>
                                  {action.entityType && (
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                      {action.entityType} {action.entityId ? `#${action.entityId}` : ''}
                                    </p>
                                  )}
                                  {action.details && typeof action.details === 'object' && (
                                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                      {Object.entries(action.details).slice(0, 3).map(([key, value]) => (
                                        <span key={key} className="mr-3">
                                          <strong>{key}:</strong> {String(value).substring(0, 30)}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right text-xs text-gray-500 dark:text-gray-400 ml-4">
                                  <p>{new Date(action.createdAt).toLocaleString()}</p>
                                  {action.ipAddress && <p className="mt-1">{action.ipAddress}</p>}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 text-gray-500 dark:text-gray-400">No actions recorded</div>
                        )}
                      </div>
                    )}

                    {!agentActions && !loadingActions && (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">Failed to load agent actions</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminAgents

