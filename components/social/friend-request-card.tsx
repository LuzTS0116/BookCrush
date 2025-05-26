// components/social/friend-request-card.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { acceptFriendRequest, declineFriendRequest } from '@/lib/api-helpers';
import { FriendRequest } from '@/types/social'; // Adjust path

interface FriendRequestCardProps {
  request: FriendRequest;
  onActionComplete: (requestId: string, action: 'accepted' | 'declined') => void;
}

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({ request, onActionComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHandled, setIsHandled] = useState(false); // To hide card after action

  const handleAccept = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await acceptFriendRequest(request.id);
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
      await declineFriendRequest(request.id);
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

  const senderDisplayName = request.sender?.profile?.display_name || request.sender?.email || 'Unknown User';

  return (
    <Card className="flex items-center p-4">
      <div className="flex-1">
        <CardTitle className="text-lg">{senderDisplayName}</CardTitle>
        <CardDescription className="text-sm">
          Friend request sent by {senderDisplayName}
        </CardDescription>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
      <div className="flex space-x-2 ml-4">
        <Button onClick={handleAccept} disabled={isLoading} size="sm" variant="outline" className="bg-green-500 text-white hover:bg-green-600">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </Button>
        <Button onClick={handleDecline} disabled={isLoading} size="sm" variant="outline" className="bg-red-500 text-white hover:bg-red-600">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        </Button>
      </div>
    </Card>
  );
};