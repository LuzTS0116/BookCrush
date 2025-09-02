// import { NextResponse, type NextRequest } from 'next/server';
// import { getToken } from 'next-auth/jwt';
// import { updateSession } from '@/utils/supabase/middleware'

// const globalPublicRoutes = [
//   { path: '/', exact: true },
//   { path: '/login', exact: false },
//   { path: '/signup', exact: false },
//   { path: '/auth', exact: false }, // Covers /auth/callback etc.
//   { path: '/api/auth', exact: false }, // For NextAuth API routes
//   { path: '/profile-setup', exact: false },
//   { path: '/api/user/profile-status', exact: true }, // Allow profile status check
//   { path: '/_next', exact: false },
//   { path: '/images', exact: false },
//   { path: '/favicon.ico', exact: true },
//   { path: '/api/profile', exact: true },
//   { path: '/api/profile/check-username', exact: true }, // Allow username validation without auth
//   { path: '/forgot-password', exact: true },
  
//   // API routes that handle their own Bearer token authentication
//   { path: '/api/clubs', exact: false }, // All clubs API routes
//   { path: '/api/invitations', exact: false }, // All invitations API routes
//   { path: '/api/meetings', exact: false }, // All meetings API routes
//   { path: '/api/books', exact: false }, // All books API routes
//   { path: '/api/social', exact: false }, // All social API routes
//   { path: '/api/friends', exact: false }, // All friends API routes
//   { path: '/api/shelf', exact: false }, // All shelf API routes
//   { path: '/api/reactions', exact: false }, // All reactions API routes
//   { path: '/api/quotes', exact: false }, // All quotes API routes
//   { path: '/api/discussions', exact: false }, // All discussions API routes
//   { path: '/api/user-books', exact: false }, // All user-books API routes
//   { path: '/api/files', exact: false }, // All files API routes
//   { path: '/api/profile/presign', exact: true },
//   { path: '/api/auth/forgot-password', exact: true }, // All forgot password API routes
// ];

// // Copy cookies from one response to another when redirecting
// // function withCopiedCookies(from: NextResponse, to: NextResponse) {
// //   for (const c of from.cookies.getAll()) to.cookies.set(c)
// //   return to
// //   }

// export async function middleware(request: NextRequest) {

  
//   //create a cookie of a number that increment every time the middleware is called
//   // const cookie = request.cookies.get('middleware-count')?.value
//   // if (cookie) {
//   //   refreshed.cookies.set('middleware-count', (parseInt(cookie) + 1).toString())
//   // } else {
//   //   refreshed.cookies.set('middleware-count', '0')
//   // }
//   // console.log(request.cookies.getAll())
 
 
  
 
//   // const { pathname } = request.nextUrl;

//   // // Create a response up front and pass it to Supabase middleware
//   // //const res = NextResponse.next();
//   // //const supabase = createMiddlewareClient({ req: request, res });

//   // // Single source of truth for refreshing Supabase cookies
  

 
  
//   // const isGloballyPublic = globalPublicRoutes.some(route =>
//   //   route.exact ? pathname === route.path : pathname.startsWith(route.path)
//   // );

//   // if (isGloballyPublic) {
//   //   return refreshed;
//   // }

//   // const token = await getToken({ 
//   //   req: request, 
//   //   secret: process.env.NEXTAUTH_SECRET,
//   //   secureCookie: process.env.NODE_ENV === 'production'
//   // });

  

//   // // Check for profile completion bypass cookie (temporary after profile creation)
//   // const profileCompleteBypassed = refreshed.cookies.get('profile-complete-bypass')?.value === 'true';
  
  
//   // // Check profile completion status from JWT token (no API call needed!)
//   // if (token!.profileComplete === false && !profileCompleteBypassed) {
//   //   const redirectUrl = new URL('/profile-setup', request.url);
//   //   redirectUrl.searchParams.set('redirectedFrom', pathname);
//   //   return withCopiedCookies(refreshed, NextResponse.redirect(redirectUrl));
//   // }

//   // // If we have a bypass cookie and profile is complete, clear the cookie
//   // if (profileCompleteBypassed && token!.profileComplete === true) {
//   //   // Use the same res to carry cookie mutation
//   //   refreshed.cookies.delete('profile-complete-bypass');
//   //   return refreshed;
//   // }

//   // If profileComplete is undefined, it means we need to check once
//   // This can happen during token refresh or edge cases
//   // if (token!.profileComplete === undefined && !profileCompleteBypassed) {
//   //   // console.log('[Main Middleware] Profile status unknown, checking via API...');
    
//   //   // For undefined status, make a quick API check
//   //   try {
//   //     const profileResponse = await fetch(`${request.nextUrl.origin}/api/user/profile-status`, {
//   //       headers: {
//   //         'Authorization': `Bearer ${token!.supa!.access_token}`,
//   //         'Content-Type': 'application/json',
//   //       },
//   //     });
      
//   //     if (profileResponse.ok) {
//   //       const { profileComplete } = await profileResponse.json();
//   //       if (!profileComplete) {
//   //         const redirectUrl = new URL('/profile-setup', request.url);
//   //         redirectUrl.searchParams.set('redirectedFrom', pathname);
//   //         return withCopiedCookies(refreshed, NextResponse.redirect(redirectUrl));
//   //       }
//   //     } else {
//   //       // console.warn('[Main Middleware] Failed to check profile status via API, allowing access');
//   //     }
//   //   } catch (error) {
//   //     // console.warn('[Main Middleware] Error checking profile status:', error);
//   //     // Allow access on API error to prevent infinite redirects
//   //   }
//   // }
  
//   return await updateSession(request);
// }

// export const config = {
//   matcher: [
//     '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// };


//@middleware.ts updated
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { getToken } from 'next-auth/jwt'
import { routeModule } from 'next/dist/build/templates/pages';

const globalPublicRoutes = [
  //{ path: '/', exact: true },
  //{ path: '/login', exact: false },
  { path: '/signup', exact: false },
  { path: '/auth', exact: false }, // Covers /auth/callback etc.
  { path: '/api/auth', exact: false }, // For NextAuth API routes
  { path: '/profile-setup', exact: false },
  { path: '/api/user/profile-status', exact: true }, // Allow profile status check
  { path: '/_next', exact: false },
  { path: '/images', exact: false },
  { path: '/favicon.ico', exact: true },
  //{ path: '/api/profile', exact: true },
  { path: '/api/profile/check-username', exact: true }, // Allow username validation without auth
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
  { path: '/api/auth/forgot-password', exact: true },
  
  //PWA routes
  { path: '/offline', exact: true },
  { path: '/manifest.webmanifest', exact: true },
  { path: '/sw.js', exact: true },
  { path: '/workbox-', exact: false },
  { path: '/icons', exact: false },
  { path: '/apple-touch-icon.png', exact: true },
];

function withCopiedCookies(from: NextResponse, to: NextResponse) {
  for (const c of from.cookies.getAll()) to.cookies.set(c)
  return to
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isGloballyPublic = globalPublicRoutes.some(route =>
    route.exact ? pathname === route.path : pathname.startsWith(route.path)
  );

  if (isGloballyPublic) {
    console.log('✅ Public route, allowing access');
    return NextResponse.next();
  }
  
  //console.log('🚀 Middleware start for path:', pathname);
  //console.log('⏰ Timestamp:', new Date().toISOString());
  
  const refreshed = await updateSession(request);
  
  // Debug: Log the refreshed response
  
  
  // Create a cookie counter for debugging
  const cookie = request.cookies.get('middleware-count')?.value
  if (cookie) {
    refreshed.cookies.set('middleware-count', (parseInt(cookie) + 1).toString())
  } else {
    refreshed.cookies.set('middleware-count', '0')
  }
  console.log('🔢 Middleware count cookie:', request.cookies.get('middleware-count')?.value)

  //console.log('protected route, checking authentication...')

  
  // const token = await getToken({ 
  //   req: request, 
  //   secret: process.env.NEXTAUTH_SECRET,
  //   secureCookie: process.env.NODE_ENV === 'production'
  // });

  
  // if (token) {
  //   console.log('🎫 Token details:', {
  //     id: token.id,
  //     profileComplete: token.profileComplete,
  //     hasSupabaseToken: !!token.supa?.access_token,
  //     tokenLength: token.supa?.access_token?.length || 0
  //   });
  // }
  
  // // Check for profile completion bypass cookie (temporary after profile creation)
  // const profileCompleteBypassed = refreshed.cookies.get('profile-complete-bypass')?.value === 'true';
  
  // // Check profile completion status from JWT token (no API call needed!)
  // if (token && token.profileComplete === false && !profileCompleteBypassed) {
  //   console.log('📝 Profile incomplete, redirecting to profile setup');
  //   const redirectUrl = new URL('/profile-setup', request.url);
  //   redirectUrl.searchParams.set('redirectedFrom', pathname);
  //   return withCopiedCookies(refreshed, NextResponse.redirect(redirectUrl));
  // }

  // // If we have a bypass cookie and profile is complete, clear the cookie
  // if (profileCompleteBypassed && token && token.profileComplete === true) {
  //   console.log('🧹 Clearing profile-complete-bypass cookie');
  //   refreshed.cookies.delete('profile-complete-bypass');
  //   return refreshed;
  // }

  // // If profileComplete is undefined, it means we need to check once
  // // This can happen during token refresh or edge cases
  // if (token && token.profileComplete === undefined && !profileCompleteBypassed) {
  //   console.log('❓ Profile status unknown, checking via API...');
    
  //   // For undefined status, make a quick API check
  //   try {
  //     const profileResponse = await fetch(`${request.nextUrl.origin}/api/user/profile-status`, {
  //       headers: {
  //         'Authorization': `Bearer ${token.supa!.access_token}`,
  //         'Content-Type': 'application/json',
  //       },
  //     });
      
  //     if (profileResponse.ok) {
  //       const { profileComplete } = await profileResponse.json();
  //       if (!profileComplete) {
  //         console.log('📝 API check: Profile incomplete, redirecting to profile setup');
  //         const redirectUrl = new URL('/profile-setup', request.url);
  //         redirectUrl.searchParams.set('redirectedFrom', pathname);
  //         return withCopiedCookies(refreshed, NextResponse.redirect(redirectUrl));
  //       }
  //     } else {
  //       console.warn('⚠️ Failed to check profile status via API, allowing access');
  //     }
  //   } catch (error) {
  //     console.warn('⚠️ Error checking profile status:', error);
  //     // Allow access on API error to prevent infinite redirects
  //   }
  // }
  
  //console.log('✅ Authentication successful, allowing access');
  return refreshed
}

// export const config = {
//   matcher: [
//     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// }

// add images formats to the matcher

export const config = {
  matcher: [
  '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw\.js|workbox-.\.js|icons/|apple-touch-icon\.png|robots\.txt|sitemap\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
  };

