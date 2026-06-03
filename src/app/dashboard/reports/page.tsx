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
      const now = new Date()
      const rows: string[][] = []

      rows.push(['UnifyTech CostPilot - Azure Maliyet Raporu'])
      rows.push([`Şirket: ${reportData.tenant?.name}`])
      rows.push([`Tarih: ${now.toLocaleDateString('tr-TR')}`])
      rows.push([])
      rows.push(['ÖZET'])
      rows.push(['Toplam Maliyet', `$${reportData.totalCost.toFixed(2)}`])
      rows.push(['Tasarruf Fırsatı', `$${reportData.totalSaving.toFixed(2)}`])
      rows.push(['Toplam Kaynak', reportData.resources.length.toString()])
      rows.push(['Açık Öneri', reportData.recommendations.filter((r: any) => r.status === 'open').length.toString()])
      rows.push([])
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

      const csv = rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n')

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
    toast.loading('PowerPoint hazırlanıyor...')

    try {
      const PptxGenJS = (await import('pptxgenjs')).default
      const prs = new PptxGenJS()

      prs.layout = 'LAYOUT_WIDE'

      // Slide 1 - Kapak
      const slide1 = prs.addSlide()
      slide1.background = { color: '0d0d14' }
      slide1.addText('UnifyTech CostPilot', {
        x: 0.5, y: 1.5, w: 12, h: 0.8,
        fontSize: 36, bold: true, color: '60a5fa', align: 'center'
      })
      slide1.addText('Azure Maliyet Yönetimi Raporu', {
        x: 0.5, y: 2.5, w: 12, h: 0.7,
        fontSize: 28, bold: true, color: 'FFFFFF', align: 'center'
      })
      slide1.addText(reportData.tenant?.name || '', {
        x: 0.5, y: 3.4, w: 12, h: 0.5,
        fontSize: 18, color: '9ca3af', align: 'center'
      })
      slide1.addText(new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }), {
        x: 0.5, y: 4.0, w: 12, h: 0.4,
        fontSize: 14, color: '6b7280', align: 'center'
      })

      // Slide 2 - Yönetici Özeti
      const slide2 = prs.addSlide()
      slide2.background = { color: '0d0d14' }
      slide2.addText('Yönetici Özeti', {
        x: 0.5, y: 0.3, w: 12, h: 0.6,
        fontSize: 24, bold: true, color: 'FFFFFF'
      })
      slide2.addShape(prs.ShapeType.line, {
        x: 0.5, y: 1.0, w: 12, h: 0,
        line: { color: '1f2937', width: 1 }
      })

      const metrics = [
        { label: 'Aylık Maliyet', value: `$${reportData.totalCost.toFixed(0)}`, color: '3b82f6' },
        { label: 'Tasarruf Fırsatı', value: `$${reportData.totalSaving.toFixed(0)}`, color: '10b981' },
        { label: 'Toplam Kaynak', value: `${reportData.resources.length}`, color: 'f59e0b' },
        { label: 'Açık Öneri', value: `${reportData.recommendations.filter((r: any) => r.status === 'open').length}`, color: 'ef4444' },
      ]

      metrics.forEach((m, i) => {
        const x = 0.5 + i * 3.1
        slide2.addShape(prs.ShapeType.roundRect, {
          x, y: 1.2, w: 2.8, h: 1.8,
          fill: { color: '13131e' },
          line: { color: '1f2937', width: 1 },
          rectRadius: 0.1,
        })
        slide2.addText(m.label, {
          x, y: 1.3, w: 2.8, h: 0.4,
          fontSize: 10, color: '9ca3af', align: 'center'
        })
        slide2.addText(m.value, {
          x, y: 1.8, w: 2.8, h: 0.8,
          fontSize: 28, bold: true, color: m.color, align: 'center'
        })
      })

      // Slide 3 - Öneriler
      const slide3 = prs.addSlide()
      slide3.background = { color: '0d0d14' }
      slide3.addText('Optimizasyon Önerileri', {
        x: 0.5, y: 0.3, w: 12, h: 0.6,
        fontSize: 24, bold: true, color: 'FFFFFF'
      })
      slide3.addShape(prs.ShapeType.line, {
        x: 0.5, y: 1.0, w: 12, h: 0,
        line: { color: '1f2937', width: 1 }
      })

      const openRecs = reportData.recommendations.filter((r: any) => r.status === 'open').slice(0, 5)
      openRecs.forEach((r: any, i: number) => {
        const y = 1.2 + i * 0.9
        const priority = r.estimated_monthly_saving >= 500 ? 'ef4444' :
          r.estimated_monthly_saving >= 200 ? 'f59e0b' : '6b7280'
        slide3.addShape(prs.ShapeType.roundRect, {
          x: 0.5, y, w: 12, h: 0.75,
          fill: { color: '13131e' },
          line: { color: '1f2937', width: 1 },
          rectRadius: 0.05,
        })
        slide3.addText(
          r.estimated_monthly_saving >= 500 ? 'Yüksek' :
          r.estimated_monthly_saving >= 200 ? 'Orta' : 'Düşük',
          { x: 0.6, y: y + 0.18, w: 0.8, h: 0.35, fontSize: 8, bold: true, color: priority, align: 'center' }
        )
        slide3.addText(r.title, {
          x: 1.6, y: y + 0.1, w: 8, h: 0.3,
          fontSize: 12, bold: true, color: 'FFFFFF'
        })
        slide3.addText(r.resources?.name || '-', {
          x: 1.6, y: y + 0.42, w: 8, h: 0.25,
          fontSize: 9, color: '9ca3af'
        })
        slide3.addText(`+$${r.estimated_monthly_saving.toFixed(0)}/ay`, {
          x: 10, y: y + 0.18, w: 2, h: 0.35,
          fontSize: 14, bold: true, color: '10b981', align: 'right'
        })
      })

      // Slide 4 - Kaynak Dağılımı
      const slide4 = prs.addSlide()
      slide4.background = { color: '0d0d14' }
      slide4.addText('Kaynak Dağılımı', {
        x: 0.5, y: 0.3, w: 12, h: 0.6,
        fontSize: 24, bold: true, color: 'FFFFFF'
      })
      slide4.addShape(prs.ShapeType.line, {
        x: 0.5, y: 1.0, w: 12, h: 0,
        line: { color: '1f2937', width: 1 }
      })

      const typeCount: Record<string, number> = {}
      reportData.resources.forEach((r: any) => {
        const t = r.resource_type?.split('/').pop() || 'Diğer'
        typeCount[t] = (typeCount[t] || 0) + 1
      })

      const colors = ['3b82f6', '8b5cf6', '06b6d4', '10b981', 'f59e0b', 'ef4444']
      Object.entries(typeCount).slice(0, 6).forEach(([type, count], i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const x = 0.5 + col * 4.2
        const y = 1.3 + row * 1.8
        slide4.addShape(prs.ShapeType.roundRect, {
          x, y, w: 3.8, h: 1.5,
          fill: { color: '13131e' },
          line: { color: '1f2937', width: 1 },
          rectRadius: 0.1,
        })
        slide4.addText(type, {
          x, y: y + 0.2, w: 3.8, h: 0.4,
          fontSize: 11, color: '9ca3af', align: 'center'
        })
        slide4.addText(`${count}`, {
          x, y: y + 0.6, w: 3.8, h: 0.6,
          fontSize: 32, bold: true, color: colors[i] || '3b82f6', align: 'center'
        })
      })

      // Slide 5 - Sonuç
      const slide5 = prs.addSlide()
      slide5.background = { color: '050508' }
      slide5.addText(`$${reportData.totalSaving.toFixed(0)}`, {
        x: 0.5, y: 0.8, w: 12, h: 1.5,
        fontSize: 72, bold: true, color: '10b981', align: 'center'
      })
      slide5.addText('Aylık Tasarruf Fırsatı', {
        x: 0.5, y: 2.4, w: 12, h: 0.6,
        fontSize: 24, bold: true, color: 'FFFFFF', align: 'center'
      })
      slide5.addText(`Yıllık toplam: $${(reportData.totalSaving * 12).toFixed(0)} tasarruf sağlanabilir`, {
        x: 0.5, y: 3.1, w: 12, h: 0.5,
        fontSize: 14, color: '9ca3af', align: 'center'
      })

      const actions = [
        `${reportData.recommendations.filter((r: any) => r.status === 'open').length} açık öneri uygulanmalı`,
        'Bütçe limiti belirlenmeli',
        'Düzenli tarama aktif edilmeli',
      ]
      actions.forEach((action, i) => {
        slide5.addShape(prs.ShapeType.roundRect, {
          x: 0.5 + i * 4.2, y: 3.8, w: 3.8, h: 0.7,
          fill: { color: '13131e' },
          line: { color: '1f2937', width: 1 },
          rectRadius: 0.1,
        })
        slide5.addText(action, {
          x: 0.5 + i * 4.2, y: 3.85, w: 3.8, h: 0.6,
          fontSize: 11, color: 'b0b0b0', align: 'center'
        })
      })

      const now = new Date()
      await prs.writeFile({
        fileName: `costpilot-sunum-${now.toISOString().split('T')[0]}.pptx`
      })

      toast.dismiss()
      toast.success('PowerPoint sunumu indirildi!')
    } catch (err) {
      console.error(err)
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* PDF */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">PDF Raporu</h3>
          <p className="text-xs text-gray-500 mb-4">Detaylı maliyet analizi, öneriler ve kaynak envanteri. CEO&apos;ya gönderilebilir format.</p>
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
          <p className="text-xs text-gray-500 mb-4">Tüm veriler Excel&apos;de filtrelenebilir ve analiz edilebilir formatta.</p>
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