import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { subscriptionId, tenantId, clientId, clientSecret } = body

    if (!tenantId || !clientId || !clientSecret) {
      return NextResponse.json({ success: false, error: 'Tenant ID, Client ID ve Client Secret zorunludur.' }, { status: 400 })
    }

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
        error: 'Credentials geçersiz: ' + (err.error_description || err.error),
      }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Subscription ID varsa doğrula, yoksa sadece token ile başarılı say
    if (subscriptionId && subscriptionId.trim() !== '') {
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
    }

    // Subscription ID yoksa sadece credentials doğrulaması yeterli
    // Tenant bilgisini al
    const tenantResponse = await fetch(
      `https://management.azure.com/tenants?api-version=2022-12-01`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (tenantResponse.ok) {
      const tenantData = await tenantResponse.json()
      const tenant = tenantData.value?.[0]
      return NextResponse.json({
        success: true,
        subscriptionName: tenant?.displayName || 'Azure Bağlantısı Doğrulandı',
        state: 'Connected',
      })
    }

    return NextResponse.json({
      success: true,
      subscriptionName: 'Azure Bağlantısı Doğrulandı',
      state: 'Connected',
    })

  } catch (err: any) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}