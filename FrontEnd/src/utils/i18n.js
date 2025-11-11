import en from '../locales/en.json'
import rw from '../locales/rw.json'
import fr from '../locales/fr.json'
import sw from '../locales/sw.json'
import ar from '../locales/ar.json'
import es from '../locales/es.json'
import zh from '../locales/zh.json'
import hi from '../locales/hi.json'

const translations = {
  en,
  rw,
  fr,
  sw,
  ar,
  es,
  zh,
  hi
}

/**
 * Get translation by nested key path
 * Example: t('landing.heroTitle') or t('common.welcome')
 */
export const t = (key, lang = 'en') => {
  const keys = key.split('.')
  let value = translations[lang]
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      // Fallback to English if translation not found
      value = translations.en
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey]
        } else {
          return key // Return key if translation doesn't exist
        }
      }
      break
    }
  }
  
  return typeof value === 'string' ? value : key
}

export const getAvailableLanguages = () => [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'sw', name: 'Kiswahili', flag: '🇹🇿' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' }
]

export default { t, getAvailableLanguages }

