"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { BookOpen, CalendarDays, Clock, Plus, Users, Loader2, MapPin, Link2 } from "lucide-react"
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
import { CustomTimePicker } from "@/components/CustomTimePicker"

interface ClubMeeting {
  id: string;
  title: string;
  description?: string;
  date: string;
  duration_minutes?: number;
  location?: string;
  meeting_mode: string;
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
  current_book?: {
    id: string;
    title: string;
    author?: string;
  };
  books?: Array<{
    id: string;
    title: string;
    author?: string;
  }>;
}

// Extend the session type to include our custom properties
interface ExtendedSession {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  supabaseAccessToken?: string;
}

export default function CalendarMain() {
  const { data: session } = useSession() as { data: ExtendedSession | null };
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [meetings, setMeetings] = useState<ClubMeeting[]>([])
  const [userClubs, setUserClubs] = useState<UserClub[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingMeeting, setCreatingMeeting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<ClubMeeting | null>(null)
  const [updatingMeeting, setUpdatingMeeting] = useState(false)
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meeting_date: '',
    meeting_time: '',
    duration_minutes: 90,
    location: '',
    meeting_mode: 'IN_PERSON',
    meeting_type: 'DISCUSSION',
    club_id: '',
    book_id: ''
  })

  // Fetch meetings
  const fetchMeetings = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/meetings', {
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`
        }
      });
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
    //   const clubsWithBooks = await Promise.all(
    //     adminClubs.map(async (club: any) => {
    //       try {
    //         const booksResponse = await fetch(`/api/clubs/${club.id}/books`);
    //         if (booksResponse.ok) {
    //           const booksData = await booksResponse.json();
    //           return { ...club, books: booksData.books || [] };
    //         }
    //         return { ...club, books: [] };
    //       } catch (error) {
    //         console.error(`Error fetching books for club ${club.id}:`, error);
    //         return { ...club, books: [] };
    //       }
    //     })
    //   );
      
      setUserClubs(adminClubs);
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
          meeting_mode: formData.meeting_mode,
          meeting_type: formData.meeting_type,
          book_id: formData.book_id === 'none' ? null : formData.book_id || null
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
        meeting_mode: 'IN_PERSON',
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

  // Handle opening edit dialog
  const handleEditMeeting = (meeting: ClubMeeting) => {
    setEditingMeeting(meeting);
    
    // Pre-populate form with existing meeting data
    const meetingDate = new Date(meeting.date);
    const dateString = meetingDate.toISOString().split('T')[0];
    const timeString = meetingDate.toTimeString().slice(0, 5);
    
    setFormData({
      title: meeting.title || '',
      description: meeting.description || '',
      meeting_date: dateString,
      meeting_time: timeString,
      duration_minutes: meeting.duration_minutes || 90,
      location: meeting.location || '',
      meeting_mode: meeting.meeting_mode || 'IN_PERSON',
      meeting_type: meeting.meeting_type,
      club_id: meeting.club.id,
      book_id: meeting.book?.id || ''
    });
    
    setIsEditDialogOpen(true);
  };

  // Handle updating meeting
  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting || !formData.club_id || !formData.title || !formData.meeting_date || !formData.meeting_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUpdatingMeeting(true);
    try {
      const meetingDateTime = new Date(`${formData.meeting_date}T${formData.meeting_time}`);
      
      const response = await fetch(`/api/clubs/${formData.club_id}/meetings/${editingMeeting.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          meeting_date: meetingDateTime.toISOString(),
          duration_minutes: formData.duration_minutes,
          location: formData.location,
          meeting_mode: formData.meeting_mode,
          meeting_type: formData.meeting_type,
          book_id: formData.book_id === 'none' ? null : formData.book_id || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update meeting');
      }

      toast.success('Meeting updated successfully!');
      setIsEditDialogOpen(false);
      setEditingMeeting(null);
      setFormData({
        title: '',
        description: '',
        meeting_date: '',
        meeting_time: '',
        duration_minutes: 90,
        location: '',
        meeting_mode: 'IN_PERSON',
        meeting_type: 'DISCUSSION',
        club_id: '',
        book_id: ''
      });
      
      // Refresh meetings
      await fetchMeetings();
    } catch (error: any) {
      console.error('Error updating meeting:', error);
      toast.error(error.message || 'Failed to update meeting');
    } finally {
      setUpdatingMeeting(false);
    }
  };

  // Handle deleting meeting
  const handleDeleteMeeting = async (meeting: ClubMeeting) => {
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to cancel "${meeting.title}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingMeetingId(meeting.id);
    try {
      const response = await fetch(`/api/clubs/${meeting.club.id}/meetings/${meeting.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel meeting');
      }

      toast.success('Meeting cancelled successfully!');
      
      // Refresh meetings
      await fetchMeetings();
    } catch (error: any) {
      console.error('Error cancelling meeting:', error);
      toast.error(error.message || 'Failed to cancel meeting');
    } finally {
      setDeletingMeetingId(null);
    }
  };

  const meetingDates = React.useMemo(
    () => meetings.map((m) => new Date(m.date)),
    [meetings]
  )

  const meetingsForSelectedDate = meetings.filter((m) => {
    const meetingDate = new Date(m.date);
    return date?.toDateString() === meetingDate.toDateString();
  });

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

  // Days until meeting
  const getMeetingCountdown = (meetingDate: string | Date): { show: boolean; message: string } => {
    try {
      const meetingTime = new Date(meetingDate).getTime();
      const currentTime = new Date().getTime();
      const daysUntil = Math.ceil((meetingTime - currentTime) / (1000 * 60 * 60 * 24));

      if (daysUntil === 0) {
        return { show: true, message: "Meeting today" };
      } else if (daysUntil > 0 && daysUntil <= 5) {
        return { show: true, message: `Meeting in ${daysUntil} day${daysUntil > 1 ? "s" : ""}` };
      } else {
        return { show: false, message: "" };
      }
    } catch {
      return { show: false, message: "" };
    }
  };

  const getSafeUrl = (url: string) =>
  url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

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
      <div className="container mx-auto px-4 py-4 pb-20 md:pb-6">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-bookWhite">Calendar</h1>
              <p className="text-bookWhite font-serif text-base/5">Track what’s next on your reading journey. Schedule and manage your book club meetings. <span className="text-xs italic text-bookWhite/40">* Only book club admins or owners can schedule meetings.</span></p>
            </div>
            <div className="flex items-center gap-2">
              {userClubs.length > 0 ? (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary-light rounded-full">
                      <Plus className="h-4 w-4" /> Schedule Meeting
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[85vw] rounded-2xl px-1">
                    <Image 
                      src="/images/background.png"
                      alt="Create and Manage your Book Clubs | BookCrush"
                      width={1622}
                      height={2871}
                      className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
                    />
                    <DialogHeader className="text-bookWhite">
                      <DialogTitle className="pt-5">Schedule a Book Club Meeting</DialogTitle>
                      <DialogDescription>Fill in the details to schedule a new book club meeting.</DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[60vh] pr-1 pl-2 px-5 w-auto">
                      <form onSubmit={handleCreateMeeting}>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="club">Club *</Label>
                            <Select 
                              value={formData.club_id} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, club_id: value, book_id: '' }))}
                            >
                              <SelectTrigger id="club">
                                <SelectValue placeholder="Select club" className="font-medium placeholder:font-normal"/>
                              </SelectTrigger>
                              <SelectContent>
                                {userClubs.map(club => (
                                  <SelectItem key={club.id} value={club.id} className="font-medium placeholder:font-normal">{club.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="title">Meeting Title</Label>
                            <Input 
                              id="title" 
                              placeholder="Enter meeting title"
                              value={formData.title}
                              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                              className="bg-bookWhite/90 text-secondary"
                              required
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-12">
                            <div className="grid gap-1">
                              <Label htmlFor="date">Date *</Label>
                              <Input 
                                id="date" 
                                type="date"
                                value={formData.meeting_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, meeting_date: e.target.value }))}
                                className="bg-bookWhite text-secondary placeholder:text-secondary/50"
                                required
                              />
                            </div>
                            <div className="grid gap-1">
                              <Label htmlFor="time">Time *</Label>
                              <Input 
                                id="time" 
                                type="time"
                                value={formData.meeting_time}
                                onChange={(e) => setFormData(prev => ({ ...prev, meeting_time: e.target.value }))}
                                className="bg-bookWhite text-secondary"
                                required
                              />
                              {/* <Label htmlFor="time">Time *</Label>
                              <CustomTimePicker
                                value={formData.meeting_time}
                                onChange={(val) =>
                                  setFormData((prev) => ({ ...prev, meeting_time: val }))
                                }
                              /> */}
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
                          
                          <div className="grid gap-2">
                            <Label htmlFor="meeting_mode">Meeting Mode</Label>
                            <Select 
                              value={formData.meeting_mode} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, meeting_mode: value, location: '' }))}
                            >
                              <SelectTrigger id="meeting_mode">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="IN_PERSON">In Person</SelectItem>
                                <SelectItem value="VIRTUAL">Virtual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {formData.club_id && userClubs.find(c => c.id === formData.club_id)?.current_book && (
                            <div className="grid gap-2">
                              <Label htmlFor="book">Book</Label>
                              <Select 
                                value={formData.book_id} 
                                onValueChange={(value) => setFormData(prev => ({ ...prev, book_id: value }))}
                              >
                                <SelectTrigger id="book">
                                  <SelectValue placeholder="Select book" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No specific book</SelectItem>
                                  {(() => {
                                    const selectedClub = userClubs.find(c => c.id === formData.club_id);
                                    const currentBook = selectedClub?.current_book;
                                    return currentBook ? (
                                      <SelectItem key={currentBook.id} value={currentBook.id}>
                                        {currentBook.title} {currentBook.author && `by ${currentBook.author}`}
                                      </SelectItem>
                                    ) : null;
                                  })()}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          
                          <div className="grid gap-2">
                            <Label htmlFor="location">
                              {formData.meeting_mode === 'VIRTUAL' ? 'Meeting URL' : 'Location'}
                            </Label>
                            <Input 
                              id="location" 
                              placeholder={
                                formData.meeting_mode === 'VIRTUAL' 
                                  ? "Zoom, Google Meet, or other meeting link" 
                                  : "Physical address or venue"
                              }
                              value={formData.location}
                              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                              className="bg-bookWhite text-secondary"
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea 
                              id="description" 
                              placeholder="Enter meeting details, discussion points, etc."
                              value={formData.description}
                              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                              className="bg-bookWhite text-secondary font-serif font-medium italic text-sm placeholder:text-secondary/40 placeholder:font-normal"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="bg-primary hover:bg-primary-light rounded-full" disabled={creatingMeeting}>
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
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="text-sm text-muted-foreground">
                  
                </div>
              )}
            </div>
          </div>

          {/* Edit Meeting Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="w-[85vw] rounded-2xl px-1">
              <Image 
                src="/images/background.png"
                alt="Create and Manage your Book Clubs | BookCrush"
                width={1622}
                height={2871}
                className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
              />
              <DialogHeader className="text-bookWhite">
                <DialogTitle className="pt-5">Edit Book Club Meeting</DialogTitle>
                <DialogDescription>Update the details for your book club meeting.</DialogDescription>
              </DialogHeader>

              <ScrollArea className="h-[60vh] pr-1 pl-2 px-5 w-auto">
                <form onSubmit={handleUpdateMeeting}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-club">Club *</Label>
                      <Select 
                        value={formData.club_id} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, club_id: value, book_id: '' }))}
                        disabled={true} // Club shouldn't be changeable when editing
                      >
                        <SelectTrigger id="edit-club">
                          <SelectValue placeholder="Select club" className="font-medium placeholder:font-normal"/>
                        </SelectTrigger>
                        <SelectContent>
                          {userClubs.map(club => (
                            <SelectItem key={club.id} value={club.id} className="font-medium placeholder:font-normal">{club.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="edit-title">Meeting Title</Label>
                      <Input 
                        id="edit-title" 
                        placeholder="Enter meeting title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="bg-bookWhite/90 text-secondary"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-12">
                      <div className="grid gap-1">
                        <Label htmlFor="edit-date">Date *</Label>
                        <Input 
                          id="edit-date" 
                          type="date"
                          value={formData.meeting_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, meeting_date: e.target.value }))}
                          className="bg-bookWhite text-secondary placeholder:text-secondary/50"
                          required
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="edit-time">Time *</Label>
                        <Input 
                          id="edit-time" 
                          type="time"
                          value={formData.meeting_time}
                          onChange={(e) => setFormData(prev => ({ ...prev, meeting_time: e.target.value }))}
                          className="bg-bookWhite text-secondary"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="edit-duration">Duration (minutes)</Label>
                      <Select 
                        value={formData.duration_minutes.toString()} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
                      >
                        <SelectTrigger id="edit-duration">
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
                      <Label htmlFor="edit-meeting_type">Meeting Type</Label>
                      <Select 
                        value={formData.meeting_type} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, meeting_type: value }))}
                      >
                        <SelectTrigger id="edit-meeting_type">
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
                    
                    <div className="grid gap-2">
                      <Label htmlFor="edit-meeting_mode">Meeting Mode</Label>
                      <Select 
                        value={formData.meeting_mode} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, meeting_mode: value, location: '' }))}
                      >
                        <SelectTrigger id="edit-meeting_mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="px-3">
                          <SelectItem value="IN_PERSON" className="not-italic">In Person</SelectItem>
                          <SelectItem value="VIRTUAL" className="not-italic">Virtual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.club_id && userClubs.find(c => c.id === formData.club_id)?.current_book && (
                      <div className="grid gap-2">
                        <Label htmlFor="edit-book">Book</Label>
                        <Select 
                          value={formData.book_id} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, book_id: value }))}
                        >
                          <SelectTrigger id="edit-book">
                            <SelectValue placeholder="Select book" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No specific book</SelectItem>
                            {(() => {
                              const selectedClub = userClubs.find(c => c.id === formData.club_id);
                              const currentBook = selectedClub?.current_book;
                              return currentBook ? (
                                <SelectItem key={currentBook.id} value={currentBook.id}>
                                  {currentBook.title} {currentBook.author && `by ${currentBook.author}`}
                                </SelectItem>
                              ) : null;
                            })()}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="grid gap-2">
                      <Label htmlFor="edit-location">
                        {formData.meeting_mode === 'VIRTUAL' ? 'Meeting URL' : 'Location'}
                      </Label>
                      <Input 
                        id="edit-location" 
                        placeholder={
                          formData.meeting_mode === 'VIRTUAL' 
                            ? "Zoom, Google Meet, or other meeting link" 
                            : "Physical address or venue"
                        }
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="bg-bookWhite text-secondary"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea 
                        id="edit-description" 
                        placeholder="Enter meeting details, discussion points, etc."
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-bookWhite text-secondary font-serif font-medium italic text-sm placeholder:text-secondary/40 placeholder:font-normal"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                      className="bg-secondary/20 text-bookWhite rounded-full" 
                      disabled={updatingMeeting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-primary hover:bg-primary-light rounded-full" disabled={updatingMeeting}>
                      {updatingMeeting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Meeting'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            <Card className="bg-secondary-light/35 rounded-xl">
              <CardContent className="p-0 py-3">
                <Calendar 
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  modifiers={{ meetingDay: meetingDates }}
                  modifiersClassNames={{
                    meetingDay: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-accent-variant",
                  }}
                />
                {/* Meeting Info or Fallback */}
                <div className="px-8 pt-0 pb-2">
                  {date && (
                    <>
                      {meetingsForSelectedDate.length > 0 ? (
                        meetingsForSelectedDate.map((meeting) => (
                          <div
                            key={meeting.id}
                            className="text-sm"
                          >
                            <p className="text-muted-foreground italic">
                              {meeting.club.name} • {" "}
                              {new Date(meeting.date).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm italic">
                          No meetings on this day
                        </p>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Upcoming Meetings</CardTitle>
                  <CardDescription className="font-serif font-normal">Your upcoming book club meetings</CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="space-y-3">
                    {upcomingMeetings.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No upcoming meetings scheduled.</p>
                    ) : (
                      upcomingMeetings.map((meeting) => (
                        <div key={meeting.id} className="flex flex-col md:flex-row gap-0 p-4 rounded-lg bg-secondary-light/5">
                          <div className="flex flex-row items-start justify-between">
                            <div className="flex flex-col">
                              {meeting.club.name && (
                              <>  
                                <p className="font-serif font-medium leading-none text-sm">book club</p>
                                <Link href={`/clubs/${meeting.club?.id}`}>
                                  <p className="text-lg leading-none text-secondary font-bold mb-2">{meeting.club.name}</p>
                                </Link>
                              </>
                              )}
                              </div>
                            <Badge variant="secondary" className="w-fit ml-1">
                              {meeting.meeting_mode.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex flex-row gap-2 items-center">
                            {meeting.book && (
                              <Link href={`/books/${meeting.book?.id}`}>
                                <div className="w-24 h-36 bg-muted/30 rounded flex items-center justify-center overflow-hidden shrink-0">
                                  <img
                                    src={meeting.book?.cover_url || "/placeholder.svg"}
                                    alt={`${meeting.book?.title} cover`}
                                    className="object-cover h-full w-full" // Added w-full
                                  />
                                </div>
                              </Link>
                            )}
                            
                            <div className="flex flex-col">
                              {/* I WANT THE MEETING SPAN 5 OR LESS HERE */}
                              <p className="font-semibold text-secondary">{meeting.book?.title}</p>
                              <span className="flex items-center leading-4 text-sm font-serif font-normal"><CalendarDays className="w-3 h-3 mr-1 text-accent-variant"/>{new Date(meeting.date).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}</span>
                              <span className="flex items-center leading-4 text-sm font-serif font-normal"><Clock className="w-3 h-3 mr-1 text-accent-variant"/>{formatMeetingDateTime(meeting.date, meeting.duration_minutes)}</span>
                              {meeting.location && (
                                <span className="flex items-center leading-4 text-sm font-serif font-normal">
                                  {meeting.meeting_mode === 'VIRTUAL' ? <Link2 className="w-3 h-3 mr-1 text-accent-variant"/> : <MapPin className="w-3 h-3 mr-1 text-accent-variant"/>}
                                  {meeting.meeting_mode === 'VIRTUAL' ? (
                                    <a href={getSafeUrl(meeting.location)} target="_blank" rel="noopener noreferrer" className="cursor-pointer underline">Meeting link here!</a>
                                    ) : (
                                      <span>{meeting.location}</span>
                                    ) }
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="md:w-3/4 mt-2">

                            <p className="py-1 pl-2 pr-2.5 rounded-r-full bg-secondary/10 text-secondary/50 font-semibold text-xs leading-3 mb-1 inline-block">{meeting.meeting_type.replace('_', ' ')}</p>

                            <div className="flex flex-col md:flex-row justify-between">
                              <h3 className="font-semibold text-sm leading-none">{meeting.title}</h3>
                            </div>

                            {meeting.description && (
                              <p className="text-xs text-secondary/50 font-serif font-medium leading-3 mb-3">{meeting.description}</p>
                            )}

                            <div className="flex items-end justify-end">
                              <div className="flex items-center justify-between w-full">
                                <p className="text-xs text-secondary/40">
                                  Created by {meeting.creator.display_name}
                                </p>
                                {meeting.is_creator && (
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditMeeting(meeting)}
                                      className="h-7 px-3 text-xs rounded-full text-bookWhite bg-secondary/70 hover:bg-secondary"
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteMeeting(meeting)}
                                      disabled={deletingMeetingId === meeting.id}
                                      className="h-7 px-3 text-xs rounded-full bg-red-800/70  hover:bg-red-800"
                                    >
                                      {deletingMeetingId === meeting.id ? (
                                        <>
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          Cancelling...
                                        </>
                                      ) : (
                                        'Cancel'
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                              {/* <Badge 
                                variant={meeting.user_attendance_status === 'ATTENDING' ? 'default' : 'outline'}
                                className="text-xs text-secondary"
                              >
                                {meeting.user_attendance_status.replace('_', ' ')}
                              </Badge> */}
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
                  <CardHeader className="pb-3">
                    <CardTitle>Past Meetings</CardTitle>
                    <CardDescription className="font-serif font-normal">Review your previous book club discussions</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2">
                    <div className="space-y-3">
                      {pastMeetings.slice(0, 3).map((meeting) => (
                        <div key={meeting.id} className="flex flex-col md:flex-row gap-0 p-4 rounded-lg bg-secondary-light/5">
                          <div className="flex flex-row items-start justify-between">
                            <div className="flex flex-col">
                              {meeting.club.name && (
                              <>  
                                <p className="font-serif font-medium leading-none text-sm">book club</p>
                                <Link href={`/clubs/${meeting.club?.id}`}>
                                  <p className="text-lg leading-none text-secondary font-bold mb-2">{meeting.club.name}</p>
                                </Link>
                              </>
                              )}
                              </div>
                          </div>
                          <div className="flex flex-row gap-2 items-center">
                            {meeting.book && (
                              <Link href={`/books/${meeting.book?.id}`}>
                                <div className="w-24 h-36 bg-muted/30 rounded flex items-center justify-center overflow-hidden shrink-0">
                                  <img
                                    src={meeting.book?.cover_url || "/placeholder.svg"}
                                    alt={`${meeting.book?.title} cover`}
                                    className="object-cover h-full w-full" // Added w-full
                                  />
                                </div>
                              </Link>
                            )}
                            
                            <div className="flex flex-col">
                              {/* I WANT THE MEETING SPAN 5 OR LESS HERE */}
                              <p className="font-semibold text-secondary">{meeting.book?.title}</p>
                              <span className="flex items-center leading-4 text-sm font-serif font-normal"><CalendarDays className="w-3 h-3 mr-1 text-accent-variant"/>{new Date(meeting.date).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}</span>
                              <span className="flex items-center leading-4 text-sm font-serif font-normal"><Clock className="w-3 h-3 mr-1 text-accent-variant"/>{formatMeetingDateTime(meeting.date, meeting.duration_minutes)}</span>
                              {meeting.location && (
                                <span className="flex items-center leading-4 text-sm font-serif font-normal">
                                  {meeting.meeting_mode === 'VIRTUAL' ? <Link2 className="w-3 h-3 mr-1 text-accent-variant"/> : <MapPin className="w-3 h-3 mr-1 text-accent-variant"/>}
                                  {meeting.meeting_mode === 'VIRTUAL' ? (
                                    <a href={getSafeUrl(meeting.location)} target="_blank" rel="noopener noreferrer" className="cursor-pointer underline">Meeting link here!</a>
                                    ) : (
                                      <span>{meeting.location}</span>
                                    ) }
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="md:w-3/4 mt-2">
                            <p className="py-1 pl-2 pr-2.5 rounded-r-full bg-secondary/10 text-secondary/50 font-semibold text-xs leading-3 mb-1 inline-block">{meeting.meeting_type.replace('_', ' ')}</p>
                            <div className="flex flex-col md:flex-row justify-between">
                              <h3 className="font-semibold text-sm leading-none">{meeting.title}</h3>
                            </div>
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
