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

  const now = new Date()
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Tüm tenantlar
  const { data: tenants } = await adminSupabase
    .from('tenants')
    .select('id, name, is_active, azure_subscription_id')

  // Tüm scan logları
  const { data: allScans } = await adminSupabase
    .from('scan_logs')
    .select('*')
    .order('started_at', { ascending: false })

  // Son 24 saatteki taramalar
  const { data: recentScans } = await adminSupabase
    .from('scan_logs')
    .select('*')
    .gte('started_at', last24h)
    .order('started_at', { ascending: false })

  // Hatalı taramalar
  const { data: failedScans } = await adminSupabase
    .from('scan_logs')
    .select('*, tenants(name)')
    .eq('status', 'failed')
    .gte('started_at', last7d)
    .order('started_at', { ascending: false })

  // Her tenant için son tarama durumu
  const tenantHealth = tenants?.map(t => {
    const tenantScans = allScans?.filter(s => s.tenant_id === t.id) || []
    const lastScan = tenantScans[0]
    const successScans = tenantScans.filter(s => s.status === 'success').length
    const failedScanCount = tenantScans.filter(s => s.status === 'failed').length

    const lastScanAge = lastScan
      ? Math.round((now.getTime() - new Date(lastScan.started_at).getTime()) / (1000 * 60 * 60))
      : null

    let status: 'healthy' | 'warning' | 'error' | 'inactive' = 'inactive'
    if (!t.is_active) status = 'inactive'
    else if (!t.azure_subscription_id) status = 'warning'
    else if (!lastScan) status = 'warning'
    else if (lastScan.status === 'failed') status = 'error'
    else if (lastScanAge && lastScanAge > 48) status = 'warning'
    else status = 'healthy'

    return {
      tenantId: t.id,
      tenantName: t.name,
      isActive: t.is_active,
      azureConnected: !!t.azure_subscription_id,
      lastScan: lastScan?.started_at || null,
      lastScanStatus: lastScan?.status || null,
      lastScanAge,
      totalScans: tenantScans.length,
      successScans,
      failedScans: failedScanCount,
      resourcesScanned: lastScan?.resources_scanned || 0,
      status,
    }
  }) || []

  // Platform istatistikleri
  const healthyCount = tenantHealth.filter(t => t.status === 'healthy').length
  const warningCount = tenantHealth.filter(t => t.status === 'warning').length
  const errorCount = tenantHealth.filter(t => t.status === 'error').length
  const inactiveCount = tenantHealth.filter(t => t.status === 'inactive').length

  const platformScore = tenants?.length
    ? Math.round((healthyCount / tenants.length) * 100)
    : 100

  return NextResponse.json({
    platform: {
      score: platformScore,
      totalTenants: tenants?.length || 0,
      activeTenants: tenants?.filter(t => t.is_active).length || 0,
      healthy: healthyCount,
      warning: warningCount,
      error: errorCount,
      inactive: inactiveCount,
      totalScans24h: recentScans?.length || 0,
      failedScans7d: failedScans?.length || 0,
    },
    tenantHealth,
    failedScans: failedScans?.slice(0, 10) || [],
    recentScans: recentScans?.slice(0, 20) || [],
  })
}