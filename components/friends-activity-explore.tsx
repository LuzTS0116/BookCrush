"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Search } from 'lucide-react';
import { Input } from "@/components/ui/input"
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getExploreUsers } from '@/lib/api-helpers';
import { ExplorableUser, UserProfileMinimal } from '@/types/social';
import { useSession } from 'next-auth/react';
import { AddFriendButton } from '@/components/social/add-friend-button';
import { ActivityFeed } from './activity-feed';
import Link from 'next/link';

// New component for displaying an explorable user profile
interface ExploreUserCardProps {
  user: ExplorableUser;
  onFriendRequestSent: () => void;
}

function ExploreUserCard({ user, onFriendRequestSent }: ExploreUserCardProps) {
  const targetUserForAddFriendButton: UserProfileMinimal = {
    id: user.id,
    display_name: user.display_name,
    email: user.email,
    avatar_url: user.avatar_url,
  };

  return (
    <div className='h-auto'>
    <Card className="p-2 flex flex-col bg-bookWhite/5 w-full max-w-xs mx-auto">
    <CardHeader className="flex p-0 items-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-full border-2 border-bookWhite bg-bookWhite mb-1 overflow-hidden">
            <Link href={`/profile/${user.id}`}>
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.display_name || 'User'} 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <User className="h-6 w-6 text-gray-500" />
              )}
            </Link>
        </div>
        <CardTitle className='text-sm/4 font-medium text-bookWhite truncate max-w-full'>
          <Link href={`/profile/${user.id}`}>{user.display_name}</Link>
        </CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col p-0 items-center">
        {user.favorite_genres && user.favorite_genres.length > 0 && (
          <div className='flex gap-2 max-w-full justify-items-center'>
            {user.favorite_genres.slice(0, 2).map((genre: string, index: number) => (
              <p key={index} className="text-xs font-serif font-normal text-accent bg-secondary-light/80 px-2 rounded-full truncate max-w-full">
                {genre}
              </p>
            ))}
          </div>
        )}
    </CardContent>
    <div className={user.favorite_genres && user.favorite_genres.length > 0 ?  "mt-2 flex justify-center" : "mt-6 flex justify-center"}>
        <AddFriendButton 
          targetUser={targetUserForAddFriendButton} 
          initialStatus={user.friendshipStatus}
          pendingRequestId={user.pendingRequestId}
          onFriendRequestSent={onFriendRequestSent} 
        />
    </div>
    </Card>
    </div>
  );
}

export default function FriendsActivityExplore() {
  const { data: session, status: sessionStatus } = useSession();
  const currentUserId = (session?.user as { id?: string; email?: string; name?: string; })?.id;

  const [activeTab, setActiveTab] = useState<'activity' | 'explore'>('activity');
  const [exploreUsers, setExploreUsers] = useState<ExplorableUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to filter users by both display_name and full_name
  const matchesSearchQuery = (user: ExplorableUser, query: string): boolean => {
    if (!query.trim()) return true;
    
    const lowerQuery = query.toLowerCase();
    const displayNameMatch = user.display_name.toLowerCase().includes(lowerQuery);
    const fullNameMatch = user.full_name?.toLowerCase().includes(lowerQuery) || false;
    
    return displayNameMatch || fullNameMatch;
  };

  const fetchData = async () => {
    if (sessionStatus !== 'authenticated' || !currentUserId || !session?.supabaseAccessToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const fetchedExploreUsers = await getExploreUsers(session.supabaseAccessToken);
      setExploreUsers(fetchedExploreUsers);

    } catch (err: any) {
      console.error("Error fetching social data:", err);
      setError(err.message || "Failed to load social data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === 'authenticated' && currentUserId) {
      fetchData();
    } else if (sessionStatus === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [sessionStatus, currentUserId]);

  const handleFriendRequestSent = () => {
    if (sessionStatus === 'authenticated' && currentUserId && session?.supabaseAccessToken) {
        getExploreUsers(session.supabaseAccessToken).then(setExploreUsers).catch(err => console.error("Error refetching explore users", err));
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="container mx-auto p-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-bookWhite" />
        <p className="mt-4 text-bookWhite">Loading social hub...</p>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="container mx-auto p-4 text-center text-accent">
        Please log in to view your social hub.
      </div>
    );
  }

  if (isLoading && exploreUsers.length === 0) {
    return (
        <div className="container mx-auto p-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-bookWhite" />
            <p className="mt-4 text-bookWhite">Loading social data...</p>
        </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center text-red-500">
        Error: {error}
        <Button onClick={fetchData} className="ml-4 mt-2">Retry</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto py-2 px-0 mt-2 w-full">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} defaultValue="activity" className="space-y-4">
        <div className='flex justify-center'>
            <TabsList className="bg-secondary-light text-primary rounded-full items-center">
            <TabsTrigger value="activity" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">
                Activity
            </TabsTrigger>
            <TabsTrigger value="explore" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">
                Explore
            </TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="activity" className="space-y-4 md:container">
          <ActivityFeed compact={false} showLoadMore={true} />
        </TabsContent>

        <TabsContent value="explore" className="space-y-4 md:container">
            <div className='flex justify-center'>
              <div className="relative w-[80vw] md:w-[60vw] lg:w-[40vw]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary" />
                <Input
                    placeholder="Search people..."
                    className="pl-10 rounded-full bg-bookWhite/90 text-secondary placeholder:text-secondary/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            {isLoading && exploreUsers.length === 0 ? (
              <div className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-bookWhite" />
                  <p className="mt-2 text-bookWhite/70">Loading users to explore...</p>
              </div>
            ) : exploreUsers.filter(user => matchesSearchQuery(user, searchQuery)).length === 0 ? (
              <p className="text-bookWhite/70 text-center py-10">{searchQuery ? "No users match your search." : "No new users to explore right now."}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 bg-transparent mx-2 overflow-y-auto no-scrollbar rounded-lg p-1 pb-14 md:grid-cols-4">
                {exploreUsers
                  .filter(user => matchesSearchQuery(user, searchQuery))
                  .map((user) => (
                    <ExploreUserCard key={user.id} user={user} onFriendRequestSent={handleFriendRequestSent} />
                ))}
              </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}