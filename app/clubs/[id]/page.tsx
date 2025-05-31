"use client"

import { use,useState, useEffect, useCallback } from "react" // Added useEffect, useCallback
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { BookOpen, CalendarDays, Plus, Settings, MessageSquare, Clock, Loader2, Check, ArrowLeft } from "lucide-react" // Added Loader2, Check
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"; // Assuming sonner for toasts
import { BookSelectionDialog } from '@/components/BookSelectionDialog'


// --- Define Interfaces (copied from previous thought, ensure consistency) ---

// Define ClubMembership locally, ideally this should be in @/types/book.ts
interface ClubMembership {
  id: string; // Membership ID
  user_id: string;
  club_id: string;
  role: 'MEMBER' | 'ADMIN' | 'OWNER';
  status: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LEFT' | 'BANNED';
  joined_at: string; // ISO Date string  
  user: { // Added this nested user object based on your API structure
    display_name: string;
    avatar_url?: string | null; // Optional: if your API provides user avatar
    // Add other user fields like id, initials if they are part of this nested object
  };
}

interface Discussion {
  id: string; // Added to match API response after mapping
  user: {
    name: string;
    avatar: string | null;
    initials: string;
  };
  text: string;
  timestamp: string;
}

interface BookHistoryEntry {
  id: string;  // club_book id
  book_id: string;
  started_at: string;
  finished_at: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  book: {
    id: string;
    title: string;
    author: string;
    cover_url: string;
    description: string;
  };
}

interface CurrentBookDetails {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  description: string;
  reading_time: string | null;
  pages: number | null;
}

interface ClubMembershipRequest {
  id: string; // This is the membershipId (UUID) needed for the approve API
  userId: string; // Applicant's User ID (UUID)
  userName: string;
  userAvatar: string | null;
  userInitials: string;
  appliedAt: string; // ISO string
  status: 'PENDING' | 'ACTIVE'; // Status of this specific request
}

// Full Club data structure for the detail page - MUST MATCH API RESPONSE EXACTLY
interface ClubData {
  id: string; // Club ID (UUID)
  name: string;
  description: string;
  memberCount: number; // Using memberCount from your schema suggestion
  ownerId: string; // The ID of the club owner

  // Current user's specific relationship to *this* club (these come from backend)
  currentUserMembershipStatus: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LEFT' | null;
  currentUserIsAdmin: boolean; // True if current user is owner_id or an ADMIN role for this club
  memberships: ClubMembership[];
  current_book: CurrentBookDetails | null;
  book_history: BookHistoryEntry[];
  discussions: Discussion[];
  pendingMemberships?: ClubMembershipRequest[]; // Populated only if currentUserIsAdmin is true
}


export default function ClubDetailPage({ params }: { params: { id: string } }) {
  const [comment, setComment] = useState("");
  const [club, setClub] = useState<ClubData | null>(null); // Club data, initially null
  const [loadingClub, setLoadingClub] = useState(true); // Loading state for initial club data fetch
  const [loadingAction, setLoadingAction] = useState(false); // Loading state for join/approve actions
  const [loadingBookAction, setLoadingBookAction] = useState(false);
  const [bookDialogOpen, setBookDialogOpen] = useState(false)
  const [loadingPostComment, setLoadingPostComment] = useState(false);


  //wrap params with React.use() 
  const {id} = useParams();

  
  // Function to fetch full club details from the API
  const fetchClubDetails = useCallback(async () => {
    setLoadingClub(true);
    try {
      const response = await fetch(`/api/clubs/${id}`); // Call your new API endpoint
      if (!response.ok) {
        throw new Error(`Failed to fetch club data: ${response.statusText}`);
      }
      const data: ClubData = await response.json(); // Cast to ClubData interface
      setClub(data);
    } catch (err: any) {
      toast.error(`Error fetching club details: ${err.message}`);
      console.error("Error fetching club details:", err);
      setClub(null); // Set to null on error
    } finally {
      setLoadingClub(false);
    }
  }, [id]);

  // Initial data load on component mount
  useEffect(() => {
    fetchClubDetails();
  }, [fetchClubDetails]); // Depend on memoized fetch function

  // --- Integration for JOIN API (`/app/api/clubs/join`) ---
  const handleJoinClub = async () => {
    setLoadingAction(true);
    try {
      if (!club) {
        toast.error("Club data not loaded yet.");
        return;
      }
      const response = await fetch('/api/clubs/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clubId: club.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join club.");
      }

      const result = await response.json();
      console.log("Join successful:", result);
      toast.success("Successfully applied to join the club! Your request is pending approval.");

      // After action, refetch club details to update UI state
      await fetchClubDetails();

    } catch (err: any) {
      toast.error(`Error joining club: ${err.message}`);
      console.error("Error joining club:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Integration for APPROVE API (`/app/api/clubs/approve`) ---
  const handleApproveMembership = async (membershipId: string, applicantName: string) => {
    setLoadingAction(true);
    try {
      if (!club) {
        toast.error("Club data not loaded yet.");
        return;
      }
      const response = await fetch('/api/clubs/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ membershipId: membershipId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve membership.");
      }

      const result = await response.json();
      console.log("Approval successful:", result);
      toast.success(`Successfully approved ${applicantName}'s membership!`);

      // After action, refetch club details to update UI state (remove from pending, update member count)
      await fetchClubDetails();

    } catch (err: any) {
      toast.error(`Error approving membership: ${err.message}`);
      console.error("Error approving membership:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  // Function to set current book
  const handleSetCurrentBook = async (bookId: string) => {
    setLoadingBookAction(true);
    try {
      const response = await fetch(`/api/clubs/${params.id}/current-book`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to set current book.");
      }

      toast.success("Successfully set current book!");
      await fetchClubDetails(); // Refresh club data
    } catch (err: any) {
      toast.error(`Error setting current book: ${err.message}`);
      console.error("Error setting current book:", err);
    } finally {
      setLoadingBookAction(false);
    }
  };

  // Function to delete current book
  const handleDeleteCurrentBook = async () => {
    setLoadingBookAction(true);
    try {
      const response = await fetch(`/api/clubs/${params.id}/current-book`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete current book.");
      }

      toast.success("Successfully deleted current book!");
      await fetchClubDetails(); // Refresh club data
    } catch (err: any) {
      toast.error(`Error deleting current book: ${err.message}`);
      console.error("Error deleting current book:", err);
    } finally {
      setLoadingBookAction(false);
    }
  };

  // Function to update book status
  const handleUpdateBookStatus = async (clubBookId: string, status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED') => {
    setLoadingBookAction(true);
    try {
      const response = await fetch(`/api/clubs/${params.id}/books`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clubBookId,
          status,
          finishedAt: status === 'COMPLETED' ? new Date().toISOString() : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update book status.");
      }

      toast.success(`Successfully updated book status to ${status.toLowerCase()}!`);
      await fetchClubDetails(); // Refresh club data
    } catch (err: any) {
      toast.error(`Error updating book status: ${err.message}`);
      console.error("Error updating book status:", err);
    } finally {
      setLoadingBookAction(false);
    }
  };

  // --- NEW: Function to handle posting a comment ---
  const handlePostComment = async () => {
    if (!comment.trim()) {
      toast.info("Comment cannot be empty.");
      return;
    }
    if (!club) {
      toast.error("Club data not available. Please try again.");
      return;
    }
    if (club.currentUserMembershipStatus !== 'ACTIVE') {
      toast.error("Only active members can post comments.");
      return;
    }

    setLoadingPostComment(true);
    try {
      // Assuming the API endpoint is /api/clubs/{clubId}/discussions
      // And it expects { text: string, bookId: string | null }
      const response = await fetch(`/api/clubs/${club.id}/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: comment,
          bookId: club.current_book?.id || null, // Send bookId if a current book exists
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to post comment.");
      }

      toast.success("Comment posted successfully!");
      setComment(""); // Clear the textarea
      await fetchClubDetails(); // Refresh club data to show the new comment

    } catch (err: any) {
      toast.error(`Error posting comment: ${err.message}`);
      console.error("Error posting comment:", err);
    } finally {
      setLoadingPostComment(false);
    }
  };

  // --- Loading State and Error Handling for UI ---
  if (loadingClub) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-lg text-muted-foreground">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading club details...
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-lg text-red-500">
        <p>Club not found or an error occurred.</p>
        <Button onClick={fetchClubDetails} className="mt-4">Retry Load</Button>
      </div>
    );
  }

  // --- Main Render Section ---
  return (
    <div className='space-y-3 px-2'>
      <div className="relative h-8 mb-8 w-full">
        {/* Back Button */}
        <button
            onClick={() => router.back()} // You can also use navigate("/previous") if using React Router
            className="absolute top-3 left-0 p-2 rounded-full bg-bookWhite/80 backdrop-blur-sm hover:bg-bookWhite shadow-md"
        >
            <ArrowLeft className="h-5 w-5 text-secondary" />
        </button>
      </div>
      {/* Header Section */}
      <Card className="bg-bookWhite/90 rounded-xl overflow-hidden py-1 px-2">
        <CardHeader className="relative p-0">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-secondary">{club.name}</h1>
                  {/* Display Admin badge if current user is an admin */}
                  {club.currentUserIsAdmin && (
                    <Badge variant="outline" className="ml-2 bg-secondary-light border-none">
                      Admin
                    </Badge>
                  )}
                  {/* Conditional Badges for Membership Status */}
                  {club.currentUserMembershipStatus === 'ACTIVE' && (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white ml-1">
                      Member
                    </Badge>
                  )}
                  {club.currentUserMembershipStatus === 'PENDING' && (
                    <Badge variant="secondary" className="ml-1">
                      Pending
                    </Badge>
                  )}
                  {club.currentUserIsAdmin && (
                    <Button variant="outline" size="icon" className="border-none bg-transparent hover:bg-transparent hover:text-secondary">
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-secondary font-serif font-normal">{club.description}</p>
              </div>
            </div>
        </CardHeader>
        {/* <CardContent className="pt-0">
        </CardContent> */}
      </Card>
      

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        <div className="md:col-span-2">
          <Card className="bg-bookWhite/90 px-2 py-2">
            <CardHeader className="">
              <CardTitle className="px-0 pb-2 text-secondary">Current Book</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {club.current_book ? (
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-32 h-48 bg-muted/30 rounded-md flex items-center justify-center overflow-hidden mx-auto md:mx-0">
                    <img
                      src={club.current_book.cover_url || "/placeholder-book.png"}
                      alt={`${club.current_book.title} cover`}
                      className="max-h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{club.current_book.title}</h3>
                    <p className="text-muted-foreground">{club.current_book.author}</p>

                    {club.current_book.reading_time && (
                      <div className="mt-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">Reading time: {club.current_book.reading_time}</span>
                      </div>
                    )}

                    {club.current_book.pages && (
                      <div className="mt-2 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">{club.current_book.pages} pages</span>
                      </div>
                    )}

                    <p className="mt-4 text-sm">{club.current_book.description}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="mx-auto h-12 w-12 mb-4" />
                  <p>No book currently selected</p>
                  {club.currentUserIsAdmin && (
                    <p className="text-sm mt-2">As an admin, you can set a current book for the club.</p>
                  )}
                </div>
              )}
            </CardContent>
            {club.currentUserIsAdmin && (
              <CardFooter className="flex justify-end gap-2 pb-4">
                {club.current_book && (
                  <Button
                    variant="outline"
                    onClick={handleDeleteCurrentBook}
                    disabled={loadingBookAction}
                  >
                    Remove Current Book
                  </Button>
                )}
                <Button
                  onClick={() => setBookDialogOpen(true)}
                  disabled={loadingBookAction}
                  className="bg-primary hover:bg-primary-light text-secondary rounded-full"
                >
                  {loadingBookAction ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-1 h-4 w-4" />
                  )}
                  {club.current_book ? 'Change Book' : 'Set Current Book'}
                </Button>

                <BookSelectionDialog
                  open={bookDialogOpen}
                  onOpenChange={setBookDialogOpen}
                  onBookSelect={handleSetCurrentBook}
                />
                {club.admin && (
                          <>
                              <Dialog>
                              <DialogTrigger asChild>
                                  <Button variant="outline" className="text-bookWhite rounded-full">
                                  Set New Book
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
                                  <Button variant="outline" className="text-bookWhite rounded-full">
                                  Complete Meeting
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
                                          src={club.currentBook?.cover || "/placeholder.svg"} // Optional chaining
                                          alt={`${club.currentBook?.title || 'No book'} cover`}
                                          className="max-h-full"
                                      />
                                      </div>
                                      <div>
                                      <p className="font-medium text-sm">{club.currentBook?.title}</p>
                                      <p className="text-xs text-muted-foreground">{club.currentBook?.author}</p>
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
            )}
          </Card>

          <div className="mt-3">
            <Tabs defaultValue="discussions" className="space-y-3">
              <div className="flex justify-center">
              <TabsList className="bg-secondary-light text-primary rounded-full">
                <TabsTrigger
                  value="discussions"
                  className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                >
                  Current Discussions
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                >
                  Book History
                </TabsTrigger>
              </TabsList>
              </div>

              <TabsContent value="discussions">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl/6 text-secondary">
                      {club.current_book ? `Discussions: ${club.current_book.title}` : "Select a Current Book"}
                    </CardTitle>
                    <CardDescription className="font-serif text-secondary font-normal text-sm/3">
                      {club.current_book
                        ? "Share your thoughts on the current book (no spoilers!)"
                        : "Select a current book to start book-specific discussions."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {club.discussions && club.discussions.length > 0 ? (
                      <div className="space-y-6">
                        {club.discussions.map((discussion, i) => (
                          <div key={discussion.id || i} className="flex gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src= "/placeholder.svg"
                                alt={discussion.user?.display_name || 'User'}
                              />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {discussion.user?.display_name?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() || '??'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{discussion.user?.display_name || 'Anonymous'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {discussion.timestamp ? new Date(discussion.created_at).toLocaleString() : 'Recently'}
                                </p>
                              </div>
                              <p className="text-sm mt-1">{discussion.content}</p>
                              {/* TODO: Implement rendering for discussion.replies if they exist and are fetched */}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                        {club.current_book && (
                          <>
                            <p>No discussions yet for "{club.current_book.title}".</p>
                            {club.currentUserMembershipStatus === 'ACTIVE' && (
                              <p className="text-sm mt-2">Be the first to share your thoughts below!</p>
                            )}
                          </>
                        ) }
                      </div>
                    )}

                    <Separator className="my-6" />

                    {/* Comment submission section - only for ACTIVE members */}
                    {club.currentUserMembershipStatus === 'ACTIVE' ? (
                      <div className="flex gap-4">
                        <Avatar className="h-10 w-10">
                          {/* Replace with actual current user avatar logic if available */}
                          <AvatarImage src={"placeholder.svg?height=40&width=40"} alt="Your avatar" />
                          <AvatarFallback className="bg-primary text-primary-foreground">ME</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <Textarea
                            placeholder={
                              club.current_book
                                ? "Share your thoughts on the book..."
                                : "Post a general discussion topic..."
                            }
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px] bg-secondary text-bookWhite border-none"
                            disabled={loadingPostComment}
                          />
                          <div className="flex justify-end">
                            <Button
                              className="bg-primary hover:bg-primary-light rounded-full text-secondary"
                              onClick={handlePostComment}
                              disabled={loadingPostComment || !comment.trim()}
                            >
                              {loadingPostComment ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <MessageSquare className="mr-0 h-4 w-4" />
                              )}
                              Post Comment
                            </Button>
                          </div>        
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        {club.currentUserMembershipStatus === 'PENDING' ? (
                          <p>Your membership is pending approval. Once approved, you can join discussions.</p>
                        ) : club.currentUserMembershipStatus === 'REJECTED' || club.currentUserMembershipStatus === 'LEFT' ? (
                          <p>Your previous application was not approved or you have left the club. You can apply again if you wish.</p>
                        ) : (
                          <p>You must be an active member of this club to post comments or participate in discussions.</p>
                        )}

                        {/* Show Join Club button if user is not admin AND not already PENDING */}
                        {/* (Implies they are also not ACTIVE due to the parent conditional) */}
                        {!club.currentUserIsAdmin && club.currentUserMembershipStatus !== 'PENDING' && (
                          <Button onClick={handleJoinClub} disabled={loadingAction} className="mt-3">
                            {loadingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Join Club
                          </Button>
                        )}
                      </div>
                    )}
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
                      {club?.book_history?.length > 0 ? (
                        club.book_history.map((entry) => (
                          <div key={entry.id} className="flex flex-col md:flex-row gap-4 p-4 bg-muted/20 rounded-lg">
                            <div className="w-24 h-36 bg-muted/30 rounded-md flex items-center justify-center overflow-hidden mx-auto md:mx-0">
                              <img
                                src={entry.book.cover_url || "/placeholder-book.png"}
                                alt={`${entry.book.title} cover`}
                                className="max-h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row justify-between">
                                <div>
                                  <h3 className="text-lg font-bold">{entry.book.title}</h3>
                                  <p className="text-sm text-muted-foreground">{entry.book.author}</p>
                                </div>
                                <Badge 
                                  variant={
                                    entry.status === 'COMPLETED' ? 'default' :
                                    entry.status === 'IN_PROGRESS' ? 'secondary' :
                                    'destructive'
                                  }
                                  className="mt-2 md:mt-0"
                                >
                                  {entry.status.toLowerCase().replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm mt-2 text-muted-foreground">
                                Started: {new Date(entry.started_at).toLocaleDateString()}
                                {entry.finished_at && ` • Finished: ${new Date(entry.finished_at).toLocaleDateString()}`}
                              </p>
                              <p className="text-sm mt-2">{entry.book.description}</p>

                              {club.currentUserIsAdmin && entry.status === 'IN_PROGRESS' && (
                                <div className="mt-4 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateBookStatus(entry.id, 'COMPLETED')}
                                    disabled={loadingBookAction}
                                  >
                                    Mark as Completed
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateBookStatus(entry.id, 'ABANDONED')}
                                    disabled={loadingBookAction}
                                    className="text-destructive"
                                  >
                                    Mark as Abandoned
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="mx-auto h-12 w-12 mb-4" />
                          <p>No books in history yet</p>
                          {club?.currentUserIsAdmin && (
                            <p className="text-sm mt-2">Start by setting a current book for the club.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div>
          <Card className="mt-3">
            <CardHeader>
              <CardTitle className="text-secondary">Club Members</CardTitle>
              <CardDescription className="font-serif text-sm font-normal">{club.memberCount} members</CardDescription> {/* Updated to memberCount */}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Dynamically display members based on club.memberCount */}

                {[...Array(Math.min(6, club.memberships.length ?? 0))].map((member, i) => (
                  <div key={i} className="flex items-center gap-3">
                    
                    
                    <Avatar className="h-8 w-8">
                      {/* For real members, you'd iterate over an array of `club.members`
                          each with their own avatar/name properties, fetched from the backend. */}
                      <AvatarImage src={`/placeholder.svg?height=32&width=32&text=${String.fromCharCode(65 + i)}`} alt="Member" />
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
                        {/* These member names are hardcoded. */}
                        {club.memberships[i].user.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {/* Member progress is hardcoded. */}
                        {i === 0
                          ? "Admin - Current Status"
                          : "Current Status"}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Show "View All Members" button if more than 6 members */}
                {club.memberCount > 6 && (
                  <Button variant="outline" className="w-full text-sm">
                    View All Members
                  </Button>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button className="bg-primary hover:bg-primary-light text-secondary rounded-full">
                <Plus className="mr-1 h-4 w-4" /> Invite Members
              </Button>
            </CardFooter>
          </Card>

          {/* --- NEW: Admin section for Pending Applications --- */}
          {club.currentUserIsAdmin && club.pendingMemberships && club.pendingMemberships.length > 0 && (
            <Card className="mt-3">
              <CardHeader className="pb-2">
                <CardTitle>Pending Applications</CardTitle>
                <CardDescription className="font-serif text-sm font-normal">Review new membership requests for this club.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {club.pendingMemberships.map((applicant) => (
                  <div key={applicant.id} className="flex items-center justify-between p-2 bg-secondary-light/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={applicant.userAvatar || "/placeholder.svg"} alt={applicant.userName} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {applicant.userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm/4 font-medium">{applicant.userName}</p>
                        <p className="text-xs text-secondary font-serif font-normal">Applied {new Date(applicant.appliedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleApproveMembership(applicant.id, applicant.userName)} // Pass only membershipId and name
                      disabled={loadingAction}
                      size="sm"
                      className="bg-accent-variant/80 hover:bg-accent-variant text-white rounded-full h-8"
                    >
                      {loadingAction ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-1 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {/* --- END NEW SECTION --- */}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Upcoming Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{club.current_book?.title}</h3>
                    <Badge variant="outline">Next</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>{club.current_book?.reading_time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Clock className="h-4 w-4" />
                    <span>{club.current_book?.reading_time}</span>
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