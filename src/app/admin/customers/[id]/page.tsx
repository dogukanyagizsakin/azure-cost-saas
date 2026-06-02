'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.id as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => { loadDetail() }, [])

  async function loadDetail() {
    const token = localStorage.getItem('admin_token')
    const res = await fetch(`/api/admin/customer-detail?tenantId=${tenantId}`, {
      headers: { 'x-admin-token': token || '' },
    })
    if (res.ok) {
      const d = await res.json()
      setData(d)
    }
    setLoading(false)
  }

  async function handleScan() {
    setScanning(true)
    const toastId = toast.loading('Tarama başlatılıyor...')
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/scan-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token || '' },
        body: JSON.stringify({ tenantId }),
      })
      const d = await res.json()
      if (d.success) {
        toast.success(`Tarama tamamlandı! ${d.resourcesScanned} kaynak bulundu.`, { id: toastId })
        loadDetail()
      } else {
        toast.error(d.error || 'Tarama başarısız', { id: toastId })
      }
    } catch {
      toast.error('Hata oluştu', { id: toastId })
    }
    setScanning(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">Müşteri bulunamadı</p>
          <Link href="/admin/customers" className="text-blue-400 hover:text-blue-300">Geri Dön</Link>
        </div>
      </div>
    )
  }

  const { tenant, users, resources, recommendations, scanLogs, stats } = data

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
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/70 transition-all">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link href="/admin/customers" className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Müşteriler</span>
          </Link>
          <Link href="/admin/health" className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/70 transition-all">
            <div className="p-1.5 rounded-lg bg-green-500/10 text-green-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Sistem Sağlığı</span>
          </Link>
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
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin/customers')} className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-sm font-semibold text-white">{tenant?.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${tenant?.is_active ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
              {tenant?.is_active ? '● Aktif' : '○ Pasif'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${tenant?.azure_subscription_id ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
              {tenant?.azure_subscription_id ? '✓ Azure Bağlı' : '✗ Azure Yok'}
            </span>
          </div>
          <button
            onClick={handleScan}
            disabled={scanning || !tenant?.azure_subscription_id}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            {scanning ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Taranıyor...</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Tara</>
            )}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {tenant?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{tenant?.name}</h2>
                <p className="text-gray-400 text-sm">{users?.[0]?.email}</p>
                <p className="text-gray-500 text-xs mt-0.5">Kayıt: {new Date(tenant?.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{stats.resourceCount}</p>
                  <p className="text-xs text-gray-500">Kaynak</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">{stats.openRecs}</p>
                  <p className="text-xs text-gray-500">Öneri</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">${stats.totalSaving.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">Tasarruf</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { key: 'overview', label: 'Genel Bakış' },
              { key: 'resources', label: `Kaynaklar (${stats.resourceCount})` },
              { key: 'recommendations', label: `Öneriler (${stats.openRecs})` },
              { key: 'scans', label: `Taramalar (${stats.scanCount})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Toplam Kaynak', value: stats.resourceCount, color: 'text-white', sub: `${stats.activeResources} aktif` },
                  { label: 'Açık Öneri', value: stats.openRecs, color: 'text-yellow-400', sub: `${stats.appliedRecs} uygulandı` },
                  { label: 'Tasarruf Fırsatı', value: `$${stats.totalSaving.toFixed(0)}`, color: 'text-emerald-400', sub: 'aylık' },
                  { label: 'Toplam Tarama', value: stats.scanCount, color: 'text-blue-400', sub: 'toplam' },
                ].map((card, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-xs text-gray-600 mt-1">{card.sub}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Azure Bağlantı Bilgileri</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Subscription ID', value: tenant?.azure_subscription_id || 'Bağlantı yapılmamış' },
                    { label: 'Aylık Bütçe', value: tenant?.monthly_budget ? `$${tenant.monthly_budget}` : 'Belirlenmemiş' },
                    { label: 'Alert Eşiği', value: tenant?.budget_alert_threshold ? `%${tenant.budget_alert_threshold}` : 'Belirlenmemiş' },
                    { label: 'Hesap Durumu', value: tenant?.is_active ? 'Aktif' : 'Pasif' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                      <span className="text-xs text-gray-500">{item.label}</span>
                      <span className="text-xs text-gray-300 font-mono">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Kullanıcılar ({users?.length})</h3>
                <div className="space-y-2">
                  {users?.map((user: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {user.email?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm text-white">{user.name || user.email}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded">{user.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'resources' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {resources?.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                  <p className="text-gray-500">Henüz kaynak taranmamış</p>
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Kaynak Adı</th>
                        <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Tür</th>
                        <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Konum</th>
                        <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resources?.map((r: any, i: number) => (
                        <tr key={i} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30">
                          <td className="px-6 py-3 text-white font-medium">{r.name}</td>
                          <td className="px-6 py-3 text-gray-400 text-xs">{r.resource_type?.split('/').pop()}</td>
                          <td className="px-6 py-3 text-gray-400 text-xs">{r.location || '-'}</td>
                          <td className="px-6 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_active ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                              {r.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'recommendations' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {recommendations?.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                  <p className="text-gray-500">Henüz öneri bulunamadı</p>
                </div>
              ) : (
                recommendations?.map((r: any, i: number) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-700 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-white font-medium">{r.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          r.estimated_monthly_saving >= 500 ? 'bg-red-900/50 text-red-400' :
                          r.estimated_monthly_saving >= 200 ? 'bg-yellow-900/50 text-yellow-400' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {r.estimated_monthly_saving >= 500 ? 'Yüksek' : r.estimated_monthly_saving >= 200 ? 'Orta' : 'Düşük'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{r.resources?.name}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="text-emerald-400 font-semibold text-sm">+${r.estimated_monthly_saving.toFixed(0)}/ay</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.status === 'open' ? 'bg-yellow-900/50 text-yellow-400' :
                        r.status === 'applied' ? 'bg-green-900/50 text-green-400' :
                        'bg-gray-800 text-gray-500'
                      }`}>
                        {r.status === 'open' ? 'Açık' : r.status === 'applied' ? 'Uygulandı' : 'Reddedildi'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'scans' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {scanLogs?.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                  <p className="text-gray-500">Henüz tarama yapılmamış</p>
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Tarih</th>
                        <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Kaynak</th>
                        <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Öneri</th>
                        <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Süre</th>
                        <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanLogs?.map((log: any, i: number) => {
                        const duration = log.finished_at
                          ? Math.round((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000)
                          : null
                        return (
                          <tr key={i} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30">
                            <td className="px-6 py-3 text-gray-400 text-xs">
                              {new Date(log.started_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-3 text-white">{log.resources_scanned || 0}</td>
                            <td className="px-6 py-3 text-white">{log.recommendations_found || 0}</td>
                            <td className="px-6 py-3 text-gray-400">{duration ? `${duration}s` : '-'}</td>
                            <td className="px-6 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                log.status === 'success' ? 'bg-green-900/50 text-green-400' :
                                log.status === 'running' ? 'bg-blue-900/50 text-blue-400' :
                                'bg-red-900/50 text-red-400'
                              }`}>
                                {log.status === 'success' ? 'Başarılı' : log.status === 'running' ? 'Çalışıyor' : 'Hata'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}