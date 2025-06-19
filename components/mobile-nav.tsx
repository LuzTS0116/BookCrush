"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookMarked, Calendar, Home, Users } from "lucide-react"
import { Coffee } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion"

export function MobileNav() {
  const pathname = usePathname()

  const shouldHideNav = ["/","/login", "/signup", "/home"].includes(pathname);

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
      active: pathname === "/books" || pathname.startsWith("/books/"),
    },
    {
      href: "/clubs",
      label: "Clubs",
      icon: Coffee,
      active: pathname === "/clubs" || pathname.startsWith("/clubs/"),
    },
    {
      href: "/friends",
      label: "Friends",
      icon: Users,
      active: pathname === "/friends",
    },
  ]

  return (
    <div className={cn("fixed bottom-0 left-1/2 z-50 w-[70vw] max-w-[420px] -translate-x-1/2 h-[60px] bg-secondary/95 backdrop-blur-md text-muted-foreground md:hidden rounded-t-[2rem] overflow-visible shadow-[0_0_10px_3px_rgba(202,177,198,0.05)] px-2", { "hidden": shouldHideNav })}>
        <div className="grid grid-cols-4 h-full pt-1 z-70">
            {routes.map((route, index) => {
            const isActive = route.active
            return (
                <Link
                key={route.href}
                href={route.href}
                className={cn(
                    "relative flex flex-col items-center justify-center transition-colors group",
                    isActive ? "text-secondary" : "text-bookWhite"
                )}
                >
                {isActive && (
                    <motion.div
                    key={`active-pill-${index}`}
                    className="absolute inset-1 rounded-full bg-primary-dark z-0"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                )}
                <div className="relative z-10 flex flex-col items-center justify-center">
                    <route.icon className="h-5 w-5 mb-0.5" />
                    <AnimatePresence mode="wait">
                    {isActive && (
                        <motion.span
                        key={`label-${route.label}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2 }}
                        className="text-[10px] font-medium"
                        >
                        {route.label}
                        </motion.span>
                    )}
                    </AnimatePresence>
                </div>
                </Link>
            )
            })}
        </div>
    </div>
  )
}