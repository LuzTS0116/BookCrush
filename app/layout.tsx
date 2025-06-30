import type React from "react"
import type { Metadata } from "next"
import { Chivo, Quicksand } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AuthSessionProvider from "./_auth/SessionProvider";
import SupabaseBridge from "./_auth/SupabaseBridge"
import { Toaster } from "@/components/ui/sonner"
import { loadEnvConfig } from '@next/env'
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/mobile-nav"

const projectDir = process.cwd()
loadEnvConfig(projectDir)

const chivo = Chivo ({
  variable: "--font-sans",
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  display: 'swap',
});

const quicksand = Quicksand ({
  variable: "--font-serif",
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "BookCrush | Your Book Club App",
  description: "Connect with friends, share books, and organize book club meetings",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

// Fetch the session on the server once per request
  const session = await getServerSession(authOptions);
  

  return (
    <html lang="en" className={`${chivo.variable} ${quicksand.variable}`} suppressHydrationWarning>
      <body>
        <AuthSessionProvider initialSession={session}>
          <SupabaseBridge>
        <ThemeProvider attribute="class" defaultTheme="light">
          <MainNav />
          <div className="mb-15">{children}</div>
          {/* <-- only one Toaster, Sonner will hook into all your toast() calls */}
          <MobileNav />
        </ThemeProvider>
        </SupabaseBridge>
        </AuthSessionProvider>
        <Toaster
          position="top-center"
          containerStyle={{
            // make the toast container stretch left→right,
            // then flex‑center its inner toasts
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            // optional offset from top nav
            top: '1rem',
          }}
          toastOptions={{
            // show for 3 seconds
            duration: 3000,
            icon: null,
            // no close button:
            rich: false,
            // shared styles for every toast
            style: {
              background: '#2e3d6a',
              color: '#faf4e7',
              opacity: 0.95,
              borderRadius: '0.5rem', // tailwind “rounded” ~ 8px
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              // centered text:
              textAlign: 'center',
              // avoid wide max‑width:
              maxWidth: '420px',
            },
            // gap between toasts
            gutter: 8,
          }}
        />
      </body>
    </html>
  )
}
