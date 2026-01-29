import React, { createContext, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Available languages with proper names and flags
export const getAvailableLanguages = () => [
  { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼', nativeName: 'Ikinyarwanda' },
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
]

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('umurenge-language') || 'en'
    }
    return 'en'
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Import i18n dynamically to avoid circular dependencies
      import('../i18n').then(({ default: i18n }) => {
        // Set initial language
        if (i18n.language !== language) {
          i18n.changeLanguage(language)
        }

        // Update document direction for RTL languages
        const rtlLanguages = ['ar', 'he', 'fa', 'ur']
        const currentLang = i18n.language.split('-')[0]
        document.documentElement.dir = rtlLanguages.includes(currentLang) ? 'rtl' : 'ltr'
        document.documentElement.lang = i18n.language

        // Listen for language changes
        i18n.on('languageChanged', (lng) => {
          setLanguage(lng)
          localStorage.setItem('umurenge-language', lng)
          const baseLang = lng.split('-')[0]
          document.documentElement.dir = rtlLanguages.includes(baseLang) ? 'rtl' : 'ltr'
          document.documentElement.lang = lng
        })
      })
    }
  }, [])

  const changeLanguage = (newLanguage) => {
    if (typeof window !== 'undefined') {
      import('../i18n').then(({ default: i18n }) => {
        i18n.changeLanguage(newLanguage)
        setLanguage(newLanguage)
        localStorage.setItem('umurenge-language', newLanguage)
      })
    }
  }

  const value = {
    language,
    changeLanguage,
    languages: getAvailableLanguages()
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}


