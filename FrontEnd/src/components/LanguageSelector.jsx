import React, { useState, useRef, useEffect } from 'react'
import { Globe, ChevronDown } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

function LanguageSelector() {
  const { language, changeLanguage, languages } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const currentLang = languages.find(lang => lang.code === language)

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Globe size={18} />
        <span className="hidden sm:block text-sm font-medium">
          {currentLang?.flag} {currentLang?.name}
        </span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-fadeIn max-h-96 overflow-y-auto">
          <div className="p-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  changeLanguage(lang.code)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  language === lang.code
                    ? 'bg-primary-50 text-primary-600 font-semibold'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="font-medium flex-1">{lang.name}</span>
                {language === lang.code && (
                  <span className="text-primary-600 font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LanguageSelector


