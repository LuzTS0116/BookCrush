"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion, AnimatePresence } from "framer-motion"

const statuses = [
  { label: "⚡ Started", value: "started", color: "bg-accent-variant text-bookWhite" },
  { label: "⏳ In Progress", value: "in-progress", color: "bg-accent-variant text-bookWhite" },
  { label: "💫 Almost Done", value: "almost done", color: "bg-accent-variant text-bookWhite" },
  { label: "🔥 Finished", value: "finished", color: "bg-accent-variant text-bookWhite" },
];

const TABS = [
  { label: "Currently Reading", value: "reading" },
  { label: "Reading Queue", value: "queue" },
]

export default function DashboardReading() {
  const [status, setStatus] = useState(statuses[1]); // default to "Started"

  const [tab, setTab] = useState("reading")
  const [prevTab, setPrevTab] = useState("reading")

  const direction =
    TABS.findIndex((t) => t.value === tab) > TABS.findIndex((t) => t.value === prevTab) ? 1 : -1
  
  return (
    <div className="container pb-6 mx-auto px-4">
        <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
                <Tabs defaultValue="reading" className="space-y-4">
                    <div className="flex justify-center">
                    <TabsList className="bg-secondary-light text-primary rounded-full">
                        <TabsTrigger
                        value="reading"
                        className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                        >
                        Currently Reading
                        </TabsTrigger>
                        <TabsTrigger
                        value="queue"
                        className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                        >
                        Reading Queue
                        </TabsTrigger>
                    </TabsList>
                    </div>

                    <TabsContent value="reading" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="overflow-hidden bg-bookWhite pb-0.5">
                            <div className="flex flex-row gap-4 px-4 pt-4">
                                {/* Book Image */}
                                <div className="w-[100px] flex-shrink-0">
                                <img
                                    src="/placeholder.svg?height=135&width=110"
                                    alt="Book cover"
                                    className="h-[135px] w-full shadow-md rounded"
                                />
                                </div>
                                {/* Content */}
                                <div className="flex flex-col justify-between flex-1">
                                <CardHeader className="pb-2 px-0 pt-0">
                                    <CardTitle>The Midnight Library</CardTitle>
                                    <CardDescription>Matt Haig</CardDescription>
                                </CardHeader>

                                <CardContent className="pb-0 px-0">
                                    <div className="flex flex-wrap gap-1.5 mb-2 items-center">
                                    {/* Current Status Badge */}
                                    <span className={`px-2 py-0.5 text-xs font-regular rounded-full ${status.color}`}>
                                        {status.label}
                                    </span>

                                    {/* Started On */}
                                    <span className="px-2 py-0.5 text-xs font-regular bg-primary-dark/50 text-secondary rounded-full">
                                        Started on: Apr 15
                                    </span>

                                    {/* Personal Note */}
                                    <span className="px-2 py-0.5 text-xs font-regular bg-accent text-secondary rounded-full max-w-[180px] truncate">
                                        "Loved the intro so far!"
                                    </span>
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-2 px-0">
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs flex items-center rounded-full h-5 gap-1 bg-bookWhite shadow-sm hover:bg-muted"
                                        >
                                            Update Status <ChevronDown className="h-4 w-4" />
                                        </Button>
                                        </DropdownMenu.Trigger>

                                        <DropdownMenu.Portal>
                                        <DropdownMenu.Content
                                            className="min-w-[160px] rounded-2xl bg-secondary-light shadow-xl p-1 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                                            sideOffset={5}
                                        >
                                            {statuses.map((s) => (
                                            <DropdownMenu.Item
                                                key={s.value}
                                                onSelect={() => setStatus(s)}
                                                className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                                            >
                                                {s.label}
                                            </DropdownMenu.Item>
                                            ))}
                                        </DropdownMenu.Content>
                                        </DropdownMenu.Portal>
                                    </DropdownMenu.Root>
                                    </CardFooter>
                                </div>
                            </div>
                        </Card>

                        <Card className="overflow-hidden bg-bookWhite pb-0.5">
                            <div className="flex flex-row gap-4 px-4 pt-4">
                                {/* Book Image */}
                                <div className="w-[100px] flex-shrink-0">
                                <img
                                    src="/placeholder.svg?height=135&width=110"
                                    alt="Book cover"
                                    className="h-[135px] w-full shadow-md rounded"
                                />
                                </div>
                                {/* Content */}
                                <div className="flex flex-col justify-between flex-1">
                                <CardHeader className="pb-2 px-0 pt-0">
                                    <CardTitle>Verity</CardTitle>
                                    <CardDescription>Coleen Hoover</CardDescription>
                                </CardHeader>

                                <CardContent className="pb-0 px-0">
                                    <div className="flex flex-wrap gap-1.5 mb-2 items-center">
                                    {/* Current Status Badge */}
                                    <span className={`px-2 py-0.5 text-xs font-regular rounded-full ${status.color}`}>
                                        {status.label}
                                    </span>

                                    {/* Started On */}
                                    <span className="px-2 py-0.5 text-xs font-regular bg-primary-dark/50 text-secondary rounded-full">
                                        Started on: Apr 15
                                    </span>

                                    {/* Personal Note */}
                                    <span className="px-2 py-0.5 text-xs font-regular bg-accent text-secondary rounded-full max-w-[180px] truncate">
                                        "This took a drastic turn"
                                    </span>
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-2 px-0">
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs flex items-center rounded-full h-5 gap-1 bg-bookWhite shadow-sm hover:bg-muted"
                                        >
                                            Update Status <ChevronDown className="h-4 w-4" />
                                        </Button>
                                        </DropdownMenu.Trigger>

                                        <DropdownMenu.Portal>
                                        <DropdownMenu.Content
                                            className="min-w-[160px] rounded-2xl bg-secondary-light shadow-xl p-1 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                                            sideOffset={5}
                                        >
                                            {statuses.map((s) => (
                                            <DropdownMenu.Item
                                                key={s.value}
                                                onSelect={() => setStatus(s)}
                                                className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                                            >
                                                {s.label}
                                            </DropdownMenu.Item>
                                            ))}
                                        </DropdownMenu.Content>
                                        </DropdownMenu.Portal>
                                    </DropdownMenu.Root>
                                    </CardFooter>
                                </div>
                            </div>
                        </Card>

                        <Card className="overflow-hidden bg-bookWhite pb-0.5">
                            <div className="flex flex-row gap-4 px-4 pt-4">
                                {/* Book Image */}
                                <div className="w-[100px] flex-shrink-0">
                                <img
                                    src="/placeholder.svg?height=135&width=110"
                                    alt="Book cover"
                                    className="h-[135px] w-full shadow-md rounded"
                                />
                                </div>
                                {/* Content */}
                                <div className="flex flex-col justify-between flex-1">
                                <CardHeader className="pb-2 px-0 pt-0">
                                    <CardTitle>Spark of the Everflame</CardTitle>
                                    <CardDescription>Penn Cole</CardDescription>
                                </CardHeader>

                                <CardContent className="pb-0 px-0">
                                    <div className="flex flex-wrap gap-1.5 mb-2 items-center">
                                    {/* Current Status Badge */}
                                    <span className={`px-2 py-0.5 text-xs font-regular rounded-full ${status.color}`}>
                                        {status.label}
                                    </span>

                                    {/* Started On */}
                                    <span className="px-2 py-0.5 text-xs font-regular bg-primary-dark/50 text-secondary rounded-full">
                                        Started on: Apr 15
                                    </span>

                                    {/* Personal Note */}
                                    <span className="px-2 py-0.5 text-xs font-regular bg-accent text-secondary rounded-full max-w-[180px] truncate">
                                        "The best slowburn!"
                                    </span>
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-2 px-0">
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs flex items-center rounded-full h-5 gap-1 bg-bookWhite shadow-sm hover:bg-muted"
                                        >
                                            Update Status <ChevronDown className="h-4 w-4" />
                                        </Button>
                                        </DropdownMenu.Trigger>

                                        <DropdownMenu.Portal>
                                        <DropdownMenu.Content
                                            className="min-w-[160px] rounded-2xl bg-secondary-light shadow-xl p-1 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                                            sideOffset={5}
                                        >
                                            {statuses.map((s) => (
                                            <DropdownMenu.Item
                                                key={s.value}
                                                onSelect={() => setStatus(s)}
                                                className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                                            >
                                                {s.label}
                                            </DropdownMenu.Item>
                                            ))}
                                        </DropdownMenu.Content>
                                        </DropdownMenu.Portal>
                                    </DropdownMenu.Root>
                                    </CardFooter>
                                </div>
                            </div>
                        </Card>

                    </div>
                    </TabsContent>

                    <TabsContent value="queue" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="overflow-hidden bg-primary">
                        <div className="flex flex-row gap-4 p-4">
                            {/* Book Image */}
                            <div className="flex-shrink-0">
                            <img
                                src="/placeholder.svg?height=135&width=110"
                                alt="Book cover"
                                className="h-[135px] w-auto shadow-md rounded"
                            />
                            </div>
                            {/* Content */}
                            <div className="flex flex-col justify-between flex-1">
                            <CardHeader className="pb-2 px-0 pt-0">
                                <CardTitle>The Sunset Library</CardTitle>
                                <CardDescription>Matt Haig</CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2 px-0">
                                <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span className="font-medium">65%</span>
                                </div>
                                
                            </CardContent>
                            <CardFooter className="pt-0 pb-0 px-0">
                                <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary w-full justify-between"
                                >
                                Update Progress 
                                </Button>
                            </CardFooter>
                            </div>
                        </div>
                        </Card>

                        <Card className="overflow-hidden bg-primary">
                        <div className="flex flex-row gap-4 p-4">
                            {/* Book Image */}
                            <div className="flex-shrink-0">
                            <img
                                src="/placeholder.svg?height=135&width=110"
                                alt="Book cover"
                                className="h-[135px] w-full shadow-md rounded"
                            />
                            </div>
                            {/* Content */}
                            <div className="flex flex-col justify-between flex-1">
                            <CardHeader className="pb-2 px-0 pt-0">
                                <CardTitle>The Sunset Library</CardTitle>
                                <CardDescription>Matt Haig</CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2 px-0">
                                <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span className="font-medium">65%</span>
                                </div>
                                
                            </CardContent>
                            <CardFooter className="pt-0 pb-0 px-0">
                                <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary w-full justify-between"
                                >
                                Update Progress 
                                </Button>
                            </CardFooter>
                            </div>
                        </div>
                        </Card>

                        <Card className="overflow-hidden bg-primary">
                        <div className="flex flex-row gap-4 p-4">
                            {/* Book Image */}
                            <div className="flex-shrink-0">
                            <img
                                src="/placeholder.svg?height=135&width=110"
                                alt="Book cover"
                                className="h-[135px] w-auto shadow-md rounded"
                            />
                            </div>
                            {/* Content */}
                            <div className="flex flex-col justify-between flex-1">
                            <CardHeader className="pb-2 px-0 pt-0">
                                <CardTitle>The Sunset Library</CardTitle>
                                <CardDescription>Matt Haig</CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2 px-0">
                                <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span className="font-medium">65%</span>
                                </div>
                                
                            </CardContent>
                            <CardFooter className="pt-0 pb-0 px-0">
                                <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary w-full justify-between"
                                >
                                Update Progress 
                                </Button>
                            </CardFooter>
                            </div>
                        </div>
                        </Card>
                    </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    </div>
  )
}