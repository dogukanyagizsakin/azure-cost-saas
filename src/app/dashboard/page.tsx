'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { toast } from 'sonner'
import { DashboardSkeleton } from '@/components/ui/Skeleton'
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

// Sayı sayma animasyonu
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number, prefix?: string, suffix?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { duration: 1500, bounce: 0 })
  const display = useTransform(spring, v => `${prefix}${Math.round(v).toLocaleString()}${suffix}`)

  useEffect(() => {
    if (inView) motionValue.set(value)
  }, [inView, motionValue, value])

  return <motion.span ref={ref}>{display}</motion.span>
}

// Kart animasyon varyantları
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }
  })
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } }
}

export default function DashboardPage() {
  const [scanning, setScanning] = useState(false)
  const [loading] = useState(false)
  const [budget, setBudget] = useState<number | null>(null)
  const [alertThreshold, setAlertThreshold] = useState(80)
  const [progressWidth, setProgressWidth] = useState(0)

  const totalMaliyet = 9600
  const tasarrufFirsati = 1970
  const aktifKaynak = 47
  const tahmin = 11200

  useEffect(() => {
    fetch('/api/budget')
      .then(r => r.json())
      .then(d => {
        setBudget(d.monthlyBudget)
        setAlertThreshold(d.alertThreshold)
      })

    // Kaynak durum bar animasyonu
    setTimeout(() => setProgressWidth(100), 300)
  }, [])

async function handleScan() {
  setScanning(true)
  const toastId = toast.loading('Azure kaynakları taranıyor...')
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session?.access_token }),
    })
    const data = await response.json()
    if (data.success) {
      toast.success(`Tarama tamamlandı! ${data.resourcesScanned} kaynak, ${data.recommendationsFound} öneri bulundu.`, { id: toastId })
    } else {
      toast.error(data.error || 'Tarama başarısız', { id: toastId })
    }
  } catch {
    toast.error('Tarama sırasında bir hata oluştu', { id: toastId })
  }
  setScanning(false)
}

  if (loading) return <DashboardSkeleton />

  return (
    <motion.div
      className="p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Üst bar */}
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs text-gray-500">
          Son tarama: <span className="text-gray-400">2 saat önce</span> · Sonraki tarama: <span className="text-gray-400">6 saat sonra</span>
        </p>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500">Subscription: <span className="text-blue-400">UnifyTech Production</span></p>
          <motion.button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors relative overflow-hidden"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {scanning && (
              <motion.div
                className="absolute inset-0 bg-blue-400/20"
                animate={{ x: ['−100%', '100%'] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            )}
            {scanning ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Taranıyor...</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Şimdi Tara</>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Bütçe Widget */}
      {budget && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`rounded-xl p-4 mb-6 border ${
            totalMaliyet >= budget ? 'bg-red-900/20 border-red-800/50' :
            totalMaliyet >= budget * (alertThreshold / 100) ? 'bg-yellow-900/20 border-yellow-800/50' :
            'bg-green-900/20 border-green-800/50'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                className={`w-2 h-2 rounded-full ${
                  totalMaliyet >= budget ? 'bg-red-500' :
                  totalMaliyet >= budget * (alertThreshold / 100) ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-medium text-white">Aylık Bütçe</span>
            </div>
            <span className="text-sm text-gray-400">${totalMaliyet.toLocaleString()} / ${budget.toLocaleString()}</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                totalMaliyet >= budget ? 'bg-red-500' :
                totalMaliyet >= budget * (alertThreshold / 100) ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totalMaliyet / budget) * 100, 100)}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-500">%{Math.round((totalMaliyet / budget) * 100)} kullanıldı</span>
            <span className="text-xs text-gray-500">${(budget - totalMaliyet).toLocaleString()} kaldı</span>
          </div>
        </motion.div>
      )}

      {/* Kaynak Durum Bar */}
      <motion.div
        className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex items-center gap-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <p className="text-xs text-gray-500 uppercase tracking-wider flex-shrink-0">Kaynak Durumu</p>
        <div className="flex-1 flex gap-1 h-2 rounded-full overflow-hidden bg-gray-800">
          <motion.div
            className="bg-green-500 rounded-l-full h-full"
            initial={{ width: 0 }}
            animate={{ width: '60%' }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
          />
          <motion.div
            className="bg-yellow-500 h-full"
            initial={{ width: 0 }}
            animate={{ width: '25%' }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
          />
          <motion.div
            className="bg-red-500 rounded-r-full h-full"
            initial={{ width: 0 }}
            animate={{ width: '15%' }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
          />
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <motion.div className="w-2 h-2 rounded-full bg-green-500" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }} />
            <span className="text-xs text-gray-400">28 Aktif</span>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div className="w-2 h-2 rounded-full bg-yellow-500" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
            <span className="text-xs text-gray-400">12 Boşta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div className="w-2 h-2 rounded-full bg-red-500" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
            <span className="text-xs text-gray-400">7 Orphan</span>
          </div>
        </div>
      </motion.div>

      {/* Metrik Kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Aylık Maliyet',
            value: totalMaliyet,
            prefix: '$',
            sub: '↑ %12 geçen ay',
            subColor: 'text-red-400',
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            iconBg: 'bg-blue-600/20', iconColor: 'text-blue-400',
            valueColor: 'text-white',
          },
          {
            label: 'Tasarruf Fırsatı',
            value: tasarrufFirsati,
            prefix: '$',
            sub: `%${Math.round(tasarrufFirsati / totalMaliyet * 100)} tasarruf mümkün`,
            subColor: 'text-green-600',
            icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
            iconBg: 'bg-green-600/20', iconColor: 'text-green-400',
            valueColor: 'text-green-400',
          },
          {
            label: 'Aktif Kaynak',
            value: aktifKaynak,
            prefix: '',
            sub: '5 dikkat gerektiriyor',
            subColor: 'text-yellow-500',
            icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
            iconBg: 'bg-purple-600/20', iconColor: 'text-purple-400',
            valueColor: 'text-white',
          },
          {
            label: 'Ay Sonu Tahmini',
            value: tahmin,
            prefix: '$',
            sub: 'Mevcut trendde',
            subColor: 'text-gray-500',
            icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
            iconBg: 'bg-orange-600/20', iconColor: 'text-orange-400',
            valueColor: 'text-orange-400',
          },
        ].map((card, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors cursor-default"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{card.label}</p>
              <motion.div
                className={`w-8 h-8 ${card.iconBg} rounded-lg flex items-center justify-center`}
                whileHover={{ rotate: 10 }}
              >
                <svg className={`w-4 h-4 ${card.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </motion.div>
            </div>
            <p className={`text-2xl font-bold ${card.valueColor}`}>
              <AnimatedNumber value={card.value} prefix={card.prefix} />
            </p>
            <p className={`text-xs ${card.subColor} mt-1.5`}>{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Grafikler */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-white">Son 7 Günlük Maliyet Trendi</h2>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Bu Hafta</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={costTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="gun" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', fontSize: '12px' }} formatter={(v) => [`$${v}`, 'Maliyet']} />
              <Line type="monotone" dataKey="maliyet" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Kaynak Dağılımı</h2>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={resourceDist} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                {resourceDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', fontSize: '12px' }} formatter={(v) => [`$${v}`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {resourceDist.map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center justify-between"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-400 truncate">{item.name}</span>
                </div>
                <span className="text-xs text-white font-medium">${item.value.toLocaleString()}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-white">Aylık Maliyet Karşılaştırması</h2>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Son 6 Ay</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyComparison} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="ay" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', fontSize: '12px' }} formatter={(v) => [`$${v}`, 'Maliyet']} />
            <Bar dataKey="maliyet" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">En Pahalı Kaynaklar</h2>
            <button className="text-xs text-blue-400 hover:text-blue-300">Tümünü Gör</button>
          </div>
          <div className="space-y-1">
            {topResources.map((r, i) => (
              <motion.div
                key={i}
                className="flex items-center justify-between py-2.5 border-b border-gray-800/50 last:border-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.07 }}
                whileHover={{ x: 3, transition: { duration: 0.15 } }}
              >
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
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Optimizasyon Önerileri</h2>
            <motion.span
              className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              5 açık
            </motion.span>
          </div>
          <div className="space-y-1">
            {recommendations.map((r, i) => (
              <motion.div
                key={i}
                className="flex items-center justify-between py-2.5 border-b border-gray-800/50 last:border-0"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.07 }}
                whileHover={{ x: -3, transition: { duration: 0.15 } }}
              >
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
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="bg-gray-900 border border-gray-800 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
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
              <motion.tr
                key={i}
                className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.07 }}
              >
                <td className="py-3 text-gray-400">{log.zaman}</td>
                <td className="py-3 text-white">{log.kaynak}</td>
                <td className="py-3 text-white">{log.öneri}</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${log.durum === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {log.durum === 'success' ? 'Başarılı' : 'Hata'}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

    </motion.div>
  )
}