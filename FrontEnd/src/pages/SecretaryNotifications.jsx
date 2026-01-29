import { useState, useEffect } from 'react'
import { Bell, MessageCircle, Users, Calendar, Eye, Send, CheckCircle, RefreshCw, DollarSign, FileText, Edit, Trash2, Plus, Clock, History, X } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { useNotifications } from '../contexts/NotificationContext'

function SecretaryNotifications() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tSecretary } = useTranslation('secretary')
  const [activeTab, setActiveTab] = useState('alerts')
  const [loading, setLoading] = useState(true)
  const { markAsRead: contextMarkAsRead } = useNotifications()

  // Alerts tab - received notifications
  const [alerts, setAlerts] = useState([])

  // Notifications tab - sent notifications
  const [sentNotifications, setSentNotifications] = useState([])

  // Templates tab
  const [templates, setTemplates] = useState([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [templateForm, setTemplateForm] = useState({ name: '', subject: '', content: '', type: 'custom' })

  // History tab - read notifications
  const [history, setHistory] = useState([])

  const [summary, setSummary] = useState({
    unreadAlerts: 0,
    sentNotifications: 0,
    memberAlerts: 0,
    meetingAlerts: 0,
    loanAlerts: 0,
    contributionAlerts: 0
  })
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [activeTab, categoryFilter])

  const fetchData = async () => {
    try {
      setLoading(true)

      if (activeTab === 'alerts' || activeTab === 'history') {
        // Fetch notifications (same as dropdown)
        const response = await api.get('/notifications?limit=500')

        if (response.data.success && response.data.data) {
          const allNotifications = response.data.data.map(notif => {
            const categorizeNotification = (type) => {
              if (!type) return 'general';
              if (type.includes('meeting') || type === 'meeting_reminder') return 'meeting';
              if (type.includes('loan') || type === 'loan_approval' || type === 'loan_rejection' || type === 'loan_request') return 'loan';
              if (type.includes('contribution') || type === 'contribution_confirmation') return 'contribution';
              if (type === 'announcement') return 'announcement';
              if (type === 'registration' || type.includes('member')) return 'member';
              if (type === 'fine_issued') return 'fine';
              return 'general';
            };

            let sender = 'System';
            let senderRole = 'System';
            const notifType = notif.type || '';
            if (notifType.includes('loan') && (notifType.includes('approval') || notifType.includes('rejection'))) {
              sender = 'Group Admin';
              senderRole = 'Group Admin';
            } else if (notifType === 'contribution_confirmation') {
              sender = 'Cashier';
              senderRole = 'Cashier';
            } else if (notifType === 'meeting_reminder') {
              sender = 'Group Admin';
              senderRole = 'Group Admin';
            } else if (notifType === 'announcement') {
              sender = 'Group Admin';
              senderRole = 'Group Admin';
            }

            return {
              id: notif.id,
              type: notif.type || 'general',
              category: categorizeNotification(notif.type),
              title: notif.title || 'Notification',
              content: notif.content || notif.message || 'Notification content',
              message: notif.content || notif.message || 'Notification content',
              sender: sender,
              senderRole: senderRole,
              read: notif.read || false,
              priority: notif.priority || 'medium',
              timestamp: notif.createdAt || notif.timestamp,
              createdAt: notif.createdAt || notif.timestamp,
              timeAgo: getTimeAgo(notif.createdAt || notif.timestamp),
              amount: notif.amount
            };
          });

          allNotifications.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.timestamp || 0);
            const dateB = new Date(b.createdAt || b.timestamp || 0);
            return dateB - dateA;
          });

          // Separate unread (alerts) and read (history)
          // Include read announcements in alerts tab as requested
          const alertsToShow = allNotifications.filter(n => !n.read || n.category === 'announcement');
          const unreadCount = allNotifications.filter(n => !n.read).length;
          const readHistory = allNotifications.filter(n => n.read);

          // Filter alerts by category
          let filteredAlerts = alertsToShow;
          if (categoryFilter !== 'all') {
            filteredAlerts = alertsToShow.filter(alert => alert.category === categoryFilter);
          }

          setAlerts(filteredAlerts);
          setHistory(readHistory);

          // Calculate summary
          setSummary({
            unreadAlerts: unreadCount,
            sentNotifications: sentNotifications.length,
            memberAlerts: allNotifications.filter(a => a.category === 'member').length,
            meetingAlerts: allNotifications.filter(a => a.category === 'meeting').length,
            loanAlerts: allNotifications.filter(a => a.category === 'loan').length,
            contributionAlerts: allNotifications.filter(a => a.category === 'contribution').length
          });
        }
      } else if (activeTab === 'notifications') {
        // Fetch sent notifications
        const response = await api.get('/notifications/sent')
        if (response.data.success) {
          const sent = (response.data.data || []).map(notif => ({
            id: notif.id,
            title: notif.title || 'Notification',
            content: notif.content || notif.message || 'Notification content',
            recipient: notif.user?.name || 'Unknown',
            recipientId: notif.userId,
            type: notif.type || 'general',
            timestamp: notif.createdAt || notif.timestamp,
            createdAt: notif.createdAt || notif.timestamp,
            timeAgo: getTimeAgo(notif.createdAt || notif.timestamp),
            read: notif.read || false
          }));
          setSentNotifications(sent);
          setSummary(prev => ({ ...prev, sentNotifications: sent.length }));
        }
      } else if (activeTab === 'templates') {
        // Fetch templates
        const response = await api.get('/message-templates')
        if (response.data.success) {
          setTemplates(response.data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  }

  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)

  const handleMarkAsRead = async (notificationId, event) => {
    if (event) {
      event.stopPropagation()
    }
    try {
      // Synchronize with global notification context (header bell)
      await contextMarkAsRead(notificationId)

      // Optimistically update the local state to avoid loading flicker
      const readAlert = alerts.find(a => a.id === notificationId)

      if (readAlert) {
        // Move from alerts to history, but keep announcements in alerts (just mark as read)
        if (readAlert.category === 'announcement') {
          setAlerts(prev => prev.map(alert =>
            alert.id === notificationId ? { ...alert, read: true } : alert
          ))
        } else {
          setAlerts(prev => prev.filter(alert => alert.id !== notificationId))
        }
        setHistory(prev => [{ ...readAlert, read: true }, ...prev])

        // Update summary counts
        setSummary(prev => ({
          ...prev,
          unreadAlerts: Math.max(0, prev.unreadAlerts - 1),
          // Decrement specific category counts if they were unread
          memberAlerts: readAlert.category === 'member' ? prev.memberAlerts : prev.memberAlerts,
          meetingAlerts: readAlert.category === 'meeting' ? prev.meetingAlerts : prev.meetingAlerts,
          loanAlerts: readAlert.category === 'loan' ? prev.loanAlerts : prev.loanAlerts,
          contributionAlerts: readAlert.category === 'contribution' ? prev.contributionAlerts : prev.contributionAlerts
        }))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      alert('Failed to mark notification as read: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleViewDetails = (alert) => {
    setSelectedNotification(alert)
    setShowDetailsModal(true)
    // Also mark as read when viewing details
    if (!alert.read) {
      handleMarkAsRead(alert.id)
    }
  }

  const handleView = (alert) => {
    // Mark as read first
    if (!alert.read) {
      handleMarkAsRead(alert.id)
    }

    // Then navigate based on category
    if (alert.category === 'meeting') {
      window.location.href = '/secretary/meetings'
    } else if (alert.category === 'loan') {
      window.location.href = '/secretary/support?tab=loans'
    } else if (alert.category === 'contribution') {
      window.location.href = '/secretary/support?tab=reports'
    } else if (alert.category === 'announcement') {
      window.location.href = '/secretary/communications'
    } else if (alert.category === 'member') {
      window.location.href = '/secretary/members'
    } else {
      // For general notifications, show details modal
      handleViewDetails(alert)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      if (!templateForm.name || !templateForm.content) {
        alert('Name and content are required')
        return
      }

      if (editingTemplate) {
        await api.put(`/message-templates/${editingTemplate.id}`, templateForm)
      } else {
        await api.post('/message-templates', templateForm)
      }

      setShowTemplateModal(false)
      setEditingTemplate(null)
      setTemplateForm({ name: '', subject: '', content: '', type: 'custom' })
      await fetchData()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template')
    }
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      subject: template.subject || '',
      content: template.content,
      type: template.type || 'custom'
    })
    setShowTemplateModal(true)
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await api.delete(`/message-templates/${templateId}`)
      await fetchData()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'meeting': return <Calendar className="text-orange-600" size={20} />
      case 'loan': return <DollarSign className="text-green-600" size={20} />
      case 'contribution': return <FileText className="text-blue-600" size={20} />
      case 'announcement': return <MessageCircle className="text-purple-600" size={20} />
      case 'member': return <Users className="text-purple-600" size={20} />
      default: return <Bell className="text-gray-600" size={20} />
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'meeting': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      case 'loan': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'contribution': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'announcement': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'member': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getCategoryLabel = (category) => {
    const labels = {
      'meeting': 'Meeting',
      'loan': 'Loan',
      'contribution': 'Contribution',
      'announcement': 'Announcement',
      'member': 'Member',
      'general': 'General'
    }
    return labels[category] || category
  }

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {t('notificationsAndAlerts', { defaultValue: 'Notifications & Alerts' })}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('manageAlertsAndNotifications', { defaultValue: 'Manage alerts and member notifications' })}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {t('unreadAlerts', { defaultValue: 'Unread Alerts' })}
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{summary.unreadAlerts}</p>
              </div>
              <Bell className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {t('sentNotifications', { defaultValue: 'Sent Notifications' })}
                </p>
                <p className="text-2xl font-bold text-green-600">{summary.sentNotifications}</p>
              </div>
              <Send className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {t('memberAlerts', { defaultValue: 'Member Alerts' })}
                </p>
                <p className="text-2xl font-bold text-purple-600">{summary.memberAlerts}</p>
              </div>
              <Users className="text-purple-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {t('meetingAlerts', { defaultValue: 'Meeting Alerts' })}
                </p>
                <p className="text-2xl font-bold text-orange-600">{summary.meetingAlerts}</p>
              </div>
              <Calendar className="text-orange-600" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 p-2">
              {['alerts', 'notifications', 'templates', 'history'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === tab
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  {t(`tab.${tab}`, { defaultValue: tab.charAt(0).toUpperCase() + tab.slice(1) })}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
              </div>
            ) : (
              <>
                {/* ALERTS TAB - Unread notifications */}
                {activeTab === 'alerts' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {t('systemAlerts', { defaultValue: 'System Alerts' })}
                      </h2>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="input-field text-sm"
                      >
                        <option value="all">All Categories</option>
                        <option value="meeting">Meetings</option>
                        <option value="loan">Loans</option>
                        <option value="contribution">Contributions</option>
                        <option value="announcement">Announcements</option>
                        <option value="member">Members</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                    {alerts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Bell className="mx-auto mb-2" size={48} />
                        <p>No unread alerts</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {alerts.map((alert) => (
                          <div
                            key={alert.id}
                            className={`p-4 rounded-xl transition-colors ${!alert.read
                              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                              : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="mt-1">
                                  {getCategoryIcon(alert.category)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-800 dark:text-white">{alert.title}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(alert.category)}`}>
                                      {getCategoryLabel(alert.category)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {alert.content && alert.content.length > 150
                                      ? alert.content.substring(0, 150) + '...'
                                      : alert.content}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                                    <span>From: {alert.sender} ({alert.senderRole})</span>
                                    <span>•</span>
                                    <span>{alert.timeAgo || 'Unknown'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => handleViewDetails(alert)}
                                  className="btn-primary text-sm px-3 py-1 flex items-center gap-1"
                                >
                                  <Eye size={14} /> {tCommon('viewDetails', { defaultValue: 'View Details' })}
                                </button>
                                {!alert.read && (
                                  <button
                                    onClick={(e) => handleMarkAsRead(alert.id, e)}
                                    className="btn-secondary text-sm px-3 py-1 flex items-center gap-1"
                                  >
                                    <CheckCircle size={14} /> {t('markRead', { defaultValue: 'Mark Read' })}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* NOTIFICATIONS TAB - Sent notifications */}
                {activeTab === 'notifications' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {t('sentNotifications', { defaultValue: 'Sent Notifications' })}
                      </h2>
                    </div>
                    {sentNotifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Send className="mx-auto mb-2" size={48} />
                        <p>No sent notifications found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sentNotifications.map((notification) => (
                          <div key={notification.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 dark:text-white">{notification.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {notification.content && notification.content.length > 150
                                    ? notification.content.substring(0, 150) + '...'
                                    : notification.content}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  <span>To: {notification.recipient}</span>
                                  <span>•</span>
                                  <span>{notification.timeAgo || 'Unknown'}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs ${notification.read ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {notification.read ? 'Read' : 'Unread'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                <button
                                  onClick={() => handleView(notification)}
                                  className="btn-secondary text-sm px-3 py-1"
                                >
                                  {tCommon('view', { defaultValue: 'View' })}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TEMPLATES TAB */}
                {activeTab === 'templates' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {t('notificationTemplates', { defaultValue: 'Notification Templates' })}
                      </h2>
                      <button
                        onClick={() => {
                          setEditingTemplate(null)
                          setTemplateForm({ name: '', subject: '', content: '', type: 'custom' })
                          setShowTemplateModal(true)
                        }}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Plus size={18} /> New Template
                      </button>
                    </div>
                    {templates.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <FileText className="mx-auto mb-2" size={48} />
                        <p>No templates found</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((template) => (
                          <div key={template.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 dark:text-white">{template.name}</h3>
                                {template.isDefault && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full mt-1 inline-block">
                                    Default
                                  </span>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Type: {template.type}</p>
                              </div>
                              {!template.isDefault && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditTemplate(template)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                  >
                                    <Edit size={16} className="text-blue-600" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTemplate(template.id)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                  >
                                    <Trash2 size={16} className="text-red-600" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {template.subject || 'No subject'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-3">
                              {template.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* HISTORY TAB - Read notifications */}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {t('activityLog', { defaultValue: 'Notification History' })}
                      </h2>
                    </div>
                    {history.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <History className="mx-auto mb-2" size={48} />
                        <p>No notification history</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {history.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl opacity-75"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="mt-1">
                                  {getCategoryIcon(item.category)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-800 dark:text-white">{item.title}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(item.category)}`}>
                                      {getCategoryLabel(item.category)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {item.content && item.content.length > 150
                                      ? item.content.substring(0, 150) + '...'
                                      : item.content}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                                    <span>From: {item.sender} ({item.senderRole})</span>
                                    <span>•</span>
                                    <span>{item.timeAgo || 'Unknown'}</span>
                                    <span className="text-green-600">✓ Read</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => handleView(item)}
                                  className="btn-secondary text-sm px-3 py-1 flex items-center gap-1"
                                >
                                  <Eye size={14} /> {tCommon('view', { defaultValue: 'View' })}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notification Details Modal */}
      {
        showDetailsModal && selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(selectedNotification.category)}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                      {selectedNotification.title}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {getCategoryLabel(selectedNotification.category)} • {selectedNotification.timeAgo || 'Unknown'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedNotification(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">From</p>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {selectedNotification.sender} ({selectedNotification.senderRole})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Date</p>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {selectedNotification.createdAt ? new Date(selectedNotification.createdAt).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Content</p>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-800 dark:text-white whitespace-pre-wrap">
                        {selectedNotification.content || selectedNotification.message || 'No content available'}
                      </p>
                    </div>
                  </div>
                  {selectedNotification.amount && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        {parseFloat(selectedNotification.amount).toLocaleString()} RWF
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                <div>
                  {!selectedNotification.read && (
                    <button
                      onClick={() => {
                        handleMarkAsRead(selectedNotification.id)
                        setSelectedNotification({ ...selectedNotification, read: true })
                      }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Mark as Read
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false)
                      setSelectedNotification(null)
                    }}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false)
                      setSelectedNotification(null)
                      handleView(selectedNotification)
                    }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Eye size={16} /> Go to Related Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Template Modal */}
      {
        showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="input-field w-full"
                    placeholder="e.g., Contribution Reminder"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    className="input-field w-full"
                    placeholder="Message subject"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={templateForm.type}
                    onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="custom">Custom</option>
                    <option value="contribution_reminder">Contribution Reminder</option>
                    <option value="loan_payment_reminder">Loan Payment Reminder</option>
                    <option value="fine_notification">Fine Notification</option>
                    <option value="general_announcement">General Announcement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Content *
                  </label>
                  <textarea
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                    className="input-field w-full h-32"
                    placeholder="Template content. Use placeholders like [Member Name], [Amount], [Date]..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowTemplateModal(false)
                      setEditingTemplate(null)
                      setTemplateForm({ name: '', subject: '', content: '', type: 'custom' })
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTemplate}
                    className="btn-primary"
                  >
                    {editingTemplate ? 'Update' : 'Create'} Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </Layout >
  )
}

export default SecretaryNotifications
