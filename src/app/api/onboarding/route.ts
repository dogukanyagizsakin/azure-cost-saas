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

    if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data: tenant } = await adminSupabase
      .from('tenants')
      .select('azure_client_id, azure_subscription_id, onboarding_completed')
      .eq('id', userData.tenant_id)
      .single()

    const hasCredentials = !!tenant?.azure_client_id
    const hasSubscription = !!tenant?.azure_subscription_id
    const onboardingCompleted = !!tenant?.onboarding_completed

    return NextResponse.json({
      onboardingCompleted,
      hasCredentials,
      hasSubscription,
      currentStep: onboardingCompleted ? 5 :
        hasSubscription ? 4 :
        hasCredentials ? 3 : 1,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

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

    await adminSupabase
      .from('tenants')
      .update({ onboarding_completed: true })
      .eq('id', userData!.tenant_id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}