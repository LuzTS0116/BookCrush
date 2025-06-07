"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Search } from 'lucide-react';
import { Input } from "@/components/ui/input"
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFriendsAndRequests, getExploreUsers } from '@/lib/api-helpers';
import { FriendRequest, Friendship, ExplorableUser, UserProfileMinimal } from '@/types/social';
import { useSession } from 'next-auth/react';
import { AddFriendButton } from '@/components/social/add-friend-button';
import {  ActivityType, ActivityTargetEntityType  } from '@prisma/client';
import Link from 'next/link';

// --- Activity Feed Types ---
interface EnrichedActivity {
  id: string;
  user_id: string; // The user whose activity this is (e.g., a friend)
  type: ActivityType;
  target_entity_type?: ActivityTargetEntityType | null;
  target_entity_id?: string | null;
  related_user_id?: string | null;
  created_at: string; // Or Date
  details: any; // Specific details per activity_type
  user: UserProfileMinimal;
  relatedUser: UserProfileMinimal;

  // Enriched fields from backend
  actor_name?: string;       // Name of the user who performed the action (usually activity.related_user.id's name)
  actor_avatar_url?: string; // Avatar of the actor
  target_entity_name?: string; // e.g., Club name, Book title
  related_user_name?: string;  // e.g., Name of the friend in a friend request, or new member's name
}

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
  };

  return (
    <div className='h-auto'>
    <Card className="p-2 flex flex-col bg-bookWhite/5 w-full max-w-xs mx-auto">
    <CardHeader className="flex p-0 items-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-bookWhite mb-1">
            <User className="h-6 w-6 text-gray-500" />
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

// --- Activity Item Card ---
function ActivityItemCard({ activity }: { activity: EnrichedActivity }) {
  const timeSince = (dateInput: string | Date): string => {
    // Ensure dateInput is valid before processing
    if (!dateInput) {
      // console.warn('timeSince called with invalid dateInput:', dateInput);
      return 'just now'; // Default for null, undefined, or empty string dateInput
    }

    let date: Date;
    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      date = dateInput; // Assumes it's already a Date object
    }

    // Check if the constructed/passed date is valid
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      // console.warn('timeSince could not parse dateInput into a valid Date:', dateInput);
      return 'just now'; // Default for invalid or unparsable dates
    }

    const seconds = Math.floor((Date.now()- date.getTime()) / 1000);
    if (seconds < 0) return 'just now'; // Handle future dates or clock skew (though ideally API sends correct past dates)
    if (seconds < 1) return 'just now'; // Catches very small fractions of a second
    if (seconds < 60) return seconds + 's ago';
    let interval = Math.floor(seconds / 60);
    if (interval < 60) return interval + 'm ago';
    interval = Math.floor(seconds / 3600);
    if (interval < 24) return interval + 'h ago';
    interval = Math.floor(seconds / 86400);
    if (interval < 30) return interval + 'd ago';
    interval = Math.floor(seconds / 2592000);
    if (interval < 12) return interval + 'mo ago';
    interval = Math.floor(seconds / 31536000);
    return interval + 'y ago';
  };

  const renderActivityText = () => {
    const actor = activity.user.display_name || 'Someone';
    const targetName = activity.target_entity_name;
    const relatedUser = activity.relatedUser?.display_name;

    switch (activity.type) {
      case ActivityType.ADDED_BOOK_TO_SHELF:
        return <><span className='font-medium'><Link href={`/profile/${activity.user?.id}`}>{actor}</Link></span> added <span className='font-medium'><Link href={`/books/${activity.target_entity_id}`}>{activity.details?.book_title || 'a book'}</Link></span> to their shelf.</>;
      case ActivityType.CHANGED_BOOK_STATUS:
        return <><span className='font-medium'><Link href={`/profile/${activity.user?.id}`}>{actor}</Link></span> changed the status of <span className='font-medium'><Link href={`/books/${activity.target_entity_id}`}>{activity.details?.book_title || 'a book'}</Link></span> to <span className='font-normal italic'>{activity.details?.status_type || 'a new status'}</span>.</>;
      case ActivityType.FINISHED_READING_BOOK:
        return <><span className='font-medium'><Link href={`/profile/${activity.user?.id}`}>{actor}</Link></span> finished reading <span className='font-medium'><Link href={`/books/${activity.target_entity_id}`}>{activity.details?.book_title || 'a book'}</Link></span>.</>;
      case ActivityType.CREATED_CLUB:
        return <div className='font-light'><span className='font-medium'><Link href={`/profile/${activity.user?.id}`}>{actor}</Link></span> created the <span className='font-medium'><Link href={`/clubs/${activity.target_entity_id}`}>{targetName || activity.details?.club_name || 'a new club'}</Link></span> book club.</div>;
      case ActivityType.SENT_FRIEND_REQUEST:
        return <div className='font-light'><span className='font-medium'><Link href={`/profile/${activity.user?.id}`}>{actor}</Link></span> sent a friend request to <span className='font-medium'>{relatedUser || activity.details?.new_member_name || 'someone'}</span>.</div>;
      case ActivityType.ACCEPTED_FRIEND_REQUEST:
        return <div className='font-light'><span className='font-medium'><Link href={`/profile/${activity.user?.id}`}>{actor}</Link></span> accepted your friend request. </div>;
      case ActivityType.ADDED_BOOK_TO_LIBRARY:
        return <div className='font-light'><span className='font-medium'><Link href={`/profile/${activity.user?.id}`}>{actor}</Link></span> added <span className='font-medium'><Link href={`/books/${activity.target_entity_id}`}>{activity.details?.book_title || 'a new book'}</Link></span> to the library.</div>;
      case ActivityType.CLUB_SELECTED_BOOK:
        return <div className='font-light'><span className='font-medium'><Link href={`/clubs/${activity.details?.club_id}`}>{targetName || activity.details?.club_name}</Link></span> (which <span className='font-medium'><Link href={`/profile/${activity.user?.id}`}>{actor}</Link></span> is part of) book club selected <span className='font-medium'><Link href={`/books/${activity.details?.book_id}`}>{activity.details?.book_title || 'a new book'}</Link></span> for its next meeting.</div>;
      case ActivityType.JOINED_CLUB:
        return <div className='font-light'><span className='font-medium'><Link href={`/profile/${activity.user?.id}`}>{actor}</Link></span> joined the <span className='font-medium'><Link href={`/clubs/${activity.details?.club_id}`}>{targetName || activity.details?.club_name}</Link></span> book club.</div>;
      case ActivityType.CLUB_NEW_MEMBER:
        return <div className='font-light'><span className='font-medium'>{relatedUser || activity.details?.new_member_name}</span> joined the <span className='font-medium'><Link href={`/clubs/${activity.details?.club_id}`}>{targetName || activity.details?.club_name}</Link></span> (a club <span className='font-medium'><Link href={`/profile/${activity.user?.id}`}>{actor}</Link></span> is in) book club.</div>;
      default:
        console.warn("Unhandled activity type:", activity.type, activity);
        return <div className='font-light'>An interesting activity involving <span className='font-medium'><Link href={`/profile/${activity.user?.id}`}>{actor}</Link></span> occurred.</div>;
    }
  };

  return (
    <Card className="flex p-2 bg-bookWhite/5 w-full">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bookWhite mr-4 shrink-0">
        {activity.actor_avatar_url ? (
          <img src={activity.actor_avatar_url} alt={activity.actor_name || 'User'} className="w-full h-full rounded-full object-cover" />
        ) : (
          <User className="h-6 w-6 text-gray-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          <CardTitle className='text-bookWhite text-sm leading-snug'>
            {renderActivityText()}
            <span className='font-serif font-light text-xs opacity-80'> {timeSince(activity.created_at)}</span>
          </CardTitle>
        </div>
      </div>
    </Card>
  );
}

export default function FriendsActivityExplore() {
  const { data: session, status: sessionStatus } = useSession();
  const currentUserId = (session?.user as { id?: string; email?: string; name?: string; })?.id;

  const [activeTab, setActiveTab] = useState<'activity' | 'explore'>('activity');
  const [exploreUsers, setExploreUsers] = useState<ExplorableUser[]>([]);
  const [activityFeed, setActivityFeed] = useState<EnrichedActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivityFeed = async () => {
    setIsLoadingActivity(true);
    try {
      const response = await fetch('/api/social/activity');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch activity feed: ${response.statusText}`);
      }
      const data: EnrichedActivity[] = await response.json();
      console.log("data", data);
      setActivityFeed(data);
    } catch (err: any) {
      console.error("Error fetching activity feed:", err);
      setError(prev => prev ? `${prev}\n${err.message}` : err.message);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  console.log(activityFeed)

  const fetchData = async () => {
    if (sessionStatus !== 'authenticated' || !currentUserId) {
      setIsLoading(false);
      setIsLoadingActivity(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const fetchedExploreUsers = await getExploreUsers();
      setExploreUsers(fetchedExploreUsers);
      
      await fetchActivityFeed();

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
      setIsLoadingActivity(false);
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

  if (isLoading && isLoadingActivity && activityFeed.length === 0 && exploreUsers.length === 0) {
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
          {isLoadingActivity && activityFeed.length === 0 ? (
            <div className="text-center py-10">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-bookWhite" />
                <p className="mt-2 text-bookWhite/70">Loading friend activity...</p>
            </div>
          ) : activityFeed.length === 0 ? (
            <p className="text-bookWhite/70 text-center py-10">No recent friend activity to show.</p>
          ) : (
            <div className="flex flex-col items-start gap-2 bg-transparent mx-4 h-[51vh] w-auto overflow-y-auto no-scrollbar rounded-lg p-2">
              {activityFeed.map((activity, index) => (
                <ActivityItemCard key={index} activity={activity} />
              ))}
            </div>
          )}
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