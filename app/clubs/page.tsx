// /app/clubs/page.tsx

import React from "react"
import Image from "next/image";
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/mobile-nav"
import ClubsMain from "@/components/clubs-main";
import ClubsTitle from "@/components/clubs-title";

export default function ClubsPage() {
  return (
    <div className="min-h-screen relative w-full h-auto overflow-hidden">
      <Image 
        src="/images/background.png"
        alt="Create and Manage your Book Clubs | BookCrush"
        width={1622}
        height={2871}
        className="absolute inset-0 w-auto h-full md:w-full md:h-auto object-cover z-[-1]"
      />
      <MainNav />
      <ClubsTitle /> 
      <ClubsMain />      
      <MobileNav />
    </div>
  )
}
