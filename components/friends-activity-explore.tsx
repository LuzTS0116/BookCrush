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
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-bookWhite mb-1 overflow-hidden">
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.display_name || 'User'} 
                className="w-full h-full rounded-full object-cover" 
              />
            ) : (
              <User className="h-6 w-6 text-gray-500" />
            )}
        </div>
        <CardTitle className='text-sm/4 font-medium text-bookWhite'>{user.display_name}</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col p-0 items-center">
        {user.favorite_genres && <p className="text-xs font-serif italic font-normal text-accent truncate max-w-full">{user.favorite_genres}</p>}
    </CardContent>
    <div className={user.favorite_genres?.length ?  "mt-2 flex justify-center" : "mt-6 flex justify-center"}>
        <AddFriendButton targetUser={targetUserForAddFriendButton} onFriendRequestSent={onFriendRequestSent} />
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

  const fetchData = async () => {
    if (sessionStatus !== 'authenticated' || !currentUserId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const fetchedExploreUsers = await getExploreUsers();
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
    if (sessionStatus === 'authenticated' && currentUserId) {
        getExploreUsers().then(setExploreUsers).catch(err => console.error("Error refetching explore users", err));
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

        <TabsContent value="activity" className="space-y-4">
          <ActivityFeed compact={false} />
        </TabsContent>

        <TabsContent value="explore" className="space-y-4">
            <div className='flex justify-center'>
                <div className="relative w-[80vw] md:w-[60vw] lg:w-[40vw]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary" />
                    <Input
                        placeholder="Search people..."
                        className="pl-10 rounded-full bg-bookWhite/90 text-primary placeholder:text-primary/70"
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
            ) : exploreUsers.filter(user => user.display_name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <p className="text-bookWhite/70 text-center py-10">{searchQuery ? "No users match your search." : "No new users to explore right now."}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 bg-transparent mx-2 h-[45vh] overflow-y-auto no-scrollbar rounded-lg p-1">
                {exploreUsers
                  .filter(user => user.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
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