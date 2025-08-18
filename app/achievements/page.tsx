import type React from "react"
import Image from "next/image";
import { AchievementsDashboard } from "@/components/ui/achievements-dashboard";

export default async function AchievementsPage() {
  return (
    <div className="min-h-screen relative w-full mt-[-11px] h-auto overflow-hidden">
      <Image 
        src="/images/background.png"
        alt="Create and Manage your Book Clubs | BookCrush"
        width={1622}
        height={2871}
        className="absolute inset-0 w-auto h-full md:w-full md:h-auto object-cover z-[-1]"
      />
      <AchievementsDashboard />
    </div>
  )
}
