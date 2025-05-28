// /app/clubs/page.tsx

"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image";
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/mobile-nav"
import ClubsMain from "@/components/clubs-main";
import ClubsTitle from "@/components/clubs-title";
import { getMyClubs, getDiscoverClubs, Club } from '@/lib/clubs'
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Simple loading component
function LoadingClubs() {
  return (
    <div className="container mx-auto px-4 py-6 pb-20 flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <span className="ml-3 text-lg text-muted-foreground">Loading clubs...</span>
    </div>
  );
}

export default function ClubsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [discoverClubs, setDiscoverClubs] = useState<Club[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on client side where authentication will work properly
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [myClubsData, discoverClubsData] = await Promise.all([
          getMyClubs(),
          getDiscoverClubs()
        ]);
        setMyClubs(myClubsData);
        setDiscoverClubs(discoverClubsData);
      } catch (err: unknown) {
        console.error("Error loading clubs data:", err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        toast.error(`Failed to load clubs: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  return (
    <div className="min-h-screen relative w-full h-auto overflow-hidden">
      <Image 
        src="/images/background.png"
        alt="Create and Manage your Book Clubs | BookCrush"
        width={1622}
        height={2871}
        className="absolute inset-0 w-auto h-full md:w-full md:h-auto object-cover z-[-1]"
      />
      <MainNav />
      <ClubsTitle /> 
      
      {isLoading ? (
        <LoadingClubs />
      ) : error ? (
        <div className="container mx-auto px-4 py-6 pb-20 flex items-center justify-center min-h-[400px]">
          <div className="text-center text-red-500">
            <p>Failed to load clubs data</p>
            <p className="text-sm mt-2">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark"
            >
              Try Again
            </button>
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
  )
}
