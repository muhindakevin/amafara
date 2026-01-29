import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// All 50 supported languages
const languages = [
  'rw', 'fr', 'sw', 'ar', 'es', 'pt', 'de', 'it', 'tr',
  'zh', 'zh-TW', 'ja', 'ko', 'hi', 'ur', 'ru', 'uk', 'nl', 'el',
  'pl', 'sv', 'no', 'fi', 'da', 'ro', 'hu', 'cs', 'sk', 'bg',
  'sr', 'hr', 'he', 'am', 'yo', 'zu', 'af', 'th', 'ms', 'id',
  'tl', 'vi', 'bn', 'ne', 'ta', 'te', 'fa', 'pt-BR', 'sw-KE'
]

// All namespaces
const namespaces = [
  'common', 'dashboard', 'navigation', 'forms', 'notifications', 
  'settings', 'errors', 'auth', 'agent', 'cashier', 'secretary', 
  'systemAdmin', 'groupAdmin', 'member', 'landing'
]

const localesDir = path.join(__dirname, 'public', 'locales')
const enDir = path.join(localesDir, 'en')

// Function to read English file
function readEnglishFile(namespace) {
  const filePath = path.join(enDir, `${namespace}.json`)
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch (e) {
      console.error(`Error reading ${filePath}:`, e.message)
      return {}
    }
  }
  return {}
}

// Function to write translation file
function writeTranslationFile(lang, namespace, data) {
  const langDir = path.join(localesDir, lang)
  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir, { recursive: true })
  }
  
  const filePath = path.join(langDir, `${namespace}.json`)
  const jsonContent = JSON.stringify(data, null, 2) + '\n'
  fs.writeFileSync(filePath, jsonContent, 'utf8')
}

// Main function
function generateAllTranslations() {
  console.log('🚀 Generating translation files for all 49 languages...\n')
  
  let totalFiles = 0
  let createdFiles = 0
  let updatedFiles = 0
  
  for (const lang of languages) {
    console.log(`📝 Processing language: ${lang}`)
    let langCreated = 0
    let langUpdated = 0
    
    for (const namespace of namespaces) {
      const enData = readEnglishFile(namespace)
      
      if (Object.keys(enData).length === 0) {
        continue // Skip empty namespaces
      }
      
      totalFiles++
      const langDir = path.join(localesDir, lang)
      const filePath = path.join(langDir, `${namespace}.json`)
      const exists = fs.existsSync(filePath)
      
      // For other languages, use English as base structure
      // This ensures all keys exist, even if not translated yet
      writeTranslationFile(lang, namespace, enData)
      
      if (exists) {
        updatedFiles++
        langUpdated++
      } else {
        createdFiles++
        langCreated++
      }
    }
    
    console.log(`   ✓ Completed ${lang} (${langCreated} created, ${langUpdated} updated)\n`)
  }
  
  console.log('✅ Translation file generation complete!\n')
  console.log(`📊 Summary:`)
  console.log(`   - Total files processed: ${totalFiles}`)
  console.log(`   - Files created: ${createdFiles}`)
  console.log(`   - Files updated: ${updatedFiles}`)
  console.log(`   - Languages: ${languages.length}`)
  console.log(`   - Namespaces: ${namespaces.length}\n`)
  console.log('💡 Next steps:')
  console.log('   1. All language files now have the same structure as English')
  console.log('   2. Use translation services (Google Translate API, DeepL, etc.) to translate')
  console.log('   3. Or manually translate the files for each language')
  console.log('   4. The system will fallback to English if translations are missing\n')
}

// Run the script
try {
  generateAllTranslations()
} catch (error) {
  console.error('❌ Error:', error.message)
  console.error(error.stack)
  process.exit(1)
}
