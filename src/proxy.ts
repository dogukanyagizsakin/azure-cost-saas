import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'costpilot-admin-secret-2024')

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_token')?.value || ''

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      await jwtVerify(token, SECRET)
      return NextResponse.next()
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}