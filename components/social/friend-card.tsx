// components/social/friend-card.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, MoreVertical } from 'lucide-react';
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"; // For future "Remove Friend" option
import { UserProfileMinimal } from '@/types/social';

interface FriendCardProps {
  friend: UserProfileMinimal; // The friend's minimal profile
  // onRemoveFriend?: (friendId: string) => void; // For future feature
}

export const FriendCard: React.FC<FriendCardProps> = ({ friend }) => {
  const friendDisplayName = friend.profile?.display_name || friend.email || 'Unknown Friend';

  return (
    <Card className="flex items-center p-1 w-full">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-bookWhite mr-4">
        <User className="h-6 w-6 text-gray-500" />
      </div>
      <div className="flex flex-col w-full">
        <div className="flex flex-wrap justify-between flex-1">
          <div className='flex flex-col'>
            <CardTitle className="text-sm leading-4">{friendDisplayName}</CardTitle>
            <p className="text-xs/3 text-secondary font-serif ">24 mutual friends</p>
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
        <p className="text-xs/3 text-secondary/50 font-serif italic">friends since may, 2025</p>
      </div>
    </Card>
  );
};