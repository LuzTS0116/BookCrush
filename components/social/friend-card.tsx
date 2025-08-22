// components/social/friend-card.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreVertical } from 'lucide-react';
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"; // For future "Remove Friend" option
import { UserProfileMinimal } from '@/types/social';
import { getMutualFriendsCount } from '@/lib/api-helpers';
import { formatDate } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface FriendCardProps {
  friend: UserProfileMinimal; // The friend's minimal profile
  establishedAt?: string; // When the friendship was established
  // onRemoveFriend?: (friendId: string) => void; // For future feature
}

export const FriendCard: React.FC<FriendCardProps> = ({ friend, establishedAt }) => {
  const { data: session } = useSession();
  const [mutualFriendsCount, setMutualFriendsCount] = useState<number>(0);
  const [isLoadingMutual, setIsLoadingMutual] = useState<boolean>(true);
  
  const friendDisplayName = friend.display_name || friend.email || 'Unknown Friend';

  // Load mutual friends count
  useEffect(() => {
    const loadMutualFriends = async () => {
      if (!session?.supabaseAccessToken || !friend.id) {
        setIsLoadingMutual(false);
        return;
      }

      try {
        const mutualData = await getMutualFriendsCount(friend.id, session.supabaseAccessToken);
        setMutualFriendsCount(mutualData.count);
      } catch (error) {
        console.error('Error loading mutual friends:', error);
        // Keep default count of 0
      } finally {
        setIsLoadingMutual(false);
      }
    };

    loadMutualFriends();
  }, [friend.id, session?.supabaseAccessToken]);

  // Format the friendship date
  const friendsSince = establishedAt 
    ? formatDate(establishedAt, { format: 'long' })
    : 'Unknown date';

  return (
    <Card className="flex items-center p-1 w-full">
      <Avatar className="h-12 w-12 mr-4">
        <AvatarImage 
          src={friend.avatar_url || undefined} 
          alt={friendDisplayName} 
          className="h-full w-full object-cover"
        />
        <AvatarFallback className="bg-bookWhite text-secondary">
          {friendDisplayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col w-full">
        <div className="flex flex-wrap justify-between flex-1">
          <div className='flex flex-col'>
            <CardTitle className="text-sm leading-4">{friendDisplayName}</CardTitle>
            <p className="text-xs/3 text-secondary font-serif">
              {isLoadingMutual 
                ? "Loading..." 
                : `${mutualFriendsCount} mutual friend${mutualFriendsCount !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <div>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-end px-0 rounded-full h-auto gap-1 bg-transparent hover:bg-transparent border-none"
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="w-auto rounded-xl bg-transparent shadow-xl px-1 mr-6 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                >
                    <DropdownMenu.Item
                      className="px-3 py-2 text-xs text-center bg-secondary/90 my-2 rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                    >
                      remove friend
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            {/* <Button variant="outline" className='ml-10 rounded-full text-bookWhite bg-accent-variant/75 hover:bg-accent-variant focus:bg-accent-variant leading-2 font-serif border-none h-5 font-normal px-2'>remove</Button> */}
          </div>
        </div>
        {/* <p className="text-xs/3 text-secondary font-serif bg-secondary/10 px-2 rounded-full inline-block w-max">**Genres:**</p> */}
        <p className="text-xs/3 text-secondary/50 font-serif italic">friends since {friendsSince}</p>
      </div>
    </Card>
  );
};