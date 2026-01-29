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
  'common', 'dashboard', 'agent', 'cashier', 'secretary', 'systemAdmin'
]

const localesDir = path.join(__dirname, 'public', 'locales')
const enDir = path.join(localesDir, 'en')

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return {}
  }
}

function writeJSON(filePath, data) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function deepMerge(target, source) {
  const result = { ...target }
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && typeof target[key] === 'object' && target[key] !== null) {
      result[key] = deepMerge(target[key], value)
    } else if (!(key in result)) {
      result[key] = value
    }
  }
  return result
}

console.log('🚀 Quick updating all translation files...\n')

let total = 0
for (const lang of targetLanguages) {
  for (const ns of namespaces) {
    const enFile = path.join(enDir, `${ns}.json`)
    const langFile = path.join(localesDir, lang, `${ns}.json`)
    
    const enData = readJSON(enFile)
    if (Object.keys(enData).length === 0) continue
    
    const existing = readJSON(langFile)
    const merged = deepMerge(existing, enData)
    writeJSON(langFile, merged)
    total++
  }
  process.stdout.write(`✓ ${lang} `)
}

console.log(`\n\n✅ Updated ${total} files across ${targetLanguages.length} languages!\n`)

