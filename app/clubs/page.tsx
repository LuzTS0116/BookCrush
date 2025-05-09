"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CalendarDays, Plus, Search, Settings, Users, BookMarked, Clock } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function ClubsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Sample clubs data
  const myClubs = [
    {
      id: 1,
      name: "Fiction Lovers",
      description: "A group dedicated to contemporary fiction and literary novels.",
      members: 12,
      admin: true,
      currentBook: {
        title: "The Midnight Library",
        author: "Matt Haig",
        cover: "/placeholder.svg?height=200&width=150",
      },
      nextMeeting: "May 9, 2025",
      history: [
        {
          title: "The Song of Achilles",
          author: "Madeline Miller",
          date: "April 2025",
          cover: "/placeholder.svg?height=200&width=150",
        },
        {
          title: "Circe",
          author: "Madeline Miller",
          date: "March 2025",
          cover: "/placeholder.svg?height=200&width=150",
        },
        {
          title: "The Vanishing Half",
          author: "Brit Bennett",
          date: "February 2025",
          cover: "/placeholder.svg?height=200&width=150",
        },
      ],
    },
    {
      id: 2,
      name: "Sci-Fi Enthusiasts",
      description: "Exploring the best of science fiction from classic to modern.",
      members: 8,
      admin: false,
      currentBook: {
        title: "Project Hail Mary",
        author: "Andy Weir",
        cover: "/placeholder.svg?height=200&width=150",
      },
      nextMeeting: "May 15, 2025",
      history: [
        {
          title: "Klara and the Sun",
          author: "Kazuo Ishiguro",
          date: "April 2025",
          cover: "/placeholder.svg?height=200&width=150",
        },
        {
          title: "The Three-Body Problem",
          author: "Liu Cixin",
          date: "March 2025",
          cover: "/placeholder.svg?height=200&width=150",
        },
      ],
    },
  ]

  const discoverClubs = [
    {
      id: 3,
      name: "Classic Literature",
      description: "Discussing timeless classics and their relevance today.",
      members: 15,
      currentBook: {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        cover: "/placeholder.svg?height=200&width=150",
      },
    },
    {
      id: 4,
      name: "Mystery Readers",
      description: "For fans of detective novels, thrillers, and whodunits.",
      members: 10,
      currentBook: {
        title: "The Silent Patient",
        author: "Alex Michaelides",
        cover: "/placeholder.svg?height=200&width=150",
      },
    },
    {
      id: 5,
      name: "Fantasy Worlds",
      description: "Exploring magical realms and epic fantasy series.",
      members: 18,
      currentBook: {
        title: "The Name of the Wind",
        author: "Patrick Rothfuss",
        cover: "/placeholder.svg?height=200&width=150",
      },
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reading Clubs</h1>
          <p className="text-muted-foreground">Join or create reading clubs to connect with other book lovers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-light text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Create Club
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create a Reading Club</DialogTitle>
                <DialogDescription>Start a new reading club and invite friends to join.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="club-name">Club Name</Label>
                  <Input id="club-name" placeholder="Enter a name for your club" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="What kind of books will your club focus on?" />
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
                  <Select>
                    <SelectTrigger id="current-book">
                      <SelectValue placeholder="Select a book" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="midnight-library">The Midnight Library</SelectItem>
                      <SelectItem value="klara-sun">Klara and the Sun</SelectItem>
                      <SelectItem value="project-hail-mary">Project Hail Mary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invite">Invite Members (Optional)</Label>
                  <Input id="invite" placeholder="Enter email addresses, separated by commas" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary-light text-primary-foreground">
                  Create Club
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reading clubs..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="my-clubs" className="space-y-4">
        <TabsList className="bg-muted text-muted-foreground">
          <TabsTrigger
            value="my-clubs"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            My Clubs
          </TabsTrigger>
          <TabsTrigger
            value="discover"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-clubs" className="space-y-6">
          {myClubs.map((club) => (
            <Card key={club.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {club.name}
                      {club.admin && (
                        <Badge variant="outline" className="ml-2">
                          Admin
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{club.description}</CardDescription>
                  </div>
                  {club.admin && (
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
                      <p className="text-sm text-muted-foreground">{club.members} people</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Current Book</p>
                      <p className="text-sm text-muted-foreground">{club.currentBook.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Next Meeting</p>
                      <p className="text-sm text-muted-foreground">{club.nextMeeting}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <p className="text-sm font-medium mb-2">Current Book</p>
                    <div className="bg-muted/30 p-3 rounded-lg flex gap-3">
                      <div className="w-16 h-24 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                        <img
                          src={club.currentBook.cover || "/placeholder.svg"}
                          alt={`${club.currentBook.title} cover`}
                          className="max-h-full"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{club.currentBook.title}</p>
                        <p className="text-xs text-muted-foreground">{club.currentBook.author}</p>
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Meeting in 3 days</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="book-history">
                        <AccordionTrigger className="text-sm font-medium">Book History</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            {club.history.map((book, i) => (
                              <div key={i} className="flex gap-3 items-center">
                                <div className="w-10 h-14 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                                  <img
                                    src={book.cover || "/placeholder.svg"}
                                    alt={`${book.title} cover`}
                                    className="max-h-full"
                                  />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{book.title}</p>
                                  <p className="text-xs text-muted-foreground">{book.author}</p>
                                  <p className="text-xs text-muted-foreground">{book.date}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-medium mb-2">Members</p>
                  <div className="flex flex-wrap gap-2">
                    {[...Array(Math.min(8, club.members))].map((_, i) => (
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
                    {club.members > 8 && (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
                        +{club.members - 8}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button variant="outline">View Activity</Button>
                <Button className="bg-primary hover:bg-primary-light text-primary-foreground">Enter Club</Button>
                {club.admin && (
                  <>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <BookMarked className="mr-2 h-4 w-4" /> Set New Book
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Set New Book for Club</DialogTitle>
                          <DialogDescription>Select the next book for your club to read.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="book">Select Book</Label>
                            <Select>
                              <SelectTrigger id="book">
                                <SelectValue placeholder="Choose a book" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="midnight-library">The Midnight Library</SelectItem>
                                <SelectItem value="klara-sun">Klara and the Sun</SelectItem>
                                <SelectItem value="project-hail-mary">Project Hail Mary</SelectItem>
                                <SelectItem value="song-achilles">The Song of Achilles</SelectItem>
                                <SelectItem value="circe">Circe</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="meeting-date">Next Meeting Date</Label>
                            <Input id="meeting-date" type="date" />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="meeting-time">Meeting Time</Label>
                            <Input id="meeting-time" type="time" />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea id="notes" placeholder="Any notes about this book selection" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="bg-primary hover:bg-primary-light text-primary-foreground">
                            Set Book & Schedule Meeting
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <CalendarDays className="mr-2 h-4 w-4" /> Complete Meeting
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Complete Book Meeting</DialogTitle>
                          <DialogDescription>
                            Mark the current book as completed and add it to history.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="flex gap-3 items-center p-3 bg-muted/30 rounded-lg">
                            <div className="w-16 h-24 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                              <img
                                src={club.currentBook.cover || "/placeholder.svg"}
                                alt={`${club.currentBook.title} cover`}
                                className="max-h-full"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{club.currentBook.title}</p>
                              <p className="text-xs text-muted-foreground">{club.currentBook.author}</p>
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="rating">Club Rating (1-5)</Label>
                            <Select>
                              <SelectTrigger id="rating">
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 - Poor</SelectItem>
                                <SelectItem value="2">2 - Fair</SelectItem>
                                <SelectItem value="3">3 - Good</SelectItem>
                                <SelectItem value="4">4 - Very Good</SelectItem>
                                <SelectItem value="5">5 - Excellent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="discussion-notes">Discussion Notes</Label>
                            <Textarea
                              id="discussion-notes"
                              placeholder="Summarize the key points from your discussion"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="next-steps">Set Next Book</Label>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id="set-next-book" className="form-checkbox" />
                              <Label htmlFor="set-next-book">Schedule next book selection</Label>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="bg-primary hover:bg-primary-light text-primary-foreground">
                            Complete & Archive
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="discover" className="space-y-6">
          {discoverClubs.map((club) => (
            <Card key={club.id}>
              <CardHeader className="pb-2">
                <CardTitle>{club.name}</CardTitle>
                <CardDescription>{club.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Members</p>
                      <p className="text-sm text-muted-foreground">{club.members} people</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Current Book</p>
                      <p className="text-sm text-muted-foreground">{club.currentBook.title}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-medium mb-2">Current Book</p>
                  <div className="bg-muted/30 p-3 rounded-lg flex gap-3">
                    <div className="w-16 h-24 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                      <img
                        src={club.currentBook.cover || "/placeholder.svg"}
                        alt={`${club.currentBook.title} cover`}
                        className="max-h-full"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{club.currentBook.title}</p>
                      <p className="text-xs text-muted-foreground">{club.currentBook.author}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-primary hover:bg-primary-light text-primary-foreground">Join Club</Button>
              </CardFooter>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
