import type React from "react"
import Image from "next/image";
import DashboardPage from "@/components/dashboard-page";
import DashboardReading from "@/components/dashboard-reading";
import { ActivityCard } from "@/components/activity-card"
import { SupportSection } from "@/components/buy-me-a-coffee";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import DashboardFeedback from "@/components/dashboard-feedback";
import { DashboardFooter } from "@/components/dashboard-footer";

export default async function DashboardLayout() {
  
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  
  const cookieJar  = await cookies();
  const stored     = cookieJar.get('daily-quote');

  let quote:  string|null;
  let author: string|null;

  if (stored) {
    // Use the cached value
    ({ quote, author } = JSON.parse(stored.value));
  } else {
    // pass null so the client components calls de API and sets the cookie
     {
      quote  = null;
      author = null;
    }
  }

  return (
    <div className="min-h-screen relative w-full mt-[-11px] h-auto overflow-hidden md:mt-5">
      <Image 
        src="/images/background.png"
        alt="Create and Manage your Book Clubs | BookCrush"
        width={1622}
        height={2871}
        className="absolute inset-0 w-auto h-full lg:w-full lg:h-auto object-cover z-[-1]"
      />
      <DashboardPage quote={quote} author={author}/>
      <DashboardReading />
      <div className="md:container md:w-full md:flex md:flex-row">
        <ActivityCard />
        <DashboardFeedback />
      </div>
      <SupportSection />
      <DashboardFooter />
    </div>
  )
}
