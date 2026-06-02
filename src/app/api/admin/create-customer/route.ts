import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'costpilot-admin-secret-2024')

async function verifyAdmin(request: Request) {
  const token = request.headers.get('x-admin-token') || ''
  try {
    await jwtVerify(token, SECRET)
    return true
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, email, password, company } = await request.json()

    if (!name || !email || !password || !company) {
      return NextResponse.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalıdır' }, { status: 400 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Email zaten kullanılıyor mu kontrol et
    const { data: existingUsers } = await adminSupabase.auth.admin.listUsers()
    const emailExists = existingUsers?.users?.some(u => u.email === email)
    if (emailExists) {
      return NextResponse.json({ error: 'Bu email zaten kullanılıyor' }, { status: 400 })
    }

    // Supabase Auth'da kullanıcı oluştur
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        name: name,
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // Tenant oluştur
    const { data: tenant, error: tenantError } = await adminSupabase
      .from('tenants')
      .insert({
        name: company,
        is_active: true,
      })
      .select()
      .single()

    if (tenantError) {
      // Auth user'ı geri al
      await adminSupabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: tenantError.message }, { status: 400 })
    }

    // Users tablosuna ekle
    const { error: userError } = await adminSupabase
      .from('users')
      .insert({
        id: userId,
        email,
        name,
        tenant_id: tenant.id,
        role: 'admin',
      })

    if (userError) {
      // Rollback
      await adminSupabase.auth.admin.deleteUser(userId)
      await adminSupabase.from('tenants').delete().eq('id', tenant.id)
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      tenantId: tenant.id,
      userId,
      message: `${name} başarıyla oluşturuldu`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}