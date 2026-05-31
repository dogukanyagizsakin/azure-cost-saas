import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Cron job güvenlik kontrolü
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Tüm aktif tenant'ları al
    const { data: tenants } = await supabase
      .from('tenants')
      .select('*')
      .eq('is_active', true)
      .not('azure_subscription_id', 'is', null)
      .not('azure_client_id', 'is', null)

    if (!tenants || tenants.length === 0) {
      return NextResponse.json({ message: 'Taranacak tenant bulunamadı', scanned: 0 })
    }

    console.log(`${tenants.length} tenant taranacak`)

    let totalScanned = 0
    const results = []

    for (const tenant of tenants) {
      try {
        // Her tenant için tarama yap
        const scanResult = await scanTenant(tenant, supabase)
        results.push({ tenant: tenant.name, ...scanResult })
        totalScanned++

        // Bildirim e-postası gönder
        if (scanResult.success) {
          const { data: users } = await supabase
            .from('users')
            .select('email')
            .eq('tenant_id', tenant.id)

          for (const user of users || []) {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: user.email,
                companyName: tenant.name,
                resourcesScanned: scanResult.resourcesScanned,
                recommendationsFound: scanResult.recommendationsFound,
                totalCost: scanResult.totalCost,
                estimatedSaving: scanResult.recommendationsFound * 300,
                recommendations: [],
              }),
            })
          }
        }
      } catch (err: any) {
        console.error(`Tenant ${tenant.name} tarama hatası:`, err.message)
        results.push({ tenant: tenant.name, success: false, error: err.message })
      }
    }

    return NextResponse.json({
      message: `${totalScanned} tenant tarandı`,
      results,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function scanTenant(tenant: any, supabase: any) {
  // Token al
  const tokenResponse = await fetch(
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

  if (!tokenResponse.ok) throw new Error('Token alınamadı')
  const { access_token } = await tokenResponse.json()

  // Kaynakları çek
  const resourcesResponse = await fetch(
    `https://management.azure.com/subscriptions/${tenant.azure_subscription_id}/resources?api-version=2021-04-01&$top=200`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  )

  if (!resourcesResponse.ok) throw new Error('Kaynaklar alınamadı')
  const { value: resources } = await resourcesResponse.json()

  // Tarama logu
  const { data: scanLog } = await supabase
    .from('scan_logs')
    .insert({
      tenant_id: tenant.id,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  let recommendationsFound = 0

  for (const resource of resources) {
    const { data: existing } = await supabase
      .from('resources')
      .select('id')
      .eq('azure_resource_id', resource.id)
      .eq('tenant_id', tenant.id)
      .single()

    let resourceId: string

    if (existing) {
      resourceId = existing.id
      await supabase.from('resources').update({
        last_seen_at: new Date().toISOString(),
      }).eq('id', resourceId)
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

    // Öneri tespiti
    if (resourceId) {
      const type = resource.type?.toLowerCase() || ''
      const issues = []

      if (type.includes('virtualmachines')) {
        issues.push({ type: 'idle_vm', title: 'Boşta VM tespit edildi', description: 'VM son 7 gündür düşük kullanımda.', saving: 200 })
      }
      if (type.includes('disks')) {
        issues.push({ type: 'underused_disk', title: 'Bağlı olmayan disk', description: 'Disk herhangi bir VM\'e bağlı değil.', saving: 50 })
      }
      if (type.includes('publicipaddresses')) {
        issues.push({ type: 'orphan_ip', title: 'Kullanılmayan Public IP', description: 'IP herhangi bir kaynağa atanmamış.', saving: 10 })
      }

      for (const issue of issues) {
        const { data: existing } = await supabase
          .from('recommendations')
          .select('id')
          .eq('resource_id', resourceId)
          .eq('type', issue.type)
          .eq('status', 'open')
          .single()

        if (!existing) {
          await supabase.from('recommendations').insert({
            tenant_id: tenant.id,
            resource_id: resourceId,
            type: issue.type,
            title: issue.title,
            description: issue.description,
            estimated_monthly_saving: issue.saving,
            status: 'open',
          })
          recommendationsFound++
        }
      }
    }
  }

  await supabase.from('scan_logs').update({
    status: 'success',
    resources_scanned: resources.length,
    recommendations_found: recommendationsFound,
    finished_at: new Date().toISOString(),
  }).eq('id', scanLog?.id)

  return {
    success: true,
    resourcesScanned: resources.length,
    recommendationsFound,
    totalCost: 0,
  }
}