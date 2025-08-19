"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CalendarDays, Plus, Search, X, Settings, Users, Calendar, BookMarked, Clock, Loader2, Check } from "lucide-react"
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
import { Club, ClubInvitation } from "@/lib/clubs";
import Link from "next/link";
import { useRouter } from 'next/navigation'; // Import useRouter
import { formatDate } from "@/lib/utils"
import { ClubMemberList } from "@/components/club-member-avatar";

interface ClubsMainProps {
  initialMyClubs: Club[];
  initialDiscoverClubs: Club[];
  initialPendingInvitations: ClubInvitation[];
}

// Get base URL for API calls (this is copy of the function from lib/clubs.ts)
// This might still be needed if you have other client-side API calls that are not related to club fetching.
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '';
  }
  return process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
};

// Helper function to calculate days until meeting
const calculateDaysUntilMeeting = (meetingDate: string | Date): string => {
  try {
    const meetingTime = new Date(meetingDate).getTime();
    const currentTime = new Date().getTime();
    const daysUntil = Math.ceil((meetingTime - currentTime) / (1000 * 60 * 60 * 24));
    
    if (daysUntil > 0) {
      return `Meeting in ${daysUntil} days`;
    } else if (daysUntil === 0) {
      return `Meeting today`;
    } else {
      return `Meeting was ${Math.abs(daysUntil)} days ago`;
    }
  } catch (error) {
    return `Meeting date unavailable`;
  }
};

// Reusable component for displaying club members
function ClubMembersSection({ members, memberCount }: { 
  members?: Array<{ id: string; display_name: string;  avatar_url?: string; role: string; joined_at: string; }>;
  memberCount: number;
}) {
  // No need for API call anymore since we have the data
  if (!members || members.length === 0) {
    // Fallback to showing member count only if no members data
    return (
      <div className="mt-0">
        <p className="text-sm font-medium mb-1 text-secondary-light">Members</p>
        <p className="text-xs text-secondary/60">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
      </div>
    );
  }

  // Extract member IDs for the ClubMemberList component
  const memberIds = members.map(member => member.id);

  return (
    <div className="mt-2">
      <p className="text-sm font-medium mb-1 text-secondary-light">Members</p>
      <ClubMemberList 
        memberIds={memberIds} 
        maxDisplay={8} 
        size="md" 
      />
    </div>
  );
}

export default function ClubsMain({
  initialMyClubs,
  initialDiscoverClubs,
  initialPendingInvitations
}: ClubsMainProps) {
  const router = useRouter(); // Initialize router
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("my-clubs"); // State for active tab
  const [loadingAction, setLoadingAction] = useState(false); // For join/approve/create actions
  
  // states for the Create Club form
  const [newClubName, setNewClubName] = useState("");
  const [newClubDescription, setNewClubDescription] = useState("");
  const [newClubPrivacy, setNewClubPrivacy] = useState<"public" | "private">("public");
  const [isCreateClubDialogOpen, setIsCreateClubDialogOpen] = useState(false); // To control dialog closing
  
  // Genre-related states for Create Club
  const [selectedGenre, setSelectedGenre] = useState("");
  const [clubGenres, setClubGenres] = useState<string[]>([]);

  // Genres array (same as profile-setup)
  const genres = [
    "Biography",
    "Children's",
    "Classics",
    "Comedy",
    "Contemporary Fiction",
    "Dark Romance",
    "Fantasy",
    "Fiction",
    "Graphic Novels",
    "Healing Fiction",
    "Historical Fiction",
    "Horror",
    "Literary Fiction",
    "Manga",
    "Memoir",
    "Mystery",
    "New Adult",
    "Non-Fiction",
    "Poetry",
    "Psychological Thriller",
    "Romance",
    "Romcoms",
    "Romantasy",
    "Science Fiction",
    "Self-Help",
    "Short Stories",
    "Spirituality",
    "Thriller",
    "True Crime",
    "Young Adult"
  ];

  // Genre helper functions
  const addGenre = () => {
    if (selectedGenre && !clubGenres.includes(selectedGenre)) {
      setClubGenres([...clubGenres, selectedGenre]);
      setSelectedGenre("");
    }
  };

  const removeGenre = (genre: string) => {
    setClubGenres(clubGenres.filter((g) => g !== genre));
  };
  
  // Initialize with server-provided data
  const [myClubs, setMyClubs] = useState<Club[]>(initialMyClubs);
  const [discoverClubs, setDiscoverClubs] = useState<Club[]>(initialDiscoverClubs);
  const [pendingInvitations, setPendingInvitations] = useState<ClubInvitation[]>(initialPendingInvitations);

  // Effect to update local state when props change (e.g., after router.refresh())
  useEffect(() => {
    setMyClubs(initialMyClubs);
    console.log("initialMyClubs", initialMyClubs)
    
  }, [initialMyClubs]);
//console.log(initialMyClubs)
  useEffect(() => {
    setDiscoverClubs(initialDiscoverClubs);
  }, [initialDiscoverClubs]);

  useEffect(() => {
    setPendingInvitations(initialPendingInvitations);
  }, [initialPendingInvitations]);

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
          isPrivate: newClubPrivacy === "private",
          genres: clubGenres,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create club.");
      }

      const result = await response.json();
      console.log("Club created successfully:", result);
      toast.success(`Club "${result.name}" created successfully!`);

      setNewClubName("");
      setNewClubDescription("");
      setNewClubPrivacy("public");
      setClubGenres([]);
      setSelectedGenre("");
      setIsCreateClubDialogOpen(false);

      router.refresh(); // Refresh server-side data

    } catch (err: any) {
      toast.error(`Error creating club: ${err.message}`);
      console.error("Error creating club:", err);
    } finally {
      setLoadingAction(false);
    }
  };
console.log(pendingInvitations);
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
      // Find club name from the current discoverClubs state for the toast message
      const clubName = discoverClubs.find(c => c.id === clubId)?.name || 'the club';
      toast.success(`Successfully applied to join "${clubName}"! Your request is pending approval.`);
      
      router.refresh(); // Refresh server-side data

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
        body: JSON.stringify({ membershipId }), // Only membershipId is needed by the backend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve membership.");
      }

      const result = await response.json();
      console.log("Approval successful:", result);
      toast.success(`Successfully approved ${applicantName}'s membership!`);

      router.refresh(); // Refresh server-side data

    } catch (err: any) {
      toast.error(`Error approving membership: ${err.message}`);
      console.error("Error approving membership:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDenyMembership = async (clubId: string, membershipId: string, applicantName: string) => {
  const baseUrl = getBaseUrl();
  setLoadingAction(true);

  try {
    const response = await fetch(`${baseUrl}/api/clubs/deny`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ membershipId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to deny membership.");
    }

    const result = await response.json();
    console.log("Denial successful:", result);
    toast.success(`Denied ${applicantName}'s membership request.`);

    router.refresh(); // Refresh the list to reflect change
  } catch (err: any) {
    toast.error(`Error denying membership: ${err.message}`);
    console.error("Error denying membership:", err);
  } finally {
    setLoadingAction(false);
  }
};

  // Add new functions for handling invitations
  const handleAcceptInvitation = async (invitationId: string, clubName: string) => {
    const baseUrl = getBaseUrl();
    setLoadingAction(true);
    try {
      const response = await fetch(`${baseUrl}/api/invitations/${invitationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'accept' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept invitation.");
      }

      const result = await response.json();
      console.log("Invitation accepted:", result);
      toast.success(`Successfully joined "${clubName}"!`);
      
      router.refresh(); // Refresh server-side data

    } catch (err: any) {
      toast.error(`Error accepting invitation: ${err.message}`);
      console.error("Error accepting invitation:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeclineInvitation = async (invitationId: string, clubName: string) => {
    const baseUrl = getBaseUrl();
    setLoadingAction(true);
    try {
      const response = await fetch(`${baseUrl}/api/invitations/${invitationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'decline' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to decline invitation.");
      }

      const result = await response.json();
      console.log("Invitation declined:", result);
      toast.success(`Declined invitation to "${clubName}".`);
      
      router.refresh(); // Refresh server-side data

    } catch (err: any) {
      toast.error(`Error declining invitation: ${err.message}`);
      console.error("Error declining invitation:", err);
    } finally {
      setLoadingAction(false);
    }
  };
  
  
  const filteredClubs = myClubs?.filter((club) =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.genres?.some((genre: string) => genre.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const filteredDiscoverClubs = discoverClubs?.filter((club) =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.genres?.some((genre: string) => genre.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  
  
  // --- Render Logic ---

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
                        <div className="grid gap-2">
                          <Label htmlFor="genres">Preferred Genres (Optional)</Label>
                          <div className="flex gap-2">
                            <Select value={selectedGenre} onValueChange={setSelectedGenre} disabled={loadingAction}>
                              <SelectTrigger className="bg-bookWhite text-secondary">
                                <SelectValue placeholder="Choose a genre" />
                              </SelectTrigger>
                              <SelectContent>
                                {genres.filter(genre => !clubGenres.includes(genre)).map((genre) => (
                                  <SelectItem key={genre} value={genre}>
                                    {genre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              type="button"
                              onClick={addGenre} 
                              disabled={!selectedGenre || loadingAction}
                              className="bg-primary hover:bg-primary-light text-primary-foreground"
                            >
                              Add
                            </Button>
                          </div>
                          {clubGenres.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {clubGenres.map((genre) => (
                                <Badge 
                                  key={genre} 
                                  variant="secondary" 
                                  className="bg-primary/70 text-secondary hover:bg-primary cursor-pointer"
                                  onClick={() => removeGenre(genre)}
                                >
                                  {genre} <X className="ml-1 h-3 w-3" />
                                </Badge>
                              ))}
                            </div>
                          )}
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
                        {/* <div className="grid gap-2 opacity-50 cursor-not-allowed">
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
                        </div> */}
                        {/* <div className="grid gap-2 opacity-50 cursor-not-allowed">
                            <Label htmlFor="invite">Invite Members (Optional)</Label>
                            <Input id="invite" placeholder="Enter email addresses, separated by commas" disabled />
                            <p className="text-xs text-muted-foreground">This feature is not yet implemented.</p>
                        </div> */}
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

            <div className="relative mb-4">
                <Search className="absolute left-3 top-2 h-4 w-4 text-secondary" />
                <Input
                    placeholder="Search reading clubs..."
                    className="pl-10 bg-bookWhite placeholder:text-secondary/60 text-secondary"
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

                <TabsContent value="my-clubs" className="space-y-3">
                {/* Add Pending Invitations Section */}
                {pendingInvitations.length > 0 && (
                  <div className="space-y-3">
                    {pendingInvitations.map((invitation) => (
                      <Card key={invitation.id} className="border-none pb-3">
                        <CardHeader className="px-3 pt-3 pb-2">
                          <div className="flex flex-col w-full">
                            <div className="flex w-full items-start gap-2">
                              {/* Left side: Title */}
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-xl/5 break-words text-secondary-light m-0 p-0">
                                  {invitation.club.name}
                                </CardTitle>
                              </div>

                              {/* Right side: Invitation Badge */}
                              <div className="flex flex-row items-start flex-none gap-2">
                                <Badge variant="outline" className="h-6 bg-accent/40 border-none text-secondary font-serif">
                                  Invitation
                                </Badge>
                              </div>
                            </div>

                            {/* Description */}
                            <CardDescription className="font-serif font-medium text-sm/4 pt-1">
                              {invitation.club.description}
                            </CardDescription>

                            {/* Genres */}
                            {invitation.club.genres && invitation.club.genres.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {invitation.club.genres.slice(0, 3).map((genre) => (
                                  <Badge 
                                    key={genre} 
                                    variant="outline" 
                                    className="bg-accent/20 text-secondary text-xs border-none"
                                  >
                                    {genre}
                                  </Badge>
                                ))}
                                {invitation.club.genres.length > 3 && (
                                  <Badge 
                                    variant="outline" 
                                    className="bg-accent/20 text-secondary text-xs border-none"
                                  >
                                    +{invitation.club.genres.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Invitation Details */}
                            {/* <div className="mt-2 p-2 bg-accent/10 rounded-md">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={invitation.inviter_avatar || "/placeholder.svg"} alt={invitation.inviter_name} />
                                  <AvatarFallback className="bg-blue-500 text-white text-xs">
                                    {invitation.inviter_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="text-sm font-medium text-secondary">
                                  Invited by {invitation.inviter_name}
                                </p>
                                <span className="text-xs text-secondary/60 font-serif">
                                  {formatDate(invitation.created_at)}
                                </span>
                              </div>
                              {invitation.message && (
                                <p className="text-sm text-secondary/80 font-serif italic mt-1 pl-8">
                                  "{invitation.message}"
                                </p>
                              )}
                            </div> */}
                          </div>
                        </CardHeader>
                        <CardContent className="px-3 py-0">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                            {invitation.club.current_book ? (
                              <div className="col-span-1">
                                <p className="text-sm font-medium mb-1 text-secondary-light">Current Book</p>
                                <div className="bg-secondary/5 p-3 w-auto rounded-lg flex gap-3">
                                  <div className="w-16 h-24 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                                    <Link href={`/books/${invitation.club.current_book?.id}`}>
                                    <img
                                      src={invitation.club.current_book?.cover_url || "/placeholder.svg"}
                                      alt={`${invitation.club.current_book?.title || 'No book'} cover`}
                                      className="max-h-full"
                                    />
                                    </Link>
                                  </div>
                                  <div>
                                    <Link href={`/books/${invitation.club.current_book?.id}`}>
                                      <p className="font-medium text-sm/4">{invitation.club.current_book?.title || 'No current book'}</p>
                                    </Link>
                                    <p className="text-xs text-secondary font-serif font-medium">{invitation.club.current_book?.author}</p>
                                    {/* Genre Tags */}
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {invitation.club.current_book?.genres?.slice(0, 1).map((genre: string) => (
                                        <span
                                          key={genre}
                                          className="bg-primary/30 text-secondary/40 text-xs/3 font-medium px-2 py-0.5 rounded-full truncate inline-block max-w-[200px] overflow-hidden whitespace-nowrap"
                                        >
                                          {genre}
                                        </span>
                                      ))}
                                    </div>
                                    {invitation.club.current_book?.pages && (
                                    <div className="flex">
                                        <p className="text-secondary text-xs/4">{invitation.club.current_book?.pages} pages • {invitation.club.current_book?.reading_time}</p>
                                    </div>
                                    )}
                                    {invitation.club.meetings && invitation.club.meetings.length > 0 ? (
                                      <span className="flex flex-row items-center w-36 mt-1.5 h-5 px-2 bg-accent-variant/75 text-bookWhite text-xs/3 rounded-full font-serif font-medium">
                                        <Calendar className="h-3 w-3 mr-1"/>
                                        {calculateDaysUntilMeeting(invitation.club.meetings[0].meeting_date)}.
                                      </span>
                                      ) : (
                                      <span className="flex flex-row items-center w-40 mt-1.5 h-5 px-2 bg-accent-variant/75 text-bookWhite text-xs/3 rounded-full font-serif font-medium">
                                        <Calendar className="h-3 w-3 mr-1"/>
                                        No meeting date set.
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="col-span-1">
                                <p className="text-sm font-normal mb-1 bg-secondary/5 py-1 px-2 inline-block text-secondary/60 rounded-md italic">
                                  No book has been chosen
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="mt-0">
                            <ClubMembersSection 
                              members={invitation.club.members} 
                              memberCount={invitation.club.memberCount} 
                            />
                          </div>

                          {/* Invitation Action Card */}
                          <div className="mt-2">
                            <Card className="bg-secondary/5 p-2 rounded-lg">
                              <CardHeader className="pb-0 px-0 pt-0">
                                <CardTitle className="text-secondary-light text-sm font-medium flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={invitation.inviter_avatar || "/placeholder.svg"} alt={invitation.inviter_name} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                      {invitation.inviter_name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  {invitation.inviter_name} invited you to join this club!
                                </CardTitle>
                                <span className="text-xs text-secondary/60 font-serif pl-6">
                                  {formatDate(invitation.created_at)}
                                </span>
                              </CardHeader>
                              <CardContent className="px-0 py-0">
                                <div className="flex flex-row justify-end items-center">
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleDeclineInvitation(invitation.id, invitation.club.name)}
                                      disabled={loadingAction}
                                      size="sm"
                                      variant="outline"
                                      className="border-none text-bookWhite bg-red-600 hover:bg-red-900 rounded-full h-7 text-xs px-3"
                                    >
                                      {loadingAction ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <X className="h-4 w-4" />
                                      )}
                                      Decline
                                    </Button>
                                    <Button
                                      onClick={() => handleAcceptInvitation(invitation.id, invitation.club.name)}
                                      disabled={loadingAction}
                                      size="sm"
                                      className="bg-accent-variant/80 hover:bg-accent-variant text-white rounded-full h-7 text-xs px-3"
                                    >
                                      {loadingAction ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Check className="h-4 w-4" />
                                      )}
                                      Accept
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Existing My Clubs Section */}
                {myClubs.length === 0 && pendingInvitations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">You are not a member of any clubs yet. Explore the "Discover" tab!</p>
                ) : myClubs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">No active club memberships. Check your invitations above or explore the "Discover" tab!</p>
                ) : filteredClubs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">
                    {searchQuery ? `No clubs found matching "${searchQuery}"` : "No clubs to display"}
                  </p>
                ) : (
                  filteredClubs.map((club) => (
                      <Card key={club.id}>
                      <CardHeader className="px-3 pt-3 pb-2">
                        <div className="flex flex-col w-full">
                            <div className="flex w-full items-start gap-2">
                                {/* Left side: Title */}
                                <div className="flex-1 min-w-0">
                                    <Link href={`/clubs/${club.id}`}>
                                    <CardTitle className="text-xl/5 break-words text-secondary-light m-0 p-0">
                                        {club.name}
                                    </CardTitle>
                                    </Link>
                                </div>

                                {/* Right side: Badges + Button */}
                                <div className="flex flex-row items-start flex-none gap-2">
                                    {club.admin && (
                                    <Badge variant="outline" className="h-6 bg-primary/40 border-none text-secondary font-serif">
                                        Admin
                                    </Badge>
                                    )}
                                    {club.membershipStatus === 'ACTIVE' && !club.admin && (
                                    <Badge className="bg-accent-variant/30 text-secondary font-serif">
                                        Member
                                    </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <CardDescription className="font-serif font-medium text-sm/4 pt-1">
                            {club.description}
                            </CardDescription>

                            {/* Genres */}
                            {club.genres && club.genres.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {club.genres.slice(0, 3).map((genre) => (
                                  <Badge 
                                    key={genre} 
                                    variant="outline" 
                                    className="bg-accent/20 text-secondary text-xs border-none"
                                  >
                                    {genre}
                                  </Badge>
                                ))}
                                {club.genres.length > 3 && (
                                  <Badge 
                                    variant="outline" 
                                    className="bg-accent/20 text-secondary text-xs border-none"
                                  >
                                    +{club.genres.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                        </div>
                      </CardHeader>
                      <CardContent className="px-3 py-0">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                            {club.current_book ? (
                            <div className="col-span-1">
                                <p className="text-sm font-medium mb-1 text-secondary-light">Current Book</p>
                                <div className="bg-secondary/5 p-3 w-auto rounded-lg flex gap-3">
                                    <div className="w-16 h-24 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                                        <Link href={`/books/${club.current_book?.id}`}>
                                        <img
                                        src={club.current_book?.cover_url || "/placeholder.svg"} // Use optional chaining
                                        alt={`${club.current_book?.title || 'No book'} cover`}
                                        className="max-h-full"
                                        />
                                        </Link>
                                    </div>
                                    <div>
                                      <Link href={`/books/${club.current_book?.id}`}>
                                        <p className="font-medium text-sm/4">{club.current_book?.title || 'No current book'}</p>
                                      </Link>
                                      <p className="text-xs text-secondary font-serif font-medium">{club.current_book?.author}</p>
                                      {/* Genre Tags */}
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {club.current_book?.genres?.slice(0, 1).map((genre: string) => (
                                          <span
                                            key={genre}
                                            className="bg-primary/30 text-secondary/40 text-xs/3 font-medium px-2 py-0.5 rounded-full truncate inline-block max-w-[200px] overflow-hidden whitespace-nowrap"
                                          >
                                            {genre}
                                          </span>
                                        ))}
                                      </div>
                                      {club.current_book?.pages && (
                                      <div className="flex">
                                          <p className="text-secondary text-xs/4">{club.current_book?.pages} pages • {club.current_book?.reading_time}</p>
                                      </div>
                                      )}
                                      {club.meetings && club.meetings.length > 0 ? (
                                        <span className="flex flex-row items-center w-36 mt-1.5 h-5 px-2 bg-accent-variant/75 text-bookWhite text-xs/3 rounded-full font-serif font-medium">
                                          <Calendar className="h-3 w-3 mr-1"/>
                                          {calculateDaysUntilMeeting(club.meetings[0].meeting_date)}.
                                        </span>
                                        ) : (
                                        <span className="flex flex-row items-center w-40 mt-1.5 h-5 px-2 bg-accent-variant/75 text-bookWhite text-xs/3 rounded-full font-serif font-medium">
                                          <Calendar className="h-3 w-3 mr-1"/>
                                          No meeting date set.
                                        </span>
                                      )}
                                    </div>
                                </div>
                            </div>
                        ):(
                            <div className="col-span-1">
                                <p className="text-sm font-normal mb-1 bg-secondary/5 py-1 px-2 inline-block text-secondary/60 rounded-md italic">No book has been chosen</p>
                            </div>
                        )} 

                          {/* <div className="col-span-2">
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
                          </div> */}
                          </div>

                          <div className="mt-0">
                            <ClubMembersSection 
                              members={club.members} 
                              memberCount={club.memberCount} 
                            />
                          </div>

                          {/* --- Admin section for Pending Applications --- */}
                          {club.admin && club.pendingMemberships && club.pendingMemberships.length > 0 && (
                              <div className="mt-0">
                                  <Card className="">
                                      <CardHeader className="pb-1 px-0 pt-2">
                                          <CardTitle className="text-secondary-light text-sm font-medium">Pending Applications</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2 px-0 py-0">
                                          {club.pendingMemberships.map((applicant) => (
                                              <div key={applicant.id} className="flex items-center justify-between p-2 bg-secondary/5 rounded-md">
                                                  <div className="flex items-center gap-3">
                                                      <Avatar className="h-8 w-8">
                                                          <AvatarImage src={applicant.userAvatar || "/placeholder.svg"} alt={applicant.userName} />
                                                          <AvatarFallback className="bg-blue-500 text-white">
                                                              {applicant.userInitials}
                                                          </AvatarFallback>
                                                      </Avatar>
                                                      <div className="flex-1 min-w-0">
                                                          <p className="text-sm/4 font-medium break-words">{applicant.userName}</p>
                                                          {/* <p className="font-serif font-medium text-xs/4 text-secondary/60">Applied {new Date(applicant.appliedAt).toLocaleDateString()}</p> */}
                                                      <p className="font-serif font-normal text-xs/3 text-secondary/60">Applied {formatDate(applicant.appliedAt)}</p>
                                                      </div>
                                                  </div>
                                                  <div className="flex items-center">
                                                    {/* // Make sure you also have an API route at /api/clubs/deny on the backend, 
                                                    expecting a POST request with membershipId, and removing or updating that membership accordingly. */}
                                                    <Button
                                                        onClick={() => handleDenyMembership(club.id, applicant.id, applicant.userName)}
                                                        disabled={loadingAction}
                                                        size="sm"
                                                        className="bg-red-600 hover:bg-red-900 text-white rounded-full h-6 mr-1 text-xs px-2"
                                                    >
                                                        {loadingAction ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <X className="h-4 w-4" />
                                                        )}
                                                        Deny
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleApproveMembership(club.id, applicant.id, applicant.userName)}
                                                        disabled={loadingAction}
                                                        size="sm"
                                                        className="bg-accent-variant/80 hover:bg-accent-variant text-white rounded-full h-6 text-xs px-2"
                                                    >
                                                        {loadingAction ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Check className="h-4 w-4" />
                                                        )}
                                                        Approve
                                                    </Button>
                                                  </div>
                                              </div>
                                          ))}
                                      </CardContent>
                                  </Card>
                              </div>
                          )}

                      </CardContent>
                      <CardFooter className="flex flex-wrap gap-0">
                          {/* <Button className="bg-primary rounded-full hover:bg-primary-light text-primary-foreground">Exit Club</Button> */}
                          {/* {club.admin && (
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
                                          src={club.current_book?.cover_url || "/placeholder.svg"} // Optional chaining
                                          alt={`${club.current_book?.title || 'No book'} cover`}
                                          className="max-h-full"
                                      />
                                      </div>
                                      <div>
                                      <p className="font-medium text-sm">{club.current_book?.title}</p>
                                      <p className="text-xs text-muted-foreground">{club.current_book?.author}</p>
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
                          )} */}
                      </CardFooter>
                      </Card>
                  ))
                )}
                </TabsContent>

                <TabsContent value="discover" className="space-y-3">
                {filteredDiscoverClubs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">
                    {searchQuery ? `No clubs found matching "${searchQuery}"` : "No new clubs to discover at the moment. Check back later!"}
                  </p>
                ) : (
                  filteredDiscoverClubs.map((club) => (
                      <Card key={club.id}>
                      <CardHeader className="pb-2 text-secondary-light items-start px-3 pt-3">
                        {/* Left side: Title */}
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-xl/5 break-words text-secondary-light m-0 p-0">
                                    {club.name}
                                </CardTitle>
                            </div>
                          <CardDescription className="pt-1 font-serif font-medium text-sm/4">{club.description}</CardDescription>

                          {/* Genres */}
                          {club.genres && club.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {club.genres.slice(0, 3).map((genre) => (
                                <Badge 
                                  key={genre} 
                                  variant="outline" 
                                  className="bg-accent/20 text-secondary text-xs border-none"
                                >
                                  {genre}
                                </Badge>
                              ))}
                              {club.genres.length > 3 && (
                                <Badge 
                                  variant="outline" 
                                  className="bg-accent/20 text-secondary text-xs border-none"
                                >
                                  +{club.genres.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                      </CardHeader>
                      <CardContent className="px-3 py-0">
                        {club.current_book ? (
                            <div className="col-span-1">
                                <p className="text-sm font-medium mb-1">Current Book</p>
                                <div className="bg-secondary/5 p-3 w-auto rounded-lg flex gap-3">
                                    <div className="w-16 h-24 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                                        <img
                                        src={club.current_book?.cover_url || "/placeholder.svg"} // Use optional chaining
                                        alt={`${club.current_book?.title || 'No book'} cover`}
                                        className="max-h-full"
                                        />
                                    </div>
                                    <div>
                                      <Link href={`/books/${club.current_book?.id}`}>
                                        <p className="font-medium text-sm/4">{club.current_book?.title || 'No current book'}</p>
                                      </Link>
                                      <p className="text-xs text-secondary font-serif font-medium">{club.current_book?.author}</p>
                                      {/* Genre Tags */}
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {club.current_book?.genres?.slice(0, 1).map((genre: string) => (
                                          <span
                                            key={genre}
                                            className="bg-primary/30 text-secondary/40 text-xs/3 font-medium px-2 py-0.5 rounded-full truncate inline-block max-w-[200px] overflow-hidden whitespace-nowrap"
                                          >
                                            {genre}
                                          </span>
                                        ))}
                                      </div>
                                      {club.current_book?.pages && (
                                      <div className="flex">
                                          <p className="text-secondary text-xs/4">{club.current_book?.pages} pages • {club.current_book?.reading_time}</p>
                                      </div>
                                      )}
                                      {club.meetings && club.meetings.length > 0 ? (
                                        <span className="flex flex-row items-center w-36 mt-1.5 h-5 px-2 bg-accent-variant/75 text-bookWhite text-xs/3 rounded-full font-serif font-medium">
                                          <Calendar className="h-3 w-3 mr-1"/>
                                          {calculateDaysUntilMeeting(club.meetings[0].meeting_date)}.
                                        </span>
                                      ) : (
                                        <span className="flex flex-row items-center w-40 mt-1.5 h-5 px-2 bg-accent-variant/75 text-bookWhite text-xs/3 rounded-full font-serif font-medium">
                                          <Calendar className="h-3 w-3 mr-1"/>
                                          No meeting date set.
                                        </span>
                                      )}
                                    </div>
                                </div>
                            </div>
                        ):(
                            <div className="col-span-1">
                                <p className="text-sm font-normal mb-1 bg-secondary/5 py-1 px-2 inline-block text-secondary/60 rounded-md italic">No book has been chosen</p>
                            </div>
                        )} 
                        <div className="mt-0">
                            <ClubMembersSection 
                              members={club.members} 
                              memberCount={club.memberCount} 
                            />
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end pt-3 px-3 pb-3">
                          {/* --- Conditional Join Button in Discover Tab --- */}
                          {club.membershipStatus === 'PENDING' ? (
                              <Badge variant="secondary" className="px-4 py-2 text-primary font-serif">
                                  Pending Response
                              </Badge>
                          ) : club.membershipStatus === 'ACTIVE' ? (
                              <Badge className="bg-accent-variant/70 text-white px-4 py-2 font-serif">
                                  Already a Member
                              </Badge>
                          ) : (
                              <Button
                                  onClick={() => handleJoinClub(club.id)}
                                  disabled={loadingAction} // Use loadingAction for button
                                  className="bg-primary rounded-full hover:bg-primary-light text-primary-foreground"
                              >
                                  {loadingAction ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                      <Plus className="h-4 w-4" />
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


 // Inside your map of activityFeedItems
            // if (item.type === 'ADDED_BOOK_TO_SHELF') return <AddedToShelfCard item={item} />;

            // AddedToShelfCard.tsx (new component)
            // function AddedToShelfCard({ item }) {
            //   return (
            //     <Card>
            //       <UserAvatar user={item.user} />
            //       <CardTitle>
            //         {item.user.display_name} added {item.book.title} to their '{item.shelfOrStatus}' shelf.
            //       </CardTitle>
            //       <BookCover book={item.book} />
            //       <Timestamp time={item.timestamp} />
            //     </Card>
            //   );
            // }