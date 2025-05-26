// components/social/friend-card.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"; // For future "Remove Friend" option
import { UserProfileMinimal } from '@/types/social';

interface FriendCardProps {
  friend: UserProfileMinimal; // The friend's minimal profile
  // onRemoveFriend?: (friendId: string) => void; // For future feature
}

export const FriendCard: React.FC<FriendCardProps> = ({ friend }) => {
  const friendDisplayName = friend.profile?.display_name || friend.email || 'Unknown Friend';

  return (
    <Card className="flex items-center p-4">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 mr-4">
        <User className="h-6 w-6 text-gray-500" />
      </div>
      <div className="flex-1">
        <CardTitle className="text-lg">{friendDisplayName}</CardTitle>
        <CardDescription className="text-sm">{friend.email}</CardDescription>
      </div>
      {/* Optional: Add a dropdown for more actions like "Remove Friend" */}
      {/* <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button variant="ghost" size="sm">...</Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item>Remove Friend</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root> */}
    </Card>
  );
};