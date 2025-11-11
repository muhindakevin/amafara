import { useLanguage } from '../contexts/LanguageContext'
import { getTranslation } from '../utils/translations'

/**
 * Custom hook for translations
 * Usage: const t = useTranslation(); t('dashboard')
 */
export function useTranslation() {
  const { language } = useLanguage()
  
  return (key, fallback = null) => {
    const translation = getTranslation(key, language)
    return translation !== key ? translation : (fallback || key)
  }
}

export default useTranslation

