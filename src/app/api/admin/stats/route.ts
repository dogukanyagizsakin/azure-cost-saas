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

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tenants } = await adminSupabase
    .from('tenants')
    .select('*, users(id, email, role, created_at)')
    .order('created_at', { ascending: false })

  const { data: resources } = await adminSupabase
    .from('resources')
    .select('id, tenant_id, name, resource_type, is_active')

  const { data: recommendations } = await adminSupabase
    .from('recommendations')
    .select('id, tenant_id, status, estimated_monthly_saving')

  const { data: scanLogs } = await adminSupabase
    .from('scan_logs')
    .select('id, tenant_id, started_at, status')
    .order('started_at', { ascending: false })

  const customers = tenants?.map(t => {
    const tenantResources = resources?.filter(r => r.tenant_id === t.id) || []
    const tenantRecs = recommendations?.filter(r => r.tenant_id === t.id) || []
    const tenantScans = scanLogs?.filter(s => s.tenant_id === t.id) || []
    const openRecs = tenantRecs.filter(r => r.status === 'open')
    const totalSaving = openRecs.reduce((sum, r) => sum + r.estimated_monthly_saving, 0)

    return {
      id: t.id,
      name: t.name,
      email: t.users?.[0]?.email || '-',
      is_active: t.is_active ?? true,
      azure_connected: !!t.azure_subscription_id,
      azure_subscription_id: t.azure_subscription_id,
      monthly_budget: t.monthly_budget,
      resource_count: tenantResources.length,
      active_resources: tenantResources.filter(r => r.is_active).length,
      recommendation_count: openRecs.length,
      total_saving: totalSaving,
      scan_count: tenantScans.length,
      last_scan: tenantScans[0]?.started_at || null,
      created_at: t.created_at,
      user_count: t.users?.length || 0,
    }
  }) || []

  return NextResponse.json({
    stats: {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.is_active).length,
      totalResources: resources?.length || 0,
      totalRecommendations: recommendations?.filter(r => r.status === 'open').length || 0,
    },
    customers,
  })
}