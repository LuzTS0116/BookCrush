"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CalendarDays, Plus, Search, Settings, Users, BookMarked, Clock, Loader2, Check } from "lucide-react"
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
import { toast } from "sonner";
import { DialogClose } from "@/components/ui/dialog" 
import { Club, ClubMembershipRequest, getMyClubs, getDiscoverClubs } from "@/lib/clubs"

interface ClubsMainProps {
  initialMyClubs: Club[];
  initialDiscoverClubs: Club[];
}

// Get base URL for API calls (this is copy of the function from lib/clubs.ts)
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '';
  }
  return process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
};

export default function ClubsMain({
  initialMyClubs,
  initialDiscoverClubs
}: ClubsMainProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("my-clubs"); // State for active tab
  const [loadingAction, setLoadingAction] = useState(false); // For join/approve actions
  const [loadingClubs, setLoadingClubs] = useState(false); // No longer need initial loading state as we have initial data
  
  // states for the Create Club form
  const [newClubName, setNewClubName] = useState("");
  const [newClubDescription, setNewClubDescription] = useState("");
  const [newClubPrivacy, setNewClubPrivacy] = useState<"public" | "private">("public");
  const [isCreateClubDialogOpen, setIsCreateClubDialogOpen] = useState(false); // To control dialog closing
  
  // Initialize with server-provided data
  const [myClubs, setMyClubs] = useState<Club[]>(initialMyClubs);
  const [discoverClubs, setDiscoverClubs] = useState<Club[]>(initialDiscoverClubs);

  // --- Data Fetching Functions ---

  // Fetches clubs the current user is a member of (or has pending requests for)
  const fetchMyClubs = useCallback(async () => {
    try {
      const clubs = await getMyClubs();
      setMyClubs(clubs);
      return clubs; // Return the clubs data
    } catch (err: any) {
      toast.error(err.message);
      return []; // Return empty array on error
    }
  }, []);

  // Fetches clubs the current user is NOT a member of
  const fetchDiscoverClubs = useCallback(async () => {
    try {
      const clubs = await getDiscoverClubs();
      setDiscoverClubs(clubs);
      return clubs; // Return the clubs data
    } catch (err: any) {
      toast.error(err.message);
      return []; // Return empty array on error
    }
  }, []);

  // Initial Data Load on component mount - only refresh if needed
  // No need for initial loading since we have client data already
  useEffect(() => {
    // Only set up refresh if we actually have data
    if (initialMyClubs.length > 0 || initialDiscoverClubs.length > 0) {
      // Optional: Refresh data after a certain time to ensure freshness
      const refreshTimer = setTimeout(() => {
        const refreshData = async () => {
          setLoadingClubs(true);
          try {
            const results = await Promise.all([
              fetchMyClubs(),
              fetchDiscoverClubs()
            ]);
            
            const [newMyClubs, newDiscoverClubs] = results;
            
            // Arrays are always truthy, so check length instead
            if (newMyClubs.length > 0) setMyClubs(newMyClubs);
            if (newDiscoverClubs.length > 0) setDiscoverClubs(newDiscoverClubs);
          } catch (error) {
            console.error("Error refreshing data:", error);
            // Don't show toast here as fetchMyClubs and fetchDiscoverClubs already handle that
          } finally {
            setLoadingClubs(false);
          }
        };
        refreshData();
      }, 60000); // Refresh after 1 minute
      
      return () => clearTimeout(refreshTimer);
    }
  }, [fetchMyClubs, fetchDiscoverClubs, initialMyClubs, initialDiscoverClubs]);

  // --- API Integration Functions ---
  const handleCreateClub = async () => {
    const baseUrl = getBaseUrl();
    setLoadingAction(true);
    try {
      const response = await fetch(`${baseUrl}/api/clubs/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newClubName,
          description: newClubDescription,
          isPrivate: newClubPrivacy === "private", // Send boolean
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create club.");
      }

      const result = await response.json();
      console.log("Club created successfully:", result);
      toast.success(`Club "${result.name}" created successfully!`);

      // Reset form fields
      setNewClubName("");
      setNewClubDescription("");
      setNewClubPrivacy("public");
      setIsCreateClubDialogOpen(false); // Close the dialog

      // Refetch my clubs to show the newly created club
      await fetchMyClubs();
      // Also refetch discover clubs in case it affects what's shown there (e.g., if you were filtering out public clubs you own)
      await fetchDiscoverClubs();

    } catch (err: any) {
      toast.error(`Error creating club: ${err.message}`);
      console.error("Error creating club:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleJoinClub = async (clubId: string) => {
    const baseUrl = getBaseUrl();
    setLoadingAction(true);
    try {
      const response = await fetch(`${baseUrl}/api/clubs/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clubId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join club.");
      }

      const result = await response.json();
      console.log("Join successful:", result);
      toast.success(`Successfully applied to join "${discoverClubs.find(c => c.id === clubId)?.name}"! Your request is pending approval.`);

      // Refetch both lists to ensure data consistency
      await Promise.all([fetchMyClubs(), fetchDiscoverClubs()]);

    } catch (err: any) {
      toast.error(`Error joining club: ${err.message}`);
      console.error("Error joining club:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleApproveMembership = async (clubId: string, membershipId: string, applicantName: string) => {
    const baseUrl = getBaseUrl();
    setLoadingAction(true);
    try {
      const response = await fetch(`${baseUrl}/api/clubs/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ membershipId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve membership.");
      }

      const result = await response.json();
      console.log("Approval successful:", result);
      toast.success(`Successfully approved ${applicantName}'s membership!`);

      // Refetch myClubs to update the pending memberships list and member count
      await fetchMyClubs();

    } catch (err: any) {
      toast.error(`Error approving membership: ${err.message}`);
      console.error("Error approving membership:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Render Logic ---

  if (loadingClubs) {
    return (
      <div className="container mx-auto px-4 py-6 pb-20 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading clubs...</span>
      </div>
    );
  }

  return (
      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-center justify-center gap-2">
                 <Dialog open={isCreateClubDialogOpen} onOpenChange={setIsCreateClubDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary-light text-secondary rounded-full">
                            <Plus className="mr-2 h-4 w-4" /> Create Club
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[85vw] rounded-2xl">
                        <Image 
                            src="/images/background.png"
                            alt="Create and Manage your Book Clubs | BookCrush"
                            width={1622}
                            height={2871}
                            className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
                        />
                    <DialogHeader className="mt-5">
                        <DialogTitle>Create a Book Club</DialogTitle>
                        <DialogDescription>Bring your favorite people together to read, discuss, and enjoy books.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                        <Label htmlFor="club-name">Club Name</Label>
                        <Input
                            id="club-name"
                            className="bg-bookWhite text-secondary"
                            placeholder="Enter a name for your club"
                            value={newClubName}
                            onChange={(e) => setNewClubName(e.target.value)}
                            disabled={loadingAction}
                        />
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            className="bg-bookWhite text-secondary font-serif text-sm leading-4 italic placeholder:text-secondary/50"
                            placeholder="What kind of books will your club focus on?"
                            value={newClubDescription}
                            onChange={(e) => setNewClubDescription(e.target.value)}
                            disabled={loadingAction}
                        />
                        </div>
                        {/* <div className="grid gap-2">
                        <Label htmlFor="privacy">Privacy</Label>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                            <input
                                type="radio"
                                id="public"
                                name="privacy"
                                value="public"
                                checked={newClubPrivacy === "public"}
                                onChange={() => setNewClubPrivacy("public")}
                                className="form-radio"
                                disabled={loadingAction}
                            />
                            <Label htmlFor="public">Public</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                            <input
                                type="radio"
                                id="private"
                                name="privacy"
                                value="private"
                                checked={newClubPrivacy === "private"}
                                onChange={() => setNewClubPrivacy("private")}
                                className="form-radio"
                                disabled={loadingAction}
                            />
                            <Label htmlFor="private">Private</Label>
                            </div>
                        </div>
                        </div> */}
                        {/* Current Book and Invite Members logic is currently not handled by the API */}
                        {/* You would need to add specific API endpoints for these features */}
                        <div className="grid gap-2 opacity-50 cursor-not-allowed">
                            <Label htmlFor="current-book">Current Book (Optional)</Label>
                            <Select disabled>
                                <SelectTrigger id="current-book" className="rounded-full" >
                                <SelectValue placeholder="Select a book" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="midnight-library">The Midnight Library</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">This feature is not yet implemented.</p>
                        </div>
                        <div className="grid gap-2 opacity-50 cursor-not-allowed">
                            <Label htmlFor="invite">Invite Members (Optional)</Label>
                            <Input id="invite" placeholder="Enter email addresses, separated by commas" disabled />
                            <p className="text-xs text-muted-foreground">This feature is not yet implemented.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        {/* Using DialogClose to close the dialog on success */}
                        <Button
                            onClick={handleCreateClub}
                            disabled={loadingAction || !newClubName.trim()}
                            className="bg-primary rounded-full hover:bg-primary-light text-primary-foreground"
                        >
                            {loadingAction ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            Create Club
                        </Button>
                    </DialogFooter>
                    </DialogContent>
                </Dialog>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-2 h-4 w-4 text-secondary" />
                <Input
                placeholder="Search reading clubs..."
                className="pl-10 bg-bookWhite placeholder:text-secondary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <Tabs defaultValue="my-clubs" className="space-y-2" onValueChange={setActiveTab}>
                <div className="flex justify-center">
                <TabsList className="bg-secondary-light text-primary rounded-full mb-2">
                <TabsTrigger
                    value="my-clubs"
                    className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                >
                    My Clubs
                </TabsTrigger>
                <TabsTrigger
                    value="discover"
                    className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                >
                    Discover
                </TabsTrigger>
                </TabsList>
                </div>

                <TabsContent value="my-clubs" className="space-y-6">
                {myClubs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">You are not a member of any clubs yet. Explore the "Discover" tab!</p>
                ) : (
                  myClubs.map((club) => (
                      <Card key={club.id}>
                      <CardHeader className="pb-2">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                              <div>
                                  <div className="flex items-center justify-between pb-1">
                                      <div className="flex items-center gap-2 text-secondary-light">
                                          <CardTitle className="p-0 m-0">
                                              {club.name}
                                          </CardTitle>
                                          {club.admin && (
                                              <Badge variant="outline" className="ml-2 bg-primary/25 border-none text-secondary font-serif">
                                              Admin
                                              </Badge>
                                          )}
                                      </div>

                                      {club.admin && (
                                      <Button variant="ghost" size="icon" className="flex justify-end">
                                          <Settings className="h-4 w-4 text-secondary-light" />
                                      </Button>
                                      )}
                                  </div>

                                  <CardDescription className="font-serif font-medium text-sm/4">
                                      {club.description}
                                  </CardDescription>
                              </div>
                              
                          </div>
                      </CardHeader>
                      <CardContent>
                          <div className="grid grid-cols-2 gap-4 pt-2">
                              <div className="flex items-center gap-2">
                                  <Users className="h-5 w-5 text-accent-variant" />
                                  <div>
                                  <p className="text-sm/3 font-medium">Members</p>
                                  {/* Assuming 'members' property from API is the actual count */}
                                  <p className="text-sm font-serif text-secondary/50 font-medium">{club.memberCount} people</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-2">
                                  <CalendarDays className="h-5 w-5 text-accent-variant" />
                                  <div>
                                  <p className="text-sm/3 font-medium">Next Meeting</p>
                                  {/* These fields (`currentBook`, `nextMeeting`, `history`) are not returned by your new APIs. */}
                                  {/* You'd need to extend your API or fetch this from `/api/clubs/[id]` separately. */}
                                  <p className="text-sm font-serif text-secondary/50 font-medium">{club.nextMeeting || 'TBD'}</p>
                                  </div>
                              </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-1">
                          <div className="col-span-1">
                              <p className="text-sm font-medium mb-1">Current Book</p>
                              <div className="bg-secondary-light/10 p-3 w-auto rounded-lg flex gap-3">
                              <div className="w-16 h-24 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                                  <img
                                  src={club.currentBook?.cover || "/placeholder.svg"} // Use optional chaining
                                  alt={`${club.currentBook?.title || 'No book'} cover`}
                                  className="max-h-full"
                                  />
                              </div>
                              <div>
                                  <p className="font-medium text-sm/4">{club.currentBook?.title || 'No current book'}</p>
                                  <p className="text-xs text-secondary font-serif font-medium">{club.currentBook?.author}</p>
                                  {/* This `Meeting in 3 days` is static, would need dynamic data */}
                                  <div className="mt-2 flex items-center gap-1 text-xs font-serif font-medium text-secondary rounded-full py-0 px-2 bg-accent/60">
                                      <Clock className="h-3 w-3" />
                                      <span>Meeting in 3 days</span>
                                  </div>
                                  <p className="text-xs mt-2 font-serif underline text-secondary">view book details</p>
                              </div>
                              </div>
                          </div>

                          <div className="col-span-2">
                              <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="book-history">
                                  <AccordionTrigger className="text-sm font-medium">Book History</AccordionTrigger>
                                  <AccordionContent>
                                  <div className="space-y-3">
                                      {club.history && club.history.length > 0 ? ( // Check if history exists
                                        club.history.map((book, i) => (
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
                                              <p className="text-xs text-secondary font-serif font-medium">{book.author}</p>
                                              <p className="text-xs text-primary-dark">{book.date}</p>
                                              </div>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-sm text-muted-foreground">No book history available.</p>
                                      )}
                                  </div>
                                  </AccordionContent>
                              </AccordionItem>
                              </Accordion>
                          </div>
                          </div>

                          <div className="mt-6">
                          <p className="text-sm font-medium mb-2">Members</p>
                          <div className="flex flex-wrap gap-2">
                              {[...Array(Math.min(8, club.memberCount))].map((_, i) => (
                              <Avatar key={i} className="h-8 w-8">
                                  <AvatarImage src={`/placeholder.svg?height=32&width=32&text=${String.fromCharCode(65 + i)}`} alt="Member" />
                                  <AvatarFallback
                                  className={
                                      i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-bookWhite"
                                  }
                                  >
                                  {String.fromCharCode(65 + i)}
                                  </AvatarFallback>
                              </Avatar>
                              ))}
                              {club.memberCount > 8 && (
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-bookWhite">
                                  +{club.memberCount - 8}
                              </div>
                              )}
                          </div>
                          </div>

                          {/* --- Admin section for Pending Applications --- */}
                          {club.admin && club.pendingMemberships && club.pendingMemberships.length > 0 && (
                              <div className="mt-6">
                                  <Card>
                                      <CardHeader className="pb-2">
                                          <CardTitle className="text-secondary-light text-lg">Pending Applications</CardTitle>
                                          <CardDescription className="font-serif font-medium text-sm/4">Review new membership requests.</CardDescription>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                          {club.pendingMemberships.map((applicant) => (
                                              <div key={applicant.id} className="flex items-center justify-between p-2 border rounded-md">
                                                  <div className="flex items-center gap-3">
                                                      <Avatar className="h-8 w-8">
                                                          <AvatarImage src={applicant.userAvatar || "/placeholder.svg"} alt={applicant.userName} />
                                                          <AvatarFallback className="bg-blue-500 text-white">
                                                              {applicant.userInitials}
                                                          </AvatarFallback>
                                                      </Avatar>
                                                      <div>
                                                          <p className="text-sm font-medium">{applicant.userName}</p>
                                                          <p className="text-xs text-muted-foreground">Applied {new Date(applicant.appliedAt).toLocaleDateString()}</p>
                                                      </div>
                                                  </div>
                                                  <Button
                                                      onClick={() => handleApproveMembership(club.id, applicant.id, applicant.userName)}
                                                      disabled={loadingAction}
                                                      size="sm"
                                                      className="bg-green-500 hover:bg-green-600 text-white"
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
                              </div>
                          )}

                      </CardContent>
                      <CardFooter className="flex flex-wrap gap-2">
                          <Button className="bg-primary rounded-full hover:bg-primary-light text-primary-foreground">Exit Club</Button>
                          {club.admin && (
                          <>
                              <Dialog>
                              <DialogTrigger asChild>
                                  <Button variant="outline" className="text-bookWhite">
                                  <BookMarked className="mr-1 h-4 w-4" /> Set New Book
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
                                  <Button variant="outline" className="text-bookWhite">
                                  <CalendarDays className="mr-1 h-4 w-4" /> Complete Meeting
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
                      </Card>
                  ))
                )}
                </TabsContent>

                <TabsContent value="discover" className="space-y-6">
                {discoverClubs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">No new clubs to discover at the moment. Check back later!</p>
                ) : (
                  discoverClubs.map((club) => (
                      <Card key={club.id}>
                      <CardHeader className="pb-2 text-secondary-light">
                          <CardTitle>{club.name}</CardTitle>
                          <CardDescription className="pt-1 font-serif font-medium text-sm/4">{club.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <div className="grid grid-cols-2 gap-4 pt-2">
                              <div className="flex items-center gap-2">
                                  <Users className="h-5 w-5 text-accent-variant" />
                                  <div>
                                  <p className="text-sm/3 font-medium">Members</p>
                                  <p className="text-sm font-serif text-secondary/50 font-medium">{club.memberCount} people</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-2">
                                  <CalendarDays className="h-5 w-5 text-accent-variant" />
                                  <div>
                                  <p className="text-sm/3 font-medium">Next Meeting</p>
                                  <p className="text-sm font-serif text-secondary/50 font-medium">June 17, 2025</p> {/* This is hardcoded static data */}
                                  </div>
                              </div>
                          </div>

                          <div className="mt-3">
                          <p className="text-sm font-medium mb-1">Current Book</p>
                          <div className="bg-secondary-light/10 p-3 rounded-lg flex gap-3">
                              <div className="w-16 h-24 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                              <img
                                  src={club.currentBook?.cover || "/placeholder.svg"} // Optional chaining
                                  alt={`${club.currentBook?.title || 'No book'} cover`}
                                  className="max-h-full"
                              />
                              </div>
                              <div>
                              <p className="font-medium text-sm/4">{club.currentBook?.title || 'No current book'}</p>
                              <p className="text-xs text-secondary font-serif font-medium">{club.currentBook?.author}</p>
                              <p className="mt-2 flex items-center gap-1 text-xs font-serif font-medium text-secondary rounded-full py-0 px-2 bg-accent-variant/40">
                                  567 pages - 7h 23min {/* This is hardcoded static data */}
                              </p>
                              <p className="text-xs mt-2 font-serif underline text-secondary">view book details</p>
                              </div>
                          </div>
                          </div>
                      </CardContent>
                      <CardFooter className="flex justify-end">
                          {/* --- Conditional Join Button in Discover Tab --- */}
                          {club.membershipStatus === 'PENDING' ? (
                              <Badge variant="secondary" className="px-4 py-2 text-primary font-serif">
                                  Pending Application
                              </Badge>
                          ) : club.membershipStatus === 'ACTIVE' ? (
                              <Badge className="bg-green-500 text-white px-4 py-2 font-serif">
                                  Already a Member
                              </Badge>
                          ) : (
                              <Button
                                  onClick={() => handleJoinClub(club.id)}
                                  disabled={loadingAction} // Use loadingAction for button
                                  className="bg-primary rounded-full hover:bg-primary-light text-primary-foreground"
                              >
                                  {loadingAction ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                      <Plus className="mr-2 h-4 w-4" />
                                  )}
                                  Join Club
                              </Button>
                          )}
                          {/* --- END Conditional Join Button --- */}
                      </CardFooter>
                      </Card>
                  ))
                )}
                </TabsContent>
            </Tabs>
            </div>
        </div>
  )
}