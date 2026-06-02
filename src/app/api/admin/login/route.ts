import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'

const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'costpilot-admin-secret-2024')

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Admin kullanıcıyı doğrula
    const { data: admin } = await adminSupabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'Geçersiz email veya şifre' }, { status: 401 })
    }

    // Şifreyi doğrula
    const { data: valid } = await adminSupabase
      .rpc('verify_admin_password', { input_email: email, input_password: password })

    if (!valid) {
      return NextResponse.json({ error: 'Geçersiz email veya şifre' }, { status: 401 })
    }

    // JWT token oluştur
    const token = await new SignJWT({ 
      adminId: admin.id, 
      email: admin.email,
      name: admin.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(SECRET)

    return NextResponse.json({ success: true, token, name: admin.name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}