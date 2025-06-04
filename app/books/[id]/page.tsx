import React from "react"
import Image from "next/image";
import BookDetailsClientWrapper from "@/components/book-details-client-wrapper"


export default function BookDetailPage({ params }: { params: { id: string } }) {
  return (
  <div className="min-h-screen relative w-full h-auto overflow-hidden">
    <Image 
      src="/images/background.png"
      alt="Create and Manage your Book Clubs | BookCrush"
      width={1622}
      height={2871}
      className="absolute inset-0 w-auto h-full md:w-full md:h-auto object-cover z-[-1]"
    />
    <BookDetailsClientWrapper params={params} />
  </div>
)
}