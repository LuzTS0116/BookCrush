// /app/clubs/page.tsx

// "use client" directive is removed to make it a Server Component
import React from "react"; // useState, useEffect removed
import Image from "next/image";
import { MainNav } from "@/components/main-nav";
import { MobileNav } from "@/components/mobile-nav";
import ClubsMain from "@/components/clubs-main";
import ClubsTitle from "@/components/clubs-title";
import { getMyClubs, getDiscoverClubs, Club } from '@/lib/clubs';
import { Loader2 } from "lucide-react";
import { cookies } from 'next/headers'; // Import cookies
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'; // Import Supabase helper
// import { toast } from "sonner"; // toast is client-side, cannot be used directly in Server Components

// Simple loading component - can be used with Suspense in the future,
// but for now, the page will await data.
function LoadingClubsMessage() {
  return (
    <div className="container mx-auto px-4 py-6 pb-20 flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <span className="ml-3 text-lg text-muted-foreground">Loading clubs...</span>
    </div>
  );
}

interface ClubsPageError {
  message: string;
}

// The page is now an async function to await data fetching
export default async function ClubsPage() {
  let myClubs: Club[] = [];
  let discoverClubs: Club[] = [];
  let error: ClubsPageError | null = null;
  let accessToken: string | undefined = undefined;

  try {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    accessToken = session?.access_token;

    if (!accessToken) {
      console.warn("ClubsPage: User not authenticated or access token unavailable for fetching my clubs.");
    }

    // Fetch data concurrently
    const [myClubsResult, discoverClubsResult] = await Promise.allSettled([
      getMyClubs(accessToken),
      getDiscoverClubs(accessToken)
      
    ]);

    
    // Process results from Promise.allSettled
    if (myClubsResult.status === 'fulfilled') {
      myClubs = myClubsResult.value;
    } else {
      console.error("Error fetching myClubs:", myClubsResult.reason);
      // Accumulate or set the error. For simplicity, setting the first critical error.
      if (!error) error = { message: myClubsResult.reason?.message || 'Failed to load your clubs.' };
    }

    if (discoverClubsResult.status === 'fulfilled') {
      discoverClubs = discoverClubsResult.value;
    } else {
      console.error("Error fetching discoverClubs:", discoverClubsResult.reason);
      if (!error) error = { message: discoverClubsResult.reason?.message || 'Failed to load discoverable clubs.' };
    }

    // If any critical fetch failed and set an error, it will be handled by the UI

  } catch (err: unknown) { // Catch errors from cookie/session retrieval or other synchronous code
    console.error("Error loading clubs data on server (ClubsPage initial setup):", err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching club data.';
    error = { message: errorMessage };
  }

  return (
    <div className="min-h-screen relative w-full h-auto overflow-hidden">
      <Image 
        src="/images/background.png"
        alt="Create and Manage your Book Clubs | BookCrush"
        width={1622}
        height={2871}
        className="absolute inset-0 w-auto h-full md:w-full md:h-auto object-cover z-[-1]"
      />
      
      <ClubsTitle /> 
      
      {error ? (
        <div className="container mx-auto px-4 py-6 pb-20 flex items-center justify-center min-h-[400px]">
          <div className="text-center text-red-500">
            <p>Failed to load clubs data.</p>
            <p className="text-sm mt-2">{error.message}</p>
          </div>
        </div>
      ) : (
        <ClubsMain 
          initialMyClubs={myClubs}
          initialDiscoverClubs={discoverClubs}
        />
      )}
      
      <MobileNav />
    </div>
  );
}
