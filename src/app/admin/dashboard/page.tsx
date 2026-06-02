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

export async function GET(request: Request) {
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tenants } = await adminSupabase
    .from('tenants')
    .select('*, users(id, email)')

  const { data: resources } = await adminSupabase
    .from('resources')
    .select('id, tenant_id')

  const { data: recommendations } = await adminSupabase
    .from('recommendations')
    .select('id')
    .eq('status', 'open')

  const customers = tenants?.map(t => ({
    id: t.id,
    name: t.name,
    email: t.users?.[0]?.email || '-',
    is_active: !!t.azure_subscription_id,
    resource_count: resources?.filter(r => r.tenant_id === t.id).length || 0,
    created_at: t.created_at,
  })) || []

  return NextResponse.json({
    stats: {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.is_active).length,
      totalResources: resources?.length || 0,
      totalRecommendations: recommendations?.length || 0,
    },
    customers,
  })
}