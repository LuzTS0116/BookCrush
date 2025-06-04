"use client"

import Link from "next/link"
import Image from "next/image";
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookOpen, Home, BookMarked, Users, Calendar, Bell, Search } from "lucide-react"
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

import { useSession } from "next-auth/react";
import { handleSignOut } from '@/lib/auth';
import { useProfile } from "@/hooks/use-profile"

export function MainNav() {
  
  const { data: session, status } = useSession(); // will be 'authenticated' here

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

  const pathname = usePathname()

  console.log(avatarUrl)
  
  // Check if the current path matches /clubs/[id], /profile/[id], or /books/[id]
  const shouldHideNav = /^\/(clubs|profile|books)\/[^/]+$/.test(pathname);

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

  return (
    <div className={cn('bg-secondary-light rounded-bl-2xl rounded-br-2xl', { 'hidden': shouldHideNav })}>
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2 mr-0 w-[55vw] max-w-[400px]">
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
        <div className="ml-auto flex items-center space-x-4">
          {/* <Link href="/calendar" className="text-muted-foreground hover:text-primary">
            <Search className="h-5 w-5" />
          </Link> */}
          <Link href="/calendar" className="text-muted-foreground hover:text-primary">
            <Calendar className="h-4 w-4" />
          </Link>
          <Link href="/#" className="text-muted-foreground hover:text-primary">
            <Heart className="h-5 w-5 font-bold"/>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={avatarUrl} 
                    alt="@user"
                    className={profileLoading ? "opacity-75" : ""} 
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profileLoading ? "..." : initials}
                  </AvatarFallback>
                </Avatar>
                {/* Optional: Show a small loading indicator */}
                {profileLoading && (
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 border-none rounded-xl" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {displayName}
                    {profileError && (
                      <span className="text-xs text-red-500 ml-2">(offline)</span>
                    )}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">{email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/profile" className="flex w-full">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
              <Button onClick={handleSignOut} className="rounded-full">
        Sign out
      </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
