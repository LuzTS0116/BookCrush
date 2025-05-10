import type React from "react"
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/mobile-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="container mx-auto py-6 pb-20 md:pb-6">{children}</div>
      <MobileNav />
    </div>
  )
}
