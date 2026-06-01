import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { subscriptionId, tenantId, clientId, clientSecret, accessToken } = body

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Token ile kullanıcıyı doğrula
    let userId: string

    if (accessToken) {
      const { data: { user }, error } = await adminSupabase.auth.getUser(accessToken)
      if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      userId = user.id
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await adminSupabase
      .from('users')
      .select('tenant_id')
      .eq('id', userId)
      .single()

    if (!userData) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const { error } = await adminSupabase
      .from('tenants')
      .update({
        azure_subscription_id: subscriptionId,
        azure_tenant_id: tenantId,
        azure_client_id: clientId,
        azure_client_secret: clientSecret,
      })
      .eq('id', userData.tenant_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}