// Script to generate base translation files for all languages
// Run with: node scripts/generate-language-files.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const languages = [
  'en', 'rw', 'fr', 'sw', 'ar', 'es', 'pt', 'de', 'it', 'tr',
  'zh', 'zh-TW', 'ja', 'ko', 'hi', 'ur', 'ru', 'uk', 'nl', 'el',
  'pl', 'sv', 'no', 'fi', 'da', 'ro', 'hu', 'cs', 'sk', 'bg',
  'sr', 'hr', 'he', 'am', 'yo', 'zu', 'af', 'th', 'ms', 'id',
  'tl', 'vi', 'bn', 'ne', 'ta', 'te', 'fa', 'pt-BR', 'sw-KE'
]

const namespaces = ['common', 'navigation', 'dashboard', 'auth', 'settings']

const baseDir = path.join(__dirname, '../public/locales')

// Read English files as base
const englishFiles = {}
namespaces.forEach(ns => {
  const filePath = path.join(baseDir, 'en', `${ns}.json`)
  if (fs.existsSync(filePath)) {
    englishFiles[ns] = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  }
})

// Create directories and files for all languages
languages.forEach(lang => {
  const langDir = path.join(baseDir, lang)
  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir, { recursive: true })
  }

  namespaces.forEach(ns => {
    const filePath = path.join(langDir, `${ns}.json`)
    // Only create if doesn't exist (preserve existing translations)
    if (!fs.existsSync(filePath) && englishFiles[ns]) {
      fs.writeFileSync(filePath, JSON.stringify(englishFiles[ns], null, 2), 'utf8')
      console.log(`Created ${lang}/${ns}.json`)
    }
  })
})

console.log('Language files generation complete!')

