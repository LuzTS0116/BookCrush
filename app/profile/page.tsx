import React from "react"
import Image from "next/image";
import EditableProfileMain from "@/components/editable-profile-main";

export default function ProfilePage() {
  return (
    <div className="min-h-screen pb-14 relative w-full mt-[-11px] h-auto overflow-hidden">
      <Image 
        src="/images/background.png"
        alt="Create and Manage your Book Clubs | BookCrush"
        width={1622}
        height={2871}
        className="absolute inset-0 w-auto h-full md:w-full md:h-auto object-cover z-[-1]"
      />
      <EditableProfileMain />      
    </div>
  )
}
