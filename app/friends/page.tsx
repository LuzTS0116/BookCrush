"use client";

import React, { useState, useEffect } from "react"
import Image from "next/image";
import FriendsTitle from "@/components/friends-title";
import FriendsMain from "@/components/friends-main";
import FriendsActivityExplore from "@/components/friends-activity-explore";
import { getFriendsAndRequests } from '@/lib/api-helpers'; // Import getExploreUsers
import { FriendRequest, Friendship } from '@/types/social';
import { useSession } from 'next-auth/react';

export default function FriendsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const currentUserId = session?.user?.id;
  
  const [totalFriends, setTotalFriends] = useState<number>(0);
  const [totalreceivedRequests, setTotalReceivedRequests] = useState<number>(0);
  const [totalsentRequests, setTotalSentRequests] = useState<number>(0);

  const fetchData = async () => {
      if (sessionStatus !== 'authenticated' || !currentUserId || !session?.supabaseAccessToken) {
          return;
      }
    // --- Fetch Friends ---
    const fetchedFriends = (await getFriendsAndRequests('friends', session.supabaseAccessToken)) as Friendship[];
    setTotalFriends(fetchedFriends.length);

    // --- Fetch Friend Requests ---
    const fetchedReceived = (await getFriendsAndRequests('received', session.supabaseAccessToken)) as FriendRequest[];
    setTotalReceivedRequests(fetchedReceived.length);

    const fetchedSent = (await getFriendsAndRequests('sent', session.supabaseAccessToken)) as FriendRequest[];
    setTotalSentRequests(fetchedSent.length);
  }

  useEffect(() => {
      if (sessionStatus === 'authenticated') {
      fetchData();
      } else if (sessionStatus === 'unauthenticated') {
      }
  }, [sessionStatus, currentUserId]); // Re-fetch when auth status or user ID changes

  return (
      <div className="min-h-screen relative w-full mt-[-11px] h-auto overflow-hidden">
        <Image 
          src="/images/background.png"
          alt="Create and Manage your Book Clubs | BookCrush"
          width={1622}
          height={2871}
          className="absolute inset-0 w-auto h-full md:w-full md:h-auto object-cover z-[-1]"
        />
        <FriendsTitle 
          friends={totalFriends}
          sent={totalsentRequests}
          request={totalreceivedRequests}/>  
        <FriendsActivityExplore />      
      </div>
  )
}