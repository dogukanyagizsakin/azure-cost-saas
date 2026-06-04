import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { accessToken, subject, category, priority, message } = await request.json()
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

    const { data: tenant } = await adminSupabase
      .from('tenants')
      .select('name')
      .eq('id', userData!.tenant_id)
      .single()

    // Ticket oluştur
    const { data: ticket, error } = await adminSupabase
      .from('support_tickets')
      .insert({
        tenant_id: userData!.tenant_id,
        user_id: user.id,
        user_email: user.email,
        company_name: tenant?.name,
        subject,
        category,
        priority,
        message,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error

    // Admin'e e-posta gönder
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify-support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          userEmail: user.email,
          companyName: tenant?.name,
          subject,
          category,
          priority,
          message,
        }),
      })
    } catch (emailErr) {
      console.log('E-posta gönderilemedi:', emailErr)
    }

    return NextResponse.json({ success: true, ticketId: ticket.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

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

    const { data: tickets } = await adminSupabase
      .from('support_tickets')
      .select('*')
      .eq('tenant_id', userData!.tenant_id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ tickets: tickets || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}