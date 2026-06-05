import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'costpilot-admin-secret-2024')

async function verifyAdmin(request: Request) {
  const token = request.headers.get('x-admin-token') || ''
  try { await jwtVerify(token, SECRET); return true } catch { return false }
}

export async function POST(request: Request) {
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Ad, email ve şifre zorunludur' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalıdır' }, { status: 400 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Email zaten var mı kontrol et
    const { data: existing } = await adminSupabase
      .from('admins')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Bu email adresi zaten kayıtlı' }, { status: 400 })
    }

    // Yeni admin ekle
    const { error } = await adminSupabase.rpc('create_admin', {
      p_email: email,
      p_password: password,
      p_name: name,
    })

    if (error) {
      // RPC yoksa direkt SQL ile ekle
      const { error: insertError } = await adminSupabase
        .from('admins')
        .insert({
          email,
          name,
          password_hash: password, // trigger ile hash'lenecek
        })

      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}