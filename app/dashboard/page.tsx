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




async function getQuote() {
  const cookieStore = cookies();
  const quoteCookie = cookieStore.get('daily-quote');
  
  if (quoteCookie) {
    return JSON.parse(quoteCookie.value);
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotes`, {
      cache: 'no-store'
    });
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Set the quote in a cookie that expires at the end of the day
    const expires = new Date();
    expires.setHours(23, 59, 59, 999);
    
    cookieStore.set('daily-quote', JSON.stringify(data), {
      expires,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    return data;
  } catch (error) {
    console.error('Error fetching quote:', error);
    return {
      quote: "A reader lives a thousand lives before he dies...",
      author: "George R.R. Martin"
    };
  }
}

export default async function DashboardLayout() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { quote, author } = await getQuote();

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
      <DashboardPage />
      <DashboardReading />
      <ClubActivityCard />
      <MobileNav />
    </div>
  )
}
