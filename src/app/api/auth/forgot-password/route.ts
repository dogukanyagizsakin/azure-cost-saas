import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email gerekli' }, { status: 400 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Kullanıcı var mı kontrol et
    const { data: user } = await adminSupabase
      .from('users')
      .select('email, name, tenant_id')
      .eq('email', email)
      .single()

    if (!user) {
      // Güvenlik için başarılı gibi davran
      return NextResponse.json({ success: true })
    }

    // Tenant adını al
    const { data: tenant } = await adminSupabase
      .from('tenants')
      .select('name')
      .eq('id', user.tenant_id)
      .single()

    // Admin'e bildirim emaili gönder
    await resend.emails.send({
      from: 'CostPilot <onboarding@resend.dev>',
      to: 'dogukan.yagiz@unifytech.com.tr',
      subject: `🔑 Şifre Sıfırlama Talebi — ${user.name || email}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;background:#0d0d14;color:#fff;margin:0;padding:0;">
          <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
            
            <div style="text-align:center;margin-bottom:32px;">
              <span style="font-size:28px;font-weight:900;color:#fff;">Unify</span>
              <span style="font-size:28px;font-weight:300;color:#60a5fa;">Tech</span>
              <p style="color:#6b7280;font-size:13px;margin-top:4px;">CostPilot Admin Bildirimi</p>
            </div>

            <div style="background:#13131e;border:1px solid #1f2937;border-radius:16px;padding:32px;">
              <div style="width:48px;height:48px;background:#1e3a5f;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                <span style="font-size:24px;">🔑</span>
              </div>
              
              <h2 style="color:#fff;font-size:20px;text-align:center;margin:0 0 8px;">Şifre Sıfırlama Talebi</h2>
              <p style="color:#9ca3af;text-align:center;font-size:14px;margin:0 0 24px;">Aşağıdaki müşteri şifresini sıfırlamak istiyor</p>

              <div style="background:#1a1a2e;border:1px solid #374151;border-radius:12px;padding:20px;margin-bottom:24px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                  <span style="color:#6b7280;font-size:13px;">Müşteri Adı</span>
                  <span style="color:#fff;font-size:13px;font-weight:600;">${user.name || '-'}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                  <span style="color:#6b7280;font-size:13px;">Email</span>
                  <span style="color:#60a5fa;font-size:13px;">${email}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                  <span style="color:#6b7280;font-size:13px;">Şirket</span>
                  <span style="color:#fff;font-size:13px;">${tenant?.name || '-'}</span>
                </div>
                <div style="display:flex;justify-content:space-between;">
                  <span style="color:#6b7280;font-size:13px;">Talep Zamanı</span>
                  <span style="color:#fff;font-size:13px;">${new Date().toLocaleString('tr-TR')}</span>
                </div>
              </div>

              <a href="https://azure-cost-saas.vercel.app/admin/customers" 
                style="display:block;background:#2461ff;color:#fff;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">
                Admin Paneline Git → Şifreyi Sıfırla
              </a>
            </div>

            <p style="color:#374151;font-size:11px;text-align:center;margin-top:24px;">
              Bu email CostPilot tarafından otomatik gönderilmiştir.
            </p>
          </div>
        </body>
        </html>
      `,
    })

    // Müşteriye de bilgi emaili gönder
    await resend.emails.send({
      from: 'CostPilot <onboarding@resend.dev>',
      to: email,
      subject: 'Şifre Sıfırlama Talebiniz Alındı',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;background:#0d0d14;color:#fff;margin:0;padding:0;">
          <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
            
            <div style="text-align:center;margin-bottom:32px;">
              <span style="font-size:28px;font-weight:900;color:#fff;">Unify</span>
              <span style="font-size:28px;font-weight:300;color:#60a5fa;">Tech</span>
              <p style="color:#6b7280;font-size:13px;margin-top:4px;">CostPilot</p>
            </div>

            <div style="background:#13131e;border:1px solid #1f2937;border-radius:16px;padding:32px;text-align:center;">
              <span style="font-size:48px;">✅</span>
              <h2 style="color:#fff;font-size:20px;margin:16px 0 8px;">Talebiniz Alındı</h2>
              <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Şifre sıfırlama talebiniz yöneticimize iletildi.<br>
                En kısa sürede yeni şifreniz size bildirilecektir.
              </p>
              <div style="background:#1a1a2e;border:1px solid #374151;border-radius:12px;padding:16px;">
                <p style="color:#6b7280;font-size:12px;margin:0;">
                  Talep saati: <span style="color:#fff;">${new Date().toLocaleString('tr-TR')}</span>
                </p>
              </div>
            </div>

            <p style="color:#374151;font-size:11px;text-align:center;margin-top:24px;">
              Bu talebi siz yapmadıysanız bu emaili görmezden gelebilirsiniz.
            </p>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Forgot password error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}