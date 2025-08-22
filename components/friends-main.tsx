"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FriendRequestCard } from '@/components/social/friend-request-card';
import { FriendCard } from '@/components/social/friend-card';
import { getFriendsAndRequests, getExploreUsers, cancelFriendRequest, getMutualFriendsCount } from '@/lib/api-helpers'; // Import getExploreUsers
import { FriendRequest, Friendship, ExplorableUser, UserProfileMinimal } from '@/types/social'; // Import ExplorableUser
import { useSession } from 'next-auth/react';
import { AddFriendButton } from '@/components/social/add-friend-button';
import { formatDate } from '@/lib/utils';

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
    display_name: user.display_name,
    avatar_url: user.avatar_url || null,
  };

  return (
    <Card className="p-3 flex flex-col h-full"> {/* Use flex-col and h-full for consistent card height */}
      <CardHeader className="flex-shrink-0">
        <CardTitle className='text-sm text-secondary-light'>{user.display_name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col">
        <p className="text-sm text-muted-foreground">24 mutual friends</p>
        {user.favorite_genres && <p className="text-sm text-muted-foreground">**Genres:** {user.favorite_genres}</p>}
        <p className="text-sm text-muted-foreground">Friends since May,2025</p>
      </CardContent>
      <div className="mt-4 flex-shrink-0"> {/* Use flex-shrink-0 to keep button at bottom */}
        <AddFriendButton targetUser={targetUserForAddFriendButton} onFriendRequestSent={onFriendRequestSent} />
      </div>
    </Card>
  );
}

// New component for displaying sent friend request cards
interface SentRequestCardProps {
  request: FriendRequest;
  onCancelRequest: (requestId: string) => void;
  isLoading: boolean;
}

function SentRequestCard({ request, onCancelRequest, isLoading }: SentRequestCardProps) {
  const { data: session } = useSession();
  const [mutualFriendsCount, setMutualFriendsCount] = useState<number>(0);
  const [isLoadingMutual, setIsLoadingMutual] = useState<boolean>(true);
  
  const receiverDisplayName = request.receiver?.display_name || request.receiver?.email || 'Unknown User';

  // Load mutual friends count
  useEffect(() => {
    const loadMutualFriends = async () => {
      if (!session?.supabaseAccessToken || !request.receiver?.id) {
        setIsLoadingMutual(false);
        return;
      }

      try {
        const mutualData = await getMutualFriendsCount(request.receiver.id, session.supabaseAccessToken);
        setMutualFriendsCount(mutualData.count);
      } catch (error) {
        console.error('Error loading mutual friends:', error);
        // Keep default count of 0
      } finally {
        setIsLoadingMutual(false);
      }
    };

    loadMutualFriends();
  }, [request.receiver?.id, session?.supabaseAccessToken]);

  return (
    <Card className="flex items-center p-1 w-full">
      <Avatar className="h-12 w-12 mr-4">
        <AvatarImage 
          src={request.receiver?.avatar_url || undefined} 
          alt={receiverDisplayName} 
          className="h-full w-full object-cover"
        />
        <AvatarFallback className="bg-bookWhite text-secondary">
          {receiverDisplayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col w-full">
        <div className="flex flex-col">
          <Link href={`/profile/${request.receiver?.id}`}><CardTitle>{receiverDisplayName}</CardTitle></Link>
          <p className="text-xs/3 text-secondary font-serif">
            {isLoadingMutual 
              ? "Loading..." 
              : `${mutualFriendsCount} mutual friend${mutualFriendsCount !== 1 ? 's' : ''}`
            }
          </p>
          <div className='flex justify-between w-full items-end'>
            <CardDescription className='text-xs/3 text-secondary font-serif'>
              request sent {formatDate(request.sentAt, { format: 'long' })}
            </CardDescription>
            <div className=''>
              <Button 
                disabled={isLoading} 
                size="sm" 
                variant="outline" 
                className="rounded-full text-secondary bg-accent/75 hover:bg-accent focus:bg-accent-variant font-serif border-none h-5 font-normal px-2"
                onClick={() => onCancelRequest(request.id)}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel" }
              </Button>
            </div>
          </div>
        </div>
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
      const fetchedFriends = (await getFriendsAndRequests('friends', session.supabaseAccessToken)) as Friendship[];
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
          display_name: friendUserPrisma.display_name || friendUserPrisma.email,
          avatar_url: friendUserPrisma.avatar_url || null,
        };

        

        return {
          ...f,
          friendUser: friendUserForCard
        };
      }).filter(Boolean) as Friendship[]; // Filter out any nulls if friendUser was not found

      setFriends(transformedFriends);
      console.log(transformedFriends);

      // --- Fetch Friend Requests ---
      const fetchedReceived = (await getFriendsAndRequests('received', session.supabaseAccessToken)) as FriendRequest[];
      setReceivedRequests(fetchedReceived);

      const fetchedSent = (await getFriendsAndRequests('sent', session.supabaseAccessToken)) as FriendRequest[];
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

  // Callback to handle canceling a sent friend request
  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelFriendRequest({ requestId });
      // Re-fetch data to update the sent requests list
      fetchData();
    } catch (error: any) {
      console.error("Error canceling friend request:", error);
      setError(error.message || "Failed to cancel request");
    }
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
    <div className="mx-auto py-2 px-0 w-full">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
        <div className='flex justify-center'>
            <TabsList className="bg-secondary-light text-primary h-8 rounded-full items-center">
            <TabsTrigger value="friends" className="data-[state=active]:bg-bookWhite h-6 data-[state=active]:text-primary-foreground rounded-full">
                Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="data-[state=active]:bg-bookWhite h-6 data-[state=active]:text-primary-foreground rounded-full">
                Sent ({sentRequests.length})
            </TabsTrigger>
            <TabsTrigger value="received" className="data-[state=active]:bg-bookWhite h-6 data-[state=active]:text-primary-foreground rounded-full">
                Pending ({receivedRequests.length})
            </TabsTrigger>
            {/* New Tab Trigger for Explore Users */}
                      {/* <TabsTrigger value="explore" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">
                        Explore Users ({exploreUsers.length})
                      </TabsTrigger> */}
            </TabsList>
        </div>

        <TabsContent value="friends" className="space-y-3">
          {friends.length === 0 ? (
            <p className="text-muted-foreground text-center">You don't have any friends yet.</p>
          ) : (
            <div className="grid gap-4">
              {friends.map((friendship) => (
                // FriendCard expects 'friend' to be a UserProfileMinimal-like object
                // Ensure your API returns the `friendUser` populated correctly or transform it here.
                <FriendCard 
                  key={friendship.id} 
                  friend={friendship.friendUser!} 
                  establishedAt={friendship.establishedAt}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          {receivedRequests.length === 0 ? (
            <p className="text-muted-foreground text-center">No received friend requests pending.</p>
          ) : (
            <div className="grid gap-4">
              {receivedRequests.map((request) => (
                <FriendRequestCard key={request.id} request={request} onActionComplete={handleRequestAction} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentRequests.length === 0 ? (
            <p className="text-muted-foreground text-center">No sent friend requests pending.</p>
          ) : (
            <div className="grid gap-4">
              {sentRequests.map((request) => (
                <SentRequestCard 
                  key={request.id} 
                  request={request} 
                  onCancelRequest={handleCancelRequest} 
                  isLoading={isLoading} 
                />
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