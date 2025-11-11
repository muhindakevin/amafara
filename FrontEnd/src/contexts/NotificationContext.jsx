import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const count = notifications.filter(n => !n.read).length
    setUnreadCount(count)
  }, [notifications])

  useEffect(() => {
    let isMounted = true
    let timeoutId
    
    async function fetchNotifications() {
      // Only fetch if user is authenticated (has token)
      const token = localStorage.getItem('uw_token')
      if (!token) {
        if (isMounted) {
          setNotifications([])
          setLoading(false)
        }
        return
      }
      
      try {
        setLoading(true)
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Request timeout')), 5000)
        })
        
        const { data } = await Promise.race([
          api.get('/notifications'),
          timeoutPromise
        ])
        
        if (timeoutId) clearTimeout(timeoutId)
        
        if (isMounted && data?.success) {
          setNotifications(data.data || [])
        }
      } catch (err) {
        // silent fail if not authenticated or timeout
        if (isMounted) {
          setNotifications([])
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    
    fetchNotifications()
    
    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    }
    setNotifications(prev => [newNotification, ...prev])
  }

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  // Real-time notifications can be wired here via websockets in the future

  const contextValue = {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}

export default NotificationContext
