import { createContext, useContext, useState, useEffect, useRef } from 'react'

const ThemeContext = createContext()

/**
 * Get user-specific theme key for localStorage
 */
function getThemeKey(userId) {
  return userId ? `theme_${userId}` : 'theme_guest'
}

/**
 * Get current user ID from localStorage token or context
 */
function getCurrentUserId() {
  if (typeof window === 'undefined') return null
  
  try {
    // Try to get user ID from token payload
    const token = localStorage.getItem('uw_token')
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.userId || payload.id || null
    }
  } catch (e) {
    // If token parsing fails, return null
  }
  
  return null
}

export function ThemeProvider({ children, forceLightMode = false }) {
  const [isDark, setIsDark] = useState(() => {
    // If forced to light mode (e.g., LandingPage), always return false
    if (forceLightMode) {
      return false
    }
    
    // Check localStorage first, then system preference
    if (typeof window !== 'undefined') {
      const userId = getCurrentUserId()
      const themeKey = getThemeKey(userId)
      const saved = localStorage.getItem(themeKey)
      
      if (saved) {
        return saved === 'dark'
      }
      
      // Fallback to system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // Track previous user ID to detect user changes
  const previousUserIdRef = useRef(getCurrentUserId())

  // Reload theme when user changes (login/logout) or when token changes
  useEffect(() => {
    if (forceLightMode) return

    const checkAndUpdateTheme = () => {
      const userId = getCurrentUserId()
      const themeKey = getThemeKey(userId)
      const saved = localStorage.getItem(themeKey)
      
      // Only update if user changed
      const userChanged = userId !== previousUserIdRef.current
      
      if (userChanged) {
        previousUserIdRef.current = userId
        
        if (saved) {
          const shouldBeDark = saved === 'dark'
          setIsDark(shouldBeDark)
        } else {
          // If user changed and no saved theme, use system preference
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          setIsDark(systemPrefersDark)
        }
      }
    }

    // Check immediately on mount
    checkAndUpdateTheme()

    // Listen for storage changes (cross-tab sync and token updates)
    const handleStorageChange = (e) => {
      if (e.key === 'uw_token') {
        // User logged in/out - check theme
        checkAndUpdateTheme()
      } else if (e.key?.startsWith('theme_')) {
        // Theme changed in another tab - sync
        const userId = getCurrentUserId()
        const themeKey = getThemeKey(userId)
        if (e.key === themeKey) {
          const shouldBeDark = e.newValue === 'dark'
          setIsDark(shouldBeDark)
        }
      }
    }

    // Listen for custom event when user logs in/out
    const handleUserChange = () => {
      checkAndUpdateTheme()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('user-changed', handleUserChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('user-changed', handleUserChange)
    }
  }, [forceLightMode]) // Only depend on forceLightMode, not isDark

  useEffect(() => {
    // If forced to light mode, ensure dark class is removed
    if (forceLightMode) {
      if (typeof document !== 'undefined') {
        const root = document.documentElement
        root.classList.remove('dark')
        root.classList.remove('theme-transition')
      }
      return
    }
    
    // Apply theme to document immediately with smooth transition
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      const userId = getCurrentUserId()
      const themeKey = getThemeKey(userId)
      
      // Add transition class for smooth theme switching
      root.classList.add('theme-transition')
      
      if (isDark) {
        root.classList.add('dark')
        localStorage.setItem(themeKey, 'dark')
      } else {
        root.classList.remove('dark')
        localStorage.setItem(themeKey, 'light')
      }
      
      // Remove transition class after animation completes
      const timeout = setTimeout(() => {
        root.classList.remove('theme-transition')
      }, 300)
      
      return () => clearTimeout(timeout)
    }
  }, [isDark, forceLightMode])

  const toggleTheme = () => {
    // Don't allow theme toggle if forced to light mode
    if (forceLightMode) {
      return
    }
    setIsDark(prev => !prev)
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, forceLightMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

