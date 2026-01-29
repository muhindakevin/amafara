import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const targetLanguages = [
  'rw', 'fr', 'sw', 'ar', 'es', 'pt', 'de', 'it', 'tr',
  'zh', 'zh-TW', 'ja', 'ko', 'hi', 'ur', 'ru', 'uk', 'nl', 'el',
  'pl', 'sv', 'no', 'fi', 'da', 'ro', 'hu', 'cs', 'sk', 'bg',
  'sr', 'hr', 'he', 'am', 'yo', 'zu', 'af', 'th', 'ms', 'id',
  'tl', 'vi', 'bn', 'ne', 'ta', 'te', 'fa', 'pt-BR', 'sw-KE'
]

const namespaces = [
  'common', 'dashboard', 'navigation', 'forms', 'notifications', 
  'settings', 'errors', 'auth', 'agent', 'cashier', 'secretary', 
  'systemAdmin', 'groupAdmin', 'member', 'landing'
]

const localesDir = path.join(__dirname, 'public', 'locales')
const enDir = path.join(localesDir, 'en')

function readJSONFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch (e) {
      return {}
    }
  }
  return {}
}

function mergeObjects(enObj, existingObj) {
  const merged = { ...existingObj }
  
  for (const [key, enValue] of Object.entries(enObj)) {
    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      merged[key] = mergeObjects(enValue, existingObj[key] || {})
    } else if (!(key in merged)) {
      merged[key] = enValue // Use English if translation missing
    }
  }
  
  return merged
}

function writeJSONFile(filePath, data) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

async function updateAllTranslations() {
  console.log('🚀 Updating all translation files with new keys...\n')
  
  let updated = 0
  let created = 0
  
  for (const lang of targetLanguages) {
    console.log(`📝 ${lang}...`)
    
    for (const namespace of namespaces) {
      const enFile = path.join(enDir, `${namespace}.json`)
      const langFile = path.join(localesDir, lang, `${namespace}.json`)
      
      const enData = readJSONFile(enFile)
      if (Object.keys(enData).length === 0) continue
      
      const existingData = readJSONFile(langFile)
      const merged = mergeObjects(enData, existingData)
      
      const existed = fs.existsSync(langFile)
      writeJSONFile(langFile, merged)
      
      if (existed) {
        updated++
      } else {
        created++
      }
    }
    
    console.log(`   ✓ ${lang} done`)
  }
  
  console.log(`\n✅ Complete! Updated: ${updated}, Created: ${created}\n`)
}

updateAllTranslations().catch(console.error)

