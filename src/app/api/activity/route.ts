import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { accessToken, action, details } = await request.json()
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

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') || 'unknown'

    await adminSupabase.from('activity_logs').insert({
      tenant_id: userData.tenant_id,
      user_id: user.id,
      user_email: user.email,
      action,
      details: details || {},
      ip_address: ip,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('accessToken')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '0')

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

    const { data, count } = await adminSupabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .eq('tenant_id', userData!.tenant_id)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    return NextResponse.json({ logs: data || [], total: count || 0 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}