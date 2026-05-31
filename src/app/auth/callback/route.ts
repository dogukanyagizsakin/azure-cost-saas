import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  console.log('Callback URL:', request.url)
  
  // Hash fragment'ı handle etmek için client-side sayfaya yönlendir
  return NextResponse.redirect(`${origin}/auth/callback-handler`)
}