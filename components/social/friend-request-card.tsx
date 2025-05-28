// components/social/friend-request-card.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, User, MoreVertical } from 'lucide-react';
import { acceptFriendRequest, declineFriendRequest } from '@/lib/api-helpers';
import { FriendRequest } from '@/types/social'; // Adjust path
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"; // Radix DropdownMenu

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
    <Card className="flex items-center p-1 w-full">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-bookWhite mr-4">
        <User className="h-6 w-6 text-gray-500" />
      </div>
      <div className="flex flex-col w-full">
        <div className="flex flex-wrap justify-between flex-1">
          <CardTitle className="text-sm leading-4">{senderDisplayName}</CardTitle>
          <div className='flex flex-col'>
            
            {/* --- NEW: Add to Shelf Dropdown --- */}
            <div className="relative inline-block">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button
                    onClick={handleDecline} 
                    disabled={isLoading} 
                    size="sm" 
                    variant="outline" 
                    className="text-xs flex items-end px-0 rounded-full h-auto gap-1 bg-transparent border-none"
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="w-auto rounded-xl bg-transparent shadow-xl px-1 mr-6 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                    sideOffset={5}
                  >
                      <DropdownMenu.Item
                        key="ignore"
                        onClick={handleDecline}
                        className="px-3 py-2 text-xs text-center bg-secondary/90 my-2 rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                      >
                        ignorar
                      </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
          <p className="text-xs/3 text-secondary font-serif">24 mutual friends</p>
          <div className='flex justify-between w-full items-end'>
            <p className="text-xs/3 text-secondary/50 font-serif italic pb-1">request received 25.05.2025</p>
            <div className=''>
              <Button onClick={handleAccept} disabled={isLoading} size="sm" variant="outline" className="rounded-full text-bookWhite bg-accent-variant/75 hover:bg-accent-variant focus:bg-accent-variant font-serif border-none h-5 font-normal px-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept" }
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
    
    // <Card className="flex items-center p-4">
    //   <div className="flex-1">
    //     <CardTitle className="text-lg">{senderDisplayName}</CardTitle>
    //     <CardDescription className="text-sm">
    //       Friend request sent by {senderDisplayName}
    //     </CardDescription>
    //     {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    //   </div>
    //   <div className="flex space-x-2 ml-4">
    //     <Button onClick={handleAccept} disabled={isLoading} size="sm" variant="outline" className="bg-green-500 text-white hover:bg-green-600">
    //       {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
    //     </Button>
    //     <Button onClick={handleDecline} disabled={isLoading} size="sm" variant="outline" className="bg-red-500 text-white hover:bg-red-600">
    //       {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
    //     </Button>
    //   </div>
    // </Card>
  );
};