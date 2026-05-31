import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function generateScanReportEmail(data: {
  companyName: string
  resourcesScanned: number
  recommendationsFound: number
  totalCost: number
  estimatedSaving: number
  recommendations: Array<{
    kaynak: string
    tip: string
    tasarruf: number
    oncelik: string
  }>
}) {
  const { companyName, resourcesScanned, recommendationsFound, totalCost, estimatedSaving, recommendations } = data

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Azure Maliyet Raporu</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;margin-bottom:24px;">
        <div style="background:#2563eb;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-right:12px;">
          <span style="color:white;font-weight:700;font-size:16px;">A</span>
        </div>
        <div>
          <span style="color:white;font-weight:700;font-size:16px;">Unify</span><span style="color:#60a5fa;font-weight:300;font-size:16px;">Tech</span>
          <p style="color:#64748b;font-size:11px;margin:0;">Azure Cost Management</p>
        </div>
      </div>
      <h1 style="color:white;font-size:22px;font-weight:700;margin:0 0 8px;">Azure Tarama Raporu</h1>
      <p style="color:#94a3b8;font-size:14px;margin:0;">${companyName} · ${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>

    <!-- Metrikler -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
      <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;">
        <p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">Toplam Maliyet</p>
        <p style="color:white;font-size:24px;font-weight:700;margin:0;">$${totalCost.toLocaleString()}</p>
        <p style="color:#ef4444;font-size:12px;margin:4px 0 0;">Bu ay</p>
      </div>
      <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;">
        <p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">Tasarruf Fırsatı</p>
        <p style="color:#34d399;font-size:24px;font-weight:700;margin:0;">$${estimatedSaving.toLocaleString()}</p>
        <p style="color:#10b981;font-size:12px;margin:4px 0 0;">%${Math.round(estimatedSaving / totalCost * 100)} tasarruf mümkün</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
      <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;">
        <p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">Taranan Kaynak</p>
        <p style="color:white;font-size:24px;font-weight:700;margin:0;">${resourcesScanned}</p>
      </div>
      <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;">
        <p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">Bulunan Öneri</p>
        <p style="color:#f59e0b;font-size:24px;font-weight:700;margin:0;">${recommendationsFound}</p>
      </div>
    </div>

    <!-- Öneriler -->
    ${recommendationsFound > 0 ? `
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;margin-bottom:24px;">
      <h2 style="color:white;font-size:15px;font-weight:600;margin:0 0 16px;">Optimizasyon Önerileri</h2>
      ${recommendations.map(r => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #1e293b;">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="background:${r.oncelik === 'yüksek' ? '#450a0a' : r.oncelik === 'orta' ? '#422006' : '#1e293b'};color:${r.oncelik === 'yüksek' ? '#f87171' : r.oncelik === 'orta' ? '#fbbf24' : '#94a3b8'};font-size:11px;padding:2px 8px;border-radius:20px;">${r.oncelik}</span>
            <div>
              <p style="color:white;font-size:13px;font-weight:500;margin:0;">${r.kaynak}</p>
              <p style="color:#64748b;font-size:12px;margin:2px 0 0;">${r.tip}</p>
            </div>
          </div>
          <p style="color:#34d399;font-size:13px;font-weight:600;margin:0;">+$${r.tasarruf}/ay</p>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="http://localhost:3000/dashboard" style="background:#2563eb;color:white;text-decoration:none;font-size:14px;font-weight:500;padding:12px 32px;border-radius:10px;display:inline-block;">
        Dashboard'u Görüntüle
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;">
      <p style="color:#334155;font-size:12px;margin:0;">UnifyTech Azure Cost Management · Otomatik tarama raporu</p>
      <p style="color:#334155;font-size:12px;margin:4px 0 0;">Sonraki tarama 8 saat sonra gerçekleşecek</p>
    </div>

  </div>
</body>
</html>
  `
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      to,
      companyName,
      resourcesScanned,
      recommendationsFound,
      totalCost,
      estimatedSaving,
      recommendations,
    } = body

    if (!to) {
      return NextResponse.json({ error: 'E-posta adresi gerekli' }, { status: 400 })
    }

    const html = generateScanReportEmail({
      companyName: companyName || 'Şirket',
      resourcesScanned: resourcesScanned || 0,
      recommendationsFound: recommendationsFound || 0,
      totalCost: totalCost || 0,
      estimatedSaving: estimatedSaving || 0,
      recommendations: recommendations || [],
    })

    const { data, error } = await resend.emails.send({
      from: 'Azure Cost <onboarding@resend.dev>',
      to: [to],
      subject: `Azure Tarama Raporu — ${recommendationsFound} öneri bulundu`,
      html,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}