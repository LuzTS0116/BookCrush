"use client"

import Link from "next/link"
import Image from "next/image";
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookOpen, Home, BookMarked, Users, Calendar, Bell, Search } from "lucide-react"
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

export function MainNav() {
  const pathname = usePathname()
  const { data: session, status } = useSession(); // will be 'authenticated' here

  if (status === "loading") {
    return <p>Loading session…</p>;
  }

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
      href: "/calendar",
      label: "Calendar",
      icon: Calendar,
      active: pathname === "/calendar",
    },
  ]

  return (
    <div className="bg-secondary-light rounded-bl-2xl rounded-br-2xl">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2 mr-0 w-[55vw] max-w-[550px]">
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
        <div className="ml-auto flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Bell className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="@user" />
                  <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session?.user?.name ?? "mysterious reader"}!</p>
                  <p className="text-xs leading-none text-muted-foreground">{session?.user?.email ?? "mysterious email"}!</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/profile" className="flex w-full">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/settings" className="flex w-full">
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
              <Button onClick={handleSignOut}>
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
