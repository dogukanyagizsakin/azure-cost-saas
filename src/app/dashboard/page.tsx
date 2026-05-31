'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const costTrend = [
  { gun: 'Pzt', maliyet: 1240 },
  { gun: 'Sal', maliyet: 1380 },
  { gun: 'Çar', maliyet: 1190 },
  { gun: 'Per', maliyet: 1520 },
  { gun: 'Cum', maliyet: 1350 },
  { gun: 'Cmt', maliyet: 980 },
  { gun: 'Paz', maliyet: 1100 },
]

const resourceDist = [
  { name: 'Virtual Machines', value: 4200, color: '#3b82f6' },
  { name: 'Storage', value: 1800, color: '#8b5cf6' },
  { name: 'SQL Database', value: 2100, color: '#06b6d4' },
  { name: 'App Service', value: 900, color: '#10b981' },
  { name: 'Diğer', value: 600, color: '#6b7280' },
]

const topResources = [
  { name: 'prod-vm-01', type: 'Virtual Machine', group: 'production-rg', maliyet: 820, durum: 'idle' },
  { name: 'sqldb-main', type: 'SQL Database', group: 'data-rg', maliyet: 640, durum: 'active' },
  { name: 'storage-backup', type: 'Storage Account', group: 'backup-rg', maliyet: 410, durum: 'orphan' },
  { name: 'app-service-api', type: 'App Service', group: 'production-rg', maliyet: 380, durum: 'active' },
  { name: 'dev-vm-02', type: 'Virtual Machine', group: 'dev-rg', maliyet: 340, durum: 'idle' },
]

const recommendations = [
  { kaynak: 'prod-vm-01', tip: 'Boşta VM', tasarruf: 820, oncelik: 'yüksek' },
  { kaynak: 'dev-vm-02', tip: 'Boşta VM', tasarruf: 340, oncelik: 'yüksek' },
  { kaynak: 'storage-backup', tip: 'Orphan Kaynak', tasarruf: 410, oncelik: 'orta' },
  { kaynak: 'sqldb-staging', tip: 'Aşırı Boyutlu', tasarruf: 280, oncelik: 'orta' },
  { kaynak: 'old-public-ip', tip: 'Kullanılmayan IP', tasarruf: 120, oncelik: 'düşük' },
]

const scanLogs = [
  { zaman: '2 saat önce', kaynak: 47, öneri: 5, durum: 'success' },
  { zaman: '10 saat önce', kaynak: 45, öneri: 4, durum: 'success' },
  { zaman: '18 saat önce', kaynak: 46, öneri: 6, durum: 'success' },
  { zaman: '1 gün önce', kaynak: 44, öneri: 3, durum: 'failed' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/auth/login')
      } else {
        setEmail(session.user.email || '')
        setLoading(false)
      }
    })
  }, [router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalMaliyet = 9600
  const tasarrufFirsati = 1970
  const aktifKaynak = 47
  const sonTarama = '2 saat önce'

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
<span className="text-white font-bold text-xl tracking-tight">UnifyTech</span>
            <span className="text-gray-500 text-xs tracking-widest ml-1">AZURE COST</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-gray-400">Azure bağlı</span>
            </div>
            <span className="text-sm text-gray-400">{email}</span>
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              Çıkış
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Sayfa başlığı */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Maliyet Genel Bakış</h1>
            <p className="text-gray-500 text-sm mt-1">Son tarama: {sonTarama} · Sonraki tarama: 6 saat sonra</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Şimdi Tara
          </button>
        </div>

        {/* Metrik Kartlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Aylık Toplam Maliyet</p>
            <p className="text-3xl font-bold text-white">${totalMaliyet.toLocaleString()}</p>
            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
              <span>↑ %12</span>
              <span className="text-gray-600">geçen aya göre</span>
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tasarruf Fırsatı</p>
            <p className="text-3xl font-bold text-green-400">${tasarrufFirsati.toLocaleString()}</p>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <span>%{Math.round(tasarrufFirsati / totalMaliyet * 100)} tasarruf mümkün</span>
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Aktif Kaynak</p>
            <p className="text-3xl font-bold text-white">{aktifKaynak}</p>
            <p className="text-xs text-yellow-500 mt-2">5 kaynak dikkat gerektiriyor</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Açık Öneri</p>
            <p className="text-3xl font-bold text-white">5</p>
            <p className="text-xs text-gray-500 mt-2">Son tarama: {sonTarama}</p>
          </div>
        </div>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Maliyet Trendi */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-6">Son 7 Günlük Maliyet Trendi</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={costTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="gun" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(v: number) => [`$${v}`, 'Maliyet']}
                />
                <Line type="monotone" dataKey="maliyet" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Dağılım */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-6">Kaynak Türü Dağılımı</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={resourceDist} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {resourceDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                  formatter={(v: number) => [`$${v}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {resourceDist.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-400">{item.name}</span>
                  </div>
                  <span className="text-xs text-white font-medium">${item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alt tablolar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* En Pahalı Kaynaklar */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">En Pahalı Kaynaklar</h2>
            <div className="space-y-3">
              {topResources.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${r.durum === 'idle' ? 'bg-yellow-500' : r.durum === 'orphan' ? 'bg-red-500' : 'bg-green-500'}`} />
                    <div>
                      <p className="text-sm text-white font-medium">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.type} · {r.group}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">${r.maliyet}</p>
                    <p className="text-xs text-gray-600">/ay</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optimizasyon Önerileri */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Optimizasyon Önerileri</h2>
            <div className="space-y-3">
              {recommendations.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.oncelik === 'yüksek' ? 'bg-red-900/50 text-red-400' :
                      r.oncelik === 'orta' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {r.oncelik}
                    </span>
                    <div>
                      <p className="text-sm text-white font-medium">{r.kaynak}</p>
                      <p className="text-xs text-gray-500">{r.tip}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-400">+${r.tasarruf}</p>
                    <p className="text-xs text-gray-600">tasarruf</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tarama Logları */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Son Tarama Logları</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                  <th className="text-left pb-3">Zaman</th>
                  <th className="text-left pb-3">Taranan Kaynak</th>
                  <th className="text-left pb-3">Bulunan Öneri</th>
                  <th className="text-left pb-3">Durum</th>
                </tr>
              </thead>
              <tbody>
                {scanLogs.map((log, i) => (
                  <tr key={i} className="border-b border-gray-800 last:border-0">
                    <td className="py-3 text-gray-400">{log.zaman}</td>
                    <td className="py-3 text-white">{log.kaynak}</td>
                    <td className="py-3 text-white">{log.öneri}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        log.durum === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {log.durum === 'success' ? 'Başarılı' : 'Hata'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}