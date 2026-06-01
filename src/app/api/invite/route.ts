import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { email, role } = await request.json()

    if (!email) return NextResponse.json({ error: 'E-posta gerekli' }, { status: 400 })

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id, full_name')
      .eq('id', user.id)
      .single()

    if (!userData) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', userData.tenant_id)
      .single()

    // Daha önce davet gönderilmiş mi kontrol et
    const { data: existing } = await supabase
      .from('invitations')
      .select('id, status')
      .eq('email', email)
      .eq('tenant_id', userData.tenant_id)
      .eq('status', 'pending')
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Bu e-postaya zaten bekleyen bir davet var' }, { status: 400 })
    }

    // Davet oluştur
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        tenant_id: userData.tenant_id,
        email,
        role: role || 'admin',
        invited_by: user.id,
      })
      .select()
      .single()

    if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 500 })

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?token=${invitation.token}`
    const inviterName = userData.full_name || user.email

    // Davet e-postası gönder
    await resend.emails.send({
      from: 'Azure Cost <onboarding@resend.dev>',
      to: [email],
      subject: `${tenant?.name} sizi Azure Cost platformuna davet etti`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,sans-serif;">
          <div style="max-width:500px;margin:0 auto;padding:40px 16px;">
            <div style="background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px;">
              <div style="margin-bottom:24px;">
                <span style="color:white;font-weight:700;font-size:18px;">Unify</span>
                <span style="color:#60a5fa;font-weight:300;font-size:18px;">Tech</span>
                <p style="color:#64748b;font-size:11px;margin:2px 0 0;">Azure Cost Management</p>
              </div>
              <h1 style="color:white;font-size:20px;font-weight:700;margin:0 0 12px;">Platforma Davet Edildiniz</h1>
              <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">
                <strong style="color:#e2e8f0;">${inviterName}</strong> sizi <strong style="color:#e2e8f0;">${tenant?.name}</strong> şirketinin Azure Cost Management platformuna <strong style="color:#60a5fa;">${role === 'viewer' ? 'Görüntüleyici' : 'Admin'}</strong> olarak davet etti.
              </p>
              <a href="${inviteUrl}" style="display:block;text-align:center;background:#2563eb;color:white;text-decoration:none;font-size:14px;font-weight:500;padding:14px;border-radius:10px;margin-bottom:16px;">
                Daveti Kabul Et →
              </a>
              <p style="color:#475569;font-size:12px;text-align:center;margin:0;">
                Bu link 7 gün geçerlidir. Daveti siz istemediyseniz görmezden gelebilirsiniz.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const { data: invitations } = await supabase
      .from('invitations')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ invitations: invitations || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}