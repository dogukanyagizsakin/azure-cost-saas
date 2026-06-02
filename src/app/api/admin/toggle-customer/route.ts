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
    const { tenantId, isActive } = await request.json()

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Tenant'ı aktif/pasif et
    await adminSupabase
      .from('tenants')
      .update({ is_active: isActive })
      .eq('id', tenantId)

    // Kullanıcıları bul
    const { data: users } = await adminSupabase
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId)

    // Her kullanıcının auth durumunu güncelle
    for (const user of users || []) {
      await adminSupabase.auth.admin.updateUserById(user.id, {
        ban_duration: isActive ? 'none' : '876600h', // ~100 yıl ban
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}