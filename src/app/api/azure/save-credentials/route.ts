import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subscriptionId, tenantId, clientId, clientSecret } = body

    if (!subscriptionId || !tenantId || !clientId || !clientSecret) {
      return NextResponse.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 })
    }

    // Kullanıcının tenant'ını bul
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // Tenant'ı güncelle
    const { error } = await supabase
      .from('tenants')
      .update({
        azure_subscription_id: subscriptionId,
        azure_tenant_id: tenantId,
        azure_client_id: clientId,
        azure_client_secret: clientSecret,
      })
      .eq('id', userData.tenant_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}