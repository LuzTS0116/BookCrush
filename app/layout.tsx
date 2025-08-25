import type React from "react"
import type { Metadata } from "next"
import { Chivo, Quicksand } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AuthSessionProvider from "./_auth/SessionProvider";
import SupabaseBridge from "./_auth/SupabaseBridge"
import { SupabaseProvider } from "@/lib/SupabaseContext"
import { Toaster } from "@/components/ui/sonner"
import { loadEnvConfig } from '@next/env'
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/mobile-nav"
import { GoalsProvider } from "@/lib/goals-context"

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
  metadataBase: new URL("https://www.bookcrush.club"),
  title: {
    default: "BookCrush | Celebrate Stories With Friends",
    template: "%s | BookCrush", // Dynamic titles like "Proyectos | Mi Book App"
  },
  description:
    "Discover and share your favorite books with friends on BookCrush — a cozy space to track your reads, exchange recommendations, join book clubs, and celebrate your reading milestones. Because stories are better when shared!",
  openGraph: {
    title: "BookCrush | Celebrate Stories With Friends",
    description:
      "Celebrate stories with friends on BookCrush — a cozy space to track reads, share recs, and enjoy book clubs together.",
    url: "https://www.bookcrush.club",
    siteName: "BookCrush",
    images: [
      {
        url: "/images/open-graph.png", // Place an image inside your /public folder
        width: 1200,
        height: 630,
        alt: "BookCrush | Celebrate Stories With Friends",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BookCrush | Celebrate Stories With Friends",
    description:
      "Discover and share your favorite books with friends on BookCrush — track your reads, exchange recommendations, join book clubs, and celebrate reading milestones.",
    images: ["/images/open-graph.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    },
  },
};

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
          <SupabaseProvider>
            <SupabaseBridge>
              <GoalsProvider>
                <ThemeProvider attribute="class" defaultTheme="light">
                  <MainNav />
                  <div className="mb-15">{children}</div>
                  {/* <-- only one Toaster, Sonner will hook into all your toast() calls */}
                  <MobileNav />
                </ThemeProvider>
              </GoalsProvider>
            </SupabaseBridge>
          </SupabaseProvider>
        </AuthSessionProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            // show for 3 seconds
            duration: 3000,
            //icon: null,
            // no close button:
            //rich: false,
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
            //gutter: 8,
          }}
        />
      </body>
    </html>
  )
}
