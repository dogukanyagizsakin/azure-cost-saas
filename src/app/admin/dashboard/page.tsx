'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const [adminName, setAdminName] = useState('')
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalResources: 0,
    totalRecommendations: 0,
  })
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const name = localStorage.getItem('admin_name') || 'Admin'
    setAdminName(name)
    loadStats()
  }, [])

  async function loadStats() {
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/stats', {
      headers: { 'x-admin-token': token || '' },
    })
    if (res.ok) {
      const data = await res.json()
      setStats(data.stats)
      setCustomers(data.customers)
    }
    setLoading(false)
  }

  async function handleLogout() {
    document.cookie = 'admin_token=; path=/; max-age=0'
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_name')
    window.location.href = '/admin/login'
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
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

        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-xs text-gray-600 uppercase tracking-wider px-2 mb-2">Menü</p>

          <Link href="/admin/dashboard" className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-sm font-medium">Dashboard</span>
          </Link>

          <Link href="/admin/customers" className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/70 transition-all">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Müşteriler</span>
            {stats.totalCustomers > 0 && (
              <span className="ml-auto text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">
                {stats.totalCustomers}
              </span>
            )}
          </Link>

          <Link href="/admin/health" className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/70 transition-all">
            <div className="p-1.5 rounded-lg bg-green-500/10 text-green-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Sistem Sağlığı</span>
          </Link>

<Link href="/admin/announcements" className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/70 transition-all">
  <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  </div>
  <span className="text-sm font-medium">Duyurular</span>
</Link>

<Link href="/admin/support" className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/70 transition-all">
  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </div>
  <span className="text-sm font-medium">Destek Talepleri</span>
</Link>
        </nav>

        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-800/70 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {adminName[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{adminName}</p>
              <p className="text-xs text-gray-500">Süper Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Çıkış Yap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Ana İçerik */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-sm font-semibold text-white">Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-800/30 px-2 py-1 rounded-lg">
              🔐 Admin Panel
            </span>
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors" target="_blank">
              Siteye Git ↗
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800/30 rounded-2xl p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-white mb-1">Hoş geldiniz, {adminName}! 👋</h2>
            <p className="text-gray-400 text-sm">UnifyTech CostPilot yönetim paneline hoş geldiniz.</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Toplam Müşteri', value: stats.totalCustomers, icon: '👥', color: 'text-blue-400' },
              { label: 'Aktif Müşteri', value: stats.activeCustomers, icon: '✅', color: 'text-green-400' },
              { label: 'Toplam Kaynak', value: stats.totalResources, icon: '☁️', color: 'text-purple-400' },
              { label: 'Toplam Öneri', value: stats.totalRecommendations, icon: '💡', color: 'text-yellow-400' },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{card.label}</p>
                  <span className="text-xl">{card.icon}</span>
                </div>
                <p className={`text-3xl font-bold ${card.color}`}>{loading ? '...' : card.value}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-white">Son Müşteriler</h3>
              <Link href="/admin/customers" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Tümünü Gör →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm mb-4">Henüz müşteri yok</p>
                <Link href="/admin/customers" className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors inline-block">
                  İlk Müşteriyi Ekle
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {customers.slice(0, 5).map((customer, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        customer.is_active ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-700'
                      }`}>
                        {customer.name?.[0]?.toUpperCase() || 'M'}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{customer.resource_count || 0} kaynak</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        customer.is_active ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'
                      }`}>
                        {customer.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Detay →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}