# Locales Directory

This directory contains JSON translation files for all supported languages in UMURENGE WALLET.

## Supported Languages

1. **English (en)** - Default language
2. **Kinyarwanda (rw)** - National language of Rwanda
3. **Français (fr)** - French
4. **Kiswahili (sw)** - Swahili
5. **العربية (ar)** - Arabic (RTL support)
6. **Español (es)** - Spanish
7. **中文 (zh)** - Chinese (Simplified)
8. **हिन्दी (hi)** - Hindi

## Translation Structure

All translation files follow the same JSON structure:

```json
{
  "common": {
    "welcome": "...",
    "login": "...",
    ...
  },
  "landing": {
    "heroTitle": "...",
    "heroSubtitle": "...",
    ...
  },
  "navigation": {
    "about": "...",
    ...
  },
  "features": {
    "mobileMoney": {
      "title": "...",
      "desc": "..."
    },
    ...
  }
}
```

## Usage

```javascript
import { t } from '../utils/i18n'
import { useLanguage } from '../contexts/LanguageContext'

function MyComponent() {
  const { language } = useLanguage()
  
  return <h1>{t('landing.heroTitle', language)}</h1>
}
```

## Adding New Translations

1. Add the translation key to all language files
2. Use nested structure for organization (e.g., `section.subsection.key`)
3. Always provide English fallback
4. Test with RTL languages (Arabic) for proper layout

## Language Detection

- Language preference is saved in `localStorage` as `umurenge-language`
- Defaults to English if language not found
- Automatically switches document direction for RTL languages

