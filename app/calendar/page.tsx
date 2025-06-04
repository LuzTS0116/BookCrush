import React from "react"
import Image from "next/image";
import CalendarMain from "@/components/calendar-main";

export default function CalendarPage() {
  return (
    <div className="min-h-screen relative w-full h-auto overflow-hidden">
      <Image 
        src="/images/background.png"
        alt="Create and Manage your Book Clubs | BookCrush"
        width={1622}
        height={2871}
        className="absolute inset-0 w-auto h-full lg:w-full lg:h-auto object-cover z-[-1]"
      />    
      <CalendarMain />      
    </div>
  )
}
