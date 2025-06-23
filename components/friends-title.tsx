"use client"

import Image from "next/image";
import FriendsStats from "./friends-stats";

type Props = {
  friends: number;
  sent: number;
  request: number;
};


export default function FriendsTitle({friends, sent, request}: Props) {
  return (
    <div className="container mx-auto pt-8 pb-6 px-4 mt-[-10px] bg-secondary-light rounded-b-3xl">
      <div className="space-y-8">
        <div className="relative flex flex-col md:flex-row justify-between gap-2 overflow-visible">
          <div className="w-[75vw]">
            <h1 className="text-3xl font-bold tracking-tight text-bookWhite">Friends 💫<span className="text-2xl"></span></h1>
            <p className="text-bookWhite font-serif text-base/5">
              Connect with book lovers, all in one place. See who you're sharing the shelf with and keep up with your favorite readers.
            </p>
            <FriendsStats 
              friends={friends}
              sent={sent}
              request={request}
            />
          </div>
          {/* Flower SVG positioned to the right */}
          {/* <div className="absolute right-[-60px] top-3 block">
            <Image 
            src="/images/logo-mark.svg"
            alt="Create and Manage your Book Clubs | BookCrush"
            width={32}
            height={32}
            className="w-32 h-32 opacity-50 rotate-[-25deg]" />
          </div> */}
        </div>  
      </div>
    </div>
  );
}