import type React from "react"
import Image from "next/image";
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/mobile-nav"
import DashboardPage from "@/components/dashboard-page";
import DashboardReading from "@/components/dashboard-reading";
import { ClubActivityCard } from "@/components/club-activity-card"
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';

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
    <div className="min-h-screen relative w-full h-auto overflow-hidden">
      <Image 
        src="/images/background.png"
        alt="Create and Manage your Book Clubs | BookCrush"
        width={1622}
        height={2871}
        className="absolute inset-0 w-auto h-full lg:w-full lg:h-auto object-cover z-[-1]"
      />
      <MainNav />
      <DashboardPage quote={quote} author={author}/>
      <DashboardReading />
      <ClubActivityCard />
      <MobileNav />
    </div>
  )
}
