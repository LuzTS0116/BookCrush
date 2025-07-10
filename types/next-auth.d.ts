import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
    supabaseAccessToken?: string
    supabaseRefreshToken?: string
    profileComplete?: boolean
    googleData?: {
      name?: string
      avatar_url?: string
    }
  }

  interface User extends DefaultUser {
    id: string
    supa?: {
      access_token: string
      refresh_token: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    supa?: {
      access_token: string
      refresh_token: string
    }
    profileComplete?: boolean
    googleData?: {
      name?: string
      avatar_url?: string
    }
  }
} 