'use client'
import { DashboardSkeleton } from '@/components/ui/Skeleton'
import { useState, useEffect, useRef } from 'react'
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'

const defaultCostTrend = [
  { tarih: 'Pzt', maliyet: 0 },
  { tarih: 'Sal', maliyet: 0 },
  { tarih: 'Çar', maliyet: 0 },
  { tarih: 'Per', maliyet: 0 },
  { tarih: 'Cum', maliyet: 0 },
]

const defaultMonthlyComparison = [
  { ay: 'Oca', maliyet: 0 },
  { ay: 'Şub', maliyet: 0 },
  { ay: 'Mar', maliyet: 0 },
  { ay: 'Nis', maliyet: 0 },
  { ay: 'May', maliyet: 0 },
  { ay: 'Haz', maliyet: 0 },
]

const defaultResourceDist = [
  { name: 'Virtual Machines', value: 0, color: '#3b82f6' },
  { name: 'Storage', value: 0, color: '#8b5cf6' },
  { name: 'SQL Database', value: 0, color: '#06b6d4' },
  { name: 'App Service', value: 0, color: '#10b981' },
  { name: 'Diğer', value: 0, color: '#6b7280' },
]

const defaultTopResources = [
  { name: 'prod-vm-01', type: 'Virtual Machine', group: 'production-rg', maliyet: 820, durum: 'idle' },
  { name: 'sqldb-main', type: 'SQL Database', group: 'data-rg', maliyet: 640, durum: 'active' },
  { name: 'storage-backup', type: 'Storage Account', group: 'backup-rg', maliyet: 410, durum: 'orphan' },
  { name: 'app-service-api', type: 'App Service', group: 'production-rg', maliyet: 380, durum: 'active' },
  { name: 'dev-vm-02', type: 'Virtual Machine', group: 'dev-rg', maliyet: 340, durum: 'idle' },
]

const defaultRecommendations = [
  { kaynak: 'prod-vm-01', tip: 'Boşta VM', tasarruf: 820, oncelik: 'yüksek' },
  { kaynak: 'dev-vm-02', tip: 'Boşta VM', tasarruf: 340, oncelik: 'yüksek' },
  { kaynak: 'storage-backup', tip: 'Orphan Kaynak', tasarruf: 410, oncelik: 'orta' },
  { kaynak: 'sqldb-staging', tip: 'Aşırı Boyutlu', tasarruf: 280, oncelik: 'orta' },
  { kaynak: 'old-public-ip', tip: 'Kullanılmayan IP', tasarruf: 120, oncelik: 'düşük' },
]

const defaultScanLogs = [
  { zaman: '—', kaynak: 0, öneri: 0, durum: 'success' },
]

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
  const [realData, setRealData] = useState<any>(null)
  const [subscriptionName, setSubscriptionName] = useState('')
  const [costSupported, setCostSupported] = useState(true)
  const [resourceDist, setResourceDist] = useState(defaultResourceDist)
  const [costTrend, setCostTrend] = useState(defaultCostTrend)
  const [monthlyComparison, setMonthlyComparison] = useState(defaultMonthlyComparison)

  async function loadRealData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Önce kritik veriyi yükle (hızlı)
    const res = await fetch('/api/dashboard-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session.access_token }),
    })

    if (res.ok) {
      const data = await res.json()
      
      // Kritik veriyi hemen göster
      setRealData(data)
      setSubscriptionName(data.subscriptionName || '')
      setCostSupported(data.costSupported ?? true)

      // Grafik verisini arka planda güncelle
      setTimeout(() => {
        if (data.resourceTypeChart?.length > 0) setResourceDist(data.resourceTypeChart)
        if (data.costTrendChart?.length > 0) {
          setCostTrend(data.costTrendChart)
          setMonthlyComparison(data.costTrendChart)
        }
      }, 100)
    }
  }

  useEffect(() => {
    loadRealData()
    fetch('/api/budget')
      .then(r => r.json())
      .then(d => {
        setBudget(d.monthlyBudget)
        setAlertThreshold(d.alertThreshold)
      })

    // Realtime: scan_logs tablosunu dinle
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'scan_logs',
      }, (payload: any) => {
        if (payload.new?.status === 'success') {
          toast.success('Tarama tamamlandı! Dashboard güncellendi.', {
            icon: '✅',
            duration: 4000,
          })
          loadRealData()
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'recommendations',
      }, () => {
        loadRealData()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'resources',
      }, () => {
        loadRealData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const totalMaliyet = realData?.totalCost || 0
  const tasarrufFirsati = realData?.totalSaving || 0
  const aktifKaynak = realData?.resourceCount || 0
  const tahmin = Math.round(totalMaliyet * 1.15)

  const displayTopResources = realData?.topResources?.map((r: any) => ({
    name: r.name,
    type: r.type,
    group: r.group,
    maliyet: Math.round(r.cost),
    durum: r.isActive ? 'active' : 'idle',
  })) || defaultTopResources

  const displayRecommendations = realData?.recommendations || defaultRecommendations

  const displayScanLogs = realData?.scanLogs?.map((log: any) => ({
    zaman: new Date(log.started_at).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }),
    kaynak: log.resources_scanned,
    öneri: log.recommendations_found,
    durum: log.status,
  })) || defaultScanLogs

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
        await loadRealData()
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
          Son tarama: <span className="text-gray-400">{realData?.lastScanTime || '—'}</span>
        </p>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500">
            Subscription: <span className="text-blue-400">{subscriptionName || 'Bağlantı yapılmamış'}</span>
          </p>
          <motion.button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors relative overflow-hidden"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {scanning ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Taranıyor...</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Şimdi Tara</>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Cost Management Uyarısı */}
      {realData && !costSupported && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm text-yellow-300 font-medium">Bilgilendirme: Tahmini maliyet gösterilmektedir.</p>
            <p className="text-xs text-yellow-400/70 mt-0.5">Bu subscription türünde Cost Management API desteklenmiyor. Maliyet verileri Azure Retail Prices API üzerinden tahmin edilmektedir. Pay-As-You-Go, EA, MCA ve CSP türündeki abonelikler için gerçek fiyatlar görüntülenebilmektedir.</p>
          </div>
        </motion.div>
      )}

      {/* Bütçe Widget */}
      {budget && totalMaliyet > 0 && (
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
              {totalMaliyet >= budget && (
                <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">Aşıldı!</span>
              )}
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
          <motion.div className="bg-green-500 rounded-l-full h-full" initial={{ width: 0 }} animate={{ width: '60%' }} transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }} />
          <motion.div className="bg-yellow-500 h-full" initial={{ width: 0 }} animate={{ width: '25%' }} transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }} />
          <motion.div className="bg-red-500 rounded-r-full h-full" initial={{ width: 0 }} animate={{ width: '15%' }} transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }} />
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <motion.div className="w-2 h-2 rounded-full bg-green-500" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }} />
            <span className="text-xs text-gray-400">{aktifKaynak > 0 ? Math.round(aktifKaynak * 0.6) : 0} Aktif</span>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div className="w-2 h-2 rounded-full bg-yellow-500" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
            <span className="text-xs text-gray-400">{aktifKaynak > 0 ? Math.round(aktifKaynak * 0.25) : 0} Boşta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div className="w-2 h-2 rounded-full bg-red-500" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
            <span className="text-xs text-gray-400">{aktifKaynak > 0 ? Math.round(aktifKaynak * 0.15) : 0} Orphan</span>
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
            sub: !costSupported && realData
              ? '~ Tahmini maliyet (Retail Prices)'
              : totalMaliyet > 0 ? '↑ %12 geçen ay' : 'Tarama yapılmamış',
            subColor: !costSupported && realData ? 'text-yellow-500' :
              totalMaliyet > 0 ? 'text-red-400' : 'text-gray-500',
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            iconBg: 'bg-blue-600/20', iconColor: 'text-blue-400', valueColor: 'text-white',
          },
          {
            label: 'Tasarruf Fırsatı',
            value: tasarrufFirsati,
            prefix: '$',
            sub: tasarrufFirsati > 0
              ? `%${Math.round(tasarrufFirsati / (totalMaliyet || 1) * 100)} tasarruf mümkün`
              : realData ? 'Öneri bulunamadı' : 'Tarama yapılmamış',
            subColor: 'text-green-600',
            icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
            iconBg: 'bg-green-600/20', iconColor: 'text-green-400', valueColor: 'text-green-400',
          },
          {
            label: 'Toplam Kaynak',
            value: aktifKaynak,
            prefix: '',
            sub: realData?.recommendationCount > 0
              ? `${realData.recommendationCount} öneri var`
              : realData ? 'Öneri yok' : 'Tarama yapılmamış',
            subColor: 'text-yellow-500',
            icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
            iconBg: 'bg-purple-600/20', iconColor: 'text-purple-400', valueColor: 'text-white',
          },
          {
            label: 'Ay Sonu Tahmini',
            value: tahmin,
            prefix: '$',
            sub: !costSupported && realData ? '~ Tahmini değer' : 'Mevcut trendde',
            subColor: !costSupported && realData ? 'text-yellow-500' : 'text-gray-500',
            icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
            iconBg: 'bg-orange-600/20', iconColor: 'text-orange-400', valueColor: 'text-orange-400',
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
              <motion.div className={`w-8 h-8 ${card.iconBg} rounded-lg flex items-center justify-center`} whileHover={{ rotate: 10 }}>
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
      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-white">Tarama Bazlı Maliyet Trendi</h2>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              {costTrend.length > 0 && costTrend[0].maliyet > 0 ? 'Gerçek Veri' : 'Veri Bekleniyor'}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={costTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="tarih" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', fontSize: '12px' }} formatter={(v) => [`$${v}`, 'Maliyet']} />
              <Line type="monotone" dataKey="maliyet" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Kaynak Dağılımı</h2>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              {resourceDist.some(r => r.value > 0) ? 'Gerçek Veri' : 'Veri Bekleniyor'}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={resourceDist} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                {resourceDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', fontSize: '12px' }} formatter={(v) => [`$${v}`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {resourceDist.filter(r => r.value > 0).map((item, i) => (
              <motion.div key={i} className="flex items-center justify-between" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-400 truncate">{item.name}</span>
                </div>
                <span className="text-xs text-white font-medium">${item.value.toLocaleString()}</span>
              </motion.div>
            ))}
            {!resourceDist.some(r => r.value > 0) && (
              <p className="text-xs text-gray-600 text-center py-2">Tarama sonrası veri görünecek</p>
            )}
          </div>
        </motion.div>
      </motion.div>

      <motion.div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-white">Tarama Geçmişi — Maliyet Karşılaştırması</h2>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
            {monthlyComparison.some(m => m.maliyet > 0) ? 'Gerçek Veri' : 'Veri Bekleniyor'}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyComparison} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="tarih" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', fontSize: '12px' }} formatter={(v) => [`$${v}`, 'Maliyet']} />
            <Bar dataKey="maliyet" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">En Pahalı Kaynaklar</h2>
            <a href="/dashboard/resources" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Tüm Kaynakları Gör</a>
          </div>
          <div className="space-y-1">
            {displayTopResources.map((r: any, i: number) => (
              <motion.div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-800/50 last:border-0"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.07 }}
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
                  <p className="text-sm font-semibold text-white">{r.maliyet > 0 ? `$${r.maliyet}` : '—'}</p>
                  <p className="text-xs text-gray-600">/ay</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Optimizasyon Önerileri</h2>
            <motion.span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              {realData?.recommendationCount || 0} açık
            </motion.span>
          </div>
          <div className="space-y-1">
            {displayRecommendations.map((r: any, i: number) => (
              <motion.div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-800/50 last:border-0"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.07 }}
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

      <motion.div className="bg-gray-900 border border-gray-800 rounded-xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
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
            {displayScanLogs.map((log: any, i: number) => (
              <motion.tr key={i} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.07 }}
              >
                <td className="py-3 text-gray-400">{log.zaman}</td>
                <td className="py-3 text-white">{log.kaynak}</td>
                <td className="py-3 text-white">{log.öneri}</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    log.durum === 'success' ? 'bg-green-900/50 text-green-400' :
                    log.durum === 'running' ? 'bg-blue-900/50 text-blue-400' :
                    'bg-red-900/50 text-red-400'
                  }`}>
                    {log.durum === 'success' ? 'Başarılı' : log.durum === 'running' ? 'Çalışıyor' : 'Hata'}
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