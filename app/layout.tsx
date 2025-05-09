import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AuthSessionProvider from "./_auth/SessionProvider";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BookCircle | Your Book Club App",
  description: "Connect with friends, share books, and organize book club meetings",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

// Fetch the session on the server once per request
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthSessionProvider initialSession={session}>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
