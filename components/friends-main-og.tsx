// app/dashboard/social/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FriendRequestCard } from '@/components/social/friend-request-card';
import { FriendCard } from '@/components/social/friend-card';
import { getFriendsAndRequests, getExploreUsers } from '@/lib/api-helpers'; // Import getExploreUsers
import { FriendRequest, Friendship, ExplorableUser, UserProfileMinimal } from '@/types/social'; // Import ExplorableUser
import { useSession } from 'next-auth/react';
import { AddFriendButton } from '@/components/social/add-friend-button';

// New component for displaying an explorable user profile
interface ExploreUserCardProps {
  user: ExplorableUser;
  onFriendRequestSent: () => void;
}

function ExploreUserCard({ user, onFriendRequestSent }: ExploreUserCardProps) {
  // AddFriendButton expects UserProfileMinimal. We need to adapt the ExplorableUser here.
  const targetUserForAddFriendButton: UserProfileMinimal = {
    id: user.id,
    email: user.email,
    profile: {
      id: user.profile.id,
      display_name: user.profile.display_name,
      // Pass other profile fields if your AddFriendButton or its underlying API expects them
      // For this example, we only need id and display_name for minimal representation
    }
  };

  return (
    <Card className="p-4 flex flex-col h-full"> {/* Use flex-col and h-full for consistent card height */}
      <CardHeader className="flex-shrink-0">
        <CardTitle>{user.profile.display_name}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 overflow-auto"> {/* Use flex-grow and overflow-auto for scrollable content */}
        {user.profile.about && <p className="text-sm text-muted-foreground">**About:** {user.profile.about}</p>}
        {user.profile.favorite_genres && <p className="text-sm text-muted-foreground">**Genres:** {user.profile.favorite_genres}</p>}
        {/* You can add more profile details here */}
      </CardContent>
      <div className="mt-4 flex-shrink-0"> {/* Use flex-shrink-0 to keep button at bottom */}
        <AddFriendButton targetUser={targetUserForAddFriendButton} onFriendRequestSent={onFriendRequestSent} />
      </div>
    </Card>
  );
}

export default function FriendsMain() {
  const { data: session, status: sessionStatus } = useSession();
  const currentUserId = session?.user?.id;

  // Add 'explore' to activeTab state
  const [activeTab, setActiveTab] = useState<'friends' | 'received' | 'sent' | 'explore'>('friends');
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [exploreUsers, setExploreUsers] = useState<ExplorableUser[]>([]); // New state for explorable users

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (sessionStatus !== 'authenticated' || !currentUserId || !session?.supabaseAccessToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // --- Fetch Friends ---
      const fetchedFriends = (await getFriendsAndRequests('friends')) as Friendship[];
      // Transform friendships to include the 'friendUser' directly for FriendCard
      // This assumes your /api/social?type=friends endpoint returns Friendship objects
      // with userA and userB relations populated.
      const transformedFriends = fetchedFriends.map(f => {
        
        const friendUserPrisma = f.userId1 === currentUserId ? f.user_two : f.user_one;
        if (!friendUserPrisma) {
          console.warn('Friendship found without a valid friend user:', f);
          return null;
        }

        // Map to UserProfileMinimal structure for FriendCard
        const friendUserForCard: UserProfileMinimal = {
          id: friendUserPrisma.id,
          email: friendUserPrisma.email,
          profile: friendUserPrisma.profile ? {
            id: friendUserPrisma.profile.id,
            display_name: friendUserPrisma.profile.display_name,
            // Only passing minimal info as FriendCard usually doesn't show all
          } : undefined,
        };

        

        return {
          ...f,
          friendUser: friendUserForCard
        };
      }).filter(Boolean) as Friendship[]; // Filter out any nulls if friendUser was not found

      setFriends(transformedFriends);

      // --- Fetch Friend Requests ---
      const fetchedReceived = (await getFriendsAndRequests('received')) as FriendRequest[];
      setReceivedRequests(fetchedReceived);

      const fetchedSent = (await getFriendsAndRequests('sent')) as FriendRequest[];
      setSentRequests(fetchedSent);

      // --- Fetch Explorable Users ---
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
    if (sessionStatus === 'authenticated') {
      fetchData();
    } else if (sessionStatus === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [sessionStatus, currentUserId]); // Re-fetch when auth status or user ID changes

  // Callback to handle actions on friend requests
  const handleRequestAction = (requestId: string, action: 'accepted' | 'declined') => {
    // Remove the processed request from the list
    setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
    // If accepted, re-fetch all data to update friend list and explore list
    if (action === 'accepted') {
      fetchData();
    }
  };

  // Callback for when a friend request is sent from the Explore Users tab
  const handleFriendRequestSent = () => {
    // Re-fetch all data to update the 'sent' requests list and remove the user from 'explore'
    fetchData();
  };

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-4">Loading social data...</p>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="container mx-auto p-4 text-center text-red-500">
        Please log in to view your social dashboard.
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center text-red-500">
        Error: {error}
        <Button onClick={fetchData} className="ml-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Social Dashboard</h1>

    

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
        <TabsList className="bg-secondary-light text-primary rounded-full">
          <TabsTrigger value="friends" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">
            My Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="received" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">
            Friend Requests ({receivedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">
            Sent Requests ({sentRequests.length})
          </TabsTrigger>
          {/* New Tab Trigger for Explore Users */}
          <TabsTrigger value="explore" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">
            Explore Users ({exploreUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">My Friends</h2>
          {friends.length === 0 ? (
            <p className="text-muted-foreground">You don't have any friends yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {friends.map((friendship) => (
                // FriendCard expects 'friend' to be a UserProfileMinimal-like object
                // Ensure your API returns the `friendUser` populated correctly or transform it here.
                <FriendCard key={friendship.id} friend={friendship.friendUser!} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Friend Requests</h2>
          {receivedRequests.length === 0 ? (
            <p className="text-muted-foreground">No pending friend requests.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {receivedRequests.map((request) => (
                <FriendRequestCard key={request.id} request={request} onActionComplete={handleRequestAction} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Sent Requests</h2>
          {sentRequests.length === 0 ? (
            <p className="text-muted-foreground">No sent friend requests.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {sentRequests.map((request) => (
                <Card key={request.id} className="p-4">
                  <CardTitle>{request.receiver?.profile?.display_name || request.receiver?.email || 'Unknown User'}</CardTitle>
                  <CardDescription>Request pending since {new Date(request.sentAt).toLocaleDateString()}</CardDescription>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* New Tab Content for Explore Users */}
        <TabsContent value="explore" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Discover Other Users</h2>
          {exploreUsers.length === 0 ? (
            <p className="text-muted-foreground">No new users to explore at the moment.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {exploreUsers.map((user) => (
                <ExploreUserCard key={user.id} user={user} onFriendRequestSent={handleFriendRequestSent} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}