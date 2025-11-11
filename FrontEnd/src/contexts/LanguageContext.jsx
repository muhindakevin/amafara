import React, { createContext, useContext, useState, useEffect } from 'react'
import { getAvailableLanguages } from '../utils/i18n'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to English
    return localStorage.getItem('umurenge-language') || 'en'
  })

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('umurenge-language', language)
    
    // Update document direction for RTL languages
    const rtlLanguages = ['ar']
    document.documentElement.dir = rtlLanguages.includes(language) ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage)
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


