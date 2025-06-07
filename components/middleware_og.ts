import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// List of public routes that don't require authentication or profile setup
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/api/auth',
  '/api/profile',  // Allow profile API access
  '/profile-setup', // Allow access to profile setup page
  '/_next',        // Next.js assets
  '/images',       // Static images
  '/favicon.ico',  // Favicon
]

export async function middleware(request: NextRequest) {
  try {
    // Check if the route is public
    if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Create a Supabase client configured to use cookies
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    // Refresh session if expired - required for Server Components
    const { data: { session } } = await supabase.auth.getSession()

    // If no session, redirect to login
    if (!session) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user has a profile
    const profile = await prisma.profile.findUnique({
      where: { id: session.user.id }
    })
    console.log('User ID:', session.user.id)
console.log('Profile check result:', profile)

    // If no profile and not already on profile setup page, redirect to profile setup
    if (!profile && !request.nextUrl.pathname.startsWith('/profile-setup')) {
      const redirectUrl = new URL('/profile-setup', request.url)
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // In case of error, allow the request to proceed
    return NextResponse.next()
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 