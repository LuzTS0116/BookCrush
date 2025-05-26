// components/social/add-friend-button.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2, XCircle } from 'lucide-react';
import { sendFriendRequest } from '@/lib/api-helpers';
import { useSession } from 'next-auth/react';
import { UserProfileMinimal } from '@/types/social';

interface AddFriendButtonProps {
  targetUser: UserProfileMinimal; // The user whose profile we are on
  // Optional: initial status if already known (e.g., from parent fetch)
  initialStatus?: 'NOT_FRIENDS' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS';
  onFriendRequestSent?: () => void; // Callback after sending
}

export const AddFriendButton: React.FC<AddFriendButtonProps> = ({ 
  targetUser, 
  initialStatus = 'NOT_FRIENDS',
  onFriendRequestSent 
}) => {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [status, setStatus] = useState<'NOT_FRIENDS' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS'>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentUserId || currentUserId === targetUser.id) {
    // Don't show button if not logged in or if it's the current user's profile
    return null; 
  }

  const handleSendRequest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await sendFriendRequest(targetUser.id);
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

  // Determine button text and icon based on status
  let buttonText = 'Add Friend';
  let buttonIcon = <UserPlus className="mr-2 h-4 w-4" />;
  let buttonVariant: "default" | "outline" | "ghost" = "default";
  let buttonDisabled = isLoading;

  switch (status) {
    case 'PENDING_SENT':
      buttonText = 'Request Sent';
      buttonIcon = <UserCheck className="mr-2 h-4 w-4" />;
      buttonVariant = 'outline';
      buttonDisabled = true;
      break;
    case 'PENDING_RECEIVED':
      buttonText = 'Respond to Request';
      buttonIcon = <UserCheck className="mr-2 h-4 w-4" />; // Or a custom icon
      buttonVariant = 'default'; // Encourage action
      // You might want to redirect to requests page or open a dialog here
      break;
    case 'FRIENDS':
      buttonText = 'Friends';
      buttonIcon = <UserCheck className="mr-2 h-4 w-4" />;
      buttonVariant = 'outline';
      buttonDisabled = true;
      break;
  }

  return (
    <div>
      <Button 
        onClick={handleSendRequest} 
        disabled={buttonDisabled}
        variant={buttonVariant}
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : buttonIcon}
        {buttonText}
      </Button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};