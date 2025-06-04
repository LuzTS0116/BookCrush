"use client"

import dynamic from "next/dynamic"

const ClubDetailsView = dynamic(() => import("./club-details"), { ssr: false })

export default function ClubDetailsClientWrapper({ params }: { params: { id: string } }) {
  return <ClubDetailsView params={params} />
}