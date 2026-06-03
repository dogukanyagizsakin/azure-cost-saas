import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'costpilot-admin-secret-2024')

async function verifyAdmin(request: Request) {
  const token = request.headers.get('x-admin-token') || ''
  try {
    await jwtVerify(token, SECRET)
    return true
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tenantId, plan } = await request.json()

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const updateData: any = { plan }

    if (plan === 'pro') {
      updateData.plan_upgraded_at = new Date().toISOString()
      updateData.trial_ends_at = null
    } else if (plan === 'free') {
      updateData.trial_started_at = new Date().toISOString()
      updateData.trial_ends_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      updateData.plan_upgraded_at = null
    }

    await adminSupabase
      .from('tenants')
      .update(updateData)
      .eq('id', tenantId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}