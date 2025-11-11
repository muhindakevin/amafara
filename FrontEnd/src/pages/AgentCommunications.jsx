import { useState, useEffect } from 'react'
import { MessageCircle, Send, Bell, Users, FileText, Calendar, Plus, Eye, Download, Search, Filter, XCircle, CheckCircle } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function AgentCommunications() {
  const [selectedTab, setSelectedTab] = useState('broadcast')
  const [showCreateMessage, setShowCreateMessage] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [showMessageDetails, setShowMessageDetails] = useState(false)
  const [broadcastMessages, setBroadcastMessages] = useState([])
  const [notifications, setNotifications] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedGroupForChat, setSelectedGroupForChat] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [newChatMessage, setNewChatMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // Fetch announcements from database
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/announcements')
        if (mounted) {
          setBroadcastMessages(data?.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch announcements:', err)
        if (mounted) {
          setBroadcastMessages([])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Fetch notifications from database
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await api.get('/notifications')
        if (mounted) {
          setNotifications(data?.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
        if (mounted) {
          setNotifications([])
        }
      }
    })()
    return () => { mounted = false }
  }, [])

  // Fetch groups
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await api.get('/groups')
        if (mounted) {
          setGroups(data?.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch groups:', err)
        if (mounted) {
          setGroups([])
        }
      }
    })()
    return () => { mounted = false }
  }, [])

  // Fetch chat messages when a group is selected
  useEffect(() => {
    if (!selectedGroupForChat) return
    let mounted = true
    ;(async () => {
      try {
        const { data } = await api.get(`/chat/${selectedGroupForChat.id}`)
        if (mounted) {
          setChatMessages(data?.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch chat messages:', err)
        if (mounted) {
          setChatMessages([])
        }
      }
    })()
    return () => { mounted = false }
  }, [selectedGroupForChat])

  const [newMessage, setNewMessage] = useState({
    title: '',
    content: '',
    type: 'announcement',
    priority: 'medium',
    recipients: 'all',
    scheduledDate: '',
    attachments: []
  })

  const getTypeColor = (type) => {
    switch (type) {
      case 'policy_update': return 'bg-blue-100 text-blue-700'
      case 'reminder': return 'bg-yellow-100 text-yellow-700'
      case 'report': return 'bg-green-100 text-green-700'
      case 'announcement': return 'bg-purple-100 text-purple-700'
      case 'new_group': return 'bg-green-100 text-green-700'
      case 'member_suspended': return 'bg-red-100 text-red-700'
      case 'financial_anomaly': return 'bg-red-100 text-red-700'
      case 'compliance_alert': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-700'
      case 'draft': return 'bg-yellow-100 text-yellow-700'
      case 'scheduled': return 'bg-blue-100 text-blue-700'
      case 'unread': return 'bg-red-100 text-red-700'
      case 'read': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleCreateMessage = async () => {
    if (!newMessage.title || !newMessage.content) {
      alert('Please fill in title and content.')
      return
    }
    try {
      const announcementData = {
        title: newMessage.title,
        content: newMessage.content,
        targetAudience: newMessage.recipients === 'all' ? 'All Groups' : newMessage.recipients,
        priority: newMessage.priority
      }
      await api.post('/announcements', announcementData)
      // Refresh announcements
      const { data } = await api.get('/announcements')
      setBroadcastMessages(data?.data || [])
      setShowCreateMessage(false)
      setNewMessage({
        title: '',
        content: '',
        type: 'announcement',
        priority: 'medium',
        recipients: 'all',
        scheduledDate: '',
        attachments: []
      })
      alert('Message created successfully!')
    } catch (err) {
      console.error('Failed to create message:', err)
      alert(err?.response?.data?.message || 'Failed to create message')
    }
  }

  const handleViewMessageDetails = (message) => {
    setSelectedMessage(message)
    setShowMessageDetails(true)
  }

  const handleSendMessage = async (messageId) => {
    try {
      await api.put(`/announcements/${messageId}/send`)
      // Refresh announcements
      const { data } = await api.get('/announcements')
      setBroadcastMessages(data?.data || [])
      alert('Message sent successfully!')
    } catch (err) {
      console.error('Failed to send message:', err)
      alert(err?.response?.data?.message || 'Failed to send message')
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      // Refresh notifications
      const { data } = await api.get('/notifications')
      setNotifications(data?.data || [])
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleTakeAction = (notificationId, action) => {
    console.log('Taking action:', action, 'for notification:', notificationId)
    alert(`Action "${action}" initiated successfully!`)
  }

  const handleExportMessages = async () => {
    try {
      let exportData = ''
      if (selectedTab === 'broadcast') {
        exportData = 'BROADCAST MESSAGES EXPORT\n' + '='.repeat(50) + '\n\n'
        broadcastMessages.forEach((msg, index) => {
          exportData += `${index + 1}. ${msg.title}\n`
          exportData += `   Content: ${msg.content || msg.message || ''}\n`
          exportData += `   Type: ${msg.type || 'N/A'}\n`
          exportData += `   Status: ${msg.status || 'N/A'}\n`
          exportData += `   Date: ${msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'N/A'}\n\n`
        })
      } else if (selectedTab === 'notifications') {
        exportData = 'NOTIFICATIONS EXPORT\n' + '='.repeat(50) + '\n\n'
        notifications.forEach((notif, index) => {
          exportData += `${index + 1}. ${notif.title || notif.message}\n`
          exportData += `   Message: ${notif.message || ''}\n`
          exportData += `   Type: ${notif.type || 'N/A'}\n`
          exportData += `   Status: ${notif.isRead ? 'Read' : 'Unread'}\n`
          exportData += `   Date: ${notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'N/A'}\n\n`
        })
      }

      const blob = new Blob([exportData], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedTab}_export_${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      alert('Export completed successfully!')
    } catch (err) {
      console.error('Failed to export:', err)
      alert('Failed to export data')
    }
  }

  const handleSendChatMessage = async () => {
    if (!newChatMessage.trim() || !selectedGroupForChat) {
      alert('Please enter a message.')
      return
    }
    try {
      await api.post(`/chat/${selectedGroupForChat.id}`, { message: newChatMessage })
      setNewChatMessage('')
      // Refresh chat messages
      const { data } = await api.get(`/chat/${selectedGroupForChat.id}`)
      setChatMessages(data?.data || [])
    } catch (err) {
      console.error('Failed to send chat message:', err)
      alert(err?.response?.data?.message || 'Failed to send message')
    }
  }

  return (
    <Layout userRole="Agent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Communication & Notifications</h1>
            <p className="text-gray-600 mt-1">Communicate with groups and manage notifications</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateMessage(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> Create Message
            </button>
            <button
              onClick={handleExportMessages}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} /> Export
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Messages</p>
                <p className="text-2xl font-bold text-gray-800">{broadcastMessages.length}</p>
              </div>
              <MessageCircle className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Unread Notifications</p>
                <p className="text-2xl font-bold text-red-600">
                  {notifications.filter(n => n.status === 'unread').length}
                </p>
              </div>
              <Bell className="text-red-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Groups</p>
                <p className="text-2xl font-bold text-green-600">
                  {groups.length}
                </p>
              </div>
              <Users className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Groups</p>
                <p className="text-2xl font-bold text-purple-600">
                  {groups.length}
                </p>
              </div>
              <Send className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['broadcast', 'notifications', 'chats'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    selectedTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {selectedTab === 'broadcast' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Broadcast Messages</h2>
                  <button
                    onClick={() => setShowCreateMessage(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus size={18} /> New Message
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading messages...</div>
                ) : broadcastMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No broadcast messages. Create a new message to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {broadcastMessages.map((message) => (
                    <div
                      key={message.id}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800">{message.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{message.content}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            ID: {message.id} • {message.sentAt ? `Sent: ${new Date(message.sentAt).toLocaleDateString()}` : message.createdAt ? `Created: ${new Date(message.createdAt).toLocaleDateString()}` : 'Draft'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(message.type || 'announcement')}`}>
                            {message.type || 'announcement'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(message.priority || 'medium')}`}>
                            {message.priority || 'medium'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(message.status || 'draft')}`}>
                            {message.status || message.sentAt ? 'sent' : 'draft'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-600">Target Audience</p>
                          <p className="font-semibold">{message.targetAudience || 'All Groups'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Created</p>
                          <p className="font-semibold">{message.createdAt ? new Date(message.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Sent</p>
                          <p className="font-semibold">{message.sentAt ? new Date(message.sentAt).toLocaleDateString() : 'Not sent'}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewMessageDetails(message)}
                          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <Eye size={16} /> View Details
                        </button>
                        {(!message.sentAt || message.status === 'draft') && (
                          <button
                            onClick={() => handleSendMessage(message.id)}
                            className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <Send size={16} /> Send Now
                          </button>
                        )}
                        <button className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                          <Download size={16} /> Export
                        </button>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">
                    System Notifications ({notifications.filter(n => !n.isRead).length} unread)
                  </h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          await Promise.all(notifications.filter(n => !n.isRead).map(n => 
                            api.put(`/notifications/${n.id}/read`)
                          ))
                          const { data } = await api.get('/notifications')
                          setNotifications(data?.data || [])
                        } catch (err) {
                          console.error('Failed to mark all as read:', err)
                        }
                      }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <CheckCircle size={18} /> Mark All Read
                    </button>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No notifications. Notifications will appear here as system events occur.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-xl transition-colors ${
                          !notification.isRead 
                            ? 'bg-red-50 border border-red-200' 
                            : 'bg-gray-50 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-800">{notification.title || notification.message}</h3>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(notification.type || 'general')}`}>
                              {notification.type?.replace('_', ' ') || 'general'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(notification.isRead ? 'read' : 'unread')}`}>
                              {notification.isRead ? 'read' : 'unread'}
                            </span>
                          </div>
                        </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewMessageDetails(notification)}
                          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <Eye size={16} /> View Details
                        </button>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <CheckCircle size={16} /> Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'chats' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Group Chats</h2>
                </div>

                {!selectedGroupForChat ? (
                  <div>
                    <p className="text-gray-600 mb-4">Select a group to start chatting:</p>
                    {groups.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No groups available. Groups will appear here once registered.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groups.map((group) => (
                          <button
                            key={group.id}
                            onClick={() => setSelectedGroupForChat(group)}
                            className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors text-left"
                          >
                            <h3 className="font-bold text-gray-800">{group.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">Click to start chatting</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h3 className="font-bold text-gray-800">{selectedGroupForChat.name}</h3>
                        <p className="text-sm text-gray-600">Chat with group members</p>
                      </div>
                      <button
                        onClick={() => setSelectedGroupForChat(null)}
                        className="btn-secondary text-sm"
                      >
                        Back to Groups
                      </button>
                    </div>

                    <div className="h-96 overflow-y-auto border border-gray-200 rounded-xl p-4 space-y-4">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-lg ${
                              msg.userId ? 'bg-blue-50 ml-auto max-w-xs' : 'bg-gray-100 mr-auto max-w-xs'
                            }`}
                          >
                            <p className="text-sm font-semibold text-gray-700">
                              {msg.user?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-800">{msg.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newChatMessage}
                        onChange={(e) => setNewChatMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSendChatMessage()
                          }
                        }}
                        placeholder="Type your message..."
                        className="input-field flex-1"
                      />
                      <button
                        onClick={handleSendChatMessage}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Send size={18} /> Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create Message Modal */}
        {showCreateMessage && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Create Broadcast Message</h2>
                <button
                  onClick={() => setShowCreateMessage(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message Title
                    </label>
                    <input
                      type="text"
                      value={newMessage.title}
                      onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                      className="input-field"
                      placeholder="Enter message title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message Type
                    </label>
                    <select
                      value={newMessage.type}
                      onChange={(e) => setNewMessage({ ...newMessage, type: e.target.value })}
                      className="input-field"
                    >
                      <option value="announcement">Announcement</option>
                      <option value="policy_update">Policy Update</option>
                      <option value="reminder">Reminder</option>
                      <option value="report">Report</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={newMessage.priority}
                      onChange={(e) => setNewMessage({ ...newMessage, priority: e.target.value })}
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
                      value={newMessage.recipients}
                      onChange={(e) => setNewMessage({ ...newMessage, recipients: e.target.value })}
                      className="input-field"
                    >
                      <option value="all">All Groups</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Schedule Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={newMessage.scheduledDate}
                      onChange={(e) => setNewMessage({ ...newMessage, scheduledDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message Content
                  </label>
                  <textarea
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                    className="input-field h-32 resize-none"
                    placeholder="Enter your message content..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateMessage(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateMessage}
                    className="btn-primary flex-1"
                  >
                    {newMessage.scheduledDate ? 'Schedule Message' : 'Send Message'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message Details Modal */}
        {showMessageDetails && selectedMessage && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Message Details</h2>
                <button
                  onClick={() => setShowMessageDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                    {selectedMessage.id}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedMessage.title}</h3>
                    <p className="text-gray-600">{selectedMessage.type.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-500">Message ID: {selectedMessage.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Message Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(selectedMessage.type)}`}>
                          {selectedMessage.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Priority:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedMessage.priority)}`}>
                          {selectedMessage.priority}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedMessage.status)}`}>
                          {selectedMessage.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sent Date:</span>
                        <span className="font-semibold">{selectedMessage.sentDate || 'Not sent'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Delivery Statistics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Recipients:</span>
                        <span className="font-semibold">{selectedMessage.recipients}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Read Count:</span>
                        <span className="font-semibold">{selectedMessage.readCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Read Rate:</span>
                        <span className="font-semibold">
                          {selectedMessage.recipients > 0 ? Math.round((selectedMessage.readCount / selectedMessage.recipients) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Attachments:</span>
                        <span className="font-semibold">{selectedMessage.attachments.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800">Message Content</h4>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-700">{selectedMessage.content}</p>
                  </div>
                </div>

                {selectedMessage.attachments.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Attachments</h4>
                    <div className="space-y-2">
                      {selectedMessage.attachments.map((attachment, index) => (
                        <div key={index} className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                          <p className="text-sm text-blue-700">{attachment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowMessageDetails(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  <button className="btn-primary flex-1">
                    Export Message
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

export default AgentCommunications
