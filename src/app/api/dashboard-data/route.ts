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

    const { data: { user } } = await adminSupabase.auth.getUser(accessToken)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await adminSupabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const { data: tenant } = await adminSupabase
      .from('tenants')
      .select('*')
      .eq('id', userData.tenant_id)
      .single()

    const { data: resources } = await adminSupabase
      .from('resources')
      .select('*, cost_snapshots(cost_usd)')
      .eq('tenant_id', userData.tenant_id)

    const { data: recommendations } = await adminSupabase
      .from('recommendations')
      .select('*, resources(name, resource_type, resource_group)')
      .eq('tenant_id', userData.tenant_id)
      .eq('status', 'open')
      .order('estimated_monthly_saving', { ascending: false })

    const { data: scanLogs } = await adminSupabase
      .from('scan_logs')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('started_at', { ascending: false })
      .limit(5)

    const totalCost = resources?.reduce((sum, r) =>
      sum + (r.cost_snapshots?.reduce((s: number, c: any) => s + Number(c.cost_usd), 0) || 0), 0) || 0

    const totalSaving = recommendations?.reduce((sum, r) => sum + r.estimated_monthly_saving, 0) || 0

    // Cost Management destekleniyor mu kontrol et
    const hasCostData = resources?.some(r =>
      r.cost_snapshots?.some((c: any) => Number(c.cost_usd) > 0)
    ) ?? false
    const costSupported = hasCostData || (resources?.length === 0)

    const lastScan = scanLogs?.[0]
    const lastScanTime = lastScan
      ? new Date(lastScan.started_at).toLocaleDateString('tr-TR', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        })
      : null

    return NextResponse.json({
      totalCost: Math.round(totalCost),
      totalSaving: Math.round(totalSaving),
      resourceCount: resources?.length || 0,
      activeCount: resources?.filter(r => r.is_active).length || 0,
      recommendationCount: recommendations?.length || 0,
      subscriptionName: tenant?.name || '',
      costSupported,
      lastScanTime,
      scanLogs: scanLogs || [],
      topResources: resources
        ?.sort((a, b) => {
          const aCost = a.cost_snapshots?.reduce((s: number, c: any) => s + Number(c.cost_usd), 0) || 0
          const bCost = b.cost_snapshots?.reduce((s: number, c: any) => s + Number(c.cost_usd), 0) || 0
          return bCost - aCost
        })
        .slice(0, 5)
        .map(r => ({
          name: r.name,
          type: r.resource_type?.split('/').pop() || r.resource_type,
          group: r.resource_group,
          cost: r.cost_snapshots?.reduce((s: number, c: any) => s + Number(c.cost_usd), 0) || 0,
          isActive: r.is_active,
        })),
      recommendations: recommendations?.slice(0, 5).map(r => ({
        kaynak: r.resources?.name || 'Bilinmiyor',
        tip: r.title,
        tasarruf: Math.round(r.estimated_monthly_saving),
        oncelik: r.estimated_monthly_saving >= 500 ? 'yüksek' :
          r.estimated_monthly_saving >= 200 ? 'orta' : 'düşük',
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}