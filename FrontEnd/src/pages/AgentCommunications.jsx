import { useState, useEffect } from 'react'
import { MessageCircle, Send, Bell, Users, FileText, Calendar, Plus, Eye, Download, Search, Filter, XCircle, CheckCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function AgentCommunications() {
  const { t } = useTranslation('common')
  const { t: tAgent } = useTranslation('agent')
  const [selectedTab, setSelectedTab] = useState('broadcast')
  const [showCreateMessage, setShowCreateMessage] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [showMessageDetails, setShowMessageDetails] = useState(false)
  const [broadcastMessages, setBroadcastMessages] = useState([])
  const [notifications, setNotifications] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedGroupForChat, setSelectedGroupForChat] = useState(null)
  const [selectedChatForExport, setSelectedChatForExport] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [newChatMessage, setNewChatMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalMessages: 0,
    sentMessages: 0,
    receivedMessages: 0,
    unreadMessages: 0,
    unreadNotifications: 0,
    totalGroups: 0,
    groupsMessaged: 0
  })
  const [users, setUsers] = useState([])
  const [chatList, setChatList] = useState([])

  // Fetch summary statistics
  const fetchSummary = async () => {
    try {
      // Get all groups
      const groupsRes = await api.get('/groups', { params: { viewAll: 'true' } })
      const allGroups = groupsRes?.data?.data || []
      
      // Get chat list to find groups/users that messaged the agent
      const chatListRes = await api.get('/chat/list')
      const chats = chatListRes?.data?.data || []
      
      // Get all messages sent and received by agent
      // We'll need to get messages from all chats
      let totalSent = 0
      let totalReceived = 0
      let unreadCount = 0
      const groupsWithMessages = new Set()
      
      for (const chat of chats) {
        try {
          if (chat.type === 'group' && chat.groupId) {
            const messagesRes = await api.get(`/chat/${chat.groupId}`)
            const messages = messagesRes?.data?.data || []
            messages.forEach(msg => {
              if (msg.senderId === chat.currentUserId) {
                totalSent++
              } else {
                totalReceived++
                if (!msg.isRead) unreadCount++
              }
            })
            if (messages.length > 0) {
              groupsWithMessages.add(chat.groupId)
            }
          } else if (chat.type === 'user' && chat.userId) {
            const messagesRes = await api.get(`/chat/user?receiverId=${chat.userId}`)
            const messages = messagesRes?.data?.data || []
            messages.forEach(msg => {
              if (msg.senderId === chat.currentUserId) {
                totalSent++
              } else {
                totalReceived++
                if (!msg.isRead) unreadCount++
              }
            })
          }
        } catch (err) {
          console.error(`Failed to fetch messages for chat ${chat.id}:`, err)
        }
      }
      
      // Get unread notifications
      const notificationsRes = await api.get('/notifications', { params: { read: 'false' } })
      const unreadNotifications = notificationsRes?.data?.data || []
      
      setSummary({
        totalMessages: totalSent + totalReceived,
        sentMessages: totalSent,
        receivedMessages: totalReceived,
        unreadMessages: unreadCount,
        unreadNotifications: unreadNotifications.length,
        totalGroups: allGroups.length,
        groupsMessaged: groupsWithMessages.size
      })
    } catch (err) {
      console.error('Failed to fetch summary:', err)
    }
  }

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

  // Fetch summary on mount
  useEffect(() => {
    fetchSummary()
  }, [])

  // Fetch notifications from database (includes system admin messages)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await api.get('/notifications')
        if (mounted) {
          // Notifications already include all notifications for the logged-in user
          // including those sent by system admin
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

  // Fetch groups and users
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const groupsRes = await api.get('/groups', { params: { viewAll: 'true' } })
        if (mounted) {
          setGroups(groupsRes?.data?.data || [])
        }
        
        // Fetch users for direct messaging
        const usersRes = await api.get('/users', { params: { viewAll: 'true' } })
        if (mounted) {
          setUsers(usersRes?.data?.data || [])
        }
        
        // Fetch chat list
        const chatListRes = await api.get('/chat/list')
        if (mounted) {
          setChatList(chatListRes?.data?.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch groups/users:', err)
        if (mounted) {
          setGroups([])
          setUsers([])
          setChatList([])
        }
      }
    })()
    return () => { mounted = false }
  }, [])

  // Fetch chat messages when a chat is selected
  useEffect(() => {
    if (!selectedGroupForChat) return
    let mounted = true
    ;(async () => {
      try {
        let messagesRes
        if (selectedGroupForChat.type === 'group' && selectedGroupForChat.groupId) {
          messagesRes = await api.get(`/chat/${selectedGroupForChat.groupId}`)
        } else if (selectedGroupForChat.type === 'user' && selectedGroupForChat.userId) {
          messagesRes = await api.get(`/chat/user?receiverId=${selectedGroupForChat.userId}`)
        } else {
          messagesRes = await api.get(`/chat/${selectedGroupForChat.id}`)
        }
        if (mounted) {
          setChatMessages(messagesRes?.data?.data || [])
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
    recipientType: 'all', // 'all', 'group', 'user'
    recipientId: '',
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
    
    if (newMessage.recipientType !== 'all' && !newMessage.recipientId) {
      alert('Please select a recipient.')
      return
    }
    
    try {
      if (newMessage.recipientType === 'user') {
        // Send private message via chat
        await api.post('/chat/user', {
          message: `${newMessage.title}\n\n${newMessage.content}`,
          recipientIds: [parseInt(newMessage.recipientId)]
        })
        
        // Also create a notification for the recipient
        const recipient = users.find(u => u.id === parseInt(newMessage.recipientId))
        if (recipient) {
          await api.post('/notifications', {
            userId: parseInt(newMessage.recipientId),
            type: 'message',
            title: newMessage.title,
            content: newMessage.content,
            channel: 'in_app'
          })
        }
      } else if (newMessage.recipientType === 'group') {
        // Send group announcement
        const announcementData = {
          title: newMessage.title,
          content: newMessage.content,
          groupId: parseInt(newMessage.recipientId),
          priority: newMessage.priority
        }
        await api.post('/announcements', announcementData)
      } else {
        // Send to all groups (broadcast)
        const announcementData = {
          title: newMessage.title,
          content: newMessage.content,
          targetAudience: 'All Groups',
          priority: newMessage.priority
        }
        await api.post('/announcements', announcementData)
      }
      
      // Refresh data
      const { data } = await api.get('/announcements')
      setBroadcastMessages(data?.data || [])
      await fetchSummary()
      setShowCreateMessage(false)
      setNewMessage({
        title: '',
        content: '',
        type: 'announcement',
        priority: 'medium',
        recipientType: 'all',
        recipientId: '',
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
      alert(tAgent('messageSentSuccessfully', { defaultValue: 'Message sent successfully!' }))
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
      if (selectedTab === 'chats' && !selectedChatForExport) {
        alert('Please select a chat to export.')
        return
      }
      
      const XLSX = await import('xlsx')
      let data = []
      let filename = ''
      
      if (selectedTab === 'broadcast') {
        filename = `broadcast_messages_${new Date().toISOString().split('T')[0]}.xlsx`
        data = broadcastMessages.map(msg => ({
          'ID': msg.id,
          'Title': msg.title,
          'Content': msg.content || msg.message || '',
          'Type': msg.type || 'announcement',
          'Priority': msg.priority || 'medium',
          'Status': msg.status || (msg.sentAt ? 'sent' : 'draft'),
          'Target Audience': msg.targetAudience || 'All Groups',
          'Created Date': msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'N/A',
          'Sent Date': msg.sentAt ? new Date(msg.sentAt).toLocaleString() : 'Not sent'
        }))
      } else if (selectedTab === 'notifications') {
        filename = `notifications_${new Date().toISOString().split('T')[0]}.xlsx`
        data = notifications.map(notif => ({
          'ID': notif.id,
          'Title': notif.title || notif.message || 'Notification',
          'Content': notif.content || notif.message || '',
          'Type': notif.type || 'general',
          'Status': notif.read || notif.isRead ? 'Read' : 'Unread',
          'Created Date': notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'N/A'
        }))
      } else if (selectedTab === 'chats' && selectedChatForExport) {
        const chatName = selectedChatForExport.type === 'group' 
          ? selectedChatForExport.groupName 
          : selectedChatForExport.userName || `Chat_${selectedChatForExport.id}`
        filename = `chat_history_${chatName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
        data = chatMessages.map(msg => ({
          'ID': msg.id,
          'Sender': msg.sender?.name || 'Unknown',
          'Message': msg.message || '',
          'Type': msg.type || 'text',
          'Read': msg.isRead ? 'Yes' : 'No',
          'Date': msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'N/A'
        }))
      }
      
      if (data.length === 0) {
        alert('No data to export.')
        return
      }
      
      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
      
      // Generate Excel file
      XLSX.writeFile(workbook, filename)
      alert('Export completed successfully!')
    } catch (err) {
      console.error('Failed to export:', err)
      alert('Failed to export data. Make sure to select a chat if exporting chat history.')
    }
  }

  const handleSendChatMessage = async () => {
    if (!newChatMessage.trim() || !selectedGroupForChat) {
      alert('Please enter a message.')
      return
    }
    try {
      if (selectedGroupForChat.type === 'group' && selectedGroupForChat.groupId) {
        await api.post(`/chat/${selectedGroupForChat.groupId}`, { message: newChatMessage })
      } else if (selectedGroupForChat.type === 'user' && selectedGroupForChat.userId) {
        await api.post('/chat/user', {
          message: newChatMessage,
          recipientIds: [selectedGroupForChat.userId]
        })
      } else {
        await api.post(`/chat/${selectedGroupForChat.id}`, { message: newChatMessage })
      }
      setNewChatMessage('')
      // Refresh chat messages
      if (selectedGroupForChat.type === 'group' && selectedGroupForChat.groupId) {
        const { data } = await api.get(`/chat/${selectedGroupForChat.groupId}`)
        setChatMessages(data?.data || [])
      } else if (selectedGroupForChat.type === 'user' && selectedGroupForChat.userId) {
        const { data } = await api.get(`/chat/user?receiverId=${selectedGroupForChat.userId}`)
        setChatMessages(data?.data || [])
      }
      await fetchSummary()
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
                <p className="text-2xl font-bold text-gray-800">{summary.totalMessages}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Sent: {summary.sentMessages} • Received: {summary.receivedMessages}
                </p>
              </div>
              <MessageCircle className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Unread Messages & Notifications</p>
                <p className="text-2xl font-bold text-red-600">
                  {summary.unreadMessages + summary.unreadNotifications}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Messages: {summary.unreadMessages} • Notifications: {summary.unreadNotifications}
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
                  {summary.totalGroups}
                </p>
              </div>
              <Users className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Groups That Messaged</p>
                <p className="text-2xl font-bold text-purple-600">
                  {summary.groupsMessaged}
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
                  <h2 className="text-xl font-bold text-gray-800">Chats</h2>
                  {selectedChatForExport && (
                    <button
                      onClick={handleExportMessages}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Download size={18} /> Export Selected Chat
                    </button>
                  )}
                </div>

                {!selectedGroupForChat ? (
                  <div>
                    <p className="text-gray-600 mb-4">Select a chat to view messages:</p>
                    {chatList.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No chats available. Start a conversation to see chats here.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {chatList.map((chat) => (
                          <button
                            key={chat.id}
                            onClick={() => {
                              setSelectedGroupForChat(chat)
                              setSelectedChatForExport(chat)
                            }}
                            className={`p-4 rounded-xl hover:bg-white transition-colors text-left border-2 ${
                              selectedChatForExport?.id === chat.id 
                                ? 'border-primary-500 bg-primary-50' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <h3 className="font-bold text-gray-800">
                              {chat.type === 'group' ? chat.groupName : chat.userName}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {chat.type === 'group' ? 'Group Chat' : 'Direct Message'}
                            </p>
                            {chat.lastMessage && (
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {chat.lastMessage}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h3 className="font-bold text-gray-800">
                          {selectedGroupForChat.type === 'group' ? selectedGroupForChat.groupName : selectedGroupForChat.userName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedGroupForChat.type === 'group' ? 'Group Chat' : 'Direct Message'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedChatForExport(selectedGroupForChat)
                            handleExportMessages()
                          }}
                          className="btn-secondary text-sm flex items-center gap-2"
                        >
                          <Download size={16} /> Export
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGroupForChat(null)
                            setSelectedChatForExport(null)
                          }}
                          className="btn-secondary text-sm"
                        >
                          Back to Chats
                        </button>
                      </div>
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
                      Send To
                    </label>
                    <select
                      value={newMessage.recipientType}
                      onChange={(e) => setNewMessage({ ...newMessage, recipientType: e.target.value, recipientId: '' })}
                      className="input-field"
                    >
                      <option value="all">All Groups (Broadcast)</option>
                      <option value="group">Specific Group</option>
                      <option value="user">Specific User</option>
                    </select>
                  </div>
                  {(newMessage.recipientType === 'group' || newMessage.recipientType === 'user') && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {newMessage.recipientType === 'group' ? 'Select Group' : 'Select User'}
                      </label>
                      <select
                        value={newMessage.recipientId}
                        onChange={(e) => setNewMessage({ ...newMessage, recipientId: e.target.value })}
                        className="input-field"
                      >
                        <option value="">Select {newMessage.recipientType === 'group' ? 'Group' : 'User'}</option>
                        {newMessage.recipientType === 'group' ? (
                          groups.map(group => (
                            <option key={group.id} value={group.id}>{group.name}</option>
                          ))
                        ) : (
                          users.map(user => (
                            <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                          ))
                        )}
                      </select>
                    </div>
                  )}
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
