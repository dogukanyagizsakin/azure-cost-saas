'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const navItems = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    activeBg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    href: '/admin/customers',
    label: 'Müşteriler',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    activeBg: 'bg-purple-500/20',
    border: 'border-purple-500/30',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    href: '/admin/health',
    label: 'Sistem Sağlığı',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    activeBg: 'bg-green-500/20',
    border: 'border-green-500/30',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    href: '/admin/announcements',
    label: 'Duyurular',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    activeBg: 'bg-pink-500/20',
    border: 'border-pink-500/30',
    icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
  },
  {
    href: '/admin/support',
    label: 'Destek Talepleri',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    activeBg: 'bg-cyan-500/20',
    border: 'border-cyan-500/30',
    icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [adminName, setAdminName] = useState('Admin')

  useEffect(() => {
    setAdminName(localStorage.getItem('admin_name') || 'Admin')
  }, [])

  function handleLogout() {
    document.cookie = 'admin_token=; path=/; max-age=0'
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_name')
    window.location.href = '/admin/login'
  }

  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-0.5">
              <span className="text-white font-bold text-sm">Unify</span>
              <span className="text-blue-400 font-light text-sm">Tech</span>
            </div>
            <p className="text-gray-500 text-xs font-medium tracking-widest uppercase">Admin</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-xs text-gray-600 uppercase tracking-wider px-2 mb-2">Menü</p>
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all',
                isActive
                  ? `${item.activeBg} ${item.color} border ${item.border}`
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
              ].join(' ')}
            >
              <div className={`p-1.5 rounded-lg ${item.bg} ${item.color}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Kullanıcı */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-800/70 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {adminName[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{adminName}</p>
            <p className="text-xs text-gray-500">Süper Admin</p>
          </div>
          <button onClick={handleLogout} className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" title="Çıkış Yap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}