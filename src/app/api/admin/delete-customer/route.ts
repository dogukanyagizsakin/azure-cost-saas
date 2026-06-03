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
    const { tenantId } = await request.json()

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Önce kullanıcı ID'lerini al
    const { data: users } = await adminSupabase
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId)

    // Önce Auth kullanıcılarını sil (en kritik adım)
    for (const user of users || []) {
      try {
        await adminSupabase.auth.admin.deleteUser(user.id)
      } catch (err) {
        console.error('Auth user delete error:', err)
      }
    }

    // Sonra tüm ilişkili verileri sil (sıralı)
    await adminSupabase.from('activity_logs').delete().eq('tenant_id', tenantId)
    await adminSupabase.from('recommendations').delete().eq('tenant_id', tenantId)
    await adminSupabase.from('cost_snapshots').delete().eq('tenant_id', tenantId)
    await adminSupabase.from('resources').delete().eq('tenant_id', tenantId)
    await adminSupabase.from('scan_logs').delete().eq('tenant_id', tenantId)
    await adminSupabase.from('notification_logs').delete().eq('tenant_id', tenantId)
    await adminSupabase.from('invitations').delete().eq('tenant_id', tenantId)
    await adminSupabase.from('azure_subscriptions').delete().eq('tenant_id', tenantId)
    await adminSupabase.from('users').delete().eq('tenant_id', tenantId)
    await adminSupabase.from('tenants').delete().eq('id', tenantId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}