'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg p-0.5">
      <button
        onClick={() => setLanguage('tr')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
          language === 'tr'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <span className="text-sm">🇹🇷</span>
        TR
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
          language === 'en'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <span className="text-sm">🇬🇧</span>
        EN
      </button>
    </div>
  )
}