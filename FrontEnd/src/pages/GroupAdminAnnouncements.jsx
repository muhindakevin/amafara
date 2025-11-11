import { useState, useEffect } from 'react'
import { Megaphone, Plus, Edit, Trash2, Send, Calendar, Users, Bell, XCircle } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function GroupAdminAnnouncements() {
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false)
  const [showEditContribution, setShowEditContribution] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [announcements, setAnnouncements] = useState([])
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
        
        const res = await api.get(`/announcements?groupId=${gid}`)
        if (mounted && res.data?.success) {
          const anns = (res.data.data || []).map(a => ({
            id: a.id,
            title: a.title,
            content: a.content,
            type: 'general',
            priority: a.priority || 'medium',
            date: a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '',
            time: a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            status: a.status === 'sent' ? 'sent' : 'draft',
            recipients: 'All Members',
            createdBy: 'Group Admin',
            sentAt: a.sentAt ? new Date(a.sentAt).toISOString() : null
          }))
          setAnnouncements(anns)
        }
      } catch (e) {
        console.error('Failed to load announcements:', e)
        if (mounted) setAnnouncements([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'general',
    priority: 'medium',
    recipients: 'all',
    scheduledDate: '',
    scheduledTime: ''
  })

  const [contributionSettings, setContributionSettings] = useState({
    minimumAmount: 0,
    maximumAmount: 0,
    dueDate: 15,
    lateFee: 0,
    gracePeriod: 5
  })

  useEffect(() => {
    let mounted = true
    async function loadGroupSettings() {
      try {
        const me = await api.get('/auth/me')
        const gid = me.data?.data?.groupId
        if (!gid || !mounted) return
        
        const groupRes = await api.get(`/groups/${gid}`)
        if (mounted && groupRes.data?.success) {
          const group = groupRes.data.data
          setContributionSettings({
            minimumAmount: Number(group.contributionAmount || 0),
            maximumAmount: 50000, // Default max
            dueDate: 15, // Default
            lateFee: 500, // Default
            gracePeriod: 5 // Default
          })
        }
      } catch (e) {
        console.error('Failed to load group settings:', e)
      }
    }
    if (groupId) loadGroupSettings()
    return () => { mounted = false }
  }, [groupId])

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'meeting': return <Calendar className="text-blue-600" size={20} />
      case 'contribution': return <Users className="text-green-600" size={20} />
      case 'loan': return <Megaphone className="text-purple-600" size={20} />
      case 'celebration': return <Bell className="text-orange-600" size={20} />
      default: return <Megaphone className="text-gray-600" size={20} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-700'
      case 'draft': return 'bg-gray-100 text-gray-700'
      case 'scheduled': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      alert('Title and content are required')
      return
    }

    if (!groupId) {
      alert('Group ID not found. Please refresh the page.')
      return
    }

    try {
      if (editingAnnouncement) {
        // Update existing announcement
        const { data } = await api.put(`/announcements/${editingAnnouncement.id}`, {
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          priority: newAnnouncement.priority
        })
        if (data?.success) {
          alert('Announcement updated successfully!')
          setShowCreateAnnouncement(false)
          setEditingAnnouncement(null)
          // Reload announcements
          const res = await api.get(`/announcements?groupId=${groupId}`)
          if (res.data?.success) {
            const anns = (res.data.data || []).map(a => ({
              id: a.id,
              title: a.title,
              content: a.content,
              type: 'general',
              priority: a.priority || 'medium',
              date: a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '',
              time: a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
              status: a.status === 'sent' ? 'sent' : 'draft',
              recipients: 'All Members',
              createdBy: 'Group Admin',
              sentAt: a.sentAt ? new Date(a.sentAt).toISOString() : null
            }))
            setAnnouncements(anns)
          }
        }
      } else {
        // Create new announcement
        const { data } = await api.post('/announcements', {
          groupId: groupId,
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          priority: newAnnouncement.priority || 'medium'
        })
        if (data?.success) {
          alert('Announcement created successfully!')
          setShowCreateAnnouncement(false)
          setNewAnnouncement({
            title: '',
            content: '',
            type: 'general',
            priority: 'medium',
            recipients: 'all',
            scheduledDate: '',
            scheduledTime: ''
          })
          // Reload announcements
          const res = await api.get(`/announcements?groupId=${groupId}`)
          if (res.data?.success) {
            const anns = (res.data.data || []).map(a => ({
              id: a.id,
              title: a.title,
              content: a.content,
              type: 'general',
              priority: a.priority || 'medium',
              date: a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '',
              time: a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
              status: a.status === 'sent' ? 'sent' : 'draft',
              recipients: 'All Members',
              createdBy: 'Group Admin',
              sentAt: a.sentAt ? new Date(a.sentAt).toISOString() : null
            }))
            setAnnouncements(anns)
          }
        }
      }
    } catch (err) {
      console.error('Failed to create/update announcement:', err)
      alert(err.response?.data?.message || err.message || 'Failed to save announcement. Please try again.')
    }
  }

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement)
    setNewAnnouncement({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      recipients: announcement.recipients,
      scheduledDate: announcement.date,
      scheduledTime: announcement.time
    })
    setShowCreateAnnouncement(true)
  }

  const handleDeleteAnnouncement = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    
    try {
      const { data } = await api.delete(`/announcements/${id}`)
      if (data?.success) {
        alert('Announcement deleted successfully!')
        // Reload announcements
        const res = await api.get(`/announcements?groupId=${groupId}`)
        if (res.data?.success) {
          const anns = (res.data.data || []).map(a => ({
            id: a.id,
            title: a.title,
            content: a.content,
            type: 'general',
            priority: a.priority || 'medium',
            date: a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '',
            time: a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            status: a.status === 'sent' ? 'sent' : 'draft',
            recipients: 'All Members',
            createdBy: 'Group Admin',
            sentAt: a.sentAt ? new Date(a.sentAt).toISOString() : null
          }))
          setAnnouncements(anns)
        }
      }
    } catch (err) {
      console.error('Failed to delete announcement:', err)
      alert(err.response?.data?.message || 'Failed to delete announcement. Please try again.')
    }
  }

  const handleSendAnnouncement = async (id) => {
    try {
      const { data } = await api.put(`/announcements/${id}/send`)
      if (data?.success) {
        alert('Announcement sent to all group members!')
        // Reload announcements
        const res = await api.get(`/announcements?groupId=${groupId}`)
        if (res.data?.success) {
          const anns = (res.data.data || []).map(a => ({
            id: a.id,
            title: a.title,
            content: a.content,
            type: 'general',
            priority: a.priority || 'medium',
            date: a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '',
            time: a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            status: a.status === 'sent' ? 'sent' : 'draft',
            recipients: 'All Members',
            createdBy: 'Group Admin',
            sentAt: a.sentAt ? new Date(a.sentAt).toISOString() : null
          }))
          setAnnouncements(anns)
        }
      }
    } catch (err) {
      console.error('Failed to send announcement:', err)
      alert(err.response?.data?.message || 'Failed to send announcement. Please try again.')
    }
  }

  const handleUpdateContributionSettings = async () => {
    if (!groupId) {
      alert('Group ID not found. Please refresh the page.')
      return
    }

    try {
      const { data } = await api.put(`/groups/${groupId}`, {
        contributionAmount: contributionSettings.minimumAmount,
        contributionFrequency: 'monthly'
      })
      if (data?.success) {
        alert('Contribution settings updated successfully!')
        setShowEditContribution(false)
      }
    } catch (err) {
      console.error('Failed to update contribution settings:', err)
      alert(err.response?.data?.message || 'Failed to update settings. Please try again.')
    }
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Announcements</h1>
            <p className="text-gray-600 mt-1">Manage group communications and settings</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditContribution(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Users size={18} /> Edit Contributions
            </button>
            <button
              onClick={() => setShowCreateAnnouncement(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> New Announcement
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Announcements</p>
                <p className="text-2xl font-bold text-gray-800">
                  {announcements.length}
                </p>
              </div>
              <Megaphone className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Sent</p>
                <p className="text-2xl font-bold text-green-600">
                  {announcements.filter(a => a.status === 'sent').length}
                </p>
              </div>
              <Send className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Drafts</p>
                <p className="text-2xl font-bold text-gray-600">
                  {announcements.filter(a => a.status === 'draft').length}
                </p>
              </div>
              <Edit className="text-gray-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">
                  {announcements.filter(a => a.status === 'scheduled').length}
                </p>
              </div>
              <Calendar className="text-blue-600" size={32} />
            </div>
          </div>
        </div>

        {/* Current Contribution Settings */}
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Current Contribution Settings</h2>
            <button
              onClick={() => setShowEditContribution(true)}
              className="btn-secondary text-sm"
            >
              Edit Settings
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Minimum Amount</p>
              <p className="text-lg font-bold text-gray-800">{contributionSettings.minimumAmount.toLocaleString()} RWF</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Maximum Amount</p>
              <p className="text-lg font-bold text-gray-800">{contributionSettings.maximumAmount.toLocaleString()} RWF</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              <p className="text-lg font-bold text-gray-800">Day {contributionSettings.dueDate}</p>
            </div>
          </div>
        </div>

        {/* Announcements List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Recent Announcements ({announcements.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No announcements found. Create an announcement to communicate with your group members.</div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    {getTypeIcon(announcement.type)}
                    <div>
                      <h3 className="font-bold text-gray-800">{announcement.title}</h3>
                      <p className="text-sm text-gray-600">{announcement.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {announcement.date} at {announcement.time} • {announcement.recipients}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(announcement.status)}`}>
                      {announcement.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {announcement.status === 'draft' && (
                    <button
                      onClick={() => handleSendAnnouncement(announcement.id)}
                      className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <Send size={16} /> Send Now
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

        {/* Create/Edit Announcement Modal */}
        {showCreateAnnouncement && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateAnnouncement(false)
                    setEditingAnnouncement(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    className="input-field h-32 resize-none"
                    placeholder="Enter announcement content..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={newAnnouncement.type}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                      className="input-field"
                    >
                      <option value="general">General</option>
                      <option value="meeting">Meeting</option>
                      <option value="contribution">Contribution</option>
                      <option value="loan">Loan</option>
                      <option value="celebration">Celebration</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Recipients
                    </label>
                    <select
                      value={newAnnouncement.recipients}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, recipients: e.target.value })}
                      className="input-field"
                    >
                      <option value="all">All Members</option>
                      <option value="active">Active Members Only</option>
                      <option value="specific">Specific Members</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Schedule Date
                    </label>
                    <input
                      type="date"
                      value={newAnnouncement.scheduledDate}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, scheduledDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateAnnouncement(false)
                      setEditingAnnouncement(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAnnouncement}
                    className="btn-primary flex-1"
                  >
                    {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Contribution Settings Modal */}
        {showEditContribution && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Edit Contribution Settings</h2>
                <button
                  onClick={() => setShowEditContribution(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Minimum Amount (RWF)
                    </label>
                    <input
                      type="number"
                      value={contributionSettings.minimumAmount}
                      onChange={(e) => setContributionSettings({ ...contributionSettings, minimumAmount: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Maximum Amount (RWF)
                    </label>
                    <input
                      type="number"
                      value={contributionSettings.maximumAmount}
                      onChange={(e) => setContributionSettings({ ...contributionSettings, maximumAmount: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Due Date (Day of Month)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={contributionSettings.dueDate}
                      onChange={(e) => setContributionSettings({ ...contributionSettings, dueDate: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Late Fee (RWF)
                    </label>
                    <input
                      type="number"
                      value={contributionSettings.lateFee}
                      onChange={(e) => setContributionSettings({ ...contributionSettings, lateFee: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Grace Period (Days)
                    </label>
                    <input
                      type="number"
                      value={contributionSettings.gracePeriod}
                      onChange={(e) => setContributionSettings({ ...contributionSettings, gracePeriod: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowEditContribution(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateContributionSettings}
                    className="btn-primary flex-1"
                  >
                    Update Settings
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

export default GroupAdminAnnouncements

