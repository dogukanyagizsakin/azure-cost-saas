'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import AdminSidebar from '@/components/admin/AdminSidebar'

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

      <AdminSidebar />

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