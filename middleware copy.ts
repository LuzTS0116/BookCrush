import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// import { PrismaClient } from '@/lib/generated/prisma' // Prisma still commented out

// const prisma = new PrismaClient() // Prisma still commented out

// List of public routes that don't require authentication or profile setup
const publicRoutes = [
  { path: '/', exact: true }, // Mark root as needing an exact match
  { path: '/login', exact: false },
  { path: '/signup', exact: false },
  { path: '/api/auth', exact: false }, // Typically /api/auth/callback, /api/auth/signout etc.
  { path: '/api/user/check-profile', exact: true }, // The API route itself should be public-ish or handled by its own auth
  { path: '/profile-setup', exact: false },
  { path: '/_next', exact: false },
  { path: '/images', exact: false },
  { path: '/favicon.ico', exact: true }, // Favicon should be exact
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('Middleware start for path:', pathname);

  // Updated public route check
  const isPublic = publicRoutes.some(route => {
    if (route.exact) {
      return pathname === route.path;
    }
    return pathname.startsWith(route.path);
  });

  if (isPublic) {
    console.log('Path is public, skipping auth checks.');
    return NextResponse.next()
  }
  console.log('Path is NOT public, proceeding with auth checks...');

  // Create a Supabase client configured to use cookies
  const res = NextResponse.next() // Create response object here, to be potentially used by supabase client
  const supabase = createMiddlewareClient({ req: request, res })

  // Refresh session if expired - required for Server Components
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('Supabase getSession error:', sessionError.message);
    // Decide how to handle this - for now, let's redirect to login as if no session
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    redirectUrl.searchParams.set('error', 'session_error');
    return NextResponse.redirect(redirectUrl)
  }

  // If no session, redirect to login
  if (!session) {
    console.log('No session found, redirecting to login.');
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  console.log('Session found for user:', session.user.id);

  // If already on profile-setup, let it through
  if (pathname.startsWith('/profile-setup')) {
    console.log('Already on profile-setup, allowing.');
    return res;
  }

  try {
    // Call the internal API to check for profile existence
    // Pass along the cookies from the original request to the API route fetch call
    const profileCheckUrl = new URL('/api/user/check-profile', request.url);
    const profileResponse = await fetch(profileCheckUrl, {
      headers: {
        'cookie': request.headers.get('cookie') || ''
      }
    });

    if (!profileResponse.ok) {
      // If the API call itself fails, log and redirect to an error page or login
      console.error('API /check-profile call failed:', profileResponse.status, await profileResponse.text());
      const errorRedirectUrl = new URL('/login', request.url); // Or a generic error page
      errorRedirectUrl.searchParams.set('error', 'profile_check_failed');
      return NextResponse.redirect(errorRedirectUrl);
    }

    const { hasProfile } = await profileResponse.json();
    console.log('Profile check API response:', { hasProfile });

    if (!hasProfile) {
      console.log('No profile found, redirecting to /profile-setup.');
      const redirectUrl = new URL('/profile-setup', request.url);
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    console.log('Profile found, proceeding.');
  } catch (e: any) {
    console.error('Error during profile check fetch:', e.message);
    // Fallback redirect in case of unexpected error during fetch
    const errorRedirectUrl = new URL('/login', request.url);
    errorRedirectUrl.searchParams.set('error', 'internal_middleware_error');
    return NextResponse.redirect(errorRedirectUrl);
  }

  return res // Return the response object that might have been updated by Supabase client
}

// Configure which routes to run middleware on (original matcher)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}