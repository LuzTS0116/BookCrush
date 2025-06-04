"use client"

import dynamic from "next/dynamic"

const ProfileDetailsView = dynamic(() => import("./profile-details"), { ssr: false })

export default function ProfileDetailsClientWrapper({ params }: { params: { id: string } }) {
  return <ProfileDetailsView params={params} />
}