// "use client"

// import Link from "next/link"
// import { usePathname } from "next/navigation"
// import { cn } from "@/lib/utils"
// import { BookMarked, Calendar, Home, Users } from "lucide-react"

// export function MobileNav() {
//   const pathname = usePathname()

//   const routes = [
//     {
//       href: "/dashboard",
//       label: "Dashboard",
//       icon: Home,
//       active: pathname === "/dashboard",
//     },
//     {
//       href: "/books",
//       label: "Books",
//       icon: BookMarked,
//       active: pathname === "/books" || pathname.startsWith("/books/"),
//     },
//     {
//       href: "/clubs",
//       label: "Clubs",
//       icon: Users,
//       active: pathname === "/clubs" || pathname.startsWith("/clubs/"),
//     },
//     {
//       href: "/calendar",
//       label: "Calendar",
//       icon: Calendar,
//       active: pathname === "/calendar",
//     },
//   ]

//   return (
//     <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t border-border md:hidden">
//       <div className="grid h-full grid-cols-4">
//         {routes.map((route) => (
//           <Link
//             key={route.href}
//             href={route.href}
//             className={cn(
//               "flex flex-col items-center justify-center text-xs font-medium transition-colors",
//               route.active ? "text-primary" : "text-muted-foreground",
//             )}
//           >
//             <route.icon className="h-6 w-6 mb-1" />
//             <span>{route.label}</span>
//           </Link>
//         ))}
//       </div>
//     </div>
//   )
// }

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookMarked, Calendar, Home, Users } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function MobileNav() {
  const pathname = usePathname()

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
      icon: Users,
      active: pathname === "/clubs" || pathname.startsWith("/clubs/"),
    },
    {
      href: "/calendar",
      label: "Calendar",
      icon: Calendar,
      active: pathname === "/calendar",
    },
  ]

  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-[65vw] max-w-[420px] -translate-x-1/2 h-[60px] bg-secondary/95 backdrop-blur-md text-muted-foreground md:hidden rounded-t-[2rem] overflow-visible shadow-[0_0_10px_3px_rgba(202,177,198,0.05)] px-2">
        <div className="grid grid-cols-4 h-full pt-1 z-70">
            {routes.map((route) => {
            const isActive = route.active
            return (
                <Link
                key={route.href}
                href={route.href}
                className={cn(
                    "relative flex flex-col items-center justify-center transition-colors group",
                    isActive ? "text-secondary" : "text-accent"
                )}
                >
                {isActive && (
                    <motion.div
                    layoutId="active-pill"
                    className="absolute inset-1 rounded-full bg-primary-dark z-0"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                )}
                <div className="relative z-10 flex flex-col items-center justify-center">
                    <route.icon className="h-5 w-5 mb-0.5" />
                    <AnimatePresence>
                    {isActive && (
                        <motion.span
                        key={route.label}
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