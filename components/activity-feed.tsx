"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, ArrowDown } from 'lucide-react';
import { ActivityType, ActivityTargetEntityType } from '@prisma/client';
import { UserProfileMinimal } from '@/types/social';
import { useSession } from 'next-auth/react';
import Link from 'next/link';


// Activity Feed Types
interface EnrichedActivity {
  id: string;
  user_id: string;
  type: ActivityType;
  target_entity_type?: ActivityTargetEntityType | null;
  target_entity_id?: string | null;
  target_entity_secondary_id?: string | null;
  related_user_id?: string | null;
  timestamp: string;
  details: any;
  user: UserProfileMinimal;
  relatedUser: UserProfileMinimal;
  actor_name?: string;
  actor_avatar_url?: string;
  target_entity_name?: string;
  related_user_name?: string;
}

interface ActivityItemCardProps {
  activity: EnrichedActivity;
  compact?: boolean; // For different display modes
}

function ActivityItemCard({ activity, compact = false }: ActivityItemCardProps) {
  const timeSince = (dateInput: string | Date): string => {
    if (!dateInput) return 'just now';

    let date: Date;
    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      date = dateInput;
    }

    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'just now';
    }

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 0) return 'just now';
    if (seconds < 1) return 'just now';
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

  //new_status format in_progress, almost_done, finished, unfinished
  const newStatus = activity.details?.new_status;
  const newStatusFormatted = newStatus ? newStatus.replace(/_/g, ' ') : 'a new status';

  const renderActivityText = () => {
    const actor = activity.user.display_name || 'Someone';
    const targetName = activity.target_entity_name;
    const relatedUser = activity.relatedUser?.display_name;
    const { data: session, status: sessionStatus } = useSession();

    switch (activity.type) {
      case ActivityType.ADDED_BOOK_TO_SHELF:
        return (
          <>
            <span className='font-medium'>
              <Link href={`/profile/${activity.user?.id}`}>{actor}</Link>
            </span>{' '}
            added{' '}
            <span className='font-medium'>
              <Link href={`/books/${activity.target_entity_id}`}>
                {activity.details?.book_title || 'a book'}
              </Link>
            </span>{' '}
            to their shelf.
          </>
        );
      case ActivityType.CHANGED_BOOK_STATUS:
        return (
          <>
            <span className='font-medium'>
              <Link href={`/profile/${activity.user?.id}`}>{actor}</Link>
            </span>{' '}
            changed the status of{' '}
            <span className='font-medium'>
              <Link href={`/books/${activity.target_entity_id}`}>
                {activity.details?.book_title || 'a book'}
              </Link>
            </span>{' '}
            to <span className='font-normal italic'>{newStatusFormatted}</span>.
          </>
        );
      case ActivityType.FINISHED_READING_BOOK:
        return (
          <>
            <span className='font-medium'>
              <Link href={`/profile/${activity.user?.id}`}>{actor}</Link>
            </span>{' '}
            finished reading{' '}
            <span className='font-medium'>
              <Link href={`/books/${activity.target_entity_id}`}>
                {activity.details?.book_title || 'a book'}
              </Link>
            </span>.
          </>
        );
      case ActivityType.CREATED_CLUB:
        return (
          <>
            <span className='font-medium'>
              <Link href={`/profile/${activity.user?.id}`}>{actor}</Link>
            </span>{' '}
            created the{' '}
            <span className='font-medium'>
              <Link href={`/clubs/${activity.target_entity_id}`}>
                {targetName || activity.details?.club_name || 'a new club'}
              </Link>
            </span>{' '}
            book club.
          </>
        );
      case ActivityType.ACCEPTED_FRIEND_REQUEST:
        return (
          <>
            <span className='font-medium'>
              <Link href={`/profile/${activity.user?.id}`}>{actor}</Link>
            </span>{' '}
            accepted your friend request.
          </>
        );
      case ActivityType.ADDED_BOOK_TO_LIBRARY:
        return (
          <>
            <span className='font-medium'>
              <Link href={`/profile/${activity.user?.id}`}>{actor}</Link>
            </span>{' '}
            added{' '}
            <span className='font-medium'>
              <Link href={`/books/${activity.target_entity_id}`}>
                {activity.details?.book_title || 'a new book'}
              </Link>
            </span>{' '}
            to the library.
          </>
        );
      case ActivityType.REVIEWED_BOOK:
        return (
          <>
            <span className='font-medium'>
              <Link href={`/profile/${activity.user?.id}`}>{actor}</Link>
            </span>{' '}
            reviewed{' '}
            <span className='font-medium'>
              <Link href={`/books/${activity.target_entity_id}`}>
                {activity.details?.book_title || 'a book'}
              </Link>
            </span>
            {activity.details?.rating && (
              <span className='font-normal italic'>
                {' '}with a {activity.details.rating === 'HEART' ? '❤️' : 
                          activity.details.rating === 'THUMBS_UP' ? '👍' : 
                          activity.details.rating === 'THUMBS_DOWN' ? '👎' : '⭐'} rating
              </span>
            )}.
          </>
        );
      case ActivityType.JOINED_CLUB:
        return (
          <>
            <span className='font-medium'>
              <Link href={`/profile/${activity.user?.id}`}>{actor}</Link>
            </span>{' '}
            joined the{' '}
            <span className='font-medium'>
              <Link href={`/clubs/${activity.details?.club_id}`}>
                {targetName || activity.details?.club_name}
              </Link>
            </span>{' '}
            book club.
          </>
        );
      case ActivityType.CLUB_NEW_MEMBER:
        return (
          <>
            <span className='font-medium'>
              <Link href={`/profile/${activity.user?.display_name}`}>{activity.user.display_name}</Link>
            </span>{' '}
            accepted{' '}
            <span className='font-medium'>
                {activity.details?.new_member_id === (session?.user as any)?.id ? 'you' : activity.details?.new_member_name}
            </span>{' '}
            into{' '}
            <span className='font-medium'>
              <Link href={`/clubs/${activity.details?.club_id}`}>
                {targetName || activity.details?.club_name}
              </Link>
            </span>{' '}
            book club.
          </>
        );
      case ActivityType.POSTED_CLUB_DISCUSSION:
        return (
          <>
            <span className='font-medium'>
              <Link href={`/profile/${activity.user?.id}`}>{actor}</Link>
            </span>{' '}
            posted a comment in{' '}
            <span className='font-medium'>
              <Link href={`/clubs/${activity.target_entity_secondary_id}`}>
                {activity.details?.club_name || 'a club'}
              </Link>
            </span>
            {activity.details?.book_title && (
              <>
                {' '}about{' '}
                <span className='font-medium italic'>
                  {activity.details.book_title}.
                </span>
              </>
            )}
          </>
        );
      default:
        return (
          <>
            An interesting activity involving{' '}
            <span className='font-medium'>
              <Link href={`/profile/${activity.user?.id}`}>{actor}</Link>
            </span>{' '}
            occurred.
          </>
        );
    }
  };

  const cardClasses = compact 
    ? "flex items-center gap-2 p-2 rounded-xl bg-primary-dark/50" 
    : "flex p-2 bg-bookWhite/5 w-full";

  const avatarClasses = compact 
    ? "h-8 w-8" 
    : "w-10 h-10";

  const textClasses = compact 
    ? "text-sm text-secondary font-medium" 
    : "text-bookWhite text-sm leading-snug";

  if (compact) {
    return (
      <div className={cardClasses}>
        <div className={`flex items-center justify-center ${avatarClasses} rounded-full bg-bookWhite shrink-0`}>
          {activity.user?.avatar_url ? (
            <img 
              src={activity.user.avatar_url} 
              alt={activity.user.display_name || 'User'} 
              className="w-full h-full rounded-full object-cover" 
            />
          ) : (
            <User className="h-4 w-4 text-gray-500" />
          )}
        </div>
        <div className="space-y-1 flex-1 min-w-0">
          <p className={textClasses}>
            {renderActivityText()}
            <span className='text-xs text-secondary/50 font-serif font-medium'> {timeSince(activity.timestamp)}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className={cardClasses}>
      <div className={`flex items-center justify-center ${avatarClasses} rounded-full bg-bookWhite mr-4 shrink-0`}>
        {activity.user?.avatar_url ? (
          <img 
            src={activity.user.avatar_url} 
            alt={activity.user.display_name || 'User'} 
            className="w-full h-full rounded-full object-cover" 
          />
        ) : (
          <User className="h-6 w-6 text-gray-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          <CardTitle className={textClasses}>
            {renderActivityText()}
            <span className='font-serif font-light text-xs opacity-80'> {timeSince(activity.timestamp)}</span>
          </CardTitle>
        </div>
      </div>
    </Card>
  );
}

interface ActivityFeedProps {
  compact?: boolean;
  maxItems?: number;
  showHeader?: boolean;
  onViewMore?: () => void;
  showLoadMore?: boolean;
}

interface ActivityFeedResponse {
  activities: EnrichedActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export function ActivityFeed({ compact = false, maxItems, showHeader = false, onViewMore, showLoadMore = true }: ActivityFeedProps) {
  
  const { data: session, status: sessionStatus } = useSession();
  const [activityFeed, setActivityFeed] = useState<EnrichedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false
  });

  const fetchActivityFeed = async (page: number = 1, append: boolean = false) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const response = await fetch(`/api/social/activity?page=${page}&limit=${pagination.limit}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch activity feed: ${response.statusText}`);
      }
      const data: ActivityFeedResponse = await response.json();
      
      if (append) {
        setActivityFeed(prev => [...prev, ...data.activities]);
      } else {
        setActivityFeed(data.activities);
      }
      
      setPagination(data.pagination);
      
    } catch (err: any) {
      console.error("Error fetching activity feed:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !isLoadingMore) {
      fetchActivityFeed(pagination.page + 1, true);
    }
  };

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchActivityFeed(1, false);
    } else if (sessionStatus === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [sessionStatus]);

  if (sessionStatus === 'loading') {
    return (
      <div className="text-center py-4">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">Loading activities...</p>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="text-center py-4 text-gray-500">
        Please log in to view activity feed.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">Loading friend activity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        <p>Error loading activities: {error}</p>
        <Button onClick={() => fetchActivityFeed(1, false)} className="mt-2" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  const displayedActivities = maxItems ? activityFeed.slice(0, maxItems) : activityFeed;

  if (displayedActivities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No recent friend activity to show.</p>
      </div>
    );
  }
  console.log(displayedActivities)
  return (
    <div className="space-y-2">
      {showHeader && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          {onViewMore && (
            <Button variant="outline" size="sm" onClick={onViewMore}>
              View All
            </Button>
          )}
        </div>
      )}
      
      {compact ? (
        <div className="space-y-2">
          {displayedActivities.map((activity, index) => (
            <ActivityItemCard key={index} activity={activity} compact={true} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2 bg-transparent mx-4 h-[61vh] w-auto overflow-y-auto no-scrollbar rounded-lg p-2">
          {displayedActivities.map((activity, index) => (
            <ActivityItemCard key={index} activity={activity} compact={false} />
          ))}
          
          {/* Load More Button */}
          {showLoadMore && pagination.hasMore && !compact && (
            <div className="w-full flex justify-center mt-4">
              <Button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                className="rounded-full bg-bookWhite/10 text-bookWhite border-bookWhite/30 hover:bg-bookWhite/20"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading more...
                  </>
                ) : (
                  <>
                    View More
                    <ArrowDown className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
      
    </div>
  );
}

export default ActivityFeed; 