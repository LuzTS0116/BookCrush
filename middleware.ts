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
  { path: '/forgot-password', exact: true },
  
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
  { path: '/api/profile/presign', exact: true },
  { path: '/api/auth/forgot-password', exact: true }, // All forgot password API routes
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // console.log('[Main Middleware] Start for path:', pathname);

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  const isGloballyPublic = globalPublicRoutes.some(route =>
    route.exact ? pathname === route.path : pathname.startsWith(route.path)
  );

  if (isGloballyPublic) {
    // console.log('[Main Middleware] Path is globally public, allowing.');
    return NextResponse.next();
  }

  if (!token) {
    // console.log('[Main Middleware] No user token found, redirecting to login.');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // console.log('[Main Middleware] Token found:', {
  //   id: token.id,
  //   email: token.email,
  //   hasSupaToken: !!token.supa?.access_token,
  //   profileComplete: token.profileComplete
  // });

  if (pathname.startsWith('/profile-setup')) {
    console.log('[Main Middleware] Already on /profile-setup, allowing.');
    return NextResponse.next();
  }

  // Check if we have the required token data
  if (!token.id) {
    // console.warn('[Main Middleware] Token found but missing user ID');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'missing_user_id');
    return NextResponse.redirect(loginUrl);
  }

  if (!token.supa?.access_token) {
    // console.warn('[Main Middleware] Token found but missing Supabase access token');
    // Add a special flag to indicate this is an invalid session
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'invalid_session');
    loginUrl.searchParams.set('clearSession', 'true');
    return NextResponse.redirect(loginUrl);
  }

  // Check profile completion status from JWT token (no API call needed!)
  if (token.profileComplete === false) {
    console.log('[Main Middleware] Profile incomplete, redirecting to /profile-setup.');
    const redirectUrl = new URL('/profile-setup', request.url);
    redirectUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If profileComplete is undefined, it means we need to check once
  // This can happen during token refresh or edge cases
  if (token.profileComplete === undefined) {
    // console.log('[Main Middleware] Profile status unknown, allowing but logging warning.');
    console.warn('[Main Middleware] Profile status is undefined for user:', token.id);
    // Allow access but the JWT callback should handle this on next token refresh
  }
  
  // console.log('[Main Middleware] Profile complete, allowing access to:', pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};