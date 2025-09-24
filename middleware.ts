import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Allow Inngest and webhook endpoints to bypass Vercel protection
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/api/inngest') || pathname.startsWith('/webhook/')) {
    // Create response with headers to bypass protection
    const response = NextResponse.next()

    // Add CORS headers for webhook endpoints
    if (pathname.startsWith('/webhook/')) {
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/inngest/:path*',
    '/webhook/:path*'
  ]
}