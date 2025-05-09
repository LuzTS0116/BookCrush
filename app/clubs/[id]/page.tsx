"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CalendarDays, Plus, Settings, MessageSquare, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

export default function ClubDetailPage({ params }: { params: { id: string } }) {
  const [comment, setComment] = useState("")

  // Mock data for a specific club
  const club = {
    id: params.id,
    name: "Fiction Lovers",
    description: "A group dedicated to contemporary fiction and literary novels.",
    members: 12,
    admin: true,
    currentBook: {
      title: "The Midnight Library",
      author: "Matt Haig",
      cover: "/placeholder.svg?height=200&width=150",
      progress: 65,
      meetingDate: "May 9, 2025",
      meetingTime: "7:00 PM",
      description:
        "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be if you had made other choices... Would you have done anything different, if you had the chance to undo your regrets?",
    },
    history: [
      {
        title: "The Song of Achilles",
        author: "Madeline Miller",
        date: "April 2025",
        cover: "/placeholder.svg?height=200&width=150",
        rating: 4.5,
        notes:
          "The group enjoyed the retelling of the Iliad from Patroclus's perspective. Discussion focused on themes of fate, love, and the cost of immortality.",
      },
      {
        title: "Circe",
        author: "Madeline Miller",
        date: "March 2025",
        cover: "/placeholder.svg?height=200&width=150",
        rating: 4.2,
        notes:
          "Members appreciated the feminist perspective on Greek mythology. The character development of Circe was particularly praised.",
      },
      {
        title: "The Vanishing Half",
        author: "Brit Bennett",
        date: "February 2025",
        cover: "/placeholder.svg?height=200&width=150",
        rating: 4.7,
        notes:
          "Powerful discussions about identity, race, and family. The narrative structure spanning decades was highlighted as particularly effective.",
      },
    ],
    discussions: [
      {
        user: {
          name: "Alex Lee",
          avatar: "/placeholder.svg?height=40&width=40",
          initials: "AL",
        },
        text: "I'm about halfway through and loving the concept. The idea of a library between life and death is so creative!",
        timestamp: "2 days ago",
      },
      {
        user: {
          name: "Sarah Johnson",
          avatar: "/placeholder.svg?height=40&width=40",
          initials: "SJ",
        },
        text: "The way Matt Haig explores regret and alternate lives is really making me think about my own choices. Can't wait to discuss this at our meeting.",
        timestamp: "Yesterday",
      },
      {
        user: {
          name: "Jane Doe",
          avatar: "/placeholder.svg?height=40&width=40",
          initials: "JD",
        },
        text: "Just finished chapter 15. The scene with her father was so moving. Anyone else tear up at that part?",
        timestamp: "5 hours ago",
      },
    ],
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{club.name}</h1>
            {club.admin && (
              <Badge variant="outline" className="ml-2">
                Admin
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{club.description}</p>
        </div>
        {club.admin && (
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Book</CardTitle>
              <CardDescription>What we're currently reading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-32 h-48 bg-muted/30 rounded-md flex items-center justify-center overflow-hidden mx-auto md:mx-0">
                  <img
                    src={club.currentBook.cover || "/placeholder.svg"}
                    alt={`${club.currentBook.title} cover`}
                    className="max-h-full"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{club.currentBook.title}</h3>
                  <p className="text-muted-foreground">{club.currentBook.author}</p>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Club Progress</span>
                      <span className="font-medium">{club.currentBook.progress}%</span>
                    </div>
                    <Progress value={club.currentBook.progress} className="h-2 bg-muted" />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Meeting Date</p>
                        <p className="text-sm text-muted-foreground">{club.currentBook.meetingDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Meeting Time</p>
                        <p className="text-sm text-muted-foreground">{club.currentBook.meetingTime}</p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm">{club.currentBook.description}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                <BookOpen className="mr-2 h-4 w-4" /> Update Progress
              </Button>
              {club.admin && (
                <Button className="bg-primary hover:bg-primary-light text-primary-foreground">
                  <CalendarDays className="mr-2 h-4 w-4" /> Manage Meeting
                </Button>
              )}
            </CardFooter>
          </Card>

          <div className="mt-6">
            <Tabs defaultValue="discussions" className="space-y-4">
              <TabsList className="bg-muted text-muted-foreground">
                <TabsTrigger
                  value="discussions"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Discussions
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Book History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="discussions">
                <Card>
                  <CardHeader>
                    <CardTitle>Book Discussions</CardTitle>
                    <CardDescription>Share your thoughts on the current book</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {club.discussions.map((discussion, i) => (
                        <div key={i} className="flex gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={discussion.user.avatar || "/placeholder.svg"}
                              alt={discussion.user.name}
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {discussion.user.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{discussion.user.name}</p>
                              <p className="text-xs text-muted-foreground">{discussion.timestamp}</p>
                            </div>
                            <p className="text-sm mt-1">{discussion.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-6" />

                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg?height=40&width=40" alt="You" />
                        <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Share your thoughts on the book..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <Button className="bg-primary hover:bg-primary-light text-primary-foreground">
                          <MessageSquare className="mr-2 h-4 w-4" /> Post Comment
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Book History</CardTitle>
                    <CardDescription>Books we've read in the past</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {club.history.map((book, i) => (
                        <div key={i} className="flex flex-col md:flex-row gap-4 p-4 bg-muted/20 rounded-lg">
                          <div className="w-24 h-36 bg-muted/30 rounded-md flex items-center justify-center overflow-hidden mx-auto md:mx-0">
                            <img
                              src={book.cover || "/placeholder.svg"}
                              alt={`${book.title} cover`}
                              className="max-h-full"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row justify-between">
                              <div>
                                <h3 className="text-lg font-bold">{book.title}</h3>
                                <p className="text-sm text-muted-foreground">{book.author}</p>
                              </div>
                              <div className="flex items-center gap-1 mt-2 md:mt-0">
                                <span className="text-sm font-medium">Rating:</span>
                                <span className="text-sm text-accent">{book.rating}/5</span>
                              </div>
                            </div>
                            <p className="text-sm mt-2 text-muted-foreground">Read in {book.date}</p>
                            <p className="text-sm mt-2">{book.notes}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Club Members</CardTitle>
              <CardDescription>{club.members} members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(Math.min(6, club.members))].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`/placeholder.svg?height=32&width=32&text=${i + 1}`} alt="Member" />
                      <AvatarFallback
                        className={
                          i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                        }
                      >
                        {String.fromCharCode(65 + i)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {["Jane Doe", "Alex Lee", "Sarah Johnson", "Mike Peterson", "Emma Wilson", "David Kim"][i]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {i === 0
                          ? "Admin"
                          : ["65% progress", "42% progress", "100% progress", "30% progress", "78% progress"][i - 1]}
                      </p>
                    </div>
                  </div>
                ))}

                {club.members > 6 && (
                  <Button variant="outline" className="w-full text-sm">
                    View All Members
                  </Button>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-primary hover:bg-primary-light text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Invite Members
              </Button>
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Upcoming Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{club.currentBook.title}</h3>
                    <Badge variant="outline">Next</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>{club.currentBook.meetingDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Clock className="h-4 w-4" />
                    <span>{club.currentBook.meetingTime}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
