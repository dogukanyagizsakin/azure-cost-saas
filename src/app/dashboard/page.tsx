'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
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

const monthlyComparison = [
  { ay: 'Oca', maliyet: 7200 },
  { ay: 'Şub', maliyet: 8100 },
  { ay: 'Mar', maliyet: 7800 },
  { ay: 'Nis', maliyet: 8600 },
  { ay: 'May', maliyet: 8200 },
  { ay: 'Haz', maliyet: 9600 },
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
  const totalMaliyet = 9600
  const tasarrufFirsati = 1970
  const aktifKaynak = 47
  const tahmin = 11200

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-gray-500">Son tarama: <span className="text-gray-400">2 saat önce</span> · Sonraki tarama: <span className="text-gray-400">6 saat sonra</span></p>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500">Subscription: <span className="text-blue-400">UnifyTech Production</span></p>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Şimdi Tara
          </button>
        </div>
      </div>

      {/* Kaynak Durum Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex items-center gap-6">
        <p className="text-xs text-gray-500 uppercase tracking-wider flex-shrink-0">Kaynak Durumu</p>
        <div className="flex-1 flex gap-1 h-2 rounded-full overflow-hidden">
          <div className="bg-green-500 rounded-l-full" style={{width: '60%'}} />
          <div className="bg-yellow-500" style={{width: '25%'}} />
          <div className="bg-red-500 rounded-r-full" style={{width: '15%'}} />
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-xs text-gray-400">28 Aktif</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-xs text-gray-400">12 Boşta</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-xs text-gray-400">7 Orphan</span></div>
        </div>
      </div>

      {/* Metrik Kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Aylık Maliyet</p>
            <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">${totalMaliyet.toLocaleString()}</p>
          <p className="text-xs text-red-400 mt-1.5">↑ %12 geçen ay</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Tasarruf Fırsatı</p>
            <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-green-400">${tasarrufFirsati.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1.5">%{Math.round(tasarrufFirsati / totalMaliyet * 100)} tasarruf mümkün</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Aktif Kaynak</p>
            <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{aktifKaynak}</p>
          <p className="text-xs text-yellow-500 mt-1.5">5 dikkat gerektiriyor</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Ay Sonu Tahmini</p>
            <div className="w-8 h-8 bg-orange-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-400">${tahmin.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1.5">Mevcut trendde</p>
        </div>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-white">Son 7 Günlük Maliyet Trendi</h2>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Bu Hafta</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={costTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="gun" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`$${v}`, 'Maliyet']} />
              <Line type="monotone" dataKey="maliyet" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Kaynak Dağılımı</h2>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={resourceDist} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                {resourceDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`$${v}`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {resourceDist.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-400 truncate">{item.name}</span>
                </div>
                <span className="text-xs text-white font-medium">${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-white">Aylık Maliyet Karşılaştırması</h2>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Son 6 Ay</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyComparison} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="ay" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`$${v}`, 'Maliyet']} />
            <Bar dataKey="maliyet" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">En Pahalı Kaynaklar</h2>
            <button className="text-xs text-blue-400 hover:text-blue-300">Tümünü Gör</button>
          </div>
          <div className="space-y-1">
            {topResources.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.durum === 'idle' ? 'bg-yellow-500' : r.durum === 'orphan' ? 'bg-red-500' : 'bg-green-500'}`} />
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

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Optimizasyon Önerileri</h2>
            <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">5 açık</span>
          </div>
          <div className="space-y-1">
            {recommendations.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${r.oncelik === 'yüksek' ? 'bg-red-900/50 text-red-400' : r.oncelik === 'orta' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}>{r.oncelik}</span>
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

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Son Tarama Logları</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
              <th className="text-left pb-3 font-medium">Zaman</th>
              <th className="text-left pb-3 font-medium">Taranan Kaynak</th>
              <th className="text-left pb-3 font-medium">Bulunan Öneri</th>
              <th className="text-left pb-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {scanLogs.map((log, i) => (
              <tr key={i} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors">
                <td className="py-3 text-gray-400">{log.zaman}</td>
                <td className="py-3 text-white">{log.kaynak}</td>
                <td className="py-3 text-white">{log.öneri}</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${log.durum === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {log.durum === 'success' ? 'Başarılı' : 'Hata'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}