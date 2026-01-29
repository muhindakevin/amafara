import axios from 'axios'

const baseURL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:4000/api'

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000, // 10 second timeout to prevent hanging
})

// Attach JWT token from localStorage if present
api.interceptors.request.use((config) => {
  // Ensure headers object exists
  if (!config.headers) {
    config.headers = {}
  }

  const token = localStorage.getItem('uw_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    console.warn(`[API] ${config.method?.toUpperCase()} ${config.url} - No token found in localStorage`)
    // For protected routes, don't make the request if no token
    const protectedRoutes = ['/members', '/contributions', '/transactions', '/loans', '/fines', '/admin', '/cashier', '/secretary', '/agent', '/system-admin']
    const isProtected = protectedRoutes.some(route => config.url?.includes(route))
    if (isProtected && window.location.pathname !== '/login' && window.location.pathname !== '/') {
      console.warn('Protected route accessed without token. Redirecting to login...')
      localStorage.removeItem('uw_token')
      window.location.href = '/login'
      return Promise.reject(new Error('No authentication token'))
    }
  }
  return config
})

// Add response interceptor for better error logging and 401 handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response:`, response.config.method?.toUpperCase(), response.config.url, response.status)
    return response
  },
  (error) => {
    const errorDetails = {
      status: error.response?.status,
      message: error.message,
      timeout: error.code === 'ECONNABORTED',
      data: error.response?.data,
      errorMessage: error.response?.data?.message || error.response?.data?.error || error.message
    }

    // Handle connection refused errors (backend not running)
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
      console.error(`[API] Backend server is not running!`)
      console.error(`[API] Please start the backend server by running: cd BackEnd && npm run dev`)
      console.error(`[API] Or check if the server is running on ${baseURL}`)

      // Only show alert once to avoid spam
      if (!window.__backendConnectionErrorShown) {
        window.__backendConnectionErrorShown = true
        setTimeout(() => {
          window.__backendConnectionErrorShown = false
        }, 5000) // Reset after 5 seconds

        // Show user-friendly error message
        const errorMsg = 'Backend server is not running. Please start the backend server to use this application.'
        console.error(`[API] ${errorMsg}`)

        // Don't show alert on login/forgot-password pages as user might not be logged in yet
        const isAuthPage = window.location.pathname === '/login' ||
          window.location.pathname === '/forgot-password' ||
          window.location.pathname === '/reset-password' ||
          window.location.pathname === '/signup'

        if (!isAuthPage) {
          // You could show a toast notification here instead of console.error
          // For now, just log it
        }
      }
    } else {
      console.error(`[API] Error:`, error.config?.method?.toUpperCase(), error.config?.url, errorDetails)
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Remove invalid token
      localStorage.removeItem('uw_token')
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        console.warn('Token expired or invalid. Redirecting to login...')
        window.location.href = '/login'
      }
    }



    return Promise.reject(error)
  }
)

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('uw_token', token)
  } else {
    localStorage.removeItem('uw_token')
  }
}

export function getAuthToken() {
  return localStorage.getItem('uw_token')
}

/**
 * Get the backend base URL (without /api)
 * Used for constructing URLs to static files like profile images
 */
export function getBackendBaseURL() {
  const apiBaseURL = baseURL.replace('/api', '')
  return apiBaseURL || 'http://localhost:4000'
}

/**
 * Construct full URL for uploaded files (profile images, documents, etc.)
 * @param {string} filePath - Relative path like /uploads/profile-images/filename.jpg
 * @returns {string} Full URL to the file
 */
export function getFileUrl(filePath) {
  if (!filePath) return ''
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath // Already a full URL
  }
  const backendURL = getBackendBaseURL()
  return `${backendURL}${filePath.startsWith('/') ? filePath : '/' + filePath}`
}

export default api

