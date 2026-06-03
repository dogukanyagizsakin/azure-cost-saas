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
      .select('plan, trial_started_at, trial_ends_at, plan_upgraded_at')
      .eq('id', userData.tenant_id)
      .single()

    if (!tenant) return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 404 })

    const now = new Date()
    const trialEnds = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null
    const isTrialExpired = tenant.plan === 'free' && trialEnds && now > trialEnds
    const daysLeft = trialEnds
      ? Math.max(0, Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null

    return NextResponse.json({
      plan: tenant.plan,
      isTrialExpired,
      daysLeft,
      trialEndsAt: tenant.trial_ends_at,
      isPro: tenant.plan === 'pro',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}