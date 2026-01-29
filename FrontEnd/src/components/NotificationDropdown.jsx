import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X, Check, Trash2, DollarSign, Users, FileText, AlertCircle, Clock } from 'lucide-react'
import { useNotifications } from '../contexts/NotificationContext'
import api from '../utils/api'

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { notifications, unreadCount, loading, markAllAsRead, markAsRead } = useNotifications()

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'contribution_confirmation':
      case 'contribution':
        return <DollarSign className="text-green-600 dark:text-green-400" size={16} />
      case 'loan_approval':
      case 'loan_rejection':
      case 'loan_request':
        return <FileText className="text-blue-600 dark:text-blue-400" size={16} />
      case 'loan_payment':
        return <DollarSign className="text-purple-600 dark:text-purple-400" size={16} />
      case 'fine_issued':
        return <AlertCircle className="text-red-600 dark:text-red-400" size={16} />
      case 'member_application':
        return <Users className="text-orange-600 dark:text-orange-400" size={16} />
      case 'announcement':
        return <Bell className="text-blue-600 dark:text-blue-400" size={16} />
      case 'chat_message':
        return <Users className="text-purple-600 dark:text-purple-400" size={16} />
      case 'meeting_reminder':
        return <Clock className="text-yellow-600 dark:text-yellow-400" size={16} />
      default:
        return <Bell className="text-gray-600 dark:text-gray-400" size={16} />
    }
  }

  const getPriorityColor = (priority, type) => {
    // If priority is not set, infer from notification type
    let effectivePriority = priority
    if (!effectivePriority) {
      if (type === 'loan_rejection' || type === 'fine_issued') {
        effectivePriority = 'high'
      } else if (type === 'contribution_confirmation' || type === 'loan_approval' || type === 'loan_payment' || type === 'announcement') {
        effectivePriority = 'medium'
      } else {
        effectivePriority = 'low'
      }
    }
    
    switch (effectivePriority) {
      case 'high':
        return 'border-l-red-500'
      case 'medium':
        return 'border-l-yellow-500'
      case 'low':
        return 'border-l-green-500'
      default:
        return 'border-l-gray-500'
    }
  }

  const formatTime = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now - time) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 relative"
      >
        <Bell size={20} className="text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Bell size={18} className="text-gray-600 dark:text-gray-300" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-200"
                  >
                    <X size={16} className="text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Fetching notifications…</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getPriorityColor(notification.priority, notification.type)} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 dark:text-white text-sm">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-line">
                              {notification.content || notification.message}
                            </p>
                            {notification.amount && (
                              <p className="text-xs text-primary-600 font-semibold mt-1">
                                Amount: {notification.amount.toLocaleString()} RWF
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Clock size={12} className="text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.timestamp || notification.createdAt)}
                              </span>
                              {(notification.priority === 'high' || notification.type === 'loan_rejection' || notification.type === 'fine_issued') && (
                                <AlertCircle size={12} className="text-red-500" />
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
                                title="Mark as read"
                              >
                                <Check size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    // Navigate to role-specific notifications page
                    const userRole = localStorage.getItem('uw_user_role') || 'Member'
                    if (userRole === 'Cashier') {
                      navigate('/cashier/notifications')
                    } else if (userRole === 'Secretary') {
                      navigate('/secretary/notifications')
                    } else if (userRole === 'Group Admin') {
                      navigate('/group-admin/announcements')
                    } else if (userRole === 'Member') {
                      navigate('/member/announcements')
                    } else if (userRole === 'Agent') {
                      navigate('/agent/communications')
                    } else if (userRole === 'System Admin') {
                      navigate('/system-admin/communications')
                    } else {
                      navigate('/member/announcements') // Fallback
                    }
                  }}
                  className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors duration-200"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationDropdown
