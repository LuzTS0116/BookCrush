import type React from "react"
import Image from "next/image";
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/mobile-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen relative w-full h-auto overflow-hidden">
      <Image 
        src="/images/background.png"
        alt="Create and Manage your Book Clubs | BookCrush"
        width={1622}
        height={2871}
        className="absolute inset-0 w-auto h-full lg:w-full lg:h-auto object-cover z-[-1]"
      />
      <MainNav />
      <div className="container mx-auto py-6 pb-20 md:pb-6">{children}</div>
      <MobileNav />
    </div>
  )
}
