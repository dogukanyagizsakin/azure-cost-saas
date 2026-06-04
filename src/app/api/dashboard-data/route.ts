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

   // Azure'dan gerçek subscription adını çek
    let subscriptionName = tenant?.name || ''

    // Önce azure_subscriptions tablosuna bak
    const { data: azureSubs } = await adminSupabase
      .from('azure_subscriptions')
      .select('subscription_id, subscription_name')
      .eq('tenant_id', userData.tenant_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    const activeSubId = azureSubs?.subscription_id || tenant?.azure_subscription_id

    if (
      activeSubId &&
      tenant?.azure_tenant_id &&
      tenant?.azure_client_id &&
      tenant?.azure_client_secret
    ) {
      try {
        const tokenRes = await fetch(
          `https://login.microsoftonline.com/${tenant.azure_tenant_id}/oauth2/v2.0/token`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: tenant.azure_client_id,
              client_secret: tenant.azure_client_secret,
              scope: 'https://management.azure.com/.default',
            }),
          }
        )
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json()
          const subRes = await fetch(
            `https://management.azure.com/subscriptions/${activeSubId}?api-version=2022-12-01`,
            { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
          )
          if (subRes.ok) {
            const subData = await subRes.json()
            subscriptionName = subData.displayName || azureSubs?.subscription_name || tenant?.name
          } else {
            // Azure'dan alınamazsa tablodaki ismi kullan
            subscriptionName = azureSubs?.subscription_name || tenant?.name || ''
          }
        }
      } catch {
        subscriptionName = azureSubs?.subscription_name || tenant?.name || ''
      }
    }

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

    const totalSaving = recommendations?.reduce((sum, r) =>
      sum + r.estimated_monthly_saving, 0) || 0

   // Son tarama loguna bak — Cost Management destekleniyor mu?
    const lastScanLog = scanLogs?.[0]
    const costSupported = lastScanLog
      ? !lastScanLog.error_message?.includes('Tahmini maliyet') &&
        !lastScanLog.error_message?.includes('Cost Management API')
      : true

    const lastScan = scanLogs?.[0]
    const lastScanTime = lastScan
      ? new Date(lastScan.started_at).toLocaleDateString('tr-TR', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        })
      : null

// Kaynak türüne göre maliyet dağılımı
    const resourceTypeCosts: Record<string, number> = {}
    resources?.forEach(r => {
      const type = r.resource_type?.split('/').pop() || 'Diğer'
      const cost = r.cost_snapshots?.reduce((s: number, c: any) => s + Number(c.cost_usd), 0) || 0
      if (cost > 0) {
        resourceTypeCosts[type] = (resourceTypeCosts[type] || 0) + cost
      }
    })

    const resourceTypeChart = Object.entries(resourceTypeCosts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({
        name,
        value: Math.round(value),
        color: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i],
      }))

    // Tarama geçmişinden maliyet trendi
    const { data: allScanLogs } = await adminSupabase
      .from('scan_logs')
      .select('started_at, total_cost_usd, resources_scanned')
      .eq('tenant_id', userData.tenant_id)
      .eq('status', 'success')
      .order('started_at', { ascending: true })
      .limit(10)

    const costTrendChart = allScanLogs?.map(log => ({
      tarih: new Date(log.started_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      maliyet: Math.round(Number(log.total_cost_usd) || 0),
      kaynak: log.resources_scanned || 0,
    })) || []

    return NextResponse.json({
      totalCost: Math.round(totalCost),
      totalSaving: Math.round(totalSaving),
      resourceCount: resources?.length || 0,
      activeCount: resources?.filter(r => r.is_active).length || 0,
      recommendationCount: recommendations?.length || 0,
      subscriptionName,
      resourceTypeChart,
      costTrendChart,
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