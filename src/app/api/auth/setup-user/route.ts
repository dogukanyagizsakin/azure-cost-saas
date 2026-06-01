import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 })
    }

    // Admin client
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Token ile kullanıcıyı doğrula
    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(accessToken)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Kullanıcı var mı kontrol et
    const { data: existingUser } = await adminSupabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', user.id)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ exists: true, isNew: false })
    }

    // Yeni kullanıcı — tenant oluştur
    const email = user.email || ''
    const fullName = user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      email.split('@')[0]
    const companyDomain = email.split('@')[1]?.split('.')[0] || 'company'
    const slug = companyDomain.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()

    const { data: tenant, error: tenantError } = await adminSupabase
      .from('tenants')
      .insert({
        name: companyDomain,
        slug,
        is_active: true,
        plan: 'free',
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Tenant error:', tenantError)
      return NextResponse.json({ error: tenantError.message }, { status: 500 })
    }

    const { error: userError } = await adminSupabase
      .from('users')
      .insert({
        id: user.id,
        tenant_id: tenant.id,
        email,
        full_name: fullName,
        role: 'owner',
      })

    if (userError) {
      console.error('User error:', userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    console.log('New user created:', email, 'tenant:', tenant.name)
    return NextResponse.json({ exists: false, isNew: true })

  } catch (err: any) {
    console.error('Setup user error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}