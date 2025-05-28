"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Search } from 'lucide-react';
import { Input } from "@/components/ui/input"
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
    <Card className="p-2 flex flex-col bg-bookWhite/5 w-full max-w-xs mx-auto"> {/* Use flex-col and h-full for consistent card height */}
    <CardHeader className="flex p-0 items-center">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-bookWhite mb-1">
            <User className="h-6 w-6 text-gray-500" />
        </div>
        <CardTitle className='text-sm/4 font-medium text-bookWhite'>{user.profile.display_name}</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col p-0 items-center">
        <p className="text-xs font-serif text-bookWhite font-light">24 mutual friends</p>
        {user.profile.favorite_genres && <p className="text-xs font-serif italic font-normal text-accent">{user.profile.favorite_genres}</p>}
    </CardContent>
    <div className="mt-2 flex justify-center"> {/* Use flex-shrink-0 to keep button at bottom */}
        <AddFriendButton targetUser={targetUserForAddFriendButton} onFriendRequestSent={onFriendRequestSent} />
    </div>
    </Card>
  );
}

export default function FriendsActivityExplore() {
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
    if (sessionStatus !== 'authenticated' || !currentUserId) {
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

  const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

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
    <div className="mx-auto py-2 px-0 mt-2 w-full">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
        <div className='flex justify-center'>
            <TabsList className="bg-secondary-light text-primary rounded-full items-center">
            <TabsTrigger value="activity" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">
                Activity
            </TabsTrigger>
            {/* New Tab Trigger for Explore Users */}
            <TabsTrigger value="explore" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">
                Explore
            </TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="activity" className="space-y-4">
          {sentRequests.length === 0 ? (
            <p className="text-muted-foreground text-center">No recent activity.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-1 lg:grid-cols-2 bg-transparent mx-4 h-[51vh] overflow-y-auto no-scrollbar rounded-lg p-2">
              {sentRequests.map((request) => (
                <Card className="flex items-center p-2 bg-bookWhite/5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bookWhite mr-4">
                        <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col">
                            <CardTitle className='text-bookWhite text-sm'>
                                <span className='font-medium'>{request.receiver?.profile?.display_name || request.receiver?.email || 'Unknown User'}</span>
                                <span className='font-light'> started reading </span>
                                <span className='font-medium'>Great Big Beautiful Life.</span>
                                <span className='font-serif font-light'> 1h ago</span>
                            </CardTitle>
                        </div>
                    </div>
                </Card>
              ))}
              {sentRequests.map((request) => (
                <Card className="flex items-center p-2 bg-bookWhite/5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bookWhite mr-4">
                        <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col">
                            <CardTitle className='text-bookWhite text-sm'>
                                <span className='font-medium'>Luz Tuñon</span>
                                <span className='font-light'> completed reading </span>
                                <span className='font-medium'>Heat of the Everflame.</span>
                                <span className='font-serif font-light'> 8h ago</span>
                            </CardTitle>
                        </div>
                    </div>
                </Card>
              ))}
              {sentRequests.map((request) => (
                <Card className="flex items-center p-2 bg-bookWhite/5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bookWhite mr-4">
                        <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col">
                            <CardTitle className='text-bookWhite text-sm'>
                                <span className='font-medium'>Patricia Polo</span>
                                <span className='font-light'> created the </span>
                                <span className='font-medium'>Emily Henry Fans</span>
                                <span className='font-light'> book club </span>
                                <span className='font-serif font-light'> 1d ago</span>
                            </CardTitle>
                        </div>
                    </div>
                </Card>
              ))}
              {sentRequests.map((request) => (
                <Card className="flex items-center p-2 bg-bookWhite/5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bookWhite mr-4">
                        <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col">
                            <CardTitle className='text-bookWhite text-sm'>
                                <span className='font-medium'>Meilyn Mong</span>
                                <span className='font-light'> added </span>
                                <span className='font-medium'>Throne of Glass</span>
                                <span className='font-light'> to the library.</span>
                                <span className='font-serif font-light'> 3d ago</span>
                            </CardTitle>
                        </div>
                    </div>
                </Card>
              ))}
              {sentRequests.map((request) => (
                <Card className="flex items-center p-2 bg-bookWhite/5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bookWhite mr-4">
                        <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col">
                            <CardTitle className='text-bookWhite text-sm'>
                                <span className='font-medium'>Kristell Thompsom</span>
                                <span className='font-light'> added a review for </span>
                                <span className='font-medium'>Verity</span>
                                <span className='font-serif font-light'> 1w ago</span>
                            </CardTitle>
                        </div>
                    </div>
                </Card>
              ))}
              {sentRequests.map((request) => (
                <Card className="flex items-center p-2 bg-bookWhite/5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bookWhite mr-4">
                        <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col">
                            <CardTitle className='text-bookWhite text-sm'>
                                <span className='font-medium'>Thai Chilli</span>
                                <span className='font-light'> book club selected </span>
                                <span className='font-medium'>Verity</span>
                                <span className='font-light'> for its next meeting.</span>
                                <span className='font-serif font-light'> 2w ago</span>
                            </CardTitle>
                        </div>
                    </div>
                </Card>
              ))}
              {sentRequests.map((request) => (
                <Card className="flex items-center p-2 bg-bookWhite/5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bookWhite mr-4">
                        <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col">
                            <CardTitle className='text-bookWhite text-sm'>
                                <span className='font-light'>A book club </span>
                                <span className='font-medium'>Meilyn Mong</span>
                                <span className='font-light'> is in selected </span>
                                <span className='font-medium'>Twilight</span>
                                <span className='font-light'> for its next meeting.</span>
                                <span className='font-serif font-light'> 2w ago</span>
                            </CardTitle>
                        </div>
                    </div>
                </Card>
              ))}
              {sentRequests.map((request) => (
                <Card className="flex items-center p-2 bg-bookWhite/5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bookWhite mr-4">
                        <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col">
                            <CardTitle className='text-bookWhite text-sm'>
                                <span className='font-medium'>Natacha Moreno</span>
                                <span className='font-light'> accepted your friend request.</span>
                                <span className='font-serif font-light'> 2w ago</span>
                            </CardTitle>
                        </div>
                    </div>
                </Card>
              ))}
              {sentRequests.map((request) => (
                <Card className="flex items-center p-2 bg-bookWhite/5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bookWhite mr-4">
                        <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col">
                            <CardTitle className='text-bookWhite text-sm'>
                                <span className='font-medium'>Patricia Polo</span>
                                <span className='font-light'> added </span>
                                <span className='font-medium'>Spark of the Everflame</span>
                                <span className='font-light'> to her shelf.</span>
                                <span className='font-serif font-light'> 2w ago</span>
                            </CardTitle>
                        </div>
                    </div>
                </Card>
              ))}
              {sentRequests.map((request) => (
                <Card className="flex items-center p-2 bg-bookWhite/5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bookWhite mr-4">
                        <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col">
                            <CardTitle className='text-bookWhite text-sm'>
                                <span className='font-medium'>La VampiFormula</span>
                                <span className='font-light'> welcomed a new member.</span>
                                <span className='font-serif font-light'> 2w ago</span>
                            </CardTitle>
                        </div>
                    </div>
                </Card>
              ))}
              {sentRequests.map((request) => (
                <Card className="flex items-center p-2 bg-bookWhite/5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bookWhite mr-4">
                        <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col">
                            <CardTitle className='text-bookWhite text-sm'>
                                <span className='font-light'>You finished </span>
                                <span className='font-medium'>5 books</span>
                                <span className='font-light'>  this month 🎉</span>
                                <span className='font-serif font-light'> 2w ago</span>
                            </CardTitle>
                        </div>
                    </div>
                </Card>
              ))}
              {sentRequests.map((request) => (
                <Card className="flex items-center p-2 bg-bookWhite/5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bookWhite mr-4">
                        <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col">
                            <CardTitle className='text-bookWhite text-sm'>
                                <span className='font-light'>You and</span>
                                <span className='font-medium'>Patricia Polo</span>
                                <span className='font-light'> have been friends for 1 year 🎉 Celebrate with a book recommendation!</span>
                                <span className='font-serif font-light'> 2w ago</span>
                            </CardTitle>
                        </div>
                    </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* New Tab Content for Explore Users */}
        <TabsContent value="explore" className="space-y-4">
            
            <div className='flex justify-center'>
                <div className="relative w-[80vw]">
                    <Search className="absolute left-3 top-1/3 pt-1 -translate-y-1/2 h-4 w-4 text-secondary" />
                    <Input
                        placeholder="Search books and more"
                        className="pl-10 rounded-full bg-bookWhite/90"
                        value=""
                    />
                </div>
            </div>
          {exploreUsers.length === 0 ? (
            <p className="text-muted-foreground">No new users to explore at the moment.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1 bg-transparent mx-2 h-[45vh] overflow-y-auto no-scrollbar rounded-lg p-2">
              {exploreUsers.map((user) => (
                <ExploreUserCard key={user.id} user={user} onFriendRequestSent={handleFriendRequestSent} />
              ))}
              {exploreUsers.map((user) => (
                <ExploreUserCard key={user.id} user={user} onFriendRequestSent={handleFriendRequestSent} />
              ))}
              {exploreUsers.map((user) => (
                <ExploreUserCard key={user.id} user={user} onFriendRequestSent={handleFriendRequestSent} />
              ))}
              {exploreUsers.map((user) => (
                <ExploreUserCard key={user.id} user={user} onFriendRequestSent={handleFriendRequestSent} />
              ))}
              {exploreUsers.map((user) => (
                <ExploreUserCard key={user.id} user={user} onFriendRequestSent={handleFriendRequestSent} />
              ))}
              {exploreUsers.map((user) => (
                <ExploreUserCard key={user.id} user={user} onFriendRequestSent={handleFriendRequestSent} />
              ))}
              {exploreUsers.map((user) => (
                <ExploreUserCard key={user.id} user={user} onFriendRequestSent={handleFriendRequestSent} />
              ))}
              {exploreUsers.map((user) => (
                <ExploreUserCard key={user.id} user={user} onFriendRequestSent={handleFriendRequestSent} />
              ))}
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