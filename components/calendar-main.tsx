"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CalendarDays, Clock, Plus, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function CalendarMain() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  // Sample meeting data
  const meetings = [
    {
      id: 1,
      title: "Monthly Book Club Meeting",
      date: "May 9, 2025",
      time: "7:00 PM - 9:00 PM",
      book: "The Midnight Library",
      circle: "Fiction Lovers",
      attendees: 8,
      location: "Virtual (Zoom)",
    },
    {
      id: 2,
      title: "Sci-Fi Book Discussion",
      date: "May 15, 2025",
      time: "6:30 PM - 8:00 PM",
      book: "Project Hail Mary",
      circle: "Sci-Fi Enthusiasts",
      attendees: 6,
      location: "Coffee House, 123 Main St",
    },
    {
      id: 3,
      title: "Author Q&A Session",
      date: "May 22, 2025",
      time: "5:00 PM - 6:30 PM",
      book: "Klara and the Sun",
      circle: "Fiction Lovers",
      attendees: 12,
      location: "Virtual (Zoom)",
    },
  ]

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-6 pb-20 md:pb-6">
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
                <p className="text-muted-foreground">Schedule and manage your book club meetings.</p>
                </div>
                <div className="flex items-center gap-2">
                <Dialog>
                    <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary-light">
                        <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
                    </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Schedule a Book Club Meeting</DialogTitle>
                        <DialogDescription>Fill in the details to schedule a new book club meeting.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                        <Label htmlFor="title">Meeting Title</Label>
                        <Input id="title" placeholder="Enter meeting title" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" type="date" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="time">Time</Label>
                            <Input id="time" type="time" />
                        </div>
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="book">Book</Label>
                        <Select>
                            <SelectTrigger id="book">
                            <SelectValue placeholder="Select book" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="midnight-library">The Midnight Library</SelectItem>
                            <SelectItem value="klara-sun">Klara and the Sun</SelectItem>
                            <SelectItem value="project-hail-mary">Project Hail Mary</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="circle">Reading Circle</Label>
                        <Select>
                            <SelectTrigger id="circle">
                            <SelectValue placeholder="Select circle" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="fiction-lovers">Fiction Lovers</SelectItem>
                            <SelectItem value="sci-fi">Sci-Fi Enthusiasts</SelectItem>
                            <SelectItem value="classics">Classic Literature</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" placeholder="Virtual (Zoom) or physical address" />
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Enter meeting details, discussion points, etc." />
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="notification">Send Notification</Label>
                        <Select defaultValue="both">
                            <SelectTrigger id="notification">
                            <SelectValue placeholder="Select notification method" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="app">App Notification</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="bg-primary hover:bg-primary-light">
                        Schedule Meeting
                        </Button>
                    </DialogFooter>
                    </DialogContent>
                </Dialog>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                <Card>
                <CardHeader>
                    <CardTitle>Calendar</CardTitle>
                    <CardDescription>Select a date to view meetings</CardDescription>
                </CardHeader>
                <CardContent>
                    <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
                </CardContent>
                </Card>

                <div className="space-y-6">
                <Card>
                    <CardHeader>
                    <CardTitle>Upcoming Meetings</CardTitle>
                    <CardDescription>Your scheduled book club meetings</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="space-y-6">
                        {meetings.map((meeting) => (
                        <div key={meeting.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border">
                            <div className="md:w-1/4 flex flex-col justify-center items-center bg-primary/10 rounded-lg p-4">
                            <CalendarDays className="h-8 w-8 text-primary mb-2" />
                            <p className="font-bold text-center">{meeting.date}</p>
                            <p className="text-sm text-muted-foreground text-center">{meeting.time}</p>
                            </div>

                            <div className="md:w-3/4">
                            <div className="flex flex-col md:flex-row justify-between mb-2">
                                <h3 className="font-bold text-lg">{meeting.title}</h3>
                                <Badge variant="outline" className="w-fit">
                                {meeting.circle}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{meeting.book}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{meeting.attendees} attendees</span>
                                </div>
                                <div className="flex items-center gap-2 md:col-span-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{meeting.location}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1">
                                {[...Array(Math.min(5, meeting.attendees))].map((_, i) => (
                                <Avatar key={i} className="h-8 w-8">
                                    <AvatarImage src={`/placeholder.svg?height=32&width=32&text=${i + 1}`} alt="Attendee" />
                                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                                    {String.fromCharCode(65 + i)}
                                    </AvatarFallback>
                                </Avatar>
                                ))}
                                {meeting.attendees > 5 && (
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
                                    +{meeting.attendees - 5}
                                </div>
                                )}
                            </div>
                            </div>
                        </div>
                        ))}
                    </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                    <CardTitle>Past Meetings</CardTitle>
                    <CardDescription>Review your previous book club discussions</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border opacity-70">
                        <div className="md:w-1/4 flex flex-col justify-center items-center bg-muted rounded-lg p-4">
                            <CalendarDays className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="font-bold text-center">April 25, 2025</p>
                            <p className="text-sm text-muted-foreground text-center">7:00 PM - 9:00 PM</p>
                        </div>

                        <div className="md:w-3/4">
                            <div className="flex flex-col md:flex-row justify-between mb-2">
                            <h3 className="font-bold text-lg">Fiction Lovers Monthly Meeting</h3>
                            <Badge variant="outline" className="w-fit">
                                Fiction Lovers
                            </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">The Song of Achilles</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">10 attendees</span>
                            </div>
                            <div className="flex items-center gap-2 md:col-span-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Virtual (Zoom)</span>
                            </div>
                            </div>

                            <Button variant="outline" size="sm">
                            View Notes
                            </Button>
                        </div>
                        </div>
                    </div>
                    </CardContent>
                </Card>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
