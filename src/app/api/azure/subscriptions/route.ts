import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('accessToken')
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

    const { data: subscriptions } = await adminSupabase
      .from('azure_subscriptions')
      .select('*')
      .eq('tenant_id', userData!.tenant_id)
      .order('created_at', { ascending: true })

    return NextResponse.json({ subscriptions: subscriptions || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { accessToken, subscriptionId, subscriptionName } = await request.json()
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

    // Zaten var mı kontrol et
    const { data: existing } = await adminSupabase
      .from('azure_subscriptions')
      .select('id')
      .eq('tenant_id', userData!.tenant_id)
      .eq('subscription_id', subscriptionId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Bu subscription zaten eklenmiş' }, { status: 400 })
    }

    // Test et
    const { data: tenant } = await adminSupabase
      .from('tenants')
      .select('azure_client_id, azure_client_secret, azure_tenant_id')
      .eq('id', userData!.tenant_id)
      .single()

    if (!tenant?.azure_client_id) {
      return NextResponse.json({ error: 'Önce Azure credentials giriniz' }, { status: 400 })
    }

    // Token al
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

    if (!tokenRes.ok) {
      return NextResponse.json({ error: 'Azure credentials geçersiz' }, { status: 400 })
    }

    const tokenData = await tokenRes.json()

    // Subscription'ı doğrula
    const subRes = await fetch(
      `https://management.azure.com/subscriptions/${subscriptionId}?api-version=2020-01-01`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    )

    if (!subRes.ok) {
      return NextResponse.json({ error: 'Subscription ID geçersiz veya erişim yok' }, { status: 400 })
    }

    const subData = await subRes.json()
    const name = subscriptionName || subData.displayName || subscriptionId

    // Ekle
    const { data, error } = await adminSupabase
      .from('azure_subscriptions')
      .insert({
        tenant_id: userData!.tenant_id,
        subscription_id: subscriptionId,
        subscription_name: name,
        is_active: true,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true, subscription: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { accessToken, subscriptionDbId } = await request.json()
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user } } = await adminSupabase.auth.getUser(accessToken)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await adminSupabase
      .from('azure_subscriptions')
      .delete()
      .eq('id', subscriptionDbId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { accessToken, subscriptionDbId, isActive } = await request.json()
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user } } = await adminSupabase.auth.getUser(accessToken)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await adminSupabase
      .from('azure_subscriptions')
      .update({ is_active: isActive })
      .eq('id', subscriptionDbId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}