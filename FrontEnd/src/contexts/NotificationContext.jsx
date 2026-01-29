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
    let pollInterval
    let initialLoadDone = false
    
    async function fetchNotifications(isInitial = false) {
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
        // Only show loading spinner on initial load
        if (isInitial && !initialLoadDone) {
          setLoading(true)
        }
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Request timeout')), 5000)
        })
        
        const { data } = await Promise.race([
          api.get('/notifications?limit=20'),
          timeoutPromise
        ])
        
        if (timeoutId) clearTimeout(timeoutId)
        
        if (isMounted && data?.success) {
          // Helper function to strip HTML tags and convert to readable text
          const stripHtml = (html) => {
            if (!html) return ''
            if (typeof html !== 'string') return String(html)
            
            let text = html
            
            // Convert line breaks first (before removing tags)
            text = text.replace(/<br\s*\/?>/gi, '\n')
            text = text.replace(/<\/p>/gi, '\n')
            text = text.replace(/<\/div>/gi, '\n')
            text = text.replace(/<\/h[1-6]>/gi, '\n')
            
            // Remove script and style tags with their content
            text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            
            // Remove all HTML tags
            text = text.replace(/<[^>]+>/g, '')
            
            // Decode common HTML entities
            text = text.replace(/&nbsp;/g, ' ')
            text = text.replace(/&amp;/g, '&')
            text = text.replace(/&lt;/g, '<')
            text = text.replace(/&gt;/g, '>')
            text = text.replace(/&quot;/g, '"')
            text = text.replace(/&#39;/g, "'")
            text = text.replace(/&apos;/g, "'")
            text = text.replace(/&mdash;/g, '—')
            text = text.replace(/&ndash;/g, '–')
            
            // Clean up multiple spaces but preserve line breaks
            text = text.replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
            text = text.replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple newlines to double
            text = text.trim()
            
            // If the result is just whitespace or very short, return empty
            if (text.length < 3 && !text.match(/[a-zA-Z0-9]/)) {
              return ''
            }
            
            return text
          }

          // Map backend notification format to frontend format
          // Filter out email channel notifications and only show in_app notifications
          const mappedNotifications = (data.data || [])
            .filter(n => n.channel === 'in_app' || !n.channel) // Only show in-app notifications
            .map(n => {
              const content = n.content || n.message || ''
              let plainTextContent = stripHtml(content)
              
              // If content is empty after stripping, provide fallback
              if (!plainTextContent || plainTextContent.trim().length < 3) {
                plainTextContent = 'Notification content'
              }
              
              const title = stripHtml(n.title || 'Notification')
              const cleanTitle = title || 'Notification'
              
              return {
                id: n.id,
                message: plainTextContent,
                type: n.type || 'general',
                priority: n.priority || 'medium',
                read: n.read || false,
                timestamp: n.createdAt || n.timestamp || new Date().toISOString(),
                amount: n.amount,
                ...n,
                content: plainTextContent, // Override content with plain text
                title: cleanTitle // Override title with clean text (after spread to ensure it's set)
              }
            })
          setNotifications(mappedNotifications)
          initialLoadDone = true
        }
      } catch (err) {
        // silent fail if not authenticated or timeout
        if (isMounted && !initialLoadDone) {
          setNotifications([])
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    
    // Fetch immediately
    fetchNotifications(true)
    
    // Poll for new notifications every 30 seconds
    pollInterval = setInterval(() => {
      if (isMounted) {
        fetchNotifications(false)
      }
    }, 30000) // Poll every 30 seconds
    
    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
      if (pollInterval) clearInterval(pollInterval)
    }
  }, []) // Only run once on mount, then poll

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    }
    setNotifications(prev => [newNotification, ...prev])
  }

  const markAsRead = async (id) => {
    // Update locally first for instant feedback
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
    
    // Sync with backend
    try {
      await api.put(`/notifications/${id}/read`)
    } catch (err) {
      console.warn('Failed to mark notification as read on server:', err)
      // Revert on error
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: false }
            : notification
        )
      )
    }
  }

  const markAllAsRead = async () => {
    // Update locally first for instant feedback
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
    
    // Sync with backend
    try {
      await api.put('/notifications/mark-all-read')
    } catch (err) {
      console.warn('Failed to mark all notifications as read on server:', err)
      // Revert on error - mark unread again
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: false }))
      )
    }
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
