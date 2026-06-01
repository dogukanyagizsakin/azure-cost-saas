import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message, history } = await request.json()

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    // Gerçek verileri çek
    const { data: resources } = await supabase
      .from('resources')
      .select('name, resource_type, location, is_active')
      .eq('tenant_id', userData.tenant_id)
      .limit(50)

    const { data: recommendations } = await supabase
      .from('recommendations')
      .select('title, type, estimated_monthly_saving, status')
      .eq('tenant_id', userData.tenant_id)
      .eq('status', 'open')
      .limit(20)

    const { data: scanLogs } = await supabase
      .from('scan_logs')
      .select('status, resources_scanned, recommendations_found, total_cost_usd, started_at')
      .eq('tenant_id', userData.tenant_id)
      .order('started_at', { ascending: false })
      .limit(5)

    const { data: tenant } = await supabase
      .from('tenants')
      .select('name, monthly_budget')
      .eq('id', userData.tenant_id)
      .single()

    const totalSaving = recommendations?.reduce((sum, r) => sum + r.estimated_monthly_saving, 0) || 0
    const lastScan = scanLogs?.[0]

    const systemPrompt = `Sen UnifyTech Azure Cost Management platformunun yapay zeka asistanısın. Türkçe konuşuyorsun ve Azure maliyet optimizasyonu konusunda uzmansın.

Kullanıcının mevcut Azure durumu:
- Şirket: ${tenant?.name || 'Bilinmiyor'}
- Toplam kaynak sayısı: ${resources?.length || 0}
- Açık optimizasyon önerisi: ${recommendations?.length || 0} adet
- Toplam potansiyel tasarruf: $${totalSaving.toFixed(0)}/ay
- Aylık bütçe: ${tenant?.monthly_budget ? '$' + tenant.monthly_budget : 'Belirlenmemiş'}
- Son tarama: ${lastScan ? new Date(lastScan.started_at).toLocaleDateString('tr-TR') : 'Henüz tarama yapılmamış'}
- Son taramada taranan kaynak: ${lastScan?.resources_scanned || 0}

Mevcut kaynaklar:
${resources?.slice(0, 10).map(r => `- ${r.name} (${r.resource_type?.split('/').pop()}, ${r.location || 'konum yok'}, ${r.is_active ? 'Aktif' : 'Pasif'})`).join('\n') || 'Henüz kaynak taranmamış'}

Açık öneriler:
${recommendations?.slice(0, 5).map(r => `- ${r.title}: $${r.estimated_monthly_saving.toFixed(0)}/ay tasarruf`).join('\n') || 'Öneri bulunamadı'}

Kısa, net ve yardımcı cevaplar ver. Teknik terimleri Türkçe açıkla. Maliyet optimizasyonu önerileri sun.`

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    })

    const chat = model.startChat({
      history: history?.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })) || [],
    })

    const result = await chat.sendMessage(message)
    const response = result.response.text()

    return NextResponse.json({ response })
  } catch (err: any) {
    console.error('AI error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}