// // app/api/auth/[...nextauth]/route.ts
// import NextAuth, { NextAuthOptions } from 'next-auth';
// import GoogleProvider from 'next-auth/providers/google';
// import Credentials from 'next-auth/providers/credentials'
// import { supabaseAdmin } from '@/lib/supabase'

// /* ──────────────────────────────────────────────────────────────────────────
//    1. Environment-variable guards (optional but recommended)
//    ────────────────────────────────────────────────────────────────────────── */
// const {
//   GOOGLE_CLIENT_ID,
//   GOOGLE_CLIENT_SECRET,
//   NEXTAUTH_SECRET,
// } = process.env;

// if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !NEXTAUTH_SECRET) {
//   throw new Error(
//     'Missing required environment variables for NextAuth: ' +
//       'GOOGLE_CLIENT_ID | GOOGLE_CLIENT_SECRET | NEXTAUTH_SECRET',
//   );
// }

// /* ──────────────────────────────────────────────────────────────────────────
//    2. NextAuth configuration with full type safety
//    ────────────────────────────────────────────────────────────────────────── */
// export const authOptions: NextAuthOptions = {
//   providers: [
//     GoogleProvider({
//       clientId: GOOGLE_CLIENT_ID,
//       clientSecret: GOOGLE_CLIENT_SECRET,
//     }),
//     Credentials({
//   name: 'credentials',
//   credentials: {
//     email:    { type: 'text' },
//     password: { type: 'password' },
//   },
//   async authorize (creds) {
//     // Ask Supabase to verify the password
//     if (!creds){
//       throw new Error('No Credentials provided')
//     }
//     const { data, error } = await supabaseAdmin.auth
//       .signInWithPassword({ email: creds.email, password: creds.password })

//     if (error || !data.user) throw new Error(error?.message ?? 'Invalid')

//     // Return the object that will be put into the JWT
//     return {
//       id:    data.user.id,
//       email: data.user.email,
//       supa:  {     // we will store the whole Supabase session
//         access_token:  data.session!.access_token,
//         refresh_token: data.session!.refresh_token,
//       }
//     }
//   }
// })
//  // …add any other NextAuth options you need here
//   ],
//   secret: NEXTAUTH_SECRET,
//   session: { strategy: 'jwt' },
//   /* put the Supabase tokens into the Next-Auth JWT ↓ */
// callbacks: {
// async jwt ({ token, user, account }) {
// // 1. e-mail / password → user is defined
// if (user?.supa) {
// token.id = user.id
// token.supa = user.supa
// }
//  // 2. Google → we receive an id_token, exchange it with Supabase
//   if (account?.provider === 'google' && account.id_token) {
//     const { data, error } = await supabaseAdmin.auth
//       .signInWithIdToken({
//         provider: 'google',
//         token: account.id_token,
//       })
//     if (!error && data.session) {
//       token.id   = data.user!.id
//       token.supa = {
//         access_token:  data.session.access_token,
//         refresh_token: data.session.refresh_token,
//       }
//     }
//   }

//   return token
// },

// /* hand the Supabase data to the React Session object ↓ */
// async session ({ session, token }) {
//   session.user.id             = token.id as string
//   // make Supabase tokens available on the client / server components
//   session.supabaseAccessToken = token.supa?.access_token as string | undefined
//   session.supabaseRefreshToken= token.supa?.refresh_token as string | undefined
//   return session
// }
// }
 
// };

// /* ──────────────────────────────────────────────────────────────────────────
//    3. Route handlers (Edge-compatible for the new App Router)
//    ────────────────────────────────────────────────────────────────────────── */
// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };

// app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { prisma } from '@/lib/prisma';

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  NEXTAUTH_SECRET,
  NEXTAUTH_URL,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !NEXTAUTH_SECRET) {
  throw new Error(
    'Missing required environment variables for NextAuth: ' +
    'GOOGLE_CLIENT_ID | GOOGLE_CLIENT_SECRET | NEXTAUTH_SECRET'
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { type: 'text' },
        password: { type: 'password' },
        access_token: { type: 'text' }, // Accept tokens from client-side auth
        refresh_token: { type: 'text' }
      },
      async authorize(creds) {
        if (!creds) {
          throw new Error('No credentials provided');
        }

        // If tokens are provided directly from client-side Supabase auth
        if (creds.access_token && creds.refresh_token) {
          try {
            // Verify the token is valid by getting the user
            const { data: userData, error: userError } = await supabaseAdmin.auth
              .getUser(creds.access_token as string);

            if (userError || !userData.user) {
              throw new Error(userError?.message ?? 'Invalid token');
            }

            return {
              id: userData.user.id,
              email: userData.user.email,
              supa: {
                access_token: creds.access_token as string,
                refresh_token: creds.refresh_token as string,
              }
            };
          } catch (error) {
            console.error('Token verification error:', error);
            throw new Error('Invalid token');
          }
        }

        // Traditional email/password flow
        if (creds.email && creds.password) {
          const { data, error } = await supabaseAdmin.auth
            .signInWithPassword({ 
              email: creds.email as string, 
              password: creds.password as string 
            });

          if (error || !data.user) {
            throw new Error(error?.message ?? 'Invalid credentials');
          }

          return {
            id: data.user.id,
            email: data.user.email,
            supa: {
              access_token: data.session!.access_token,
              refresh_token: data.session!.refresh_token,
            }
          };
        }

        throw new Error('Invalid credentials format');
      }
    })
  ],
  secret: NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login', // Custom sign-in page
    error: '/login', // Redirect errors back to login page
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      console.log('[Auth JWT Callback] Starting with:', {
        hasUser: !!user,
        hasAccount: !!account,
        accountProvider: account?.provider,
        tokenId: token.id,
        hasSupaInToken: !!token.supa,
        environment: process.env.NODE_ENV
      });

      // Handle credential authentication (including client-side tokens)
      if (user?.supa) {
        console.log('[Auth JWT Callback] Setting supa tokens from user');
        token.id = user.id;
        token.supa = user.supa;
      }
      
      // Handle Google authentication
      if (account?.provider === 'google' && account.id_token) {
        console.log('[Auth JWT Callback] Processing Google authentication');
        
        const { data, error } = await supabaseAdmin.auth
          .signInWithIdToken({
            provider: 'google',
            token: account.id_token,
          });
          
        if (!error && data.session) {
          console.log('[Auth JWT Callback] Google auth successful, setting tokens');
          token.id = data.user!.id;
          token.supa = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          };

          // Create or update profile with Google data
          try {
            const googleUser = data.user;
            const userMetadata = googleUser.user_metadata || {};
            
            // Check if profile exists
            const existingProfile = await prisma.profile.findUnique({
              where: { id: googleUser.id },
              select: { id: true, display_name: true, email: true, avatar_url: true }
            });

            if (!existingProfile) {
              // Create minimal profile with Google data - user still needs to complete setup
              console.log('[Auth JWT Callback] Creating minimal profile for Google user:', googleUser.id);
              
              await prisma.profile.create({
                data: {
                  id: googleUser.id,
                  email: googleUser.email,
                  // Keep display_name empty to force username selection in profile-setup
                  display_name: '', // Will be set to username in profile-setup
                  avatar_url: userMetadata.avatar_url || userMetadata.picture,
                  about: null,
                  kindle_email: null,
                  favorite_genres: [],
                  role: 'USER'
                }
              });
              
              // Profile exists but is incomplete - redirect to profile-setup
              token.profileComplete = false;
              token.googleData = {
                name: userMetadata.full_name || userMetadata.name || googleUser.email?.split('@')[0] || '',
                avatar_url: userMetadata.avatar_url || userMetadata.picture
              };
            } else {
              // For existing profiles, only update avatar if missing and check completeness
              const updates: any = {};
              
              if (!existingProfile.email && googleUser.email) {
                updates.email = googleUser.email;
              }
              
              // Always update avatar if Google provides one and we don't have one
              if (!existingProfile.avatar_url && (userMetadata.avatar_url || userMetadata.picture)) {
                updates.avatar_url = userMetadata.avatar_url || userMetadata.picture;
              }
              
              if (Object.keys(updates).length > 0) {
                console.log('[Auth JWT Callback] Updating profile with Google data for user:', googleUser.id);
                await prisma.profile.update({
                  where: { id: googleUser.id },
                  data: updates
                });
              }
              
              // Profile is complete if has display_name (username)
              token.profileComplete = !!(existingProfile.display_name);
            }
          } catch (profileError) {
            console.error('[Auth JWT Callback] Error managing profile for Google user:', profileError);
            // Don't fail the auth process, but log the error
            token.profileComplete = false;
          }
        } else {
          console.error('[Auth JWT Callback] Google auth failed:', error);
        }
      }

      // Check profile status when token is first created or explicitly updated
      if (token.id && (user || trigger === 'update')) {
        // Always check profile status on initial creation or when explicitly updating
        const shouldCheckProfile = user || trigger === 'update' || token.profileComplete === undefined;
        
        if (shouldCheckProfile) {
          try {
            console.log('[Auth JWT Callback] Checking profile status for user:', token.id);
            const profile = await prisma.profile.findUnique({
              where: { id: token.id as string },
              select: { id: true, display_name: true }
            });

            const newProfileComplete = !!profile && !!profile.display_name;
            
            // Only log if status actually changed
            if (token.profileComplete !== newProfileComplete) {
              console.log('[Auth JWT Callback] Profile status changed from', token.profileComplete, 'to', newProfileComplete);
            }
            
            token.profileComplete = newProfileComplete;
          } catch (error) {
            console.error('[Auth JWT Callback] Error checking profile status:', error);
            // Default to false if we can't check
            token.profileComplete = false;
          }
        }
      }
      
      // Refresh token logic (optional but recommended)
      if (token.supa?.access_token) {
        try {
          // Check if the token is expired or about to expire
          const { exp } = JSON.parse(atob(token.supa.access_token.split('.')[1]));
          const expTimeInSeconds = exp;
          const currentTimeInSeconds = Math.floor(Date.now() / 1000);
          
          // If token is expired or about to expire (within 30 minutes)
          if (expTimeInSeconds - currentTimeInSeconds < 1800) {
            console.log('[Auth JWT Callback] Token expiring soon, refreshing...');
            
            const { data, error } = await supabaseAdmin.auth.refreshSession({
              refresh_token: token.supa.refresh_token,
            });
            
            if (error) throw error;
            
            if (data.session) {
              console.log('[Auth JWT Callback] Token refreshed successfully');
              token.supa = {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
              };
            }
          }
        } catch (error) {
          console.error('[Auth JWT Callback] Failed to refresh token:', error);
          // Token refresh failed, clear the token
          delete token.supa;
        }
      }

      // After all processing, do a final check if needed
      if (token.id && token.supa?.access_token && token.profileComplete === undefined) {
        console.log('[Auth JWT Callback] Final profile status check for user:', token.id);
        
        try {
          // Check if user has completed profile setup
          const profile = await prisma.profile.findUnique({
            where: { id: token.id as string },
            select: { 
              display_name: true,
              about: true,
              avatar_url: true
            }
          });

          if (profile) {
            const hasBasicInfo = !!(profile.display_name && profile.about);
            token.profileComplete = hasBasicInfo;
            console.log('[Auth JWT Callback] Final profile status:', { hasBasicInfo, displayName: !!profile.display_name, about: !!profile.about });
          } else {
            console.log('[Auth JWT Callback] No profile found for user:', token.id);
            token.profileComplete = false;
          }
        } catch (profileError) {
          console.error('[Auth JWT Callback] Error in final profile check:', profileError);
          token.profileComplete = false; // Default to false on error
        }
      } else if (!token.id || !token.supa?.access_token) {
        console.log('[Auth JWT Callback] Missing required data for final check:', {
          hasId: !!token.id,
          hasSupaToken: !!token.supa?.access_token
        });
      }

      console.log('[Auth JWT Callback] Final token state:', {
        id: token.id,
        hasSupaToken: !!token.supa?.access_token,
        profileComplete: token.profileComplete
      });

      return token;
    },
    
    async session({ session, token }) {
      console.log('[Auth Session Callback] Creating session with token:', {
        tokenId: token.id,
        hasSupaToken: !!token.supa?.access_token,
        profileComplete: token.profileComplete,
        userEmail: session.user?.email
      });

      if (session.user) {
        session.user.id = token.id as string;
        
        // Try to get user profile from database to populate name
        if (token.id) {
          try {
            const profile = await prisma.profile.findUnique({
              where: { id: token.id as string },
              select: { full_name: true, display_name: true }
            });

            if (profile) {
              // Prioritize full_name, fallback to display_name if full_name is not available
              session.user.name = profile.full_name || profile.display_name;
            } else if (token.supa?.access_token && !session.user.name) {
              // Fallback to Supabase user metadata if profile doesn't exist
              const { data: userData } = await supabaseAdmin.auth.getUser(token.supa.access_token);
              if (userData.user?.user_metadata?.display_name) {
                session.user.name = userData.user.user_metadata.display_name;
              }
            }
          } catch (error) {
            console.warn('[Auth Session Callback] Could not fetch user profile:', error);
            
            // Final fallback to Supabase user metadata
            if (token.supa?.access_token && !session.user.name) {
              try {
                const { data: userData } = await supabaseAdmin.auth.getUser(token.supa.access_token);
                if (userData.user?.user_metadata?.display_name) {
                  session.user.name = userData.user.user_metadata.display_name;
                }
              } catch (supabaseError) {
                console.warn('[Auth Session Callback] Could not fetch user metadata:', supabaseError);
              }
            }
          }
        }
      }
      
      if (token.supa?.access_token) {
        session.supabaseAccessToken = token.supa.access_token;
        session.supabaseRefreshToken = token.supa.refresh_token;
      }

      // Include profile completion status
      session.profileComplete = token.profileComplete as boolean | undefined;
      session.googleData = token.googleData as any; // Pass Google data to client

      console.log('[Auth Session Callback] Final session state:', {
        userId: session.user?.id,
        hasSupabaseToken: !!session.supabaseAccessToken,
        profileComplete: session.profileComplete
      });

      return session;
    }
  },
  // Remove custom cookie configuration - let NextAuth handle it
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };