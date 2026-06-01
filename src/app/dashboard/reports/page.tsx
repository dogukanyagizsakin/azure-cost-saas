'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type ScanLog = {
  id: string
  status: string
  resources_scanned: number
  recommendations_found: number
  total_cost_usd: number
  started_at: string
  finished_at: string
}

export default function ReportsPage() {
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    if (!userData) return

    const { data } = await supabase
      .from('scan_logs')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('started_at', { ascending: false })
      .limit(20)

    setScanLogs(data || [])
    setLoading(false)
  }

  async function generateReport() {
    setGenerating(true)
    toast.loading('Rapor hazırlanıyor...')

    try {
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
        .select('*, resources(name)')
        .eq('tenant_id', userData.tenant_id)

      const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', userData.tenant_id)
        .single()

      const totalCost = resources?.reduce((sum, r) =>
        sum + (r.cost_snapshots?.reduce((s: number, c: any) => s + c.cost_usd, 0) || 0), 0) || 0

      const totalSaving = recommendations?.filter(r => r.status === 'open')
        .reduce((sum, r) => sum + r.estimated_monthly_saving, 0) || 0

      const now = new Date()
      const reportDate = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

      const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Azure Maliyet Raporu - ${tenant?.name}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a2e; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #2461ff; }
  .logo { font-size: 24px; font-weight: 800; }
  .logo span { color: #2461ff; }
  .date { color: #666; font-size: 14px; }
  h1 { font-size: 28px; margin-bottom: 8px; }
  .subtitle { color: #666; margin-bottom: 40px; }
  .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
  .metric { background: #f8f9ff; border: 1px solid #e0e4ff; border-radius: 12px; padding: 20px; }
  .metric-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .metric-value { font-size: 28px; font-weight: 700; color: #1a1a2e; }
  .metric-value.green { color: #10b981; }
  .metric-value.blue { color: #2461ff; }
  h2 { font-size: 18px; margin-bottom: 16px; color: #1a1a2e; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
  th { text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; border-bottom: 1px solid #e5e7eb; }
  td { padding: 12px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-red { background: #fee2e2; color: #dc2626; }
  .badge-yellow { background: #fef3c7; color: #d97706; }
  .badge-gray { background: #f3f4f6; color: #6b7280; }
  .badge-green { background: #d1fae5; color: #059669; }
  .footer { text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">Unify<span>Tech</span> Azure Cost</div>
    <div class="date">${reportDate}</div>
  </div>

  <h1>Azure Maliyet Raporu</h1>
  <p class="subtitle">${tenant?.name} · ${selectedPeriod === 'this_month' ? 'Bu Ay' : 'Son 3 Ay'}</p>

  <div class="metrics">
    <div class="metric">
      <div class="metric-label">Toplam Maliyet</div>
      <div class="metric-value">$${totalCost.toFixed(0)}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Tasarruf Fırsatı</div>
      <div class="metric-value green">$${totalSaving.toFixed(0)}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Toplam Kaynak</div>
      <div class="metric-value blue">${resources?.length || 0}</div>
    </div>
  </div>

  <h2>Optimizasyon Önerileri</h2>
  <table>
    <thead>
      <tr>
        <th>Kaynak</th>
        <th>Öneri Türü</th>
        <th>Aylık Tasarruf</th>
        <th>Durum</th>
      </tr>
    </thead>
    <tbody>
      ${recommendations?.map(r => `
        <tr>
          <td>${r.resources?.name || '-'}</td>
          <td>${r.title}</td>
          <td style="color:#10b981;font-weight:600">$${r.estimated_monthly_saving.toFixed(0)}</td>
          <td><span class="badge ${r.status === 'open' ? 'badge-red' : r.status === 'applied' ? 'badge-green' : 'badge-gray'}">${
            r.status === 'open' ? 'Açık' : r.status === 'applied' ? 'Uygulandı' : 'Reddedildi'
          }</span></td>
        </tr>
      `).join('') || '<tr><td colspan="4" style="text-align:center;color:#999">Öneri bulunamadı</td></tr>'}
    </tbody>
  </table>

  <h2>En Pahalı Kaynaklar</h2>
  <table>
    <thead>
      <tr>
        <th>Kaynak Adı</th>
        <th>Tür</th>
        <th>Maliyet</th>
      </tr>
    </thead>
    <tbody>
      ${resources?.slice(0, 10).map(r => {
        const cost = r.cost_snapshots?.reduce((s: number, c: any) => s + c.cost_usd, 0) || 0
        return `
          <tr>
            <td>${r.name}</td>
            <td>${r.resource_type?.split('/').pop() || r.resource_type}</td>
            <td style="font-weight:600">${cost > 0 ? '$' + cost.toFixed(2) : '-'}</td>
          </tr>
        `
      }).join('') || '<tr><td colspan="3" style="text-align:center;color:#999">Kaynak bulunamadı</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    Bu rapor UnifyTech Azure Cost Management platformu tarafından otomatik oluşturulmuştur.<br>
    ${reportDate}
  </div>
</body>
</html>`

      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `azure-maliyet-raporu-${now.toISOString().split('T')[0]}.html`
      a.click()
      URL.revokeObjectURL(url)

      toast.dismiss()
      toast.success('Rapor indirildi!')
    } catch {
      toast.dismiss()
      toast.error('Rapor oluşturulurken hata oluştu')
    }
    setGenerating(false)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6">

      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Raporlar</h2>
          <p className="text-sm text-gray-500 mt-1">Maliyet raporları oluşturun ve indirin</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="this_month">Bu Ay</option>
            <option value="last_3_months">Son 3 Ay</option>
            <option value="last_6_months">Son 6 Ay</option>
          </select>
          <button
            onClick={generateReport}
            disabled={generating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {generating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            Rapor İndir
          </button>
        </div>
      </div>

      {/* Rapor Kartları */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {[
          {
            title: 'Aylık Maliyet Raporu',
            desc: 'Tüm kaynakların aylık maliyet dökümü',
            icon: '📊',
            color: 'blue',
          },
          {
            title: 'Optimizasyon Raporu',
            desc: 'Tasarruf fırsatları ve öneriler',
            icon: '💡',
            color: 'green',
          },
          {
            title: 'Kaynak Envanteri',
            desc: 'Tüm Azure kaynaklarının listesi',
            icon: '🗂️',
            color: 'purple',
          },
        ].map((card, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <div className="text-3xl mb-4">{card.icon}</div>
            <h3 className="text-sm font-semibold text-white mb-2">{card.title}</h3>
            <p className="text-xs text-gray-500 mb-4">{card.desc}</p>
            <button
              onClick={generateReport}
              disabled={generating}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              İndir
            </button>
          </div>
        ))}
      </div>

      {/* Tarama Geçmişi */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Tarama Geçmişi</h3>

        {scanLogs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Henüz tarama yapılmamış</p>
            <a href="/dashboard" className="text-blue-400 text-sm hover:text-blue-300 mt-2 inline-block">
              Dashboard&apos;dan tarama başlatın →
            </a>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left pb-3 font-medium">Tarih</th>
                <th className="text-left pb-3 font-medium">Taranan Kaynak</th>
                <th className="text-left pb-3 font-medium">Öneri</th>
                <th className="text-left pb-3 font-medium">Toplam Maliyet</th>
                <th className="text-left pb-3 font-medium">Süre</th>
                <th className="text-left pb-3 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {scanLogs.map((log, i) => {
                const duration = log.finished_at
                  ? Math.round((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000)
                  : null
                return (
                  <tr key={i} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 text-gray-400">
                      {new Date(log.started_at).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 text-white">{log.resources_scanned}</td>
                    <td className="py-3 text-white">{log.recommendations_found}</td>
                    <td className="py-3 text-white">
                      {log.total_cost_usd > 0 ? `$${log.total_cost_usd.toFixed(0)}` : '-'}
                    </td>
                    <td className="py-3 text-gray-400">
                      {duration ? `${duration}s` : '-'}
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        log.status === 'success' ? 'bg-green-900/50 text-green-400' :
                        log.status === 'running' ? 'bg-blue-900/50 text-blue-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>
                        {log.status === 'success' ? 'Başarılı' :
                         log.status === 'running' ? 'Çalışıyor' : 'Hata'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}