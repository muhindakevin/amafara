import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

i18n
  // Load translation using http -> see /public/locales/{lng}/{ns}.json
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Fallback language
    fallbackLng: 'en',

    // Default namespace
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'navigation', 'forms', 'notifications', 'settings', 'errors', 'auth', 'agent', 'cashier', 'secretary', 'systemAdmin', 'groupAdmin', 'member', 'landing'],

    // Debug mode (set to false in production)
    debug: false,

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Backend options
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      // Allow cross-origin requests
      crossDomain: false,
    },

    // Language detection options
    detection: {
      // Order and from where user language should be detected
      order: ['localStorage', 'navigator', 'htmlTag'],

      // Keys or params to lookup language from
      lookupLocalStorage: 'umurenge-language',
      caches: ['localStorage'],
    },

    // React options
    react: {
      useSuspense: false, // Set to false to avoid Suspense issues
    },

    // Supported languages
    supportedLngs: [
      'en', 'rw', 'fr'
    ],

    // Language names for display
    load: 'languageOnly', // Only load language code, not region (e.g., 'en' not 'en-US')
  })

export default i18n

