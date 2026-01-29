import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, MessageCircle, Users, Mail, Phone, Clock, CheckCircle, XCircle, AlertCircle, Send, DollarSign, Loader2, Edit2, Save, Trash2, FileText } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function CashierNotifications() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tCashier } = useTranslation('cashier')
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('inbox')
  const [showCompose, setShowCompose] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [messages, setMessages] = useState([])
  const [sentNotifications, setSentNotifications] = useState([])
  const [members, setMembers] = useState([])
  const [groupId, setGroupId] = useState(null)
  const [overdueMembers, setOverdueMembers] = useState([])
  const [templates, setTemplates] = useState([])
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [showTemplateSend, setShowTemplateSend] = useState(null)

  // Format time relative to now
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  // Fetch notifications
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/notifications')
        if (mounted && data?.success) {
          setNotifications(data.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
        if (mounted) setNotifications([])
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Fetch recent messages from all group members (not just unread)
  useEffect(() => {
    let mounted = true
    const fetchMessages = async () => {
      try {
        const meRes = await api.get('/auth/me')
        const userId = meRes.data?.data?.id
        if (!userId || !mounted) return

        // Get chat list to find all private conversations
        const chatListRes = await api.get('/chat/list')
        if (chatListRes.data?.success && mounted) {
          const chatList = chatListRes.data.data || []
          const privateChats = chatList.filter(chat => chat.type === 'private')
          
          // Fetch last message from each conversation
          const allMessages = []
          for (const chat of privateChats) {
            if (chat.receiverId) {
              try {
                let messagesRes
                try {
                  messagesRes = await api.get(`/chat/user`, { params: { receiverId: chat.receiverId } })
                } catch (err) {
                  messagesRes = await api.get(`/chat/user?receiverId=${chat.receiverId}`)
                }
                
                if (messagesRes.data?.success && mounted) {
                  const chatMessages = messagesRes.data.data || []
                  // Get the most recent message (last in array since they're sorted ASC)
                  const lastMessage = chatMessages[chatMessages.length - 1]
                  
                  if (lastMessage) {
                    const senderInfo = chatList.find(c => c.receiverId === chat.receiverId)
                    // Determine if message is from or to cashier
                    const isFromCashier = lastMessage.senderId === userId
                    allMessages.push({
                      id: lastMessage.id,
                      from: isFromCashier ? 'You' : (senderInfo?.name || 'Unknown'),
                      phone: senderInfo?.phone || '',
                      message: lastMessage.message,
                      time: lastMessage.createdAt,
                      status: lastMessage.isRead ? 'read' : 'unread',
                      type: 'general',
                      senderId: lastMessage.senderId,
                      receiverId: chat.receiverId,
                      isFromCashier
                    })
                  }
                }
              } catch (err) {
                console.error(`Failed to fetch messages for chat ${chat.receiverId}:`, err)
              }
            }
          }
          
          // Sort by time (most recent first) and filter to only show messages TO cashier
          const receivedMessages = allMessages
            .filter(m => !m.isFromCashier) // Only show messages received by cashier
            .sort((a, b) => new Date(b.time) - new Date(a.time))
          if (mounted) setMessages(receivedMessages)
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err)
        if (mounted) setMessages([])
      }
    }
    
    fetchMessages()
    
    // Refresh messages every 30 seconds
    const interval = setInterval(() => {
      if (mounted && activeTab === 'messages') {
        fetchMessages()
      }
    }, 30000)
    
    return () => { 
      mounted = false
      clearInterval(interval)
    }
  }, [activeTab])

  // Fetch sent notifications
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await api.get('/notifications/sent')
        if (mounted && data?.success) {
          setSentNotifications(data.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch sent notifications:', err)
        if (mounted) setSentNotifications([])
      }
    })()
    return () => { mounted = false }
  }, [])

  // Fetch message templates
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await api.get('/message-templates')
        if (mounted && data?.success) {
          setTemplates(data.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch templates:', err)
        if (mounted) setTemplates([])
      }
    })()
    return () => { mounted = false }
  }, [])

  // Fetch members for compose message
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const meRes = await api.get('/auth/me')
        const gid = meRes.data?.data?.groupId
        if (!gid || !mounted) return
        
        setGroupId(gid)
        // Fetch ALL members (all roles and statuses) using allMembers=true parameter
        const membersRes = await api.get(`/groups/${gid}/members`, { params: { allMembers: 'true' } })
        if (mounted && membersRes.data?.success) {
          setMembers(membersRes.data.data || [])
          console.log(`[CashierNotifications] Loaded ${membersRes.data.data?.length || 0} members`)
        }

        // Also fetch overdue members for reminders
        try {
          const loansRes = await api.get('/loans')
          if (loansRes.data?.success && mounted) {
            const allLoans = loansRes.data.data || []
            const overdue = allLoans.filter(loan => {
              if (!loan.dueDate) return false
              const dueDate = new Date(loan.dueDate)
              const now = new Date()
              return dueDate < now && loan.status === 'active' && loan.remainingAmount > 0
            })
            
            // Get unique member IDs and their info from loans
            const overdueMemberMap = new Map()
            overdue.forEach(loan => {
              if (loan.member && !overdueMemberMap.has(loan.memberId)) {
                overdueMemberMap.set(loan.memberId, loan.member)
              }
            })
            
            if (mounted) setOverdueMembers(Array.from(overdueMemberMap.values()))
          }
        } catch (err) {
          console.error('Failed to fetch overdue members:', err)
        }
      } catch (err) {
        console.error('Failed to fetch members:', err)
        if (mounted) setMembers([])
      }
    })()
    return () => { mounted = false }
  }, [])

  const [composeMessage, setComposeMessage] = useState({
    to: '',
    subject: '',
    message: '',
    type: 'general'
  })
  const [selectedMembers, setSelectedMembers] = useState([])

  // Get priority from notification type
  const getPriorityFromType = (type) => {
    if (['loan_rejection', 'fine_issued'].includes(type)) return 'high'
    if (['contribution_confirmation', 'loan_approval', 'announcement'].includes(type)) return 'medium'
    return 'low'
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'contribution_confirmation': return <DollarSign className="text-green-600 dark:text-green-400" size={20} />
      case 'loan_approval': return <CheckCircle className="text-blue-600 dark:text-blue-400" size={20} />
      case 'loan_rejection': return <XCircle className="text-red-600 dark:text-red-400" size={20} />
      case 'fine_issued': return <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
      case 'announcement': return <Bell className="text-blue-600 dark:text-blue-400" size={20} />
      case 'chat_message': return <MessageCircle className="text-purple-600 dark:text-purple-400" size={20} />
      default: return <Bell className="text-gray-600 dark:text-gray-400" size={20} />
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
      ))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
      alert('Failed to mark notification as read')
    }
  }

  const handleMarkMessageAsRead = async (messageId, senderId) => {
    try {
      // Mark chat message as read by fetching the conversation (this automatically marks as read)
      try {
        await api.get(`/chat/user`, { params: { receiverId: senderId } })
      } catch (err) {
        // Try alternative format
        await api.get(`/chat/user?receiverId=${senderId}`)
      }
      
      // Refresh messages list
      const meRes = await api.get('/auth/me')
      const userId = meRes.data?.data?.id
      const chatListRes = await api.get('/chat/list')
      if (chatListRes.data?.success) {
        const chatList = chatListRes.data.data || []
        const privateChats = chatList.filter(chat => chat.type === 'private' && chat.unread > 0)
        const allMessages = []
        
        for (const chat of privateChats) {
          if (chat.receiverId) {
            try {
              let messagesRes
              try {
                messagesRes = await api.get(`/chat/user`, { params: { receiverId: chat.receiverId } })
              } catch (err) {
                messagesRes = await api.get(`/chat/user?receiverId=${chat.receiverId}`)
              }
              
              if (messagesRes.data?.success) {
                const chatMessages = messagesRes.data.data || []
                const senderInfo = chatList.find(c => c.receiverId === chat.receiverId)
                chatMessages.forEach(msg => {
                  if (msg.senderId !== userId && !msg.isRead) {
                    allMessages.push({
                      id: msg.id,
                      from: senderInfo?.name || 'Unknown',
                      phone: senderInfo?.phone || '',
                      message: msg.message,
                      time: msg.createdAt,
                      status: msg.isRead ? 'read' : 'unread',
                      type: 'general',
                      senderId: msg.senderId
                    })
                  }
                })
              }
            } catch (err) {
              console.error(`Failed to fetch messages for chat ${chat.receiverId}:`, err)
            }
          }
        }
        allMessages.sort((a, b) => new Date(b.time) - new Date(a.time))
        setMessages(allMessages)
      }
    } catch (err) {
      console.error('Failed to mark message as read:', err)
    }
  }

  const handleSendMessage = async () => {
    if (selectedMembers.length === 0) {
      alert('Please select at least one member')
      return
    }

    if (!composeMessage.subject || !composeMessage.message) {
      alert('Please fill in subject and message')
      return
    }

    try {
      const userIds = selectedMembers.map(id => parseInt(id))

      if (userIds.length === 0) {
        alert('No recipients selected')
        return
      }

      // Send bulk notifications
      await api.post('/notifications/bulk', {
        userIds,
        type: composeMessage.type === 'announcement' ? 'announcement' : 'general',
        title: composeMessage.subject,
        content: composeMessage.message,
        channel: 'in_app'
      })

      alert(`Message sent successfully to ${userIds.length} member(s)!`)
      setShowCompose(false)
      setComposeMessage({
        to: '',
        subject: '',
        message: '',
        type: 'general'
      })
      setSelectedMembers([])
      
      // Refresh sent notifications and inbox
      const [sentRes, inboxRes] = await Promise.all([
        api.get('/notifications/sent'),
        api.get('/notifications')
      ])
      if (sentRes.data?.success) {
        setSentNotifications(sentRes.data.data || [])
      }
      if (inboxRes.data?.success) {
        setNotifications(inboxRes.data.data || [])
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      alert('Failed to send message: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleToggleMember = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId)
      } else {
        return [...prev, memberId]
      }
    })
  }

  const handleSelectAllMembers = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(members.map(m => m.id.toString()))
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read)
      if (unreadNotifications.length === 0) {
        alert('No unread notifications')
        return
      }

      // Mark all unread notifications as read
      await Promise.all(
        unreadNotifications.map(n => api.put(`/notifications/${n.id}/read`))
      )

      // Update local state
      setNotifications(prev => prev.map(n => 
        !n.read ? { ...n, read: true, readAt: new Date().toISOString() } : n
      ))

      alert(`Marked ${unreadNotifications.length} notification(s) as read`)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      alert('Failed to mark all notifications as read')
    }
  }

  const handleSendBulkReminder = async () => {
    if (overdueMembers.length === 0) {
      alert('No members with overdue payments found')
      return
    }

    if (!confirm(`Send payment reminders to ${overdueMembers.length} members with overdue payments?`)) {
      return
    }

    try {
      const userIds = overdueMembers.map(m => m.id)
      
      // Get overdue loan details
      const loansRes = await api.get('/loans')
      if (loansRes.data?.success) {
        const allLoans = loansRes.data.data || []
        const now = new Date()
        
        for (const member of overdueMembers) {
          const memberLoans = allLoans.filter(l => 
            l.memberId === member.id && 
            l.status === 'active' && 
            l.remainingAmount > 0 &&
            l.dueDate && new Date(l.dueDate) < now
          )
          
          if (memberLoans.length > 0) {
            const totalOverdue = memberLoans.reduce((sum, l) => sum + parseFloat(l.remainingAmount || 0), 0)
            const oldestDueDate = memberLoans.reduce((oldest, l) => {
              const dueDate = new Date(l.dueDate)
              return !oldest || dueDate < oldest ? dueDate : oldest
            }, null)
            
            await api.post('/notifications', {
              userId: member.id,
              type: 'general',
              title: 'Overdue Payment Reminder',
              content: `Dear ${member.name}, you have an overdue loan payment of ${totalOverdue.toLocaleString()} RWF. The payment was due on ${oldestDueDate.toLocaleDateString()}. Please make your payment as soon as possible to avoid additional charges.`,
              channel: 'in_app'
            })
          }
        }
      }

      alert(`Reminders sent to ${overdueMembers.length} members!`)
      
      // Refresh sent notifications
      const { data } = await api.get('/notifications/sent')
      if (data?.success) {
        setSentNotifications(data.data || [])
      }
    } catch (err) {
      console.error('Failed to send reminders:', err)
      alert('Failed to send reminders: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleUseTemplate = (template) => {
    setComposeMessage({
      ...composeMessage,
      message: template,
      subject: template.split('\n')[0].replace(/["']/g, '') || 'Message'
    })
    setShowCompose(true)
  }

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{tCashier('notificationsAndCommunication', { defaultValue: 'Notifications & Communication' })}</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{tCashier('manageNotificationsAndCommunicate', { defaultValue: 'Manage notifications and communicate with members' })}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCompose(true)}
              className="btn-primary flex items-center gap-2"
            >
              <MessageCircle size={18} /> {t('composeMessage', { defaultValue: 'Compose Message' })}
            </button>
            <button
              onClick={handleSendBulkReminder}
              className="btn-secondary flex items-center gap-2"
            >
              <Bell size={18} /> {t('sendReminders', { defaultValue: 'Send Reminders' })}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Unread Notifications</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {loading ? <Loader2 className="animate-spin" size={24} /> : notifications.filter(n => !n.read).length}
                </p>
              </div>
              <Bell className="text-blue-600 dark:text-blue-400" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Unread Messages</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {messages.filter(m => m.status === 'unread').length}
                </p>
              </div>
              <MessageCircle className="text-green-600 dark:text-green-400" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">High Priority</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {notifications.filter(n => getPriorityFromType(n.type) === 'high').length}
                </p>
              </div>
              <AlertCircle className="text-red-600 dark:text-red-400" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Messages</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {messages.length}
                </p>
              </div>
              <Mail className="text-purple-600 dark:text-purple-400" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['inbox', 'messages', 'sent', 'templates'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab
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
            {activeTab === 'inbox' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Notifications</h2>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Mark All as Read
                    </button>
                  )}
                </div>
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin text-primary-600" size={32} />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Bell className="mx-auto mb-2" size={48} />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl border transition-colors ${
                        !notification.read 
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                          : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(notification.type)}
                          <h3 className="font-semibold text-gray-800 dark:text-white">{notification.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(getPriorityFromType(notification.type))}`}>
                            {getPriorityFromType(notification.type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{formatTimeAgo(notification.createdAt)}</span>
                          {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Mark as read"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 whitespace-pre-line">{notification.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Messages from Members</h2>
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageCircle className="mx-auto mb-2" size={48} />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => {
                        // Navigate to chat with this member
                        const userId = message.receiverId || message.senderId
                        if (userId) {
                          navigate(`/cashier/chat?userId=${userId}`)
                        }
                      }}
                      className={`p-4 rounded-xl border transition-colors cursor-pointer hover:shadow-md ${
                        message.status === 'unread' 
                          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                          : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {message.from[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">{message.from}</h3>
                            {message.phone && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">{message.phone}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{formatTimeAgo(message.time)}</span>
                          {message.status === 'unread' && (
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{message.message}</p>
                      <p className="text-xs text-primary-600 dark:text-primary-400 mt-2">Click to open chat and respond</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'sent' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Sent Messages</h2>
                {sentNotifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Mail className="mx-auto mb-2" size={48} />
                  <p>No sent messages yet</p>
                  <p className="text-sm">Messages you send will appear here</p>
                </div>
                ) : (
                  sentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 rounded-xl border bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(notification.type)}
                          <h3 className="font-semibold text-gray-800 dark:text-white">{notification.title}</h3>
                          {notification.user && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                              To: {notification.user.name || `User ${notification.userId}`}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatTimeAgo(notification.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{notification.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Message Templates</h2>
                  <button
                    onClick={() => {
                      setEditingTemplate({
                        id: null,
                        name: '',
                        subject: '',
                        content: '',
                        type: 'custom'
                      })
                    }}
                    className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <MessageCircle size={16} /> New Template
                  </button>
                </div>
                
                {/* New Template Form */}
                {editingTemplate && editingTemplate.id === null && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Create New Template</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingTemplate.name}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                        className="input-field text-sm font-semibold"
                        placeholder="Template name"
                      />
                      <input
                        type="text"
                        value={editingTemplate.subject}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                        className="input-field text-sm"
                        placeholder="Subject"
                      />
                      <textarea
                        value={editingTemplate.content}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                        className="input-field text-sm h-24 resize-none"
                        placeholder="Template content"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              if (!editingTemplate.name || !editingTemplate.content) {
                                alert('Please fill in name and content')
                                return
                              }
                              await api.post('/message-templates', editingTemplate)
                              const { data } = await api.get('/message-templates')
                              if (data?.success) setTemplates(data.data || [])
                              setEditingTemplate(null)
                              alert('Template created!')
                            } catch (err) {
                              alert('Failed to create template: ' + (err.response?.data?.message || err.message))
                            }
                          }}
                          className="btn-primary text-sm px-3 py-1 flex items-center gap-1"
                        >
                          <Save size={14} /> Save Template
                        </button>
                        <button
                          onClick={() => setEditingTemplate(null)}
                          className="btn-secondary text-sm px-3 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {templates.length === 0 && !editingTemplate ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FileText className="mx-auto mb-2" size={48} />
                    <p>No templates yet. Create your first template!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <div key={template.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        {editingTemplate?.id === template.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editingTemplate.name}
                              onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                              className="input-field text-sm font-semibold"
                              placeholder="Template name"
                            />
                            <input
                              type="text"
                              value={editingTemplate.subject}
                              onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                              className="input-field text-sm"
                              placeholder="Subject"
                            />
                            <textarea
                              value={editingTemplate.content}
                              onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                              className="input-field text-sm h-24 resize-none"
                              placeholder="Template content"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    if (template.id) {
                                      await api.put(`/message-templates/${template.id}`, editingTemplate)
                                    } else {
                                      await api.post('/message-templates', editingTemplate)
                                    }
                                    const { data } = await api.get('/message-templates')
                                    if (data?.success) setTemplates(data.data || [])
                                    setEditingTemplate(null)
                                    alert('Template saved!')
                                  } catch (err) {
                                    alert('Failed to save template: ' + (err.response?.data?.message || err.message))
                                  }
                                }}
                                className="btn-primary text-sm px-3 py-1 flex items-center gap-1"
                              >
                                <Save size={14} /> Save
                              </button>
                              <button
                                onClick={() => setEditingTemplate(null)}
                                className="btn-secondary text-sm px-3 py-1"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-gray-800 dark:text-white">{template.name}</h3>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setEditingTemplate({ ...template })}
                                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
                                </button>
                                {!template.isDefault && (
                                  <button
                                    onClick={async () => {
                                      if (confirm('Delete this template?')) {
                                        try {
                                          await api.delete(`/message-templates/${template.id}`)
                                          const { data } = await api.get('/message-templates')
                                          if (data?.success) setTemplates(data.data || [])
                                        } catch (err) {
                                          alert('Failed to delete template')
                                        }
                                      }
                                    }}
                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                            {template.subject && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Subject: {template.subject}</p>
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-line">
                              {template.content}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowTemplateSend(template)}
                                className="btn-primary text-sm px-3 py-1 flex items-center gap-1 flex-1"
                              >
                                <Send size={14} /> Send
                              </button>
                              <button
                                onClick={() => handleUseTemplate(template.content)}
                                className="btn-secondary text-sm px-3 py-1"
                              >
                                Use in Compose
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Compose Message Modal */}
        {showCompose && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">Compose Message</h2>
                <button
                  onClick={() => {
                    setShowCompose(false)
                    setSelectedMembers([])
                    setComposeMessage({
                      to: '',
                      subject: '',
                      message: '',
                      type: 'general'
                    })
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Message Type
                    </label>
                    <select
                      value={composeMessage.type}
                      onChange={(e) => setComposeMessage({ ...composeMessage, type: e.target.value })}
                      className="input-field"
                    >
                      <option value="general">General</option>
                      <option value="reminder">Reminder</option>
                      <option value="fine">Fine Notification</option>
                      <option value="announcement">Announcement</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Select Members ({selectedMembers.length} selected)
                    </label>
                    <button
                      onClick={handleSelectAllMembers}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {selectedMembers.length === members.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                    {members.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        Loading members...
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {members.map(member => (
                          <label
                            key={member.id}
                            className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(member.id.toString())}
                              onChange={() => handleToggleMember(member.id.toString())}
                              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-800 dark:text-white">
                                {member.name}
                              </span>
                              {member.phone && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                  ({member.phone})
                                </span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={composeMessage.subject}
                    onChange={(e) => setComposeMessage({ ...composeMessage, subject: e.target.value })}
                    className="input-field"
                    placeholder="Enter message subject..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    value={composeMessage.message}
                    onChange={(e) => setComposeMessage({ ...composeMessage, message: e.target.value })}
                    className="input-field h-32 resize-none"
                    placeholder="Enter your message..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCompose(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendMessage}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={selectedMembers.length === 0 || !composeMessage.subject || !composeMessage.message}
                  >
                    <Send size={18} /> Send Message ({selectedMembers.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Template Send Modal */}
        {showTemplateSend && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">Send Template: {showTemplateSend.name}</h2>
                <button
                  onClick={() => setShowTemplateSend(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    To (Member/Group)
                  </label>
                  <select
                    id="templateRecipient"
                    className="input-field"
                    defaultValue=""
                  >
                    <option value="">Select recipient...</option>
                    <option value="all">All Members</option>
                    <option value="defaulters">Defaulters Only ({overdueMembers.length})</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} {member.phone ? `(${member.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="templateSubject"
                    defaultValue={showTemplateSend.subject || showTemplateSend.name}
                    className="input-field"
                    placeholder="Enter message subject..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Message (You can edit the template before sending)
                  </label>
                  <textarea
                    id="templateContent"
                    defaultValue={showTemplateSend.content}
                    className="input-field h-32 resize-none"
                    placeholder="Template content..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowTemplateSend(null)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const recipient = document.getElementById('templateRecipient')?.value
                      const subject = document.getElementById('templateSubject')?.value
                      const content = document.getElementById('templateContent')?.value

                      if (!recipient || !subject || !content) {
                        alert('Please fill in all fields')
                        return
                      }

                      try {
                        let userIds = []
                        
                        if (recipient === 'all') {
                          userIds = members.map(m => m.id)
                        } else if (recipient === 'defaulters') {
                          userIds = overdueMembers.map(m => m.id)
                        } else {
                          userIds = [parseInt(recipient)]
                        }

                        if (userIds.length === 0) {
                          alert('No recipients selected')
                          return
                        }

                        // Send bulk notifications
                        await api.post('/notifications/bulk', {
                          userIds,
                          type: 'announcement',
                          title: subject,
                          content: content,
                          channel: 'in_app'
                        })

                        alert('Template sent successfully!')
                        setShowTemplateSend(null)
                        
                        // Refresh sent notifications and inbox
                        const [sentRes, inboxRes] = await Promise.all([
                          api.get('/notifications/sent'),
                          api.get('/notifications')
                        ])
                        if (sentRes.data?.success) {
                          setSentNotifications(sentRes.data.data || [])
                        }
                        if (inboxRes.data?.success) {
                          setNotifications(inboxRes.data.data || [])
                        }
                      } catch (err) {
                        console.error('Failed to send template:', err)
                        alert('Failed to send template: ' + (err.response?.data?.message || err.message))
                      }
                    }}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Send size={18} /> Send Template
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

export default CashierNotifications
