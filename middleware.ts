import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const globalPublicRoutes = [
  { path: '/', exact: true },
  { path: '/login', exact: false },
  { path: '/signup', exact: false },
  { path: '/auth', exact: false }, // Covers /auth/callback etc.
  { path: '/api/auth', exact: false }, // For NextAuth API routes
  { path: '/profile-setup', exact: false },
  { path: '/api/user/profile-status', exact: true }, // Allow profile status check
  { path: '/_next', exact: false },
  { path: '/images', exact: false },
  { path: '/favicon.ico', exact: true },
  { path: '/api/profile', exact: true },
  // API routes that handle their own Bearer token authentication
  { path: '/api/clubs', exact: false }, // All clubs API routes
  { path: '/api/invitations', exact: false }, // All invitations API routes
  { path: '/api/meetings', exact: false }, // All meetings API routes
  { path: '/api/books', exact: false }, // All books API routes
  { path: '/api/social', exact: false }, // All social API routes
  { path: '/api/friends', exact: false }, // All friends API routes
  { path: '/api/shelf', exact: false }, // All shelf API routes
  { path: '/api/reactions', exact: false }, // All reactions API routes
  { path: '/api/quotes', exact: false }, // All quotes API routes
  { path: '/api/discussions', exact: false }, // All discussions API routes
  { path: '/api/user-books', exact: false }, // All user-books API routes
  { path: '/api/files', exact: false }, // All files API routes
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('[Main Middleware] Start for path:', pathname);

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  const isGloballyPublic = globalPublicRoutes.some(route =>
    route.exact ? pathname === route.path : pathname.startsWith(route.path)
  );

  if (isGloballyPublic) {
    console.log('[Main Middleware] Path is globally public, allowing.');
    return NextResponse.next();
  }

  if (!token) {
    console.log('[Main Middleware] No user token found, redirecting to login.');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  console.log('[Main Middleware] Token found:', {
    id: token.id,
    email: token.email,
    hasSupaToken: !!token.supa?.access_token,
    supaTokenLength: token.supa?.access_token?.length || 0
  });

  if (pathname.startsWith('/profile-setup')) {
    console.log('[Main Middleware] Already on /profile-setup, allowing.');
    return NextResponse.next();
  }

  // Check if we have the required token data
  if (!token.id) {
    console.warn('[Main Middleware] Token found but missing user ID');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'missing_user_id');
    return NextResponse.redirect(loginUrl);
  }

  if (!token.supa?.access_token) {
    console.warn('[Main Middleware] Token found but missing Supabase access token');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'missing_supabase_token');
    return NextResponse.redirect(loginUrl);
  }

  // Check profile status
  try {
    const profileStatusUrl = new URL('/api/user/profile-status', request.url);
    const profileResponse = await fetch(profileStatusUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${token.supa.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[Main Middleware] Profile status response:', profileResponse.status);

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json().catch(() => ({ error: 'Failed to parse profile status error' }));
      console.error('[Main Middleware] Profile status check failed:', profileResponse.status, errorData.error);
      
      // If it's a 401, the token might be expired
      if (profileResponse.status === 401) {
        console.log('[Main Middleware] Unauthorized - token might be expired, redirecting to login');
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'token_expired');
        return NextResponse.redirect(loginUrl);
      }
      
      // For other errors, redirect to login with error
      const errorRedirectUrl = new URL('/login', request.url);
      errorRedirectUrl.searchParams.set('error', 'profile_check_api_error');
      return NextResponse.redirect(errorRedirectUrl);
    }

    const { hasProfile } = await profileResponse.json();
    console.log('[Main Middleware] Profile status:', { hasProfile });

    if (!hasProfile) {
      console.log('[Main Middleware] No profile found, redirecting to /profile-setup.');
      const redirectUrl = new URL('/profile-setup', request.url);
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    console.log('[Main Middleware] Profile found, allowing access to:', pathname);
    return NextResponse.next();
    
  } catch (error: any) {
    console.error('[Main Middleware] Error calling profile status API:', error.message);
    const errorRedirectUrl = new URL('/login', request.url);
    errorRedirectUrl.searchParams.set('error', 'profile_api_fetch_error');
    return NextResponse.redirect(errorRedirectUrl);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};