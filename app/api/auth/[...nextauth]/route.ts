// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

/* ──────────────────────────────────────────────────────────────────────────
   1. Environment-variable guards (optional but recommended)
   ────────────────────────────────────────────────────────────────────────── */
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  NEXTAUTH_SECRET,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !NEXTAUTH_SECRET) {
  throw new Error(
    'Missing required environment variables for NextAuth: ' +
      'GOOGLE_CLIENT_ID | GOOGLE_CLIENT_SECRET | NEXTAUTH_SECRET',
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   2. NextAuth configuration with full type safety
   ────────────────────────────────────────────────────────────────────────── */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: NEXTAUTH_SECRET,
  // …add any other NextAuth options you need here
};

/* ──────────────────────────────────────────────────────────────────────────
   3. Route handlers (Edge-compatible for the new App Router)
   ────────────────────────────────────────────────────────────────────────── */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };