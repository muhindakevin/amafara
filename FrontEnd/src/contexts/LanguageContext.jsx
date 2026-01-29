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
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼', nativeName: 'Ikinyarwanda' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'sw', name: 'Swahili', flag: '🇹🇿', nativeName: 'Kiswahili' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', nativeName: 'Português' },
  { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷', nativeName: 'Türkçe' },
  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳', nativeName: '中文 (简体)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', flag: '🇹🇼', nativeName: '中文 (繁體)' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰', nativeName: 'اردو' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦', nativeName: 'Українська' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱', nativeName: 'Nederlands' },
  { code: 'el', name: 'Greek', flag: '🇬🇷', nativeName: 'Ελληνικά' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱', nativeName: 'Polski' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪', nativeName: 'Svenska' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴', nativeName: 'Norsk' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮', nativeName: 'Suomi' },
  { code: 'da', name: 'Danish', flag: '🇩🇰', nativeName: 'Dansk' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴', nativeName: 'Română' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺', nativeName: 'Magyar' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿', nativeName: 'Čeština' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰', nativeName: 'Slovenčina' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬', nativeName: 'Български' },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸', nativeName: 'Српски' },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷', nativeName: 'Hrvatski' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱', nativeName: 'עברית' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹', nativeName: 'አማርኛ' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬', nativeName: 'Yorùbá' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦', nativeName: 'isiZulu' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦', nativeName: 'Afrikaans' },
  { code: 'th', name: 'Thai', flag: '🇹🇭', nativeName: 'ไทย' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾', nativeName: 'Bahasa Melayu' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩', nativeName: 'Bahasa Indonesia' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭', nativeName: 'Filipino' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', nativeName: 'Tiếng Việt' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩', nativeName: 'বাংলা' },
  { code: 'ne', name: 'Nepali', flag: '🇳🇵', nativeName: 'नेपाली' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳', nativeName: 'తెలుగు' },
  { code: 'fa', name: 'Persian', flag: '🇮🇷', nativeName: 'فارسی' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷', nativeName: 'Português (Brasil)' },
  { code: 'sw-KE', name: 'Kiswahili (Kenya)', flag: '🇰🇪', nativeName: 'Kiswahili (Kenya)' },
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


