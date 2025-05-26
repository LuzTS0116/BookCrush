// components/BookDetailsClientWrapper.tsx
"use client"

import dynamic from "next/dynamic"

const BookDetailsView = dynamic(() => import("./book-details"), { ssr: false })

export default function BookDetailsClientWrapper({ params }: { params: { id: string } }) {
  return <BookDetailsView params={params} />
}