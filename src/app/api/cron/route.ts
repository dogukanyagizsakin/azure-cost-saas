import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

async function getAzureToken(tenantId: string, clientId: string, clientSecret: string) {
  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://management.azure.com/.default',
      }),
    }
  )
  const data = await response.json()
  if (!response.ok) throw new Error(data.error_description || 'Token alınamadı')
  return data.access_token
}

async function getResources(token: string, subscriptionId: string) {
  const response = await fetch(
    `https://management.azure.com/subscriptions/${subscriptionId}/resources?api-version=2021-04-01&$top=200`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await response.json()
  if (!response.ok) return []
  return data.value || []
}

async function getCosts(token: string, subscriptionId: string) {
  try {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const endDate = now.toISOString().split('T')[0]
    const response = await fetch(
      `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ActualCost',
          timeframe: 'Custom',
          timePeriod: { from: startDate, to: endDate },
          dataset: {
            granularity: 'None',
            aggregation: { totalCost: { name: 'Cost', function: 'Sum' } },
            grouping: [{ type: 'Dimension', name: 'ResourceId' }],
          },
        }),
      }
    )
    if (!response.ok) return []
    const data = await response.json()
    return data.properties?.rows || []
  } catch {
    return []
  }
}

function detectIssues(resource: any, costPerMonth: number) {
  const type = resource.type?.toLowerCase() || ''
  const name = resource.name?.toLowerCase() || ''
  const tags = resource.tags || {}
  const issues = []
  const isTestEnv = name.includes('dev') || name.includes('test') || name.includes('staging') || tags.environment?.toLowerCase()?.includes('dev')
  const saving = (pct: number) => costPerMonth > 0 ? costPerMonth * pct : 50

  if (type.includes('virtualmachines') || type.includes('hybridcompute/machines') || type.includes('microsoft.hybridcompute')) {
    issues.push({ type: 'idle_vm', title: `Makine İnceleme: ${resource.name}`, description: 'Kullanım durumu incelenmelidir.', saving: saving(0.3) })
    if (isTestEnv) issues.push({ type: 'schedule', title: `Gece Kapatma: ${resource.name}`, description: 'Mesai dışında otomatik kapatılabilir.', saving: saving(0.65) })
  }
  if (type.includes('disks')) issues.push({ type: 'underused_disk', title: `Bağlı Olmayan Disk: ${resource.name}`, description: 'Makineye bağlı değil, silinebilir.', saving: saving(0.95) })
  if (type.includes('publicipaddresses')) issues.push({ type: 'orphan_ip', title: `Kullanılmayan IP: ${resource.name}`, description: 'Kaynağa atanmamış, silinebilir.', saving: saving(0.95) })
  if (type.includes('snapshots')) issues.push({ type: 'old_snapshot', title: `Eski Snapshot: ${resource.name}`, description: 'Gereksizse silinebilir.', saving: saving(0.9) })
  if (type.includes('storageaccounts')) issues.push({ type: 'storage_tier', title: `Depolama Optimizasyonu: ${resource.name}`, description: 'Cool/Archive katmanına taşınabilir.', saving: saving(0.5) })
  if (type.includes('microsoft.sql') || type.includes('sqlservers')) issues.push({ type: 'reserved_instance', title: `SQL Reserved Capacity: ${resource.name}`, description: 'Reserved Capacity ile %33 tasarruf.', saving: saving(0.33) })
  if (issues.length === 0) issues.push({ type: 'rightsizing', title: `Kaynak Optimizasyonu: ${resource.name}`, description: `${resource.type} için optimizasyon değerlendirilebilir.`, saving: saving(0.2) })
  return issues
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tenants } = await adminSupabase
    .from('tenants')
    .select('*')
    .eq('is_active', true)
    .not('azure_client_id', 'is', null)

  const results = []

  for (const tenant of tenants || []) {
    try {
      // Multi-subscription desteği
      const { data: subscriptions } = await adminSupabase
        .from('azure_subscriptions')
        .select('subscription_id, subscription_name')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)

      const subList = subscriptions && subscriptions.length > 0
        ? subscriptions
        : tenant?.azure_subscription_id
          ? [{ subscription_id: tenant.azure_subscription_id, subscription_name: 'Ana Subscription' }]
          : []

      if (subList.length === 0) {
        results.push({ tenant: tenant.name, skipped: true, reason: 'Subscription yok' })
        continue
      }

      const { data: scanLog } = await adminSupabase
        .from('scan_logs')
        .insert({ tenant_id: tenant.id, status: 'running', started_at: new Date().toISOString() })
        .select()
        .single()

      const azureToken = await getAzureToken(tenant.azure_tenant_id, tenant.azure_client_id, tenant.azure_client_secret)

      let allResources: any[] = []
      let allCosts: any[] = []

      for (const sub of subList) {
        const subResources = await getResources(azureToken, sub.subscription_id)
        const subCosts = await getCosts(azureToken, sub.subscription_id)
        subResources.forEach((r: any) => {
          r._subscriptionId = sub.subscription_id
          r._subscriptionName = sub.subscription_name
        })
        allResources = [...allResources, ...subResources]
        allCosts = [...allCosts, ...subCosts]
      }

      const costMap: Record<string, number> = {}
      allCosts.forEach((row: any[]) => {
        if (row[0] && row[1]) costMap[row[0].toLowerCase()] = parseFloat(row[1]) || 0
      })

      const costSupported = allCosts.length > 0
      let totalCost = 0
      let recommendationsFound = 0

      for (const resource of allResources) {
        const resourceCost = costMap[resource.id?.toLowerCase()] || 0
        totalCost += resourceCost

        const { data: existing } = await adminSupabase
          .from('resources')
          .select('id')
          .eq('azure_resource_id', resource.id)
          .eq('tenant_id', tenant.id)
          .maybeSingle()

        let resourceId: string

        if (existing) {
          resourceId = existing.id
          await adminSupabase.from('resources').update({
            name: resource.name,
            resource_type: resource.type,
            resource_group: resource.id?.split('/resourceGroups/')[1]?.split('/')[0] || '',
            location: resource.location || '',
            tags: resource.tags || {},
            last_seen_at: new Date().toISOString(),
          }).eq('id', resourceId)
        } else {
          const { data: newResource } = await adminSupabase
            .from('resources')
            .insert({
              tenant_id: tenant.id,
              azure_resource_id: resource.id,
              name: resource.name,
              resource_type: resource.type,
              resource_group: resource.id?.split('/resourceGroups/')[1]?.split('/')[0] || '',
              location: resource.location || '',
              subscription_id: resource._subscriptionId || tenant.azure_subscription_id,
              tags: resource.tags || {},
            })
            .select()
            .single()
          resourceId = newResource?.id
        }

        if (resourceId && resourceCost > 0 && costSupported) {
          const now = new Date()
          await adminSupabase.from('cost_snapshots').insert({
            tenant_id: tenant.id,
            resource_id: resourceId,
            period_start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
            period_end: now.toISOString().split('T')[0],
            cost_usd: resourceCost,
          })
        }

        if (resourceId) {
          const issues = detectIssues(resource, resourceCost)
          for (const issue of issues) {
            const estimatedSaving = resourceCost > 0 ? resourceCost * 0.8 : issue.saving
            const { data: existingRec } = await adminSupabase
              .from('recommendations')
              .select('id')
              .eq('resource_id', resourceId)
              .eq('type', issue.type)
              .eq('status', 'open')
              .maybeSingle()

            if (!existingRec) {
              await adminSupabase.from('recommendations').insert({
                tenant_id: tenant.id,
                resource_id: resourceId,
                type: issue.type,
                title: issue.title,
                description: issue.description,
                estimated_monthly_saving: estimatedSaving,
                status: 'open',
              })
              recommendationsFound++
            }
          }
        }
      }

      await adminSupabase.from('scan_logs').update({
        status: 'success',
        resources_scanned: allResources.length,
        recommendations_found: recommendationsFound,
        total_cost_usd: totalCost,
        finished_at: new Date().toISOString(),
        error_message: !costSupported ? 'Cost Management API desteklenmiyor' : null,
      }).eq('id', scanLog?.id)

      results.push({
        tenant: tenant.name,
        success: true,
        resourcesScanned: allResources.length,
        recommendationsFound,
        subscriptionsScanned: subList.length,
      })

    } catch (err: any) {
      results.push({ tenant: tenant.name, success: false, error: err.message })
    }
  }

  return NextResponse.json({
    success: true,
    tenantsProcessed: tenants?.length || 0,
    results,
  })
}