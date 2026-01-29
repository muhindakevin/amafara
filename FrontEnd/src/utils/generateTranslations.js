// This script helps generate translation files for all languages
// Run this in Node.js to generate all translation files

const fs = require('fs')
const path = require('path')

const languages = [
  { code: 'en', name: 'English' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'fr', name: 'French' },
  { code: 'sw', name: 'Swahili' },
  { code: 'ar', name: 'Arabic' },
  { code: 'es', name: 'Spanish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'tr', name: 'Turkish' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ru', name: 'Russian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'el', name: 'Greek' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'da', name: 'Danish' },
  { code: 'ro', name: 'Romanian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'cs', name: 'Czech' },
  { code: 'sk', name: 'Slovak' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'hr', name: 'Croatian' },
  { code: 'he', name: 'Hebrew' },
  { code: 'am', name: 'Amharic' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'th', name: 'Thai' },
  { code: 'ms', name: 'Malay' },
  { code: 'id', name: 'Indonesian' },
  { code: 'tl', name: 'Filipino' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ne', name: 'Nepali' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'fa', name: 'Persian' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'sw-KE', name: 'Kiswahili (Kenya)' },
]

const namespaces = ['common', 'navigation', 'dashboard', 'auth', 'settings']

// Read English base files
const baseDir = path.join(__dirname, '../../public/locales/en')
const translations = {}

namespaces.forEach(ns => {
  const filePath = path.join(baseDir, `${ns}.json`)
  if (fs.existsSync(filePath)) {
    translations[ns] = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  }
})

console.log('Translation generator ready. Base translations loaded.')

