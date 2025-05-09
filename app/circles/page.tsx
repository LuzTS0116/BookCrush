"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CalendarDays, Plus, Search, Settings, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function CirclesPage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Sample circles data
  const myCircles = [
    {
      id: 1,
      name: "Fiction Lovers",
      description: "A group dedicated to contemporary fiction and literary novels.",
      members: 12,
      admin: true,
      currentBook: "The Midnight Library",
      nextMeeting: "May 9, 2025",
    },
    {
      id: 2,
      name: "Sci-Fi Enthusiasts",
      description: "Exploring the best of science fiction from classic to modern.",
      members: 8,
      admin: false,
      currentBook: "Project Hail Mary",
      nextMeeting: "May 15, 2025",
    },
  ]

  const discoverCircles = [
    {
      id: 3,
      name: "Classic Literature",
      description: "Discussing timeless classics and their relevance today.",
      members: 15,
      currentBook: "Pride and Prejudice",
    },
    {
      id: 4,
      name: "Mystery Readers",
      description: "For fans of detective novels, thrillers, and whodunits.",
      members: 10,
      currentBook: "The Silent Patient",
    },
    {
      id: 5,
      name: "Fantasy Worlds",
      description: "Exploring magical realms and epic fantasy series.",
      members: 18,
      currentBook: "The Name of the Wind",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reading Circles</h1>
          <p className="text-muted-foreground">Join or create reading circles to connect with other book lovers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-light">
                <Plus className="mr-2 h-4 w-4" /> Create Circle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create a Reading Circle</DialogTitle>
                <DialogDescription>Start a new reading circle and invite friends to join.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="circle-name">Circle Name</Label>
                  <Input id="circle-name" placeholder="Enter a name for your circle" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="What kind of books will your circle focus on?" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="privacy">Privacy</Label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="public" name="privacy" className="form-radio" />
                      <Label htmlFor="public">Public</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="private" name="privacy" className="form-radio" />
                      <Label htmlFor="private">Private</Label>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="current-book">Current Book (Optional)</Label>
                  <Input id="current-book" placeholder="What book is your circle currently reading?" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invite">Invite Members (Optional)</Label>
                  <Input id="invite" placeholder="Enter email addresses, separated by commas" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary-light">
                  Create Circle
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reading circles..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="my-circles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-circles">My Circles</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="my-circles" className="space-y-6">
          {myCircles.map((circle) => (
            <Card key={circle.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {circle.name}
                      {circle.admin && (
                        <Badge variant="outline" className="ml-2">
                          Admin
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{circle.description}</CardDescription>
                  </div>
                  {circle.admin && (
                    <Button variant="ghost" size="icon" className="mt-2 md:mt-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Members</p>
                      <p className="text-sm text-muted-foreground">{circle.members} people</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Current Book</p>
                      <p className="text-sm text-muted-foreground">{circle.currentBook}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Next Meeting</p>
                      <p className="text-sm text-muted-foreground">{circle.nextMeeting}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-medium mb-2">Members</p>
                  <div className="flex flex-wrap gap-2">
                    {[...Array(Math.min(8, circle.members))].map((_, i) => (
                      <Avatar key={i} className="h-8 w-8">
                        <AvatarImage src={`/placeholder.svg?height=32&width=32&text=${i + 1}`} alt="Member" />
                        <AvatarFallback
                          className={
                            i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                          }
                        >
                          {String.fromCharCode(65 + i)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {circle.members > 8 && (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
                        +{circle.members - 8}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">View Activity</Button>
                <Button className="bg-primary hover:bg-primary-light">Enter Circle</Button>
              </CardFooter>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="discover" className="space-y-6">
          {discoverCircles.map((circle) => (
            <Card key={circle.id}>
              <CardHeader className="pb-2">
                <CardTitle>{circle.name}</CardTitle>
                <CardDescription>{circle.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Members</p>
                      <p className="text-sm text-muted-foreground">{circle.members} people</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Current Book</p>
                      <p className="text-sm text-muted-foreground">{circle.currentBook}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-primary hover:bg-primary-light">Join Circle</Button>
              </CardFooter>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
