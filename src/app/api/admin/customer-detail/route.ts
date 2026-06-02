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

export async function GET(request: Request) {
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId gerekli' }, { status: 400 })
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tenant } = await adminSupabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  const { data: users } = await adminSupabase
    .from('users')
    .select('*')
    .eq('tenant_id', tenantId)

  const { data: resources } = await adminSupabase
    .from('resources')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  const { data: recommendations } = await adminSupabase
    .from('recommendations')
    .select('*, resources(name)')
    .eq('tenant_id', tenantId)
    .order('estimated_monthly_saving', { ascending: false })

  const { data: scanLogs } = await adminSupabase
    .from('scan_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('started_at', { ascending: false })
    .limit(10)

  const totalSaving = recommendations
    ?.filter(r => r.status === 'open')
    .reduce((sum, r) => sum + r.estimated_monthly_saving, 0) || 0

  return NextResponse.json({
    tenant,
    users,
    resources,
    recommendations,
    scanLogs,
    stats: {
      resourceCount: resources?.length || 0,
      activeResources: resources?.filter(r => r.is_active).length || 0,
      openRecs: recommendations?.filter(r => r.status === 'open').length || 0,
      appliedRecs: recommendations?.filter(r => r.status === 'applied').length || 0,
      totalSaving,
      scanCount: scanLogs?.length || 0,
    }
  })
}