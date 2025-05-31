"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CalendarDays, Clock, Plus, Users, Loader2 } from "lucide-react"
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
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface ClubMeeting {
  id: string;
  title: string;
  description?: string;
  date: string;
  duration_minutes?: number;
  location?: string;
  meeting_type: string;
  status: string;
  club: {
    id: string;
    name: string;
  };
  book?: {
    id: string;
    title: string;
    author?: string;
    cover_url?: string;
  };
  creator: {
    id: string;
    display_name: string;
  };
  attendees_count: number;
  user_attendance_status: string;
  is_creator: boolean;
}

interface UserClub {
  id: string;
  name: string;
  role: string;
  books?: Array<{
    id: string;
    title: string;
    author?: string;
  }>;
}

export default function CalendarMain() {
  const { data: session } = useSession();
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [meetings, setMeetings] = useState<ClubMeeting[]>([])
  const [userClubs, setUserClubs] = useState<UserClub[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingMeeting, setCreatingMeeting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meeting_date: '',
    meeting_time: '',
    duration_minutes: 90,
    location: '',
    meeting_type: 'DISCUSSION',
    club_id: '',
    book_id: ''
  })

  // Fetch meetings
  const fetchMeetings = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/meetings');
      if (!response.ok) {
        throw new Error('Failed to fetch meetings');
      }
      const data = await response.json();
      setMeetings(data.meetings || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    }
  }, [session?.user?.id]);

  // Fetch user's clubs where they are admin/owner
  const fetchUserClubs = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/clubs/my-clubs', {
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch clubs');
      }
      const data = await response.json();
      // Filter clubs where user is admin or owner
      const adminClubs = data.filter((club: any) => 
        club.role === 'ADMIN' || club.role === 'OWNER' || club.admin
      );
      
      // Fetch books for each club if needed
      const clubsWithBooks = await Promise.all(
        adminClubs.map(async (club: any) => {
          try {
            const booksResponse = await fetch(`/api/clubs/${club.id}/books`);
            if (booksResponse.ok) {
              const booksData = await booksResponse.json();
              return { ...club, books: booksData.books || [] };
            }
            return { ...club, books: [] };
          } catch (error) {
            console.error(`Error fetching books for club ${club.id}:`, error);
            return { ...club, books: [] };
          }
        })
      );
      
      setUserClubs(clubsWithBooks);
    } catch (error) {
      console.error('Error fetching user clubs:', error);
      toast.error('Failed to load your clubs');
    }
  }, [session?.user?.id, session?.supabaseAccessToken]);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (session?.user?.id) {
        setLoading(true);
        await Promise.all([fetchMeetings(), fetchUserClubs()]);
        setLoading(false);
      }
    };
    loadData();
  }, [session?.user?.id, fetchMeetings, fetchUserClubs]);

  // Handle form submission
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.club_id || !formData.title || !formData.meeting_date || !formData.meeting_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreatingMeeting(true);
    try {
      const meetingDateTime = new Date(`${formData.meeting_date}T${formData.meeting_time}`);
      
      const response = await fetch(`/api/clubs/${formData.club_id}/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          meeting_date: meetingDateTime.toISOString(),
          duration_minutes: formData.duration_minutes,
          location: formData.location,
          meeting_type: formData.meeting_type,
          book_id: formData.book_id || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create meeting');
      }

      toast.success('Meeting scheduled successfully!');
      setIsDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        meeting_date: '',
        meeting_time: '',
        duration_minutes: 90,
        location: '',
        meeting_type: 'DISCUSSION',
        club_id: '',
        book_id: ''
      });
      
      // Refresh meetings
      await fetchMeetings();
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      toast.error(error.message || 'Failed to create meeting');
    } finally {
      setCreatingMeeting(false);
    }
  };

  // Helper function to format date and time
  const formatMeetingDateTime = (dateString: string, duration?: number) => {
    const date = new Date(dateString);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (duration) {
      const endTime = new Date(date.getTime() + duration * 60000);
      const endTimeString = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${timeString} - ${endTimeString}`;
    }
    
    return timeString;
  };

  // Separate upcoming and past meetings
  const now = new Date();
  const upcomingMeetings = meetings.filter(meeting => new Date(meeting.date) >= now);
  const pastMeetings = meetings.filter(meeting => new Date(meeting.date) < now);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading calendar...</span>
        </div>
      </div>
    );
  }

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
              {userClubs.length > 0 ? (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                    <form onSubmit={handleCreateMeeting}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="club">Club *</Label>
                          <Select 
                            value={formData.club_id} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, club_id: value, book_id: '' }))}
                          >
                            <SelectTrigger id="club">
                              <SelectValue placeholder="Select club" />
                            </SelectTrigger>
                            <SelectContent>
                              {userClubs.map(club => (
                                <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="title">Meeting Title *</Label>
                          <Input 
                            id="title" 
                            placeholder="Enter meeting title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="date">Date *</Label>
                            <Input 
                              id="date" 
                              type="date"
                              value={formData.meeting_date}
                              onChange={(e) => setFormData(prev => ({ ...prev, meeting_date: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="time">Time *</Label>
                            <Input 
                              id="time" 
                              type="time"
                              value={formData.meeting_time}
                              onChange={(e) => setFormData(prev => ({ ...prev, meeting_time: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="duration">Duration (minutes)</Label>
                          <Select 
                            value={formData.duration_minutes.toString()} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
                          >
                            <SelectTrigger id="duration">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="90">1.5 hours</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                              <SelectItem value="150">2.5 hours</SelectItem>
                              <SelectItem value="180">3 hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="meeting_type">Meeting Type</Label>
                          <Select 
                            value={formData.meeting_type} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, meeting_type: value }))}
                          >
                            <SelectTrigger id="meeting_type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DISCUSSION">Book Discussion</SelectItem>
                              <SelectItem value="BOOK_SELECTION">Book Selection</SelectItem>
                              <SelectItem value="AUTHOR_QA">Author Q&A</SelectItem>
                              <SelectItem value="SOCIAL">Social Meeting</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {formData.club_id && userClubs.find(c => c.id === formData.club_id)?.books && (
                          <div className="grid gap-2">
                            <Label htmlFor="book">Book (Optional)</Label>
                            <Select 
                              value={formData.book_id} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, book_id: value }))}
                            >
                              <SelectTrigger id="book">
                                <SelectValue placeholder="Select book (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">No specific book</SelectItem>
                                {userClubs.find(c => c.id === formData.club_id)?.books?.map(book => (
                                  <SelectItem key={book.id} value={book.id}>
                                    {book.title} {book.author && `by ${book.author}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        <div className="grid gap-2">
                          <Label htmlFor="location">Location</Label>
                          <Input 
                            id="location" 
                            placeholder="Virtual (Zoom) or physical address"
                            value={formData.location}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea 
                            id="description" 
                            placeholder="Enter meeting details, discussion points, etc."
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-primary hover:bg-primary-light" disabled={creatingMeeting}>
                          {creatingMeeting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Schedule Meeting'
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="text-sm text-muted-foreground">
                  You need to be an admin or owner of a club to schedule meetings.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Select a date to view meetings</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar 
                  mode="single" 
                  selected={date} 
                  onSelect={setDate} 
                  className="rounded-md border" 
                />
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
                    {upcomingMeetings.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No upcoming meetings scheduled.</p>
                    ) : (
                      upcomingMeetings.map((meeting) => (
                        <div key={meeting.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border">
                          <div className="md:w-1/4 flex flex-col justify-center items-center bg-primary/10 rounded-lg p-4">
                            <CalendarDays className="h-8 w-8 text-primary mb-2" />
                            <p className="font-bold text-center">{new Date(meeting.date).toLocaleDateString()}</p>
                            <p className="text-sm text-muted-foreground text-center">
                              {formatMeetingDateTime(meeting.date, meeting.duration_minutes)}
                            </p>
                          </div>

                          <div className="md:w-3/4">
                            <div className="flex flex-col md:flex-row justify-between mb-2">
                              <h3 className="font-bold text-lg">{meeting.title}</h3>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="w-fit">
                                  {meeting.club.name}
                                </Badge>
                                <Badge variant="secondary" className="w-fit">
                                  {meeting.meeting_type.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>

                            {meeting.description && (
                              <p className="text-sm text-muted-foreground mb-3">{meeting.description}</p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                              {meeting.book && (
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{meeting.book.title}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{meeting.attendees_count} attending</span>
                              </div>
                              {meeting.location && (
                                <div className="flex items-center gap-2 md:col-span-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{meeting.location}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                Created by {meeting.creator.display_name}
                              </p>
                              <Badge 
                                variant={meeting.user_attendance_status === 'ATTENDING' ? 'default' : 'outline'}
                                className="text-xs"
                              >
                                {meeting.user_attendance_status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {pastMeetings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Past Meetings</CardTitle>
                    <CardDescription>Review your previous book club discussions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {pastMeetings.slice(0, 3).map((meeting) => (
                        <div key={meeting.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border opacity-70">
                          <div className="md:w-1/4 flex flex-col justify-center items-center bg-muted rounded-lg p-4">
                            <CalendarDays className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="font-bold text-center">{new Date(meeting.date).toLocaleDateString()}</p>
                            <p className="text-sm text-muted-foreground text-center">
                              {formatMeetingDateTime(meeting.date, meeting.duration_minutes)}
                            </p>
                          </div>

                          <div className="md:w-3/4">
                            <div className="flex flex-col md:flex-row justify-between mb-2">
                              <h3 className="font-bold text-lg">{meeting.title}</h3>
                              <Badge variant="outline" className="w-fit">
                                {meeting.club.name}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                              {meeting.book && (
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{meeting.book.title}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{meeting.attendees_count} attended</span>
                              </div>
                              {meeting.location && (
                                <div className="flex items-center gap-2 md:col-span-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{meeting.location}</span>
                                </div>
                              )}
                            </div>

                            <Button variant="outline" size="sm">
                              View Notes
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
