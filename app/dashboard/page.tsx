import type React from "react"
import Image from "next/image";
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/mobile-nav"
import DashboardPage from "@/components/dashboard-page";
import DashboardReading from "@/components/dashboard-reading";
import { ClubActivityCard } from "@/components/club-activity-card"

export default function DashboardLayout() {
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
      <DashboardPage />
      <DashboardReading />
      <ClubActivityCard />
      <MobileNav />
    </div>
  )
}
