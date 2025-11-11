import { useState } from 'react'
import { Bell, X, Check, Trash2, DollarSign, Users, FileText, AlertCircle, Clock } from 'lucide-react'
import { useNotifications } from '../contexts/NotificationContext'

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, loading } = useNotifications()

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'contribution':
        return <DollarSign className="text-green-600" size={16} />
      case 'loan_request':
        return <FileText className="text-blue-600" size={16} />
      case 'loan_payment':
        return <DollarSign className="text-purple-600" size={16} />
      case 'member_application':
        return <Users className="text-orange-600" size={16} />
      default:
        return <Bell className="text-gray-600" size={16} />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
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
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
      >
        <Bell size={20} />
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
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Bell size={18} />
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
                      onClick={markAllAsRead}
                      className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Fetching notifications…</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-sm">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            {notification.amount && (
                              <p className="text-xs text-primary-600 font-semibold mt-1">
                                Amount: {notification.amount.toLocaleString()} RWF
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Clock size={12} className="text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.timestamp)}
                              </span>
                              {notification.priority === 'high' && (
                                <AlertCircle size={12} className="text-red-500" />
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    // Navigate to notifications page or show all
                    alert('View all notifications - would navigate to notifications page')
                    setIsOpen(false)
                  }}
                  className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-semibold"
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
