'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

type ScoreCategory = {
  name: string
  score: number
  maxScore: number
  color: string
  icon: string
  description: string
  items: { label: string; status: 'good' | 'warning' | 'bad'; detail: string }[]
}

function ScoreGauge({ score, size = 160 }: { score: number; size?: number }) {
  const radius = size / 2 - 20
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#1f2937" strokeWidth="12" />
        <motion.circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-gray-500">/ 100</span>
      </div>
    </div>
  )
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  )
}

export default function FinOpsPage() {
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState<ScoreCategory[]>([])
  const [overallScore, setOverallScore] = useState(0)
  const [grade, setGrade] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    loadFinOpsData()
  }, [])

  async function loadFinOpsData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    if (!userData) return

    const { data: resources } = await supabase
      .from('resources')
      .select('*, cost_snapshots(cost_usd)')
      .eq('tenant_id', userData.tenant_id)

    const { data: recommendations } = await supabase
      .from('recommendations')
      .select('*')
      .eq('tenant_id', userData.tenant_id)

    const { data: scanLogs } = await supabase
      .from('scan_logs')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('started_at', { ascending: false })
      .limit(5)

    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', userData.tenant_id)
      .single()

    // Hesaplamalar
    const totalResources = resources?.length || 0
    const openRecs = recommendations?.filter(r => r.status === 'open').length || 0
    const appliedRecs = recommendations?.filter(r => r.status === 'applied').length || 0
    const totalRecs = recommendations?.length || 0
    const totalCost = resources?.reduce((sum, r) =>
      sum + (r.cost_snapshots?.reduce((s: number, c: any) => s + Number(c.cost_usd), 0) || 0), 0) || 0
    const totalSaving = recommendations?.filter(r => r.status === 'open')
      .reduce((sum, r) => sum + r.estimated_monthly_saving, 0) || 0
    const hasBudget = !!tenant?.monthly_budget
    const hasAzure = !!tenant?.azure_subscription_id
    const recentScans = scanLogs?.length || 0
    const applicationRate = totalRecs > 0 ? (appliedRecs / totalRecs) * 100 : 0

    // FinOps Skoru Kategorileri
    const categories: ScoreCategory[] = [
      {
        name: 'Maliyet Optimizasyonu',
        score: calculateCostScore(totalCost, totalSaving, openRecs, totalResources),
        maxScore: 100,
        color: '#3b82f6',
        icon: '💰',
        description: 'Maliyet azaltma fırsatlarının ne kadarı tespit ve uygulandı',
        items: [
          {
            label: 'Açık optimizasyon önerileri',
            status: openRecs === 0 ? 'good' : openRecs < 5 ? 'warning' : 'bad',
            detail: `${openRecs} açık öneri`,
          },
          {
            label: 'Uygulanan öneriler',
            status: applicationRate > 50 ? 'good' : applicationRate > 20 ? 'warning' : 'bad',
            detail: `%${Math.round(applicationRate)} uygulandı`,
          },
          {
            label: 'Tasarruf fırsatı',
            status: totalSaving === 0 ? 'good' : totalSaving < 500 ? 'warning' : 'bad',
            detail: totalSaving > 0 ? `$${totalSaving.toFixed(0)}/ay kaçırılıyor` : 'Tespit edilmedi',
          },
        ],
      },
      {
        name: 'Kaynak Verimliliği',
        score: calculateEfficiencyScore(resources || [], recommendations || []),
        maxScore: 100,
        color: '#10b981',
        icon: '⚡',
        description: 'Kaynakların ne kadar verimli kullanıldığı',
        items: [
          {
            label: 'Toplam kaynak sayısı',
            status: totalResources > 0 ? 'good' : 'warning',
            detail: `${totalResources} kaynak tarandı`,
          },
          {
            label: 'Boşta kalan kaynaklar',
            status: openRecs === 0 ? 'good' : openRecs < 3 ? 'warning' : 'bad',
            detail: `${openRecs} optimizasyon gerekiyor`,
          },
          {
            label: 'Kaynak etiketleme',
            status: 'warning',
            detail: 'Etiket kullanımı kontrol edilmeli',
          },
        ],
      },
      {
        name: 'Görünürlük & İzleme',
        score: calculateVisibilityScore(hasAzure, hasBudget, recentScans),
        maxScore: 100,
        color: '#8b5cf6',
        icon: '👁️',
        description: 'Maliyet görünürlüğü ve izleme kapsamı',
        items: [
          {
            label: 'Azure bağlantısı',
            status: hasAzure ? 'good' : 'bad',
            detail: hasAzure ? 'Bağlı ve aktif' : 'Bağlantı yapılmamış',
          },
          {
            label: 'Bütçe limiti',
            status: hasBudget ? 'good' : 'bad',
            detail: hasBudget ? `$${tenant?.monthly_budget}/ay` : 'Bütçe belirlenmemiş',
          },
          {
            label: 'Düzenli tarama',
            status: recentScans >= 3 ? 'good' : recentScans >= 1 ? 'warning' : 'bad',
            detail: `Son ${recentScans} tarama`,
          },
        ],
      },
      {
        name: 'Yönetim & Süreç',
        score: calculateGovernanceScore(hasBudget, applicationRate, recentScans),
        maxScore: 100,
        color: '#f59e0b',
        icon: '📋',
        description: 'FinOps süreçleri ve yönetim olgunluğu',
        items: [
          {
            label: 'Bütçe yönetimi',
            status: hasBudget ? 'good' : 'bad',
            detail: hasBudget ? 'Aktif bütçe mevcut' : 'Bütçe tanımlanmamış',
          },
          {
            label: 'Öneri uygulama oranı',
            status: applicationRate > 50 ? 'good' : applicationRate > 0 ? 'warning' : 'bad',
            detail: `%${Math.round(applicationRate)} uygulama oranı`,
          },
          {
            label: 'Periyodik tarama',
            status: recentScans >= 5 ? 'good' : recentScans >= 2 ? 'warning' : 'bad',
            detail: recentScans >= 5 ? 'Düzenli tarama aktif' : 'Tarama sıklığı artırılmalı',
          },
        ],
      },
    ]

    const overall = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length)
    const g = overall >= 90 ? 'A+' : overall >= 80 ? 'A' : overall >= 70 ? 'B' : overall >= 60 ? 'C' : overall >= 50 ? 'D' : 'F'

    setScores(categories)
    setOverallScore(overall)
    setGrade(g)
    setLastUpdated(new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }))
    setLoading(false)
  }

  function calculateCostScore(totalCost: number, totalSaving: number, openRecs: number, totalResources: number) {
    if (totalResources === 0) return 50
    let score = 100
    if (openRecs > 0) score -= Math.min(openRecs * 5, 40)
    if (totalCost > 0 && totalSaving > 0) {
      const wasteRate = totalSaving / totalCost
      score -= Math.min(wasteRate * 100, 30)
    }
    return Math.max(Math.round(score), 10)
  }

  function calculateEfficiencyScore(resources: any[], recommendations: any[]) {
    if (resources.length === 0) return 40
    const openRecs = recommendations.filter(r => r.status === 'open').length
    let score = 100
    if (openRecs > 0) score -= Math.min(openRecs * 4, 50)
    return Math.max(Math.round(score), 10)
  }

  function calculateVisibilityScore(hasAzure: boolean, hasBudget: boolean, scans: number) {
    let score = 0
    if (hasAzure) score += 40
    if (hasBudget) score += 30
    if (scans >= 1) score += 15
    if (scans >= 3) score += 15
    return Math.min(score, 100)
  }

  function calculateGovernanceScore(hasBudget: boolean, appRate: number, scans: number) {
    let score = 0
    if (hasBudget) score += 30
    score += Math.min(appRate * 0.4, 40)
    if (scans >= 1) score += 15
    if (scans >= 5) score += 15
    return Math.min(Math.round(score), 100)
  }

  const gradeColor = overallScore >= 80 ? 'text-green-400' :
    overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'

  const gradeBg = overallScore >= 80 ? 'from-green-900/30 to-green-900/10 border-green-800/30' :
    overallScore >= 60 ? 'from-yellow-900/30 to-yellow-900/10 border-yellow-800/30' :
    'from-red-900/30 to-red-900/10 border-red-800/30'

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl">

      {/* Başlık */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-white">FinOps Skoru</h2>
          <p className="text-sm text-gray-500 mt-1">Maliyet yönetimi olgunluk seviyeniz</p>
        </div>
        <p className="text-xs text-gray-600">Son güncelleme: {lastUpdated}</p>
      </div>

      {/* Ana Skor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${gradeBg} border rounded-2xl p-8 mb-8 flex items-center gap-8`}
      >
        <ScoreGauge score={overallScore} size={160} />

        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Genel FinOps Skoru</p>
              <div className="flex items-center gap-3">
                <span className={`text-6xl font-black ${gradeColor}`}>{grade}</span>
                <div>
                  <p className="text-2xl font-bold text-white">{overallScore}/100</p>
                  <p className={`text-sm font-medium ${gradeColor}`}>
                    {overallScore >= 80 ? 'Mükemmel' :
                     overallScore >= 70 ? 'İyi' :
                     overallScore >= 60 ? 'Orta' :
                     overallScore >= 50 ? 'Geliştirilmeli' : 'Kritik'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {scores.map((cat, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg">{cat.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400">{cat.name}</span>
                    <span className="text-xs font-medium text-white">{cat.score}</span>
                  </div>
                  <ScoreBar value={cat.score} max={100} color={cat.color} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Kategori Detayları */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {scores.map((cat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{cat.name}</p>
                  <p className="text-xs text-gray-500">{cat.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: cat.color }}>{cat.score}</p>
                <p className="text-xs text-gray-600">/ 100</p>
              </div>
            </div>

            <ScoreBar value={cat.score} max={100} color={cat.color} />

            <div className="mt-4 space-y-2">
              {cat.items.map((item, j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.status === 'good' ? 'bg-green-500' :
                    item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-gray-400 flex-1">{item.label}</span>
                  <span className={`text-xs font-medium ${
                    item.status === 'good' ? 'text-green-400' :
                    item.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                  }`}>{item.detail}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* İyileştirme Önerileri */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6"
      >
        <h3 className="text-sm font-semibold text-white mb-4">🎯 Skoru Artırmak İçin</h3>
        <div className="space-y-3">
          {scores
            .filter(s => s.score < 80)
            .sort((a, b) => a.score - b.score)
            .slice(0, 3)
            .map((cat, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-xl">
                <span className="text-lg flex-shrink-0">{cat.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{cat.name} — {cat.score}/100</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {cat.items.filter(i => i.status !== 'good').map(i => i.label).join(', ')} düzeltilmeli
                  </p>
                </div>
                <span className="text-xs text-blue-400 flex-shrink-0">
                  +{Math.round((80 - cat.score) * 0.5)} puan kazanabilirsiniz
                </span>
              </div>
            ))}
          {scores.every(s => s.score >= 80) && (
            <p className="text-sm text-green-400 text-center py-2">
              🎉 Tüm kategorilerde iyi durumdasınız!
            </p>
          )}
        </div>
      </motion.div>

    </div>
  )
}