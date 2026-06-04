'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'
import AdminSidebar from '@/components/admin/AdminSidebar'

function ActivityTab({ tenantId }: { tenantId: string }) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)

  useEffect(() => { loadLogs() }, [page])

  async function loadLogs() {
    const token = localStorage.getItem('admin_token')
    const res = await fetch(
      `/api/admin/activity?tenantId=${tenantId}&page=${page}&limit=20`,
      { headers: { 'x-admin-token': token || '' } }
    )
    if (res.ok) {
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
    }
    setLoading(false)
  }

  const actionLabel: Record<string, { label: string; color: string; icon: string }> = {
    login: { label: 'Giriş', color: 'text-green-400 bg-green-900/30', icon: '🔑' },
    logout: { label: 'Çıkış', color: 'text-gray-400 bg-gray-800', icon: '🚪' },
    scan_started: { label: 'Tarama Başladı', color: 'text-blue-400 bg-blue-900/30', icon: '🔍' },
    scan_completed: { label: 'Tarama Tamamlandı', color: 'text-blue-400 bg-blue-900/30', icon: '✅' },
    recommendation_applied: { label: 'Öneri Uygulandı', color: 'text-emerald-400 bg-emerald-900/30', icon: '💡' },
    recommendation_dismissed: { label: 'Öneri Reddedildi', color: 'text-yellow-400 bg-yellow-900/30', icon: '❌' },
    azure_connected: { label: 'Azure Bağlandı', color: 'text-blue-400 bg-blue-900/30', icon: '☁️' },
    subscription_added: { label: 'Subscription Eklendi', color: 'text-purple-400 bg-purple-900/30', icon: '➕' },
    subscription_removed: { label: 'Subscription Silindi', color: 'text-red-400 bg-red-900/30', icon: '➖' },
    settings_updated: { label: 'Ayarlar Güncellendi', color: 'text-gray-400 bg-gray-800', icon: '⚙️' },
    report_exported: { label: 'Rapor İndirildi', color: 'text-green-400 bg-green-900/30', icon: '📊' },
    budget_updated: { label: 'Bütçe Güncellendi', color: 'text-yellow-400 bg-yellow-900/30', icon: '💰' },
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-800 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-800 rounded w-32" />
                <div className="h-3 bg-gray-800 rounded w-48" />
              </div>
              <div className="h-3 bg-gray-800 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-500 text-sm">Henüz aktivite kaydı yok</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-500">{total} aktivite kaydı</p>
      </div>
      {logs.map((log) => {
        const config = actionLabel[log.action] || { label: log.action, color: 'text-gray-400 bg-gray-800', icon: '📝' }
        return (
          <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-gray-500 truncate">{log.user_email}</span>
                </div>
                {log.details && Object.keys(log.details).length > 0 && (
                  <p className="text-xs text-gray-600 truncate">
                    {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-500">
                  {new Date(log.created_at).toLocaleDateString('tr-TR', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
                {log.ip_address && log.ip_address !== 'unknown' && (
                  <p className="text-xs text-gray-700">{log.ip_address}</p>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {total > 20 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            {page * 20 + 1} - {Math.min((page + 1) * 20, total)} / {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              ← Önceki
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * 20 >= total}
              className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sonraki →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.id as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)

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

  async function handleResetPassword() {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı')
      return
    }
    setResettingPassword(true)
    try {
      const token = localStorage.getItem('admin_token')
      const userId = data?.users?.[0]?.id
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token || '' },
        body: JSON.stringify({ userId, newPassword }),
      })
      const d = await res.json()
      if (d.success) {
        toast.success('Şifre başarıyla sıfırlandı!')
        setShowPasswordModal(false)
        setNewPassword('')
      } else {
        toast.error(d.error || 'Şifre sıfırlanamadı')
      }
    } catch {
      toast.error('Hata oluştu')
    }
    setResettingPassword(false)
  }

  async function handleUpdatePlan(plan: string) {
    const token = localStorage.getItem('admin_token')
    const toastId = toast.loading('Plan güncelleniyor...')
    const res = await fetch('/api/admin/update-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token || '' },
      body: JSON.stringify({ tenantId, plan }),
    })
    const d = await res.json()
    if (d.success) {
      toast.success(`Plan ${plan === 'pro' ? 'Pro' : 'Free'} olarak güncellendi!`, { id: toastId })
      loadDetail()
    } else {
      toast.error(d.error || 'Plan güncellenemedi', { id: toastId })
    }
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

      <AdminSidebar />

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
            <span className={`text-xs px-2 py-0.5 rounded-full ${tenant?.plan === 'pro' ? 'bg-purple-900/50 text-purple-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
              {tenant?.plan === 'pro' ? '⚡ Pro' : '🆓 Free'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/30 text-yellow-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Şifre Sıfırla
            </button>
            <button
              onClick={handleScan}
              disabled={scanning || !tenant?.azure_subscription_id}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              {scanning ? (
                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Taranıyor...</>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Tara
                </>
              )}
            </button>
          </div>
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
                <p className="text-gray-500 text-xs mt-0.5">
                  Kayıt: {new Date(tenant?.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
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

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { key: 'overview', label: 'Genel Bakış' },
              { key: 'resources', label: `Kaynaklar (${stats.resourceCount})` },
              { key: 'recommendations', label: `Öneriler (${stats.openRecs})` },
              { key: 'scans', label: `Taramalar (${stats.scanCount})` },
              { key: 'activity', label: 'Aktivite Logu' },
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

          {/* Genel Bakış */}
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

              {/* Plan Yönetimi */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Plan Yönetimi</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">
                      {tenant?.plan === 'pro' ? '⚡ Pro Plan' : '🆓 Free Plan'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tenant?.plan === 'pro'
                        ? `Pro'ya geçiş: ${tenant?.plan_upgraded_at ? new Date(tenant.plan_upgraded_at).toLocaleDateString('tr-TR') : '-'}`
                        : `Deneme bitiş: ${tenant?.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleDateString('tr-TR') : '-'}`
                      }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {tenant?.plan !== 'pro' && (
                      <button
                        onClick={() => handleUpdatePlan('pro')}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Pro&apos;ya Geç
                      </button>
                    )}
                    {tenant?.plan === 'pro' && (
                      <button
                        onClick={() => handleUpdatePlan('free')}
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Free&apos;ye Düşür
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Azure Bilgileri */}
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

              {/* Kullanıcılar */}
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

          {/* Kaynaklar */}
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

          {/* Öneriler */}
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

          {/* Taramalar */}
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

          {/* Aktivite Logu */}
          {activeTab === 'activity' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ActivityTab tenantId={tenantId} />
            </motion.div>
          )}
        </main>
      </div>

      {/* Şifre Sıfırlama Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Şifre Sıfırla</h3>
                <p className="text-xs text-gray-500 mt-0.5">{data?.users?.[0]?.email}</p>
              </div>
              <button
                onClick={() => { setShowPasswordModal(false); setNewPassword('') }}
                className="text-gray-500 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Yeni Şifre</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPasswordModal(false); setNewPassword('') }}
                  className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={resettingPassword}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {resettingPassword ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : 'Sıfırla'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}