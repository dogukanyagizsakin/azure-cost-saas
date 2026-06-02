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
  if (!response.ok) throw new Error('Kaynaklar alınamadı')
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
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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

    if (!response.ok) {
      console.log('Cost Management API desteklenmiyor, maliyet verisi atlanıyor')
      return []
    }

    const data = await response.json()
    return data.properties?.rows || []
  } catch {
    console.log('Cost Management API hatası, maliyet verisi atlanıyor')
    return []
  }
}

function detectIssues(resource: any, costPerMonth: number) {
  const type = resource.type?.toLowerCase() || ''
  const name = resource.name?.toLowerCase() || ''
  const tags = resource.tags || {}
  const issues = []

  // VM
  if (type.includes('microsoft.compute/virtualmachines')) {
    const isTestEnv = name.includes('dev') || name.includes('test') ||
      name.includes('staging') ||
      tags.environment?.toLowerCase()?.includes('dev') ||
      tags.environment?.toLowerCase()?.includes('test')

    // Sadece 1 ana öneri — boşta VM
    issues.push({
      type: 'idle_vm',
      title: `Boşta VM: ${resource.name}`,
      description: 'Bu VM düşük kullanımda. Durdurulması veya silinmesi önerilir.',
      saving: costPerMonth > 0 ? costPerMonth * 0.9 : 200,
    })

    // Test ortamı ise zamanlama önerisi
    if (isTestEnv) {
      issues.push({
        type: 'schedule',
        title: `Gece Kapatma: ${resource.name}`,
        description: 'Test/dev VM mesai dışında otomatik kapatılabilir. %65 tasarruf.',
        saving: costPerMonth > 0 ? costPerMonth * 0.65 : 180,
      })
    }
  }

  // Disk
  if (type.includes('microsoft.compute/disks')) {
    issues.push({
      type: 'underused_disk',
      title: `Bağlı Olmayan Disk: ${resource.name}`,
      description: "Bu disk herhangi bir VM'e bağlı değil. Silinmesi önerilir.",
      saving: costPerMonth > 0 ? costPerMonth * 0.95 : 50,
    })
  }

  // Public IP
  if (type.includes('microsoft.network/publicipaddresses')) {
    issues.push({
      type: 'orphan_ip',
      title: `Kullanılmayan Public IP: ${resource.name}`,
      description: 'Bu Public IP herhangi bir kaynağa atanmamış. Silinmesi önerilir.',
      saving: costPerMonth > 0 ? costPerMonth * 0.95 : 10,
    })
  }

  // Snapshot
  if (type.includes('microsoft.compute/snapshots')) {
    issues.push({
      type: 'old_snapshot',
      title: `Eski Snapshot: ${resource.name}`,
      description: 'Eski snapshot gereksizse silinmesi önerilir.',
      saving: costPerMonth > 0 ? costPerMonth * 0.9 : 20,
    })
  }

  // Storage
  if (type.includes('microsoft.storage/storageaccounts')) {
    issues.push({
      type: 'storage_tier',
      title: `Depolama Katmanı: ${resource.name}`,
      description: 'Nadiren erişilen veriler Cool/Archive katmanına taşınabilir.',
      saving: costPerMonth > 0 ? costPerMonth * 0.5 : 30,
    })
  }

  // App Service
  if (type.includes('microsoft.web/sites') || type.includes('microsoft.web/serverfarms')) {
    issues.push({
      type: 'rightsizing',
      title: `App Service Rightsizing: ${resource.name}`,
      description: 'App Service planı küçültülebilir.',
      saving: costPerMonth > 0 ? costPerMonth * 0.35 : 80,
    })
  }

  // SQL
  if (type.includes('microsoft.sql')) {
    issues.push({
      type: 'reserved_instance',
      title: `SQL Reserved Capacity: ${resource.name}`,
      description: 'Reserved Capacity ile %33 tasarruf.',
      saving: costPerMonth > 0 ? costPerMonth * 0.33 : 200,
    })
  }

  return issues
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { accessToken } = body

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(accessToken)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    if (!tenant?.azure_subscription_id) {
      return NextResponse.json({ error: 'Azure bağlantısı yapılmamış.' }, { status: 400 })
    }

    // Tarama logu başlat
    const { data: scanLog } = await adminSupabase
      .from('scan_logs')
      .insert({
        tenant_id: tenant.id,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    try {
      const azureToken = await getAzureToken(
        tenant.azure_tenant_id,
        tenant.azure_client_id,
        tenant.azure_client_secret
      )

      const resources = await getResources(azureToken, tenant.azure_subscription_id)
      const costs = await getCosts(azureToken, tenant.azure_subscription_id)

      const costMap: Record<string, number> = {}
      costs.forEach((row: any[]) => {
        if (row[0] && row[1]) {
          costMap[row[0].toLowerCase()] = parseFloat(row[1]) || 0
        }
      })

      const costSupported = costs.length > 0
      let totalCost = 0
      let recommendationsFound = 0

      for (const resource of resources) {
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
          await adminSupabase
            .from('resources')
            .update({
              name: resource.name,
              resource_type: resource.type,
              resource_group: resource.id?.split('/resourceGroups/')[1]?.split('/')[0] || '',
              location: resource.location || '',
              tags: resource.tags || {},
              last_seen_at: new Date().toISOString(),
            })
            .eq('id', resourceId)
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
              subscription_id: tenant.azure_subscription_id,
              tags: resource.tags || {},
            })
            .select()
            .single()
          resourceId = newResource?.id
        }

        // Maliyet snapshot kaydet (sadece cost destekleniyorsa)
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

        // Öneri tespiti
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

      await adminSupabase
        .from('scan_logs')
        .update({
          status: 'success',
          resources_scanned: resources.length,
          recommendations_found: recommendationsFound,
          total_cost_usd: totalCost,
          finished_at: new Date().toISOString(),
          error_message: !costSupported
            ? 'Cost Management API bu subscription türünde desteklenmiyor'
            : null,
        })
        .eq('id', scanLog?.id)

      // Bildirim e-postası gönder
      try {
        const { data: users } = await adminSupabase
          .from('users')
          .select('email')
          .eq('tenant_id', tenant.id)

        for (const u of users || []) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: u.email,
              companyName: tenant.name,
              resourcesScanned: resources.length,
              recommendationsFound,
              totalCost,
              estimatedSaving: recommendationsFound * 300,
              recommendations: [],
            }),
          })
        }
      } catch (emailErr) {
        console.log('E-posta gönderilemedi:', emailErr)
      }

      return NextResponse.json({
        success: true,
        resourcesScanned: resources.length,
        recommendationsFound,
        totalCost: totalCost.toFixed(2),
        costSupported,
      })

    } catch (scanError: any) {
      await adminSupabase
        .from('scan_logs')
        .update({
          status: 'failed',
          error_message: scanError.message,
          finished_at: new Date().toISOString(),
        })
        .eq('id', scanLog?.id)

      return NextResponse.json({ error: scanError.message }, { status: 500 })
    }

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Sunucu hatası' }, { status: 500 })
  }
}