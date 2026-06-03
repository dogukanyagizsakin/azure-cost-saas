import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { accessToken } = await request.json()
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(accessToken)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Kullanıcı zaten var mı?
    const { data: existingUser } = await adminSupabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', user.id)
      .single()

    if (existingUser) {
      // Tenant aktif mi kontrol et
      const { data: tenant } = await adminSupabase
        .from('tenants')
        .select('is_active')
        .eq('id', existingUser.tenant_id)
        .single()

      if (tenant && tenant.is_active === false) {
        return NextResponse.json({ error: 'Hesabınız pasif edilmiştir. Lütfen yöneticinizle iletişime geçin.' }, { status: 403 })
      }

      return NextResponse.json({ success: true, existing: true })
    }

    // Yeni kullanıcı — tenant oluştur
    const name = user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] || 'User'

    const company = user.user_metadata?.company ||
      user.email?.split('@')[1]?.split('.')[0] || 'Company'

    const { data: tenant, error: tenantError } = await adminSupabase
  .from('tenants')
  .insert({ name: company, is_active: true, onboarding_completed: false })
  .select()
  .single()

    if (tenantError) return NextResponse.json({ error: tenantError.message }, { status: 500 })

    const { error: userError } = await adminSupabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        name,
        tenant_id: tenant.id,
        role: 'admin',
      })

    if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })

    return NextResponse.json({ success: true, existing: false })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}