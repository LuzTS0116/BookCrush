// components/social/add-friend-button.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2, XCircle, Check, X } from 'lucide-react';
import { sendFriendRequest, cancelFriendRequest, acceptFriendRequest, declineFriendRequest } from '@/lib/api-helpers';
import { useSession } from 'next-auth/react';
import { UserProfileMinimal } from '@/types/social';
import { toast } from 'sonner';

interface AddFriendButtonProps {
  targetUser: UserProfileMinimal; // The user whose profile we are on
  // Optional: initial status if already known (e.g., from parent fetch)
  initialStatus?: 'NOT_FRIENDS' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS';
  pendingRequestId?: string | null; // Required for accepting/declining requests
  onFriendRequestSent?: () => void; // Callback after sending
}

export const AddFriendButton: React.FC<AddFriendButtonProps> = ({ 
  targetUser, 
  initialStatus = 'NOT_FRIENDS',
  pendingRequestId,
  onFriendRequestSent 
}) => {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [status, setStatus] = useState<'NOT_FRIENDS' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS'>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  if (!currentUserId || currentUserId === targetUser.id) {
    // Don't show button if not logged in or if it's the current user's profile
    return null; 
  }

  const handleSendRequest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const friendRequest = await sendFriendRequest(targetUser.id);
      setRequestId(friendRequest.id);
      setStatus('PENDING_SENT');
      if (onFriendRequestSent) {
        onFriendRequestSent();
      }
    } catch (err: any) {
      setError(err.message || "Failed to send request.");
      console.error("Error sending friend request:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use requestId if available, otherwise use targetUserId
      const params = requestId 
        ? { requestId } 
        : { targetUserId: targetUser.id };
      
      await cancelFriendRequest(params);
      setStatus('NOT_FRIENDS');
      setRequestId(null);
      if (onFriendRequestSent) {
        onFriendRequestSent(); // Refresh parent component
      }
    } catch (err: any) {
      setError(err.message || "Failed to cancel request.");
      console.error("Error canceling friend request:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!pendingRequestId) {
      setError("Cannot accept request: Request ID is missing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await acceptFriendRequest(pendingRequestId);
      setStatus('FRIENDS');
      toast.success(`You are now friends with ${targetUser.display_name}!`);
      if (onFriendRequestSent) {
        onFriendRequestSent(); // Refresh parent component
      }
    } catch (err: any) {
      setError(err.message || "Failed to accept request.");
      console.error("Error accepting friend request:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!pendingRequestId) {
      setError("Cannot decline request: Request ID is missing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await declineFriendRequest(pendingRequestId);
      setStatus('NOT_FRIENDS');
      toast.success(`Friend request from ${targetUser.display_name} declined.`);
      if (onFriendRequestSent) {
        onFriendRequestSent(); // Refresh parent component
      }
    } catch (err: any) {
      setError(err.message || "Failed to decline request.");
      console.error("Error declining friend request:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine button text and icon based on status
  // Special handling for PENDING_RECEIVED status - show Accept/Decline buttons
  if (status === 'PENDING_RECEIVED') {
    return (
      <div className="flex flex-col items-center gap-1">
        
        <div className="flex gap-2">
          <Button 
            onClick={handleAcceptRequest} 
            disabled={isLoading}
            variant="default"
            size="sm"
            className='bg-accent-variant/80 hover:bg-accent-variant text-destructive-foreground rounded-full h-7 w-7 p-0'
            title="Accept friend request"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          </Button>
          <Button 
            onClick={handleDeclineRequest} 
            disabled={isLoading}
            variant="default" 
            size="sm"
            className='rounded-full h-7 w-7 p-0 bg-red-800/70 text-destructive-foreground hover:bg-red-800'
            title="Decline friend request"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
          </Button>
        </div>
        {error && <p className="text-red-500 text-xs mt-1 text-center">{error}</p>}
      </div>
    );
  }

  // Handle other statuses with single button
  let buttonText = 'Add Friend';
  let buttonVariant: "default" | "outline" | "ghost" = "default";
  let buttonDisabled = isLoading;

  switch (status) {
    case 'PENDING_SENT':
      buttonText = 'Cancel Request';
      buttonVariant = 'outline';
      buttonDisabled = isLoading;
      break;
    case 'FRIENDS':
      buttonText = 'Friends';
      buttonVariant = 'outline';
      buttonDisabled = true;
      break;
  }

  return (
    <div className="flex gap-2">
      <Button 
        onClick={status === 'PENDING_SENT' ? handleCancelRequest : handleSendRequest} 
        disabled={buttonDisabled}
        variant={buttonVariant}
        size={status === 'PENDING_SENT' ? 'sm' : 'default'}
        className={`rounded-full bg-bookWhite/80 backdrop-blur-sm ${
          status === 'PENDING_SENT' 
            ? 'h-7 text-xs px-3' 
            : 'h-8'
        }`}
      >
        {isLoading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
        {buttonText}
      </Button>
      {error && <p className="text-red-500 text-xs mt-1 text-center">{error}</p>}
    </div>
  );
};