'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'

type TenantHealth = {
  tenantId: string
  tenantName: string
  isActive: boolean
  azureConnected: boolean
  lastScan: string | null
  lastScanStatus: string | null
  lastScanAge: number | null
  totalScans: number
  successScans: number
  failedScans: number
  resourcesScanned: number
  status: 'healthy' | 'warning' | 'error' | 'inactive'
}

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/customers', label: 'Müşteriler', color: 'text-purple-400', bg: 'bg-purple-500/10', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/admin/health', label: 'Sistem Sağlığı', color: 'text-green-400', bg: 'bg-green-500/10', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/admin/announcements', label: 'Duyurular', color: 'text-pink-400', bg: 'bg-pink-500/10', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
]

function StatusBadge({ status }: { status: TenantHealth['status'] }) {
  const config = {
    healthy: { bg: 'bg-green-900/50', text: 'text-green-400', label: '✓ Sağlıklı', dot: 'bg-green-500' },
    warning: { bg: 'bg-yellow-900/50', text: 'text-yellow-400', label: '⚠ Uyarı', dot: 'bg-yellow-500' },
    error: { bg: 'bg-red-900/50', text: 'text-red-400', label: '✕ Hata', dot: 'bg-red-500' },
    inactive: { bg: 'bg-gray-800', text: 'text-gray-500', label: '○ Pasif', dot: 'bg-gray-600' },
  }
  const c = config[status]
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 w-fit ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

export default function AdminHealthPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadHealth() }, [])

  async function loadHealth() {
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/health', {
      headers: { 'x-admin-token': token || '' },
    })
    if (res.ok) {
      const d = await res.json()
      setData(d)
    }
    setLoading(false)
    setRefreshing(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadHealth()
    toast.success('Sistem sağlığı güncellendi')
  }

  const filteredTenants = data?.tenantHealth?.filter((t: TenantHealth) => {
    if (filter === 'all') return true
    return t.status === filter
  }) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { platform, failedScans, recentScans } = data || {}

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
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all',
                item.href === '/admin/health'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
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
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={() => { document.cookie = 'admin_token=; path=/; max-age=0'; localStorage.clear(); window.location.href = '/admin/login' }}
            className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-gray-800/70 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Ana İçerik */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-sm font-semibold text-white">Sistem Sağlığı</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Yenile
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">

          {/* Platform Skoru */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 mb-6 border ${
              platform?.score >= 80 ? 'bg-green-900/20 border-green-800/30' :
              platform?.score >= 60 ? 'bg-yellow-900/20 border-yellow-800/30' :
              'bg-red-900/20 border-red-800/30'
            }`}
          >
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className={`text-5xl font-black ${
                  platform?.score >= 80 ? 'text-green-400' :
                  platform?.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>{platform?.score}</p>
                <p className="text-xs text-gray-500 mt-1">Platform Skoru</p>
              </div>
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Sağlıklı', value: platform?.healthy, color: 'text-green-400' },
                  { label: 'Uyarı', value: platform?.warning, color: 'text-yellow-400' },
                  { label: 'Hata', value: platform?.error, color: 'text-red-400' },
                  { label: 'Pasif', value: platform?.inactive, color: 'text-gray-500' },
                ].map((item, i) => (
                  <div key={i} className="bg-black/20 rounded-xl p-3 text-center">
                    <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Son 24 saat</p>
                <p className="text-2xl font-bold text-blue-400">{platform?.totalScans24h}</p>
                <p className="text-xs text-gray-500">tarama</p>
                {platform?.failedScans7d > 0 && (
                  <p className="text-xs text-red-400 mt-2">{platform?.failedScans7d} hata (7 gün)</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Filtreler */}
          <div className="flex items-center gap-2 mb-4">
            {[
              { key: 'all', label: 'Tümü', count: data?.tenantHealth?.length },
              { key: 'healthy', label: '✓ Sağlıklı', count: platform?.healthy },
              { key: 'warning', label: '⚠ Uyarı', count: platform?.warning },
              { key: 'error', label: '✕ Hata', count: platform?.error },
              { key: 'inactive', label: '○ Pasif', count: platform?.inactive },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {f.label}
                <span className="bg-black/20 px-1.5 py-0.5 rounded-full">{f.count}</span>
              </button>
            ))}
          </div>

          {/* Müşteri Sağlık Tablosu */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6"
          >
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Müşteri Sağlık Durumu</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Müşteri</th>
                  <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Durum</th>
                  <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Azure</th>
                  <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Son Tarama</th>
                  <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Toplam</th>
                  <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Başarı/Hata</th>
                  <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((t: TenantHealth, i: number) => (
                  <motion.tr
                    key={t.tenantId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          t.status === 'healthy' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                          t.status === 'warning' ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                          t.status === 'error' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gray-700'
                        }`}>
                          {t.tenantName?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{t.tenantName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        t.azureConnected ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-800 text-gray-500'
                      }`}>
                        {t.azureConnected ? '✓ Bağlı' : '✗ Yok'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {t.lastScan ? (
                        <div>
                          <p>{new Date(t.lastScan).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                          <p className={`mt-0.5 ${t.lastScanAge && t.lastScanAge > 48 ? 'text-yellow-400' : 'text-gray-600'}`}>
                            {t.lastScanAge !== null ? `${t.lastScanAge} saat önce` : '-'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-600">Hiç taranmadı</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{t.totalScans}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-400">{t.successScans} ✓</span>
                        {t.failedScans > 0 && (
                          <span className="text-xs text-red-400">{t.failedScans} ✕</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/customers/${t.tenantId}`}
                        className="text-xs bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-800/30 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Detay
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Hatalı Taramalar */}
          {failedScans?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900 border border-red-900/30 rounded-xl overflow-hidden mb-6"
            >
              <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-sm font-semibold text-white">Son 7 Günde Hatalı Taramalar</h3>
                <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full ml-auto">{failedScans.length} hata</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Müşteri</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Tarih</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Hata</th>
                  </tr>
                </thead>
                <tbody>
                  {failedScans.map((scan: any, i: number) => (
                    <tr key={i} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30">
                      <td className="px-6 py-3 text-white">{scan.tenants?.name || '-'}</td>
                      <td className="px-6 py-3 text-gray-400 text-xs">
                        {new Date(scan.started_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-3 text-red-400 text-xs">{scan.error_message || 'Bilinmeyen hata'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {/* Son Taramalar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Son 24 Saat Tarama Aktivitesi</h3>
            </div>
            {recentScans?.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 text-sm">Son 24 saatte tarama yapılmamış</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Tarih</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Kaynak</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Öneri</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans?.map((scan: any, i: number) => (
                    <tr key={i} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30">
                      <td className="px-6 py-3 text-gray-400 text-xs">
                        {new Date(scan.started_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-3 text-white">{scan.resources_scanned || 0}</td>
                      <td className="px-6 py-3 text-white">{scan.recommendations_found || 0}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          scan.status === 'success' ? 'bg-green-900/50 text-green-400' :
                          scan.status === 'running' ? 'bg-blue-900/50 text-blue-400' :
                          'bg-red-900/50 text-red-400'
                        }`}>
                          {scan.status === 'success' ? 'Başarılı' : scan.status === 'running' ? 'Çalışıyor' : 'Hata'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}