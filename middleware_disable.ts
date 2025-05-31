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
  { path: '/api/profile', exact: true }
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

  if (token) {
    console.log('[Main Middleware] User token found:', token.id ? `ID: ${token.id}` : 'No ID in token', token.email ? `Email: ${token.email}`: 'No email in token');

    if (pathname.startsWith('/profile-setup')) {
      console.log('[Main Middleware] Already on /profile-setup, allowing.');
      return NextResponse.next();
    }

    if (token.id && token.supa?.access_token) {
      try {
        const profileStatusUrl = new URL('/api/user/profile-status', request.url);
        const profileResponse = await fetch(profileStatusUrl.toString(), {
          headers: {
            'Authorization': `Bearer ${token.supa.access_token}`,
          },
        });

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json().catch(() => ({ error: 'Failed to parse profile status error' }));
          console.error('[Main Middleware] Profile status check failed:', profileResponse.status, errorData.error);
          // Redirect to login or an error page if the profile check API itself fails
          const errorRedirectUrl = new URL('/login', request.url);
          errorRedirectUrl.searchParams.set('error', 'profile_check_api_error');
          return NextResponse.redirect(errorRedirectUrl);
        }

        const { hasProfile } = await profileResponse.json();

        if (!hasProfile) {
          console.log('[Main Middleware] No profile found (from API), redirecting to /profile-setup.');
          const redirectUrl = new URL('/profile-setup', request.url);
          redirectUrl.searchParams.set('redirectedFrom', pathname);
          return NextResponse.redirect(redirectUrl);
        }
        console.log('[Main Middleware] Profile found (from API), proceeding.');
      } catch (e: any) {
        console.error('[Main Middleware] Error calling profile status API:', e.message);
        const errorRedirectUrl = new URL('/login', request.url);
        errorRedirectUrl.searchParams.set('error', 'profile_api_fetch_error');
        return NextResponse.redirect(errorRedirectUrl);
      }
    } else {
      console.warn('[Main Middleware] User token found, but no token.id or supa.access_token. Check JWT callback.');
      const errorRedirectUrl = new URL('/login', request.url);
      errorRedirectUrl.searchParams.set('error', 'missing_token_details');
      return NextResponse.redirect(errorRedirectUrl);
    }

  } else {
    console.log('[Main Middleware] No user token, not on public path, redirecting to login.');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};