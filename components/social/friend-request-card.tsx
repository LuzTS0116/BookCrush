// components/social/friend-request-card.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Loader2, User } from 'lucide-react';
import { acceptFriendRequest, declineFriendRequest, getMutualFriendsCount } from '@/lib/api-helpers';
import { FriendRequest } from '@/types/social'; // Adjust path
import { formatDate } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface FriendRequestCardProps {
  request: FriendRequest;
  onActionComplete: (requestId: string, action: 'accepted' | 'declined') => void;
}

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({ request, onActionComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHandled, setIsHandled] = useState(false); // To hide card after action
  const [mutualFriendsCount, setMutualFriendsCount] = useState<number>(0);
  const [isLoadingMutual, setIsLoadingMutual] = useState<boolean>(true);

  const { data: session } = useSession();

  useEffect(() => {
    const loadMutualFriends = async () => {
      if (!session?.supabaseAccessToken || !request.sender?.id) {
        setIsLoadingMutual(false);
        return;
      }

      try {
        const mutualData = await getMutualFriendsCount(request.sender.id, session.supabaseAccessToken);
        setMutualFriendsCount(mutualData.count);
      } catch (error) {
        console.error('Error loading mutual friends:', error);
        // Keep default count of 0
      } finally {
        setIsLoadingMutual(false);
      }
    };

    loadMutualFriends();
  }, [request.sender?.id, session?.supabaseAccessToken]);

  const handleAccept = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await acceptFriendRequest(request.id, session?.supabaseAccessToken || '');
      setIsHandled(true);
      onActionComplete(request.id, 'accepted');
    } catch (err: any) {
      setError(err.message || 'Failed to accept request.');
      console.error("Error accepting request:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await declineFriendRequest(request.id, session?.supabaseAccessToken || '');
      setIsHandled(true);
      onActionComplete(request.id, 'declined');
    } catch (err: any) {
      setError(err.message || 'Failed to decline request.');
      console.error("Error declining request:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isHandled) {
    return null; // Don't render card after it's handled
  }
  
  const senderDisplayName = request.sender?.display_name || request.sender?.email || 'Unknown User';

  return (
    <Card className="flex items-center p-1 w-full">
      <Avatar className="h-12 w-12 mr-4">
        <AvatarImage 
          src={request.sender?.avatar_url || undefined} 
          alt={senderDisplayName} 
          className="h-full w-full object-cover"
        />
        <AvatarFallback className="bg-bookWhite text-secondary">
          {senderDisplayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col w-full">
        <div className="flex flex-wrap justify-between flex-1">
          <Link href={`/profile/${request.sender?.id}`}>
            <CardTitle className="text-sm leading-4">{senderDisplayName}</CardTitle>
          </Link>
        </div>
        <p className="text-xs/3 text-secondary font-serif">
          {isLoadingMutual 
            ? 'Loading...' 
            : `${mutualFriendsCount} mutual friend${mutualFriendsCount !== 1 ? 's' : ''}`
          }
        </p>
        <div className='flex justify-between w-full items-end'>
          <p className="text-xs/3 text-secondary/50 font-serif italic pb-1">
            request received {formatDate(request.sentAt, { format: 'long' })}
          </p>
          <div className='flex gap-2'>
            <Button 
              onClick={handleAccept} 
              disabled={isLoading} 
              size="sm" 
              variant="default"
              className="rounded-full h-7 w-7 p-0 bg-accent-variant/80 hover:bg-accent-variant text-destructive-foreground"
              title="Accept friend request"
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </Button>
            <Button 
              onClick={handleDecline} 
              disabled={isLoading} 
              size="sm" 
              variant="default"
              className="rounded-full h-7 w-7 p-0 bg-red-800/70 text-destructive-foreground hover:bg-red-800"
              title="Decline friend request"
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        {error && <p className="text-red-500 text-xs mt-1 text-center">{error}</p>}
      </div>
    </Card>
  );
};