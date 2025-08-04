// Test preview deployment - this is the develop branch
import React from "react";
import Welcome from "@/components/welcome-page";
import Footer from "@/components/footer";
import Image from "next/image";


export default function Home() {

  return (
    <div className="min-h-screen relative w-full mt-[-11px] h-auto overflow-hidden">
      <Image 
        src="/images/background.png"
        alt="Create and Manage your Book Clubs | BookCrush"
        width={1622}
        height={2871}
        className="absolute inset-0 w-auto h-full lg:w-full lg:h-auto object-cover z-[-1]"
      />
      <Welcome />
      <Footer />
    </div>
  )
}
