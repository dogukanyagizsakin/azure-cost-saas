'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isDark = theme === 'dark'

  function handleToggle() {
    const newTheme = isDark ? 'light' : 'dark'
    console.log('Theme changing to:', newTheme)
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    document.documentElement.classList.toggle('light', newTheme === 'light')
  }

  return (
    <button
      onClick={handleToggle}
      className="relative w-10 h-5 rounded-full transition-colors duration-300 focus:outline-none"
      style={{ background: isDark ? '#2461ff' : '#e5e7eb' }}
      title={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
    >
      <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center text-xs ${
        isDark ? 'translate-x-5 bg-white' : 'translate-x-0.5 bg-white'
      }`}>
        {isDark ? '🌙' : '☀️'}
      </div>
    </button>
  )
}