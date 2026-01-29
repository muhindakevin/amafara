import { useState, useEffect } from 'react'
import { MessageCircle, Send, Users, Globe, Bell, FileText, Plus, Eye, XCircle, CheckCircle, MessageSquare } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

function SystemAdminCommunications() {
  const { t } = useTranslation('common')
  const { t: tSystemAdmin } = useTranslation('systemAdmin')
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('broadcast')
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [showAnnouncementDetails, setShowAnnouncementDetails] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)

  const [announcements, setAnnouncements] = useState([])
  const [targetedAnnouncements, setTargetedAnnouncements] = useState([])
  const [historyAnnouncements, setHistoryAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [selectedGroups, setSelectedGroups] = useState([])
  const [selectedRoles, setSelectedRoles] = useState([])

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'General',
    priority: 'Medium',
    targetType: 'All', // All, Groups, Roles
    targetGroups: [],
    targetRoles: [],
  })

  useEffect(() => {
    fetchData()
    fetchGroups()
  }, [activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // For System Admin, fetch all announcements (no groupId filter)
      // Broadcast: all sent announcements
      // Targeted: announcements sent to specific groups (not system-wide)
      // History: all announcements regardless of status
      const [broadcastRes, targetedRes, historyRes] = await Promise.all([
        api.get('/announcements', { params: { status: 'sent' } }).catch(() => ({ data: { success: false, data: [] } })),
        api.get('/announcements', { params: { targeted: 'true' } }).catch(() => ({ data: { success: false, data: [] } })),
        api.get('/announcements', { params: { status: 'all' } }).catch(() => ({ data: { success: false, data: [] } }))
      ])
      
      if (broadcastRes.data?.success) {
        setAnnouncements(broadcastRes.data.data || [])
      }
      
      if (targetedRes.data?.success) {
        // Filter to show only targeted announcements (those with specific groupId, not null)
        const targeted = (targetedRes.data.data || []).filter(a => a.groupId !== null)
        setTargetedAnnouncements(targeted)
      }
      
      if (historyRes.data?.success) {
        // History shows all announcements sorted by date
        const allAnnouncements = historyRes.data.data || []
        setHistoryAnnouncements(allAnnouncements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      }
    } catch (error) {
      console.error('[SystemAdminCommunications] Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const { data } = await api.get('/groups')
      if (data?.data) {
        setGroups(data.data)
      }
    } catch (error) {
      console.error('[SystemAdminCommunications] Error fetching groups:', error)
    }
  }

  const handleComposeAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      alert(tSystemAdmin('fillAllRequiredFields', { defaultValue: 'Please fill in all required fields.' }))
      return
    }
    
    try {
      // For System Admin, we need to send to selected receivers
      const payload = {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        type: newAnnouncement.type,
        priority: newAnnouncement.priority.toLowerCase(),
        targetType: newAnnouncement.targetType,
        sendToGroup: true, // Always send immediately for System Admin
        // For System Admin, we can send to multiple groups or roles
        targetGroups: newAnnouncement.targetType === 'Groups' ? selectedGroups : [],
        targetRoles: newAnnouncement.targetType === 'Roles' ? selectedRoles : [],
        // If targetType is 'All', send to all groups
        groupId: newAnnouncement.targetType === 'All' ? null : (selectedGroups[0] || null)
      }
      
      const response = await api.post('/announcements/system-admin', payload)
      
      if (response.data?.success) {
        alert(tSystemAdmin('announcementCreatedAndSent', { defaultValue: 'Announcement created and sent successfully!' }))
        setShowComposeModal(false)
        setNewAnnouncement({ 
          title: '', 
          content: '', 
          type: 'General', 
          priority: 'Medium', 
          targetType: 'All',
          targetGroups: [],
          targetRoles: []
        })
        setSelectedGroups([])
        setSelectedRoles([])
        fetchData() // Refresh all tabs
      }
    } catch (e) {
      console.error('[SystemAdminCommunications] Error creating announcement:', e)
      alert(e?.response?.data?.message || tSystemAdmin('failedToCreateAnnouncement', { defaultValue: 'Failed to create announcement' }))
    }
  }

  const handleViewAnnouncementDetails = (announcement) => {
    setSelectedAnnouncement(announcement)
    setShowAnnouncementDetails(true)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700'
      case 'Medium': return 'bg-yellow-100 text-yellow-700'
      case 'Low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Published': return 'bg-green-100 text-green-700'
      case 'Draft': return 'bg-gray-100 text-gray-700'
      case 'Scheduled': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'System': return 'bg-red-100 text-red-700'
      case 'Product': return 'bg-blue-100 text-blue-700'
      case 'Training': return 'bg-purple-100 text-purple-700'
      case 'General': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tSystemAdmin('communicationAndAnnouncements', { defaultValue: 'Communication & Announcements' })}</h1>
            <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('broadcastMessagesAndNotifications', { defaultValue: 'Broadcast messages and send targeted notifications to users' })}</p>
          </div>
          <button 
            onClick={() => navigate('/system-admin/chat')}
            className="btn-primary flex items-center gap-2"
          >
            <MessageSquare size={20} /> Chat
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('totalAnnouncements', { defaultValue: 'Total Announcements' })}</p>
                <p className="text-2xl font-bold text-gray-800">{announcements.length}</p>
              </div>
              <MessageCircle className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('published', { defaultValue: 'Published' })}</p>
                <p className="text-2xl font-bold text-gray-800">{announcements.filter(a => a.status === 'Published').length}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('totalViews', { defaultValue: 'Total Views' })}</p>
                <p className="text-2xl font-bold text-gray-800">{announcements.reduce((sum, a) => sum + (a.views||0), 0)}</p>
              </div>
              <Eye className="text-purple-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('totalRecipients', { defaultValue: 'Total Recipients' })}</p>
                <p className="text-2xl font-bold text-gray-800">{announcements.reduce((sum, a) => sum + (a.recipients||0), 0)}</p>
              </div>
              <Users className="text-orange-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['broadcast', 'targeted', 'history'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 rounded-lg font-medium transition-all ${ activeTab === tab ? 'bg-primary-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100' }`}>
                  {t(`tab.${tab}`, { defaultValue: tab.charAt(0).toUpperCase() + tab.slice(1) })}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'broadcast' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">System-Wide Announcements</h2>
                  <button onClick={() => setShowComposeModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={20} /> Create Announcement
                  </button>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">Loading…</div>
                  ) : announcements.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">No announcements yet.</div>
                  ) : announcements.map(announcement => (
                    <div key={announcement.id} className="card">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{announcement.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(announcement.type)}`}>{announcement.type}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(announcement.priority)}`}>{announcement.priority}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(announcement.status || 'sent')}`}>{announcement.status || 'sent'}</span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">{announcement.content}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>Group: {announcement.group?.name || 'All'}</span>
                            <span>Views: {announcement.views || 0}</span>
                            <span>Recipients: {announcement.recipients || 0}</span>
                            <span>Created: {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'targeted' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Targeted Announcements</h2>
                  <button onClick={() => setShowComposeModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={20} /> Create Targeted Announcement
                  </button>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">Loading…</div>
                  ) : targetedAnnouncements.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">No targeted announcements yet.</div>
                  ) : targetedAnnouncements.map(announcement => (
                    <div key={announcement.id} className="card">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{announcement.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(announcement.type)}`}>{announcement.type}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(announcement.priority)}`}>{announcement.priority}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(announcement.status || 'sent')}`}>{announcement.status || 'sent'}</span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">{announcement.content}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>Target: {announcement.group?.name || 'Specific Group'}</span>
                            <span>Views: {announcement.views || 0}</span>
                            <span>Recipients: {announcement.recipients || 0}</span>
                            <span>Sent: {announcement.sentAt ? new Date(announcement.sentAt).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Announcement History</h2>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">Loading…</div>
                  ) : historyAnnouncements.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">No announcement history.</div>
                  ) : historyAnnouncements.map(announcement => (
                    <div key={announcement.id} className="card">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{announcement.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(announcement.type)}`}>{announcement.type}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(announcement.priority)}`}>{announcement.priority}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(announcement.status || 'draft')}`}>{announcement.status || 'draft'}</span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">{announcement.content}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>Group: {announcement.group?.name || 'N/A'}</span>
                            <span>Creator: {announcement.creator?.name || 'System Admin'}</span>
                            <span>Views: {announcement.views || 0}</span>
                            <span>Recipients: {announcement.recipients || 0}</span>
                            <span>Created: {announcement.createdAt ? new Date(announcement.createdAt).toLocaleString() : 'N/A'}</span>
                            {announcement.sentAt && (
                              <span>Sent: {new Date(announcement.sentAt).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compose Modal */}
        {showComposeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Create Announcement</h2>
                <button onClick={() => setShowComposeModal(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <p className="text-gray-600">Enter announcement details and choose target audience.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                  <input className="input-field" value={newAnnouncement.title} onChange={(e)=>setNewAnnouncement({...newAnnouncement,title:e.target.value})} placeholder="System Maintenance Notice" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                  <textarea className="input-field" rows={4} value={newAnnouncement.content} onChange={(e)=>setNewAnnouncement({...newAnnouncement,content:e.target.value})} placeholder="Write your message..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                    <select className="input-field" value={newAnnouncement.type} onChange={(e)=>setNewAnnouncement({...newAnnouncement,type:e.target.value})}>
                      <option>General</option>
                      <option>System</option>
                      <option>Product</option>
                      <option>Training</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                    <select className="input-field" value={newAnnouncement.priority} onChange={(e)=>setNewAnnouncement({...newAnnouncement,priority:e.target.value})}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Target Type</label>
                    <select 
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                      value={newAnnouncement.targetType} 
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, targetType: e.target.value})}
                    >
                      <option value="All">All Users</option>
                      <option value="Groups">Specific Groups</option>
                      <option value="Roles">Specific Roles</option>
                    </select>
                  </div>
                </div>

                {newAnnouncement.targetType === 'Groups' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Groups</label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
                      {groups.map(group => (
                        <label key={group.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedGroups.includes(group.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGroups([...selectedGroups, group.id])
                                setNewAnnouncement({...newAnnouncement, targetGroups: [...selectedGroups, group.id]})
                              } else {
                                const updated = selectedGroups.filter(id => id !== group.id)
                                setSelectedGroups(updated)
                                setNewAnnouncement({...newAnnouncement, targetGroups: updated})
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{group.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {newAnnouncement.targetType === 'Roles' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Roles</label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
                      {['Agent', 'Group Admin', 'Secretary', 'Cashier', 'Member'].map(role => (
                        <label key={role} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(role)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const updated = [...selectedRoles, role]
                                setSelectedRoles(updated)
                                setNewAnnouncement({...newAnnouncement, targetRoles: updated})
                              } else {
                                const updated = selectedRoles.filter(r => r !== role)
                                setSelectedRoles(updated)
                                setNewAnnouncement({...newAnnouncement, targetRoles: updated})
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowComposeModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleComposeAnnouncement} className="btn-primary flex-1">Create Announcement</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminCommunications

