import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { subscriptionId, tenantId, clientId, clientSecret } = body

    // Azure token al
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://management.azure.com/.default',
        }),
      }
    )

    if (!tokenResponse.ok) {
      const err = await tokenResponse.json()
      return NextResponse.json({
        success: false,
        error: 'Token alınamadı: ' + (err.error_description || err.error),
      }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Subscription doğrula
    const subResponse = await fetch(
      `https://management.azure.com/subscriptions/${subscriptionId}?api-version=2022-12-01`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!subResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Subscription erişilemiyor. ID ve roller kontrol edin.',
      }, { status: 400 })
    }

    const subData = await subResponse.json()
    return NextResponse.json({
      success: true,
      subscriptionName: subData.displayName,
      state: subData.state,
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}