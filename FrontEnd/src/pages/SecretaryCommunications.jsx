import { useState, useEffect } from 'react'
import { MessageCircle, Plus, Edit, Trash2, Send, Bell, Eye, Users, Calendar, FileText, XCircle, RefreshCw } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import { api } from '../utils/api'

function SecretaryCommunications() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tSecretary } = useTranslation('secretary')
  const [activeTab, setActiveTab] = useState('announcements')
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false)
  const [showCreateNotice, setShowCreateNotice] = useState(false)
  const [showEditAnnouncement, setShowEditAnnouncement] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [summary, setSummary] = useState({ total: 0, published: 0, drafts: 0, activeNotices: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)
  const [groupId, setGroupId] = useState(null)

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    recipients: 'All Members',
    priority: 'medium',
    sendToGroup: false
  })

  const [editAnnouncement, setEditAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium'
  })

  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    category: 'General',
    sendToGroup: false
  })

  // Fetch groupId and data
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Get user info to get groupId
      const userResponse = await api.get('/auth/me')
      if (userResponse.data.success && userResponse.data.data.groupId) {
        setGroupId(userResponse.data.data.groupId)
      }

      // Fetch announcements
      await fetchAnnouncements()
      
      // Fetch summary
      await fetchSummary()
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/announcements')
      if (response.data.success) {
        setAnnouncements(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await api.get('/announcements/summary')
      if (response.data.success) {
        const summaryData = response.data.data || { total: 0, published: 0, drafts: 0, activeNotices: 0 }
        console.log('[SecretaryCommunications] Summary data:', summaryData)
        setSummary(summaryData)
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
      // Set default values on error
      setSummary({ total: 0, published: 0, drafts: 0, activeNotices: 0 })
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'low': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'published': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'draft': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'active': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'sent': return 'Published'
      case 'published': return 'Published'
      case 'draft': return 'Draft'
      case 'active': return 'Active'
      default: return status
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const handleCreateAnnouncement = async () => {
    try {
      if (!newAnnouncement.title || !newAnnouncement.content) {
        alert('Please fill in title and content')
        return
      }

      if (!groupId) {
        alert('Unable to determine your group. Please try again.')
        return
      }

      const response = await api.post('/announcements', {
        groupId,
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        priority: newAnnouncement.priority,
        sendToGroup: newAnnouncement.sendToGroup
      })

      if (response.data.success) {
        alert(newAnnouncement.sendToGroup 
          ? 'Announcement created and sent successfully!' 
          : 'Announcement created successfully!')
    setShowCreateAnnouncement(false)
    setNewAnnouncement({
      title: '',
      content: '',
      recipients: 'All Members',
          priority: 'medium',
          sendToGroup: false
        })
        // Refresh both announcements and summary
        await fetchAnnouncements()
        await fetchSummary()
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
      alert(error.response?.data?.message || 'Failed to create announcement')
    }
  }

  const handleCreateNotice = async () => {
    try {
      if (!newNotice.title || !newNotice.content) {
        alert('Please fill in title and content')
        return
      }

      if (!groupId) {
        alert('Unable to determine your group. Please try again.')
        return
      }

      // Notices are announcements with high priority and sent immediately
      const response = await api.post('/announcements', {
        groupId,
        title: newNotice.title,
        content: newNotice.content,
        priority: 'high',
        sendToGroup: newNotice.sendToGroup
      })

      if (response.data.success) {
        alert(newNotice.sendToGroup 
          ? 'Notice created and sent successfully!' 
          : 'Notice created successfully!')
    setShowCreateNotice(false)
    setNewNotice({
      title: '',
      content: '',
          category: 'General',
          sendToGroup: false
        })
        // Refresh both announcements and summary
        await fetchAnnouncements()
        await fetchSummary()
      }
    } catch (error) {
      console.error('Error creating notice:', error)
      alert(error.response?.data?.message || 'Failed to create notice')
    }
  }

  const handleSendAnnouncement = async (announcementId) => {
    try {
      const response = await api.put(`/announcements/${announcementId}/send`)
      if (response.data.success) {
        alert('Announcement sent successfully to all group members!')
        // Refresh both announcements and summary
        await fetchAnnouncements()
        await fetchSummary()
      }
    } catch (error) {
      console.error('Error sending announcement:', error)
      alert(error.response?.data?.message || 'Failed to send announcement')
    }
  }

  const handleEditAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement)
    setEditAnnouncement({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority
    })
    setShowEditAnnouncement(true)
  }

  const handleUpdateAnnouncement = async () => {
    try {
      if (!editAnnouncement.title || !editAnnouncement.content) {
        alert('Please fill in title and content')
        return
      }

      const response = await api.put(`/announcements/${selectedAnnouncement.id}`, editAnnouncement)
      if (response.data.success) {
        alert('Announcement updated successfully!')
        setShowEditAnnouncement(false)
        setSelectedAnnouncement(null)
        // Refresh both announcements and summary
        await fetchAnnouncements()
        await fetchSummary()
      }
    } catch (error) {
      console.error('Error updating announcement:', error)
      alert(error.response?.data?.message || 'Failed to update announcement')
    }
  }

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      const response = await api.delete(`/announcements/${announcementId}`)
      if (response.data.success) {
        alert('Announcement deleted successfully!')
        // Refresh both announcements and summary
        await fetchAnnouncements()
        await fetchSummary()
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      alert(error.response?.data?.message || 'Failed to delete announcement')
    }
  }

  // Notices are sent announcements (status = 'sent')
  const notices = announcements.filter(a => a.status === 'sent')

  if (loading) {
    return (
      <Layout userRole="Secretary">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading communications...</p>
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
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{tSecretary('communicationAndAnnouncements', { defaultValue: 'Communication & Announcements' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{tSecretary('manageGroupCommunications', { defaultValue: 'Manage group communications and official notices' })}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateAnnouncement(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> {t('newAnnouncement', { defaultValue: 'New Announcement' })}
            </button>
            <button
              onClick={() => setShowCreateNotice(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus size={18} /> New Notice
            </button>
            <button
              onClick={fetchData}
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
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Announcements</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{summary.total}</p>
              </div>
              <MessageCircle className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Published</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.published}</p>
              </div>
              <Send className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Drafts</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.drafts}</p>
              </div>
              <Edit className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active Notices</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.activeNotices}</p>
              </div>
              <Bell className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 p-2">
              {['announcements', 'notices', 'templates', 'history'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'announcements' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Announcements</h2>
                {announcements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageCircle className="mx-auto mb-2" size={48} />
                    <p>No announcements found</p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 dark:text-white">{announcement.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{announcement.content}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                              {formatDate(announcement.createdAt)} • Created by: {announcement.creator?.name || 'Unknown'}
                          </p>
                        </div>
                          <div className="flex items-center gap-3 ml-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(announcement.status)}`}>
                              {getStatusLabel(announcement.status)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(announcement.priority)}`}>
                            {announcement.priority}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                          {announcement.status === 'draft' && (
                        <button
                          onClick={() => handleSendAnnouncement(announcement.id)}
                          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <Send size={16} /> Send
                        </button>
                          )}
                        <button
                            onClick={() => handleEditAnnouncement(announcement)}
                          className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <Edit size={16} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}

            {activeTab === 'notices' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Notice Board</h2>
                {notices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Bell className="mx-auto mb-2" size={48} />
                    <p>No active notices found</p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {notices.map((notice) => (
                    <div
                      key={notice.id}
                        className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 dark:text-white">{notice.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notice.content}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                              {formatDate(notice.createdAt)} • Priority: {notice.priority}
                          </p>
                        </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor('active')}`}>
                            Active
                        </span>
                      </div>

                      <div className="flex gap-2">
                          <button
                            onClick={() => handleEditAnnouncement(notice)}
                            className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                          >
                          <Edit size={16} /> Edit
                        </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(notice.id)}
                            className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                          >
                          <Trash2 size={16} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Message Templates</h2>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="mx-auto mb-2" size={48} />
                  <p>Templates feature coming soon</p>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Communication History</h2>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageCircle className="mx-auto mb-2" size={48} />
                  <p>Communication history will be displayed here</p>
                  <p className="text-sm">Track all sent messages and announcements</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Announcement Modal */}
        {showCreateAnnouncement && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Create Announcement</h2>
                <button
                  onClick={() => setShowCreateAnnouncement(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    className="input-field"
                    placeholder="Enter announcement title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    className="input-field h-32 resize-none"
                    placeholder="Enter announcement content..."
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sendToGroup"
                    checked={newAnnouncement.sendToGroup}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, sendToGroup: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="sendToGroup" className="text-sm text-gray-700 dark:text-gray-300">
                    Send to all group members immediately (will create notifications)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateAnnouncement(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAnnouncement}
                    className="btn-primary flex-1"
                  >
                    {newAnnouncement.sendToGroup ? 'Create & Send' : 'Create Announcement'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Announcement Modal */}
        {showEditAnnouncement && selectedAnnouncement && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Announcement</h2>
                <button
                  onClick={() => {
                    setShowEditAnnouncement(false)
                    setSelectedAnnouncement(null)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editAnnouncement.title}
                    onChange={(e) => setEditAnnouncement({ ...editAnnouncement, title: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={editAnnouncement.priority}
                    onChange={(e) => setEditAnnouncement({ ...editAnnouncement, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={editAnnouncement.content}
                    onChange={(e) => setEditAnnouncement({ ...editAnnouncement, content: e.target.value })}
                    className="input-field h-32 resize-none"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEditAnnouncement(false)
                      setSelectedAnnouncement(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateAnnouncement}
                    className="btn-primary flex-1"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Notice Modal */}
        {showCreateNotice && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Create Notice</h2>
                <button
                  onClick={() => setShowCreateNotice(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newNotice.title}
                    onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                    className="input-field"
                    placeholder="Enter notice title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newNotice.content}
                    onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                    className="input-field h-32 resize-none"
                    placeholder="Enter notice content..."
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sendNoticeToGroup"
                    checked={newNotice.sendToGroup}
                    onChange={(e) => setNewNotice({ ...newNotice, sendToGroup: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="sendNoticeToGroup" className="text-sm text-gray-700 dark:text-gray-300">
                    Send to all group members immediately (will create notifications)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateNotice(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNotice}
                    className="btn-primary flex-1"
                  >
                    {newNotice.sendToGroup ? 'Create & Send Notice' : 'Create Notice'}
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

export default SecretaryCommunications
