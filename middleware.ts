import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('user_id')?.value
  const { pathname } = request.nextUrl

  if (!token && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  if (token && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  if (
    pathname === '/dashboard/admin' || 
    pathname === '/dashboard/vendedor' || 
    pathname === '/dashboard/marketing'
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
}