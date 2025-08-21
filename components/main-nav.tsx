"use client"

import Link from "next/link"
import Image from "next/image";
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookOpen, Home, BookMarked, Users, Calendar, Bell, Search, Shield, Settings } from "lucide-react"
import { Heart, Coffee } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useSession } from "next-auth/react";
import { handleSignOut } from '@/lib/auth';
import { useProfile } from "@/hooks/use-profile"
import { useUserRole } from "@/hooks/useUserRole"
import { useFeedbackNotifications } from "@/hooks/use-feedback-notifications"
import { useRecommendationNotifications } from "@/hooks/use-recommendation-notifications"
import React, { useState } from "react";

export function MainNav() {
  
  const { data: session, status } = useSession(); // will be 'authenticated' here
  const { isSuperAdmin } = useUserRole();

  // The useProfile hook already uses SWR with proper caching (5 minutes)
  // and deduplication, so it will only fetch once and reuse the data
  const { 
    avatarUrl, 
    displayName, 
    initials, 
    email, 
    isLoading: profileLoading,
    error: profileError 
  } = useProfile()

  // Check for feedback and recommendation notifications
  const { hasUnreadReplies, unreadCount } = useFeedbackNotifications();
  const { hasUnread: hasUnreadRecommendations, unreadCount: recommendationCount } = useRecommendationNotifications();
  
  // Calculate total notification count
  const totalNotifications = unreadCount + recommendationCount;
  const hasNotifications = hasUnreadReplies || hasUnreadRecommendations;

  const pathname = usePathname()

  
  // Check if the current path matches /clubs/[id], /profile/[id], or /books/[id]
  const shouldHideNav = /^\/(clubs|profile|books)\/[^/]+$/.test(pathname) ||
  ["/","/profile", "/profile-setup", "/login", "/forgot-password", "/reset-password", "/signup", "/home", "/forgot-password"].includes(pathname);

  // if (status === "loading") {
  //   return <p>Loading session…</p>;
  // }

  const routes = [
    {
      href: "/dashboard",
      label: "Home",
      icon: Home,
      active: pathname === "/dashboard",
    },
    {
      href: "/books",
      label: "Books",
      icon: BookMarked,
      active: pathname === "/books",
    },
    {
      href: "/clubs",
      label: "Clubs",
      icon: Users,
      active: pathname === "/clubs",
    },
    {
      href: "/friends",
      label: "Friends",
      icon: Coffee,
      active: pathname === "/friends",
    },
  ]

  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className={cn('bg-secondary-light rounded-bl-2xl rounded-br-2xl', { 'hidden': shouldHideNav })}>
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2 mr-0 w-[55vw] max-w-[400px] md:w-[24vw] lg:w-[12vw]">
          <Image 
              src="/images/main-logo.svg"
              alt="Reading a Book in a Castle | BookCrush"
              width={800}
              height={200}
          />
        </Link>
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5",
                route.active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <route.icon className="h-4 w-4 md:inline hidden" />
              <span className="hidden md:block">{route.label}</span>
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-3">
          {/* <Link href="/calendar" className="text-muted-foreground hover:text-primary">
            <Search className="h-5 w-5" />
          </Link> */}
          <Link href="/calendar" className="text-muted-foreground hover:text-primary">
            <Calendar className="h-4 w-4" />
          </Link>
          
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-transparent focus:ring-transparent focus-visible:ring-none focus-visible:ring-offset-transparent">
                <Link href="/#" className="text-muted-foreground hover:text-primary">
                  <Settings className="h-5 w-5"/>
                </Link>
                {/* Optional: Show a small loading indicator */}
                {profileLoading && (
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-auto pt-0 border-none bg-transparent shadow-none" align="end" forceMount>
              {/* <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col items-end space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {displayName}
                    {profileError && (
                      <span className="text-xs text-red-500 ml-2">(offline)</span>
                    )}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">{email}</p>
                </div>
              </DropdownMenuLabel> */}
              {/* <DropdownMenuSeparator /> */}
              {isSuperAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="bg-bookWhite mb-1 hover:bg-bookWhite focus:bg-bookWhite/85">
                    <Link href="/admin" className="flex justify-end w-full items-center gap-2 text-secondary" onClick={() => setDropdownOpen(false)}>
                      <Shield className="h-4 w-4 text-red-600" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem className="flex justify-end px-0 hover:bg-transparent focus:bg-transparent">
                <Button onClick={handleSignOut} className="rounded-sm bg-gray-600 text-bookWhite hover:bg-gray-500">
                  Sign out
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/profile" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={avatarUrl} 
                      alt="@user"
                      className={profileLoading ? "h-full w-full object-cover opacity-75" : "h-full w-full object-cover"} 
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profileLoading ? "..." : initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Combined notification badge for feedback and recommendations */}
                  {hasNotifications && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 flex items-center justify-center border-2 border-secondary-light">
                      <span className="text-[6px] font-thin text-white">
                        {totalNotifications > 9 ? '9+' : totalNotifications}
                      </span>
                    </div>
                  )}
                  
                  {/* Optional: Show a small loading indicator */}
                  {profileLoading && !hasNotifications && (
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {hasNotifications ? (
                    <>
                      {hasUnreadReplies && hasUnreadRecommendations ? (
                        `You have ${unreadCount} feedback ${unreadCount === 1 ? 'reply' : 'replies'} and ${recommendationCount} book ${recommendationCount === 1 ? 'recommendation' : 'recommendations'}`
                      ) : hasUnreadReplies ? (
                        `You have ${unreadCount} new feedback ${unreadCount === 1 ? 'reply' : 'replies'}`
                      ) : (
                        `You have ${recommendationCount} new book ${recommendationCount === 1 ? 'recommendation' : 'recommendations'}`
                      )}
                    </>
                  ) : (
                    'Go to Profile'
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
