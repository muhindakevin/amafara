import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

/**
 * Adaptive theme icon component that shows moon in light mode and sun in dark mode
 * Automatically adjusts colors based on theme
 */
function ThemeIcon({ size = 20, className = '' }) {
  const { isDark } = useTheme()
  
  if (isDark) {
    return <Sun size={size} className={`text-yellow-400 ${className}`} />
  }
  
  return <Moon size={size} className={`text-gray-600 dark:text-gray-300 ${className}`} />
}

export default ThemeIcon

