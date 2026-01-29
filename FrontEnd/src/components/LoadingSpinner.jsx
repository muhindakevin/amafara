import React from 'react'

/**
 * Global Loading Spinner Component
 * Displays IKIMINA WALLET logo with a circular spinner around it
 * Logo displays in its natural rectangular form for better visibility
 * Compatible with light and dark modes
 */
function LoadingSpinner({ size = 'default', text = '', fullScreen = false }) {
  const logoSizeClasses = {
    small: 'h-12 w-[100px]',
    default: 'h-16 w-[140px]',
    large: 'h-24 w-[200px]',
    xl: 'h-32 w-[260px]'
  }

  const spinnerSizeClasses = {
    small: 'w-20 h-20',
    default: 'w-28 h-28',
    large: 'w-36 h-36',
    xl: 'w-44 h-44'
  }

  const logoSize = logoSizeClasses[size] || logoSizeClasses.default
  const spinnerSize = spinnerSizeClasses[size] || spinnerSizeClasses.default

  const content = (
    <div className="flex flex-col items-center justify-center">
      {/* Spinner Container with Logo in Center */}
      <div className="relative flex items-center justify-center">
        {/* Circular Spinner */}
        <div 
          className={`${spinnerSize} border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin`}
          style={{ 
            animation: 'spin 1s linear infinite'
          }}
        ></div>
        
        {/* Logo in Center */}
        <div className="absolute flex items-center justify-center">
          <img 
            src="/assets/images/wallet.png" 
            alt="IKIMINA WALLET" 
            className={`${logoSize} object-cover`}
            onError={(e) => {
              // Fallback to text if image fails
              e.target.style.display = 'none'
              const fallback = e.target.nextElementSibling
              if (fallback) fallback.style.display = 'block'
            }}
          />
          <span className="text-primary-600 dark:text-primary-400 font-bold text-lg hidden">IKIMINA WALLET</span>
        </div>
      </div>
      
      {/* Optional Loading Text */}
      {text && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return content
}

export default LoadingSpinner

