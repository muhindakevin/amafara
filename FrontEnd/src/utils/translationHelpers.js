import i18n from '../i18n'

/**
 * Translation helper utilities for alerts, confirms, and prompts
 * These functions automatically use the current language
 */

/**
 * Translated alert function
 * @param {string} key - Translation key (e.g., 'errors.invalidCredentials')
 * @param {object} options - Options for translation interpolation
 * @param {string} namespace - Translation namespace (default: 'common')
 */
export const tAlert = (key, options = {}, namespace = 'common') => {
  const message = i18n.t(key, { ...options, ns: namespace, defaultValue: key })
  alert(message)
}

/**
 * Translated confirm function
 * @param {string} key - Translation key
 * @param {object} options - Options for translation interpolation
 * @param {string} namespace - Translation namespace (default: 'common')
 * @returns {boolean} - User's confirmation
 */
export const tConfirm = (key, options = {}, namespace = 'common') => {
  const message = i18n.t(key, { ...options, ns: namespace, defaultValue: key })
  return window.confirm(message)
}

/**
 * Translated prompt function
 * @param {string} key - Translation key
 * @param {string} defaultValue - Default value for prompt
 * @param {object} options - Options for translation interpolation
 * @param {string} namespace - Translation namespace (default: 'common')
 * @returns {string|null} - User's input or null if cancelled
 */
export const tPrompt = (key, defaultValue = '', options = {}, namespace = 'common') => {
  const message = i18n.t(key, { ...options, ns: namespace, defaultValue: key })
  return window.prompt(message, defaultValue)
}

/**
 * Get translated text with fallback
 * @param {string} key - Translation key
 * @param {object} options - Options for translation interpolation
 * @param {string} namespace - Translation namespace (default: 'common')
 * @returns {string} - Translated text
 */
export const getTranslation = (key, options = {}, namespace = 'common') => {
  return i18n.t(key, { ...options, ns: namespace, defaultValue: key })
}

