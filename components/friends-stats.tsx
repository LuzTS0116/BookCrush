"use client"

import React  from 'react';
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FriendsMain from "./friends-main";
import { getFriendsAndRequests } from '@/lib/api-helpers'; // Import getExploreUsers
import { FriendRequest, Friendship } from '@/types/social';
import { useSession } from 'next-auth/react';

type Props = {
  friends: number;
  sent: number;
  request: number;
};


export default function FriendsStats({friends, sent, request}: Props) {
    
  return (   
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex flex-row border-none gap-2 w-max text-center text-sm bg-secondary/75 hover:bg-secondary font-normal font-serif text-bookWhite mt-2 rounded-full h-5 px-2">
            <div className="flex">
                <p>Friends </p>
                <p className="ml-1 font-semibold">{friends}</p>
                <p className="ml-2 font-bold">•</p>
            </div>
            <div className="flex pl-0">
                <p>Sent </p>
                <p className="ml-1 font-semibold">{sent}</p>
                <p className="ml-2 font-bold">•</p>
            </div>
            <div className="flex">
                <p>Pending </p>
                <p className="ml-1 font-semibold">{request}</p>
            </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[85vw] rounded-2xl">
        <Image 
            src="/images/background.png"
            alt="Create and Manage your Book Clubs | BookCrush"
            width={1622}
            height={2871}
            className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
        />
        <DialogHeader className="flex justify-start">
          <DialogTitle>My Connections</DialogTitle>
        </DialogHeader>
        <FriendsMain />
      </DialogContent>
    </Dialog>
  );
}