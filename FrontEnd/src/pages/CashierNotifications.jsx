import { useState } from 'react'
import { Bell, MessageCircle, Users, Mail, Phone, Clock, CheckCircle, XCircle, AlertCircle, Send, DollarSign } from 'lucide-react'
import Layout from '../components/Layout'

function CashierNotifications() {
  const [activeTab, setActiveTab] = useState('inbox')
  const [showCompose, setShowCompose] = useState(false)

  const notifications = [
    {
      id: 'N001',
      type: 'contribution',
      title: 'New Contribution Received',
      message: 'Kamikazi Marie has submitted a contribution of RWF 5,000',
      time: '2 hours ago',
      status: 'unread',
      priority: 'medium',
      member: 'Kamikazi Marie'
    },
    {
      id: 'N002',
      type: 'overdue',
      title: 'Overdue Payment Alert',
      message: 'Mutabazi Paul has an overdue loan payment of RWF 15,000',
      time: '4 hours ago',
      status: 'unread',
      priority: 'high',
      member: 'Mutabazi Paul'
    },
    {
      id: 'N003',
      type: 'system',
      title: 'System Update',
      message: 'New fine rules have been applied to the system',
      time: '1 day ago',
      status: 'read',
      priority: 'low',
      member: null
    },
    {
      id: 'N004',
      type: 'admin',
      title: 'Admin Message',
      message: 'Please review the monthly financial report',
      time: '2 days ago',
      status: 'read',
      priority: 'medium',
      member: 'Group Admin'
    }
  ]

  const messages = [
    {
      id: 'M001',
      from: 'Kamikazi Marie',
      phone: '+250788123456',
      message: 'I have made my contribution via MTN Mobile Money. Please verify.',
      time: '1 hour ago',
      status: 'unread',
      type: 'contribution'
    },
    {
      id: 'M002',
      from: 'Group Admin',
      phone: '+250788999999',
      message: 'Please send reminders to all members with overdue payments.',
      time: '3 hours ago',
      status: 'read',
      type: 'instruction'
    },
    {
      id: 'M003',
      from: 'Mutabazi Paul',
      phone: '+250788456789',
      message: 'I need to discuss my loan payment schedule.',
      time: '5 hours ago',
      status: 'unread',
      type: 'loan'
    }
  ]

  const [composeMessage, setComposeMessage] = useState({
    to: '',
    subject: '',
    message: '',
    type: 'general'
  })

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
      case 'contribution': return <DollarSign className="text-green-600" size={20} />
      case 'overdue': return <AlertCircle className="text-red-600" size={20} />
      case 'system': return <Bell className="text-blue-600" size={20} />
      case 'admin': return <Users className="text-purple-600" size={20} />
      default: return <Bell className="text-gray-600" size={20} />
    }
  }

  const handleMarkAsRead = (notificationId) => {
    console.log('Marking notification as read:', notificationId)
    alert('Notification marked as read!')
  }

  const handleSendMessage = () => {
    console.log('Sending message:', composeMessage)
    alert('Message sent successfully!')
    setShowCompose(false)
    setComposeMessage({
      to: '',
      subject: '',
      message: '',
      type: 'general'
    })
  }

  const handleSendBulkReminder = () => {
    console.log('Sending bulk reminders')
    alert('Bulk reminders sent to all members!')
  }

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Notifications & Communication</h1>
            <p className="text-gray-600 mt-1">Manage notifications and communicate with members</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCompose(true)}
              className="btn-primary flex items-center gap-2"
            >
              <MessageCircle size={18} /> Compose Message
            </button>
            <button
              onClick={handleSendBulkReminder}
              className="btn-secondary flex items-center gap-2"
            >
              <Bell size={18} /> Send Reminders
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Unread Notifications</p>
                <p className="text-2xl font-bold text-gray-800">
                  {notifications.filter(n => n.status === 'unread').length}
                </p>
              </div>
              <Bell className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Unread Messages</p>
                <p className="text-2xl font-bold text-gray-800">
                  {messages.filter(m => m.status === 'unread').length}
                </p>
              </div>
              <MessageCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {notifications.filter(n => n.priority === 'high').length}
                </p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Messages</p>
                <p className="text-2xl font-bold text-purple-600">
                  {messages.length}
                </p>
              </div>
              <Mail className="text-purple-600" size={32} />
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
                <h2 className="text-xl font-bold text-gray-800 mb-4">Notifications</h2>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl border transition-colors ${
                      notification.status === 'unread' 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(notification.type)}
                        <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{notification.time}</span>
                        {notification.status === 'unread' && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    {notification.member && (
                      <p className="text-xs text-gray-500">Member: {notification.member}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Messages from Members</h2>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-xl border transition-colors ${
                      message.status === 'unread' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {message.from[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{message.from}</h3>
                          <p className="text-sm text-gray-600">{message.phone}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          message.type === 'contribution' ? 'bg-green-100 text-green-700' :
                          message.type === 'loan' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {message.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{message.time}</span>
                        {message.status === 'unread' && (
                          <button className="text-green-600 hover:text-green-800">
                            <CheckCircle size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{message.message}</p>
                    <div className="flex gap-2 mt-3">
                      <button className="btn-primary text-sm px-3 py-1 flex items-center gap-1">
                        <MessageCircle size={14} /> Reply
                      </button>
                      <button className="btn-secondary text-sm px-3 py-1 flex items-center gap-1">
                        <Phone size={14} /> Call
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'sent' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Sent Messages</h2>
                <div className="text-center py-8 text-gray-500">
                  <Mail className="mx-auto mb-2" size={48} />
                  <p>No sent messages yet</p>
                  <p className="text-sm">Messages you send will appear here</p>
                </div>
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Message Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Contribution Reminder</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      "Dear [Member Name], this is a reminder that your contribution of [Amount] RWF is due on [Date]. Please make your payment to avoid any penalties."
                    </p>
                    <button className="btn-primary text-sm px-3 py-1">Use Template</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Loan Payment Reminder</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      "Dear [Member Name], your loan payment of [Amount] RWF was due on [Date]. Please make your payment as soon as possible to avoid additional charges."
                    </p>
                    <button className="btn-primary text-sm px-3 py-1">Use Template</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Fine Notification</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      "Dear [Member Name], a fine of [Amount] RWF has been applied to your account due to [Reason]. Please settle this amount by [Due Date]."
                    </p>
                    <button className="btn-primary text-sm px-3 py-1">Use Template</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">General Announcement</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      "Dear Members, [Announcement Text]. Please take note of this important information. Thank you for your attention."
                    </p>
                    <button className="btn-primary text-sm px-3 py-1">Use Template</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compose Message Modal */}
        {showCompose && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Compose Message</h2>
                <button
                  onClick={() => setShowCompose(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      To (Member/Group)
                    </label>
                    <select
                      value={composeMessage.to}
                      onChange={(e) => setComposeMessage({ ...composeMessage, to: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select recipient...</option>
                      <option value="all">All Members</option>
                      <option value="defaulters">Defaulters Only</option>
                      <option value="kamikazi">Kamikazi Marie</option>
                      <option value="mukamana">Mukamana Alice</option>
                      <option value="mutabazi">Mutabazi Paul</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  >
                    <Send size={18} /> Send Message
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
