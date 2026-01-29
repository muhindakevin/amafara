import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || ''
const USE_API = GOOGLE_TRANSLATE_API_KEY !== ''

const targetLanguages = [
  'rw', 'fr', 'sw', 'ar', 'es', 'pt', 'de', 'it', 'tr',
  'zh', 'zh-TW', 'ja', 'ko', 'hi', 'ur', 'ru', 'uk', 'nl', 'el',
  'pl', 'sv', 'no', 'fi', 'da', 'ro', 'hu', 'cs', 'sk', 'bg',
  'sr', 'hr', 'he', 'am', 'yo', 'zu', 'af', 'th', 'ms', 'id',
  'tl', 'vi', 'bn', 'ne', 'ta', 'te', 'fa', 'pt-BR', 'sw-KE'
]

const namespaces = ['common', 'dashboard', 'agent', 'cashier', 'secretary', 'systemAdmin']

const localesDir = path.join(__dirname, 'public', 'locales')
const enDir = path.join(localesDir, 'en')

// Google Translate API function
async function translateWithGoogle(text, targetLang) {
  if (!USE_API) {
    return text // Return English if no API key
  }
  
  try {
    // Map language codes for Google Translate
    const langMap = {
      'zh-TW': 'zh-TW',
      'pt-BR': 'pt',
      'sw-KE': 'sw'
    }
    const googleLang = langMap[targetLang] || targetLang
    
    const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        target: googleLang,
        source: 'en'
      })
    })
    
    const data = await response.json()
    return data.data?.translations?.[0]?.translatedText || text
  } catch (error) {
    console.error(`Translation error for ${targetLang}:`, error.message)
    return text
  }
}

// Recursively translate object
async function translateObject(obj, targetLang, depth = 0) {
  if (depth > 10) return obj
  
  if (typeof obj === 'string') {
    if (obj.startsWith('{{') || obj.includes('{{')) return obj
    if (obj.length === 0) return obj
    return await translateWithGoogle(obj, targetLang)
  }
  
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => translateObject(item, targetLang, depth + 1)))
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const translated = {}
    for (const [key, value] of Object.entries(obj)) {
      translated[key] = await translateObject(value, targetLang, depth + 1)
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return translated
  }
  
  return obj
}

function readEnglishFile(namespace) {
  const filePath = path.join(enDir, `${namespace}.json`)
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch (e) {
      return null
    }
  }
  return null
}

function writeTranslationFile(lang, namespace, data) {
  const langDir = path.join(localesDir, lang)
  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir, { recursive: true })
  }
  const filePath = path.join(langDir, `${namespace}.json`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

async function translateAll() {
  console.log(USE_API ? '🌐 Using Google Translate API\n' : '📋 Using English as placeholder (no API key)\n')
  
  for (const lang of targetLanguages) {
    console.log(`📝 ${lang}...`)
    for (const namespace of namespaces) {
      const enData = readEnglishFile(namespace)
      if (!enData) continue
      
      try {
        const translated = USE_API 
          ? await translateObject(enData, lang)
          : enData
        writeTranslationFile(lang, namespace, translated)
      } catch (e) {
        console.error(`   Error ${namespace}:`, e.message)
      }
    }
    console.log(`   ✓ ${lang} done\n`)
  }
  
  console.log('✅ Complete!')
}

translateAll().catch(console.error)

