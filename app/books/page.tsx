import React from "react"
import Image from "next/image";
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/mobile-nav"
import BooksPageContents from "@/components/books-page"
import BooksTableContents from "@/components/books-table"

export default function BooksPage() {
  return (
    <div className="min-h-screen relative w-full h-auto overflow-hidden">
      <Image 
        src="/images/background.png"
        alt="Create and Manage your Book Clubs | BookCrush"
        width={1622}
        height={2871}
        className="absolute inset-0 w-auto h-full md:w-full md:h-auto object-cover z-[-1]"
      />
      
      <BooksPageContents />    
      <BooksTableContents />      
      <MobileNav />
    </div>
)
}
