import React, { createContext, useContext, useState, useCallback } from 'react'
import ToastContainer from '../components/ToastContainer'

const ToastContext = createContext()

/**
 * ToastProvider Component
 * Provides toast functionality throughout the app
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    const newToast = {
      id,
      type: toast.type || 'info',
      title: toast.title || '',
      message: toast.message || '',
      duration: toast.duration !== undefined ? toast.duration : 5000,
    }

    setToasts(prevToasts => [...prevToasts, newToast])

    // Auto-remove after duration if specified
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration + 300) // Add animation time
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id))
  }, [])

  const showSuccess = useCallback((message, title = '', duration) => {
    return addToast({ type: 'success', title, message, duration })
  }, [addToast])

  const showError = useCallback((message, title = '', duration) => {
    return addToast({ type: 'error', title, message, duration })
  }, [addToast])

  const showWarning = useCallback((message, title = '', duration) => {
    return addToast({ type: 'warning', title, message, duration })
  }, [addToast])

  const showInfo = useCallback((message, title = '', duration) => {
    return addToast({ type: 'info', title, message, duration })
  }, [addToast])

  const value = {
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

/**
 * Custom hook to use toast functionality
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
