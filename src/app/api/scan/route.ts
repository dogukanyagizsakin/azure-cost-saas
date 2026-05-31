import { createSupabaseServerClient } from '@/lib/supabase-server'
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

  if (!response.ok) return []
  const data = await response.json()
  return data.properties?.rows || []
}

function detectIssues(resource: any) {
  const type = resource.type?.toLowerCase() || ''
  const name = resource.name?.toLowerCase() || ''
  const issues = []

  if (type.includes('virtualmachines')) {
    issues.push({ type: 'idle_vm', title: 'Boşta VM tespit edildi', description: 'VM son 7 gündür %5\'in altında CPU kullanıyor olabilir.', estimatedSaving: 0 })
  }
  if (type.includes('disks') && !type.includes('virtualmachines')) {
    issues.push({ type: 'underused_disk', title: 'Bağlı olmayan disk', description: 'Bu disk herhangi bir VM\'e bağlı değil, orphan olabilir.', estimatedSaving: 0 })
  }
  if (type.includes('publicipaddresses')) {
    issues.push({ type: 'orphan_ip', title: 'Kullanılmayan Public IP', description: 'Bu IP herhangi bir kaynağa atanmamış olabilir.', estimatedSaving: 0 })
  }

  return issues
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Kullanıcının tenant bilgilerini al
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', userData.tenant_id)
      .single()

    if (!tenant?.azure_subscription_id) {
      return NextResponse.json({ error: 'Azure bağlantısı yapılmamış. Önce Ayarlar sayfasından Azure bilgilerini girin.' }, { status: 400 })
    }

    // Tarama logu başlat
    const { data: scanLog } = await supabase
      .from('scan_logs')
      .insert({
        tenant_id: tenant.id,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    try {
      // Azure token al
      const token = await getAzureToken(
        tenant.azure_tenant_id,
        tenant.azure_client_id,
        tenant.azure_client_secret
      )

      // Kaynakları çek
      const resources = await getResources(token, tenant.azure_subscription_id)

      // Maliyetleri çek
      const costs = await getCosts(token, tenant.azure_subscription_id)

      // Maliyet map'i oluştur
      const costMap: Record<string, number> = {}
      costs.forEach((row: any[]) => {
        if (row[0] && row[1]) {
          costMap[row[0].toLowerCase()] = parseFloat(row[1]) || 0
        }
      })

      let totalCost = 0
      let recommendationsFound = 0

      // Kaynakları işle
      for (const resource of resources) {
        const resourceCost = costMap[resource.id?.toLowerCase()] || 0
        totalCost += resourceCost

        // Kaynağı kaydet / güncelle
        const { data: existingResource } = await supabase
          .from('resources')
          .select('id')
          .eq('azure_resource_id', resource.id)
          .eq('tenant_id', tenant.id)
          .single()

        let resourceId: string

        if (existingResource) {
          resourceId = existingResource.id
          await supabase
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
          const { data: newResource } = await supabase
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

        // Maliyet snapshot kaydet
        if (resourceId && resourceCost > 0) {
          const now = new Date()
          await supabase.from('cost_snapshots').insert({
            tenant_id: tenant.id,
            resource_id: resourceId,
            period_start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
            period_end: now.toISOString().split('T')[0],
            cost_usd: resourceCost,
          })
        }

        // Sorunları tespit et
        if (resourceId) {
          const issues = detectIssues(resource)
          for (const issue of issues) {
            const estimatedSaving = resourceCost * 0.8

            const { data: existingRec } = await supabase
              .from('recommendations')
              .select('id')
              .eq('resource_id', resourceId)
              .eq('type', issue.type)
              .eq('status', 'open')
              .single()

            if (!existingRec) {
              await supabase.from('recommendations').insert({
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

      // Tarama logunu güncelle
      await supabase
        .from('scan_logs')
        .update({
          status: 'success',
          resources_scanned: resources.length,
          recommendations_found: recommendationsFound,
          total_cost_usd: totalCost,
          finished_at: new Date().toISOString(),
        })
        .eq('id', scanLog?.id)

// Bildirim e-postası gönder
try {
  const { data: notifSettings } = await supabase
    .from('users')
    .select('email')
    .eq('id', user.id)
    .single()

  if (notifSettings?.email) {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: notifSettings.email,
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
      })

    } catch (scanError: any) {
      // Tarama hatasını logla
      await supabase
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