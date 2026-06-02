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
  const [generating, setGenerating] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')
  const [reportData, setReportData] = useState<any>(null)

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

    // Rapor verilerini yükle
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
      .select('name, monthly_budget')
      .eq('id', userData.tenant_id)
      .single()

    const totalCost = resources?.reduce((sum, r) =>
      sum + (r.cost_snapshots?.reduce((s: number, c: any) => s + Number(c.cost_usd), 0) || 0), 0) || 0

    const totalSaving = recommendations?.filter(r => r.status === 'open')
      .reduce((sum, r) => sum + r.estimated_monthly_saving, 0) || 0

    setReportData({
      tenant,
      resources: resources || [],
      recommendations: recommendations || [],
      totalCost,
      totalSaving,
      scanLogs: data || [],
    })

    setLoading(false)
  }

  // PDF Raporu
  async function generatePDF() {
    if (!reportData) return
    setGenerating('pdf')
    toast.loading('PDF raporu hazırlanıyor...')

    try {
      const now = new Date()
      const reportDate = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

      const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Azure Maliyet Raporu - ${reportData.tenant?.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #1a1a2e; background: #fff; }
  .header { background: linear-gradient(135deg, #1a1a2e, #2461ff); color: white; padding: 40px; display: flex; justify-content: space-between; align-items: center; }
  .logo { font-size: 28px; font-weight: 800; }
  .logo span { color: #60a5fa; }
  .header-right { text-align: right; font-size: 13px; opacity: 0.8; }
  .content { padding: 40px; }
  h1 { font-size: 24px; margin-bottom: 8px; }
  .subtitle { color: #666; margin-bottom: 32px; font-size: 14px; }
  .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .metric { background: #f8f9ff; border: 1px solid #e0e4ff; border-radius: 12px; padding: 20px; text-align: center; }
  .metric-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .metric-value { font-size: 28px; font-weight: 700; }
  .metric-value.blue { color: #2461ff; }
  .metric-value.green { color: #10b981; }
  .metric-value.orange { color: #f59e0b; }
  h2 { font-size: 16px; margin-bottom: 12px; color: #1a1a2e; border-left: 4px solid #2461ff; padding-left: 12px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 13px; }
  th { text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; border-bottom: 2px solid #e5e7eb; background: #f9fafb; }
  td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
  tr:hover td { background: #f9fafb; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-red { background: #fee2e2; color: #dc2626; }
  .badge-green { background: #d1fae5; color: #059669; }
  .badge-gray { background: #f3f4f6; color: #6b7280; }
  .footer { text-align: center; color: #999; font-size: 11px; padding: 24px 40px; border-top: 1px solid #e5e7eb; margin-top: 20px; }
  .page-break { page-break-before: always; }
  .summary-box { background: linear-gradient(135deg, #f0f4ff, #e8f5e9); border: 1px solid #c7d7fe; border-radius: 12px; padding: 20px; margin-bottom: 32px; }
  .summary-box p { font-size: 13px; color: #374151; line-height: 1.6; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Unify<span>Tech</span> CostPilot</div>
      <div style="font-size:13px;opacity:0.7;margin-top:4px;">Azure Maliyet Yönetimi</div>
    </div>
    <div class="header-right">
      <div style="font-size:16px;font-weight:600;">${reportData.tenant?.name || 'Şirket'}</div>
      <div>${reportDate}</div>
      <div style="margin-top:4px">Azure Maliyet Raporu</div>
    </div>
  </div>

  <div class="content">
    <h1>Aylık Azure Maliyet Raporu</h1>
    <p class="subtitle">${reportData.tenant?.name} · ${selectedPeriod === 'this_month' ? 'Bu Ay' : 'Son 3 Ay'} · ${reportDate}</p>

    <div class="summary-box">
      <p><strong>Yönetici Özeti:</strong> Bu rapor, Azure altyapınızın maliyet analizi ve optimizasyon önerilerini içermektedir. 
      Toplam <strong>${reportData.resources.length} kaynak</strong> taranmış, 
      <strong>${reportData.recommendations.filter((r: any) => r.status === 'open').length} optimizasyon fırsatı</strong> tespit edilmiştir.
      ${reportData.totalSaving > 0 ? `Aylık <strong>$${reportData.totalSaving.toFixed(0)} tasarruf</strong> fırsatı mevcuttur.` : ''}</p>
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="metric-label">Toplam Maliyet</div>
        <div class="metric-value blue">$${reportData.totalCost.toFixed(0)}</div>
        <div style="font-size:11px;color:#666;margin-top:4px">Bu ay</div>
      </div>
      <div class="metric">
        <div class="metric-label">Tasarruf Fırsatı</div>
        <div class="metric-value green">$${reportData.totalSaving.toFixed(0)}</div>
        <div style="font-size:11px;color:#666;margin-top:4px">Aylık potansiyel</div>
      </div>
      <div class="metric">
        <div class="metric-label">Toplam Kaynak</div>
        <div class="metric-value orange">${reportData.resources.length}</div>
        <div style="font-size:11px;color:#666;margin-top:4px">Taranan kaynak</div>
      </div>
    </div>

    <h2>Optimizasyon Önerileri</h2>
    <table>
      <thead>
        <tr>
          <th>Kaynak</th>
          <th>Öneri</th>
          <th>Aylık Tasarruf</th>
          <th>Durum</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.recommendations.slice(0, 20).map((r: any) => `
          <tr>
            <td>${r.resources?.name || '-'}</td>
            <td>${r.title}</td>
            <td style="color:#10b981;font-weight:600">$${r.estimated_monthly_saving.toFixed(0)}</td>
            <td><span class="badge ${r.status === 'open' ? 'badge-red' : r.status === 'applied' ? 'badge-green' : 'badge-gray'}">${
              r.status === 'open' ? 'Açık' : r.status === 'applied' ? 'Uygulandı' : 'Reddedildi'
            }</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="page-break"></div>

    <h2>Azure Kaynak Envanteri</h2>
    <table>
      <thead>
        <tr>
          <th>Kaynak Adı</th>
          <th>Tür</th>
          <th>Konum</th>
          <th>Maliyet</th>
          <th>Durum</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.resources.slice(0, 30).map((r: any) => {
          const cost = r.cost_snapshots?.reduce((s: number, c: any) => s + Number(c.cost_usd), 0) || 0
          return `
          <tr>
            <td>${r.name}</td>
            <td style="font-size:11px;color:#666">${r.resource_type?.split('/').pop() || r.resource_type}</td>
            <td>${r.location || '-'}</td>
            <td>${cost > 0 ? `$${cost.toFixed(2)}` : '-'}</td>
            <td><span class="badge ${r.is_active ? 'badge-green' : 'badge-gray'}">${r.is_active ? 'Aktif' : 'Pasif'}</span></td>
          </tr>
        `}).join('')}
      </tbody>
    </table>

    <h2>Tarama Geçmişi</h2>
    <table>
      <thead>
        <tr>
          <th>Tarih</th>
          <th>Taranan Kaynak</th>
          <th>Bulunan Öneri</th>
          <th>Durum</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.scanLogs.slice(0, 10).map((log: any) => `
          <tr>
            <td>${new Date(log.started_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
            <td>${log.resources_scanned || 0}</td>
            <td>${log.recommendations_found || 0}</td>
            <td><span class="badge ${log.status === 'success' ? 'badge-green' : 'badge-red'}">${log.status === 'success' ? 'Başarılı' : 'Hata'}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    Bu rapor UnifyTech CostPilot platformu tarafından otomatik oluşturulmuştur · ${reportDate}<br>
    Gizli ve özeldir · Sadece yetkili personel tarafından kullanılabilir
  </div>
</body>
</html>`

      // Print to PDF
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      }

      toast.dismiss()
      toast.success('PDF raporu açıldı! Yazdır/Kaydet seçeneklerini kullanın.')
    } catch {
      toast.dismiss()
      toast.error('PDF oluşturulurken hata oluştu')
    }
    setGenerating(null)
  }

  // Excel Raporu
  async function generateExcel() {
    if (!reportData) return
    setGenerating('excel')
    toast.loading('Excel raporu hazırlanıyor...')

    try {
      // CSV formatında Excel uyumlu dosya
      const now = new Date()
      const rows: string[][] = []

      // Başlık
      rows.push(['UnifyTech CostPilot - Azure Maliyet Raporu'])
      rows.push([`Şirket: ${reportData.tenant?.name}`])
      rows.push([`Tarih: ${now.toLocaleDateString('tr-TR')}`])
      rows.push([])

      // Özet
      rows.push(['ÖZET'])
      rows.push(['Toplam Maliyet', `$${reportData.totalCost.toFixed(2)}`])
      rows.push(['Tasarruf Fırsatı', `$${reportData.totalSaving.toFixed(2)}`])
      rows.push(['Toplam Kaynak', reportData.resources.length.toString()])
      rows.push(['Açık Öneri', reportData.recommendations.filter((r: any) => r.status === 'open').length.toString()])
      rows.push([])

      // Öneriler
      rows.push(['OPTİMİZASYON ÖNERİLERİ'])
      rows.push(['Kaynak', 'Öneri Başlığı', 'Tür', 'Aylık Tasarruf ($)', 'Durum'])
      reportData.recommendations.forEach((r: any) => {
        rows.push([
          r.resources?.name || '-',
          r.title,
          r.type,
          r.estimated_monthly_saving.toFixed(2),
          r.status === 'open' ? 'Açık' : r.status === 'applied' ? 'Uygulandı' : 'Reddedildi',
        ])
      })
      rows.push([])

      // Kaynaklar
      rows.push(['KAYNAK ENVANTERİ'])
      rows.push(['Kaynak Adı', 'Tür', 'Resource Group', 'Konum', 'Maliyet ($)', 'Durum'])
      reportData.resources.forEach((r: any) => {
        const cost = r.cost_snapshots?.reduce((s: number, c: any) => s + Number(c.cost_usd), 0) || 0
        rows.push([
          r.name,
          r.resource_type?.split('/').pop() || r.resource_type,
          r.resource_group || '-',
          r.location || '-',
          cost.toFixed(2),
          r.is_active ? 'Aktif' : 'Pasif',
        ])
      })

      // CSV oluştur
      const csv = rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n')

      // BOM ekle (Türkçe karakter desteği)
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `azure-maliyet-raporu-${now.toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast.dismiss()
      toast.success('Excel raporu indirildi!')
    } catch {
      toast.dismiss()
      toast.error('Excel oluşturulurken hata oluştu')
    }
    setGenerating(null)
  }

  // PowerPoint Raporu
  async function generatePPT() {
    if (!reportData) return
    setGenerating('ppt')
    toast.loading('PowerPoint raporu hazırlanıyor...')

    try {
      const now = new Date()
      const reportDate = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

      const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Azure Maliyet Sunumu</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: #0f0f1a; }
  .slide { width: 1280px; min-height: 720px; margin: 0 auto 40px; position: relative; overflow: hidden; page-break-after: always; }

  /* Slide 1 - Kapak */
  .slide-cover { background: linear-gradient(135deg, #050508 0%, #0d0d14 50%, #1a1a2e 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 80px; }
  .slide-cover .logo { font-size: 48px; font-weight: 900; color: white; margin-bottom: 16px; }
  .slide-cover .logo span { color: #60a5fa; }
  .slide-cover h1 { font-size: 56px; font-weight: 800; color: white; margin-bottom: 16px; letter-spacing: -2px; }
  .slide-cover .accent { background: linear-gradient(135deg, #2461ff, #00e5a0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .slide-cover p { font-size: 22px; color: rgba(255,255,255,0.6); margin-bottom: 8px; }
  .slide-cover .date { font-size: 16px; color: rgba(255,255,255,0.4); margin-top: 32px; }

  /* Slide 2 - Özet */
  .slide-content { background: #0d0d14; padding: 60px; }
  .slide-title { font-size: 36px; font-weight: 700; color: white; margin-bottom: 8px; }
  .slide-subtitle { font-size: 16px; color: rgba(255,255,255,0.4); margin-bottom: 48px; text-transform: uppercase; letter-spacing: 0.1em; }
  .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .metric-card { background: #13131e; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 32px; text-align: center; }
  .metric-card .label { font-size: 13px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; }
  .metric-card .value { font-size: 48px; font-weight: 800; margin-bottom: 8px; }
  .metric-card .sub { font-size: 13px; color: rgba(255,255,255,0.4); }
  .blue { color: #3b82f6; } .green { color: #10b981; } .yellow { color: #f59e0b; } .red { color: #ef4444; }

  /* Slide 3 - Öneriler */
  .rec-list { display: flex; flex-direction: column; gap: 16px; }
  .rec-item { background: #13131e; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; }
  .rec-item .badge { font-size: 11px; padding: 4px 12px; border-radius: 100px; font-weight: 600; }
  .badge-high { background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
  .badge-med { background: rgba(245,158,11,0.2); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
  .badge-low { background: rgba(107,114,128,0.2); color: #9ca3af; border: 1px solid rgba(107,114,128,0.3); }
  .rec-item .saving { font-size: 20px; font-weight: 700; color: #10b981; }

  /* Slide 4 - Chart */
  .chart-container { display: flex; gap: 48px; align-items: center; }
  .chart-bars { flex: 1; display: flex; align-items: flex-end; gap: 12px; height: 300px; }
  .bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .bar { width: 100%; border-radius: 6px 6px 0 0; background: linear-gradient(180deg, #2461ff, #1a45cc); }
  .bar-label { font-size: 12px; color: rgba(255,255,255,0.4); }

  /* Slide 5 - Sonuç */
  .slide-conclusion { background: linear-gradient(135deg, #050508, #0d1a2e); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 80px; }
  .big-number { font-size: 120px; font-weight: 900; color: #10b981; line-height: 1; margin-bottom: 24px; }
  .conclusion-text { font-size: 28px; color: white; font-weight: 600; margin-bottom: 16px; }
  .conclusion-sub { font-size: 18px; color: rgba(255,255,255,0.5); max-width: 600px; }
  .action-list { display: flex; gap: 24px; margin-top: 48px; }
  .action-item { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px 28px; font-size: 14px; color: rgba(255,255,255,0.7); }

  @media print {
    body { background: white; }
    .slide { page-break-after: always; margin: 0; }
  }
</style>
</head>
<body>

  <!-- Slide 1: Kapak -->
  <div class="slide slide-cover">
    <div class="logo">Unify<span>Tech</span> CostPilot</div>
    <h1>Azure Maliyet<br><span class="accent">Yönetimi Raporu</span></h1>
    <p>${reportData.tenant?.name}</p>
    <p class="date">${reportDate}</p>
  </div>

  <!-- Slide 2: Özet Metrikler -->
  <div class="slide slide-content">
    <div class="slide-title">Yönetici Özeti</div>
    <div class="slide-subtitle">Azure Altyapı Maliyet Analizi</div>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="label">Aylık Maliyet</div>
        <div class="value blue">$${reportData.totalCost.toFixed(0)}</div>
        <div class="sub">Bu ay toplam harcama</div>
      </div>
      <div class="metric-card">
        <div class="label">Tasarruf Fırsatı</div>
        <div class="value green">$${reportData.totalSaving.toFixed(0)}</div>
        <div class="sub">Aylık potansiyel tasarruf</div>
      </div>
      <div class="metric-card">
        <div class="label">Toplam Kaynak</div>
        <div class="value yellow">${reportData.resources.length}</div>
        <div class="sub">Taranan Azure kaynağı</div>
      </div>
    </div>
  </div>

  <!-- Slide 3: Öneriler -->
  <div class="slide slide-content">
    <div class="slide-title">Optimizasyon Önerileri</div>
    <div class="slide-subtitle">${reportData.recommendations.filter((r: any) => r.status === 'open').length} açık öneri · Toplam $${reportData.totalSaving.toFixed(0)}/ay tasarruf</div>
    <div class="rec-list">
      ${reportData.recommendations.filter((r: any) => r.status === 'open').slice(0, 5).map((r: any) => `
        <div class="rec-item">
          <div style="display:flex;align-items:center;gap:16px">
            <span class="badge ${r.estimated_monthly_saving >= 500 ? 'badge-high' : r.estimated_monthly_saving >= 200 ? 'badge-med' : 'badge-low'}">
              ${r.estimated_monthly_saving >= 500 ? 'Yüksek' : r.estimated_monthly_saving >= 200 ? 'Orta' : 'Düşük'}
            </span>
            <div>
              <div style="font-size:16px;font-weight:600;color:white">${r.title}</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.4)">${r.resources?.name || '-'}</div>
            </div>
          </div>
          <div class="saving">+$${r.estimated_monthly_saving.toFixed(0)}/ay</div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Slide 4: Kaynak Dağılımı -->
  <div class="slide slide-content">
    <div class="slide-title">Kaynak Dağılımı</div>
    <div class="slide-subtitle">Kaynak türlerine göre dağılım</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:32px">
      ${(() => {
        const typeCount: Record<string, number> = {}
        reportData.resources.forEach((r: any) => {
          const t = r.resource_type?.split('/').pop() || 'Diğer'
          typeCount[t] = (typeCount[t] || 0) + 1
        })
        return Object.entries(typeCount).slice(0, 6).map(([type, count]) => `
          <div style="background:#13131e;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px">
            <div style="font-size:14px;color:rgba(255,255,255,0.5);margin-bottom:8px">${type}</div>
            <div style="font-size:32px;font-weight:700;color:white">${count}</div>
            <div style="margin-top:8px;height:4px;background:rgba(255,255,255,0.1);border-radius:2px">
              <div style="height:100%;width:${Math.min((count / reportData.resources.length) * 100, 100)}%;background:#2461ff;border-radius:2px"></div>
            </div>
          </div>
        `).join('')
      })()}
    </div>
  </div>

  <!-- Slide 5: Sonuç -->
  <div class="slide slide-conclusion">
    <div class="big-number">$${reportData.totalSaving.toFixed(0)}</div>
    <div class="conclusion-text">Aylık Tasarruf Fırsatı</div>
    <div class="conclusion-sub">Tespit edilen optimizasyon önerilerinin tümü uygulandığında yıllık $${(reportData.totalSaving * 12).toFixed(0)} tasarruf sağlanabilir.</div>
    <div class="action-list">
      <div class="action-item">✅ ${reportData.recommendations.filter((r: any) => r.status === 'open').length} açık öneri uygulanmalı</div>
      <div class="action-item">📊 Bütçe limiti belirlenmeli</div>
      <div class="action-item">🔄 Düzenli tarama aktif edilmeli</div>
    </div>
  </div>

</body>
</html>`

      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 800)
      }

      toast.dismiss()
      toast.success('PowerPoint sunumu açıldı! PDF olarak kaydedin.')
    } catch {
      toast.dismiss()
      toast.error('Sunum oluşturulurken hata oluştu')
    }
    setGenerating(null)
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
          <p className="text-sm text-gray-500 mt-1">CEO ve yöneticiler için profesyonel raporlar</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={e => setSelectedPeriod(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="this_month">Bu Ay</option>
          <option value="last_3_months">Son 3 Ay</option>
          <option value="last_6_months">Son 6 Ay</option>
        </select>
      </div>

      {/* Rapor Kartları */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* PDF */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">PDF Raporu</h3>
          <p className="text-xs text-gray-500 mb-4">Detaylı maliyet analizi, öneriler ve kaynak envanteri. CEO'ya gönderilebilir format.</p>
          <div className="space-y-1.5 mb-5">
            {['Yönetici özeti', 'Maliyet metrikleri', 'Optimizasyon önerileri', 'Kaynak envanteri', 'Tarama geçmişi'].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="text-xs text-gray-400">{item}</span>
              </div>
            ))}
          </div>
          <button
            onClick={generatePDF}
            disabled={generating === 'pdf'}
            className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {generating === 'pdf' ? (
              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            PDF İndir
          </button>
        </div>

        {/* Excel */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">Excel Raporu</h3>
          <p className="text-xs text-gray-500 mb-4">Tüm veriler Excel'de filtrelenebilir ve analiz edilebilir formatta.</p>
          <div className="space-y-1.5 mb-5">
            {['Maliyet özeti', 'Tüm öneriler', 'Kaynak listesi', 'Maliyet dökümü', 'Filtrelenebilir tablo'].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-xs text-gray-400">{item}</span>
              </div>
            ))}
          </div>
          <button
            onClick={generateExcel}
            disabled={generating === 'excel'}
            className="w-full bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {generating === 'excel' ? (
              <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            Excel İndir
          </button>
        </div>

        {/* PowerPoint */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
          <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">PowerPoint Sunumu</h3>
          <p className="text-xs text-gray-500 mb-4">Yönetim toplantıları için hazır slayt sunumu. Profesyonel tasarım.</p>
          <div className="space-y-1.5 mb-5">
            {['Kapak slaydı', 'Yönetici özeti', 'Optimizasyon önerileri', 'Kaynak dağılımı', 'Aksiyon planı'].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span className="text-xs text-gray-400">{item}</span>
              </div>
            ))}
          </div>
          <button
            onClick={generatePPT}
            disabled={generating === 'ppt'}
            className="w-full bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/30 text-orange-400 text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {generating === 'ppt' ? (
              <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            Sunum İndir
          </button>
        </div>
      </div>

      {/* Tarama Geçmişi */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Tarama Geçmişi</h3>
        {scanLogs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Henüz tarama yapılmamış</p>
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
                    <td className="py-3 text-white">{log.resources_scanned || 0}</td>
                    <td className="py-3 text-white">{log.recommendations_found || 0}</td>
                    <td className="py-3 text-white">
                      {log.total_cost_usd > 0 ? `$${Number(log.total_cost_usd).toFixed(0)}` : '-'}
                    </td>
                    <td className="py-3 text-gray-400">{duration ? `${duration}s` : '-'}</td>
                    <td className="py-3">
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
        )}
      </div>
    </div>
  )
}