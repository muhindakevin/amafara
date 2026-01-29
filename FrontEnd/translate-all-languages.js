import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// All languages to translate TO (excluding English)
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

// Simple translation function using a free service
// This uses a mock translation - in production, replace with actual API
async function translateText(text, targetLang) {
  // For now, return English text with a note
  // In production, replace this with actual translation API call
  // Example: Google Translate API, DeepL, etc.
  
  // Mock translation - returns English for now
  // TODO: Replace with actual translation service
  return text
}

// Recursively translate an object
async function translateObject(obj, targetLang, depth = 0) {
  if (depth > 10) return obj // Prevent infinite recursion
  
  if (typeof obj === 'string') {
    // Skip translation if it's a placeholder or already translated
    if (obj.startsWith('{{') || obj.includes('{{')) {
      return obj // Keep interpolation syntax
    }
    return await translateText(obj, targetLang)
  }
  
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => translateObject(item, targetLang, depth + 1)))
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const translated = {}
    for (const [key, value] of Object.entries(obj)) {
      translated[key] = await translateObject(value, targetLang, depth + 1)
    }
    return translated
  }
  
  return obj
}

// Read English file
function readEnglishFile(namespace) {
  const filePath = path.join(enDir, `${namespace}.json`)
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch (e) {
      console.error(`Error reading ${filePath}:`, e.message)
      return null
    }
  }
  return null
}

// Write translated file
function writeTranslationFile(lang, namespace, data) {
  const langDir = path.join(localesDir, lang)
  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir, { recursive: true })
  }
  
  const filePath = path.join(langDir, `${namespace}.json`)
  const jsonContent = JSON.stringify(data, null, 2) + '\n'
  fs.writeFileSync(filePath, jsonContent, 'utf8')
}

// Main translation function
async function translateAllLanguages() {
  console.log('🚀 Starting bulk translation for all languages...\n')
  console.log('⚠️  NOTE: This script uses English as placeholder.')
  console.log('   For actual translations, integrate with Google Translate API or DeepL.\n')
  
  let totalFiles = 0
  let processedFiles = 0
  
  for (const lang of targetLanguages) {
    console.log(`📝 Processing language: ${lang}`)
    
    for (const namespace of namespaces) {
      totalFiles++
      const enData = readEnglishFile(namespace)
      
      if (!enData || Object.keys(enData).length === 0) {
        continue
      }
      
      try {
        // For now, copy English structure
        // In production, uncomment the translation line below
        // const translatedData = await translateObject(enData, lang)
        const translatedData = enData // Using English as placeholder for now
        
        writeTranslationFile(lang, namespace, translatedData)
        processedFiles++
      } catch (error) {
        console.error(`   ❌ Error translating ${namespace} for ${lang}:`, error.message)
      }
    }
    
    console.log(`   ✓ Completed ${lang}\n`)
  }
  
  console.log('✅ Translation file generation complete!\n')
  console.log(`📊 Summary:`)
  console.log(`   - Files processed: ${processedFiles}/${totalFiles}`)
  console.log(`   - Languages: ${targetLanguages.length}`)
  console.log(`   - Namespaces: ${namespaces.length}\n`)
  
  console.log('💡 To enable actual translations:')
  console.log('   1. Get API key from Google Translate, DeepL, or similar')
  console.log('   2. Uncomment the translateObject call in the script')
  console.log('   3. Implement the translateText function with your API')
  console.log('   4. Run the script again\n')
  
  console.log('✨ All files now have English structure and are ready for translation!\n')
}

// Run
translateAllLanguages().catch(console.error)

