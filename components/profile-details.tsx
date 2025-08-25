"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookMarked, ArrowLeft, Smartphone, BookOpen, Headphones, CircleCheckBig, CircleAlert, Star, UserMinus, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ProfileBookHistory } from "./profile-book-history";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Books, Bookmark, CheckCircle } from "@phosphor-icons/react"
import { BookDetails, BookFile, UserBook, StatusDisplay, TabDisplay } from "@/types/book";
import Link from "next/link";
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { LucideHeart, LucideThumbsUp, LucideThumbsDown } from "lucide-react"
import { AddFriendButton } from '@/components/social/add-friend-button';
import { UserProfileMinimal } from '@/types/social';
import { toast } from "sonner";

// Re-define these with consistent types matching Prisma enums
const statuses: StatusDisplay[] = [
  { label: "⏳ In Progress", value: "in_progress", color: "bg-accent-variant text-bookWhite" },
  { label: "💫 Almost Done", value: "almost_done", color: "bg-accent-variant text-bookWhite" },
  { label: "🔥 Finished", value: "finished", color: "bg-accent-variant text-bookWhite" },
  { label: "😑 Unfinished", value: "unfinished", color: "bg-accent-variant text-bookWhite" },
];

const TABS: TabDisplay[] = [
  { label: "Currently Reading", value: "currently_reading" }, // Matches Prisma shelf_type
  { label: "Reading Queue", value: "queue" }, // Matches Prisma shelf_type
];

const readingOptions = [
  { label: "AudioBook", icon: Headphones, value: "audio_book" },
  { label: "E-Reader", icon: Smartphone, value: "e_reader" },
  { label: "Physical Book", icon: BookOpen, value: "physical_book" },
];

// Helper to get status display info
const getStatusDisplay = (statusCode: UserBook['status']): StatusDisplay => {
  return statuses.find(s => s.value === statusCode) || statuses[0]; // Default to "In Progress" if not found
};

// Helper function to get media type display info
const getMediaTypeDisplay = (mediaType: UserBook['media_type']) => {
  return readingOptions.find(option => option.value === mediaType) || readingOptions[1]; // Default to E-Reader
};

// Helper function to get comment display info
const getCommentDisplay = (comment: UserBook['comment']) => {
  return comment;
};

// Add interface for profile data
interface ProfileData {
  id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  about: string | null;
  favorite_genres: string[] | null;
  userBooks?: UserBook[]; // Optional for non-friends
  addedBooks?: any[]; // Optional for non-friends
  isFriend: boolean; // New property to track friendship status
  friendshipStatus: 'NOT_FRIENDS' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS';
  pendingRequestId?: string | null; // Added for handling friend requests
  _count: {
    friendshipsAsUser1: number,
    friendshipsAsUser2: number,
    memberships: number;
  };
}

// History Book Item Component - simplified without external menu
interface HistoryBookItemProps {
  userBook: UserBook;
  bookStatus: UserBook['status'];
  bookMediaType: UserBook['media_type'];
  profileUserId: string; // The friend's user ID whose profile we're viewing
  profileDisplayName: string | null;
}

function ProfileBookHistoryItem({ userBook, bookStatus, bookMediaType, profileUserId, profileDisplayName }: HistoryBookItemProps) {
  return (
    <div className="relative w-auto cursor-pointer">
      <ProfileBookHistory 
        historyBooks={userBook} 
        bookStatus={bookStatus}
        bookMediaType={bookMediaType}
        profileUserId={profileUserId}
        profileDisplayName={profileDisplayName}
      />
      {/* Status indicators */}
      {userBook.status === 'finished' && (
        <span className="absolute bottom-1 right-1 bg-green-600/50 text-bookWhite text-xs font-bold px-1 py-1 rounded-full shadow-md">
          <CircleCheckBig className="h-4 w-4" />
        </span>
      )}
      {userBook.status === 'unfinished' && (
        <span className="absolute bottom-1 right-1 bg-accent/70 text-bookWhite text-xs font-bold px-1 py-1 rounded-full shadow-md">
          <CircleAlert className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}

export default function ProfileDetailsView({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [currentlyReadingBooks, setCurrentlyReadingBooks] = useState<UserBook[]>([]);
  const [queueBooks, setQueueBooks] = useState<UserBook[]>([]);
  const [historyBooks, setHistoryBooks] = useState<UserBook[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<UserBook[]>([]);
  const [addedBooks, setAddedBooks] = useState<BookDetails[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnfriending, setIsUnfriending] = useState(false);
  
  // Unfriend confirmation dialog state
  const [unfriendDialogOpen, setUnfriendDialogOpen] = useState(false);

  const router = useRouter();

  const {id} = useParams();

  // Fetch profile data - made accessible component-wide
  const fetchProfile = async () => {
    try {
      if (!session?.supabaseAccessToken) {
        throw new Error('No access token found');
      }
      setIsLoading(true);
      const response = await fetch(`/api/profile/${id}`, {
        headers: {
          'Authorization': `Bearer ${session?.supabaseAccessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }
      
      const profileData: ProfileData = await response.json();
      setProfile(profileData);
      //console.log(profileData);
      
      // Only categorize books if user is a friend (has access to book data)
      if (profileData.isFriend && profileData.userBooks) {
        // Categorize books based on shelf (not shelf_type)
        const currentlyReading = profileData.userBooks.filter(book => book.shelf === 'currently_reading');
        const queue = profileData.userBooks.filter(book => book.shelf === 'queue');
        const history = profileData.userBooks.filter(book => book.shelf === 'history');
        const favorites = profileData.userBooks.filter(book => book.is_favorite === true);
        
        setCurrentlyReadingBooks(currentlyReading);
        setQueueBooks(queue);
        setHistoryBooks(history);
        setFavoriteBooks(favorites);

        if (profileData.addedBooks) {          
          setAddedBooks(profileData.addedBooks)
        }
      } else {
        // Clear book data for non-friends
        setCurrentlyReadingBooks([]);
        setQueueBooks([]);
        setHistoryBooks([]);
        setFavoriteBooks([]);
        setAddedBooks([]);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profile data
  useEffect(() => {
    fetchProfile();
  }, [id, session?.supabaseAccessToken]);

  // Handle unfriend action
  const handleUnfriend = async () => {
    if (!profile || !session?.supabaseAccessToken) {
      toast.error('Unable to unfriend at this time');
      return;
    }

    setIsUnfriending(true);
    try {
      const response = await fetch('/api/friends', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        },
        body: JSON.stringify({ friendId: profile.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unfriend user');
      }

      toast.success(`You are no longer friends with ${profile.display_name ||  'this user'}`);
      
      // Refetch profile data to update UI
      await fetchProfile();

    } catch (err: any) {
      toast.error(`Error unfriending user: ${err.message}`);
      console.error('Error unfriending user:', err);
    } finally {
      setIsUnfriending(false);
      setUnfriendDialogOpen(false);
    }
  };

  // Handle friend request sent or canceled
  const handleFriendRequestSent = () => {
    // Refetch profile data immediately to get updated friendship status
    fetchProfile();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-2 py-2">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !profile) {
    return (
      <div className="container mx-auto px-2 py-2">
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-red-500">
            Error: {error || 'Profile not found'}
          </div>
        </div>
      </div>
    );
  }

  // Get display name with fallback
  const displayName = profile.full_name || profile.display_name || 'Anonymous User';
  const avatarFallback = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const currentFriends = profile._count.friendshipsAsUser1 + profile._count.friendshipsAsUser2;

  // Create target user object for AddFriendButton
  const targetUserForAddFriendButton: UserProfileMinimal = {
    id: profile.id,
    display_name: profile.display_name,
    email: '', // Email not available in non-friend profile data
    avatar_url: profile.avatar_url,
  };

  return (
    <div className="container mx-auto px-2 py-2">
      <div className="flex flex-col bg-transparent gap-2 md:items-center">
        <div className="md:container bg-transparent">
          <Card className="px-0 bg-bookWhite/90 rounded-b-3xl rounded-t-none overflow-hidden">
            <CardHeader className="relative p-0">
                {/* Banner */}
                <div className="relative h-32 w-full bg-gradient-to-r from-primary rounded-b-2xl to-accent">
                    <img
                        src="/images/background.png"
                        alt="Banner"
                        className="object-cover w-full h-full"
                    />

                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="absolute top-3 left-3 p-2 rounded-full bg-bookWhite/80 backdrop-blur-sm hover:bg-bookWhite shadow-md"
                    >
                        <ArrowLeft className="h-5 w-5 text-secondary" />
                    </button>

                    <div className="absolute top-3 right-3 gap-2">
                      {!profile.isFriend && (
                        <AddFriendButton 
                          targetUser={targetUserForAddFriendButton} 
                          initialStatus={profile.friendshipStatus}
                          pendingRequestId={profile.pendingRequestId}
                          onFriendRequestSent={handleFriendRequestSent} 
                        />
                      )}
                        
                      {/* Unfriend button - only show for friends when viewing another user's profile */}
                      {profile.isFriend && profile.id !== session?.user?.id && (
                        <div className="flex justify-start">
                          <Button
                            onClick={() => setUnfriendDialogOpen(true)}
                            disabled={isUnfriending}
                            variant="outline"
                            size="sm"
                            className="bg-transparent backdrop-blur-sm text-bookWhite/80 border-bookWhite/50 rounded-full h-8 hover:bg-red-100 hover:border-red-300"
                          >
                            {isUnfriending ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Unfriending...
                              </>
                            ) : (
                              <>
                                <UserMinus className="h-3 w-3" />
                                Unfriend
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                </div>

                {/* Avatar + user info */}
                <div className="flex flex-row px-4 pt-2 pb-4 -mt-15 items-end">
                    <div className="absolute left-4 bottom-0 flex gap-2 items-end translate-y-1/2">
                        <Avatar className="h-24 w-24 border-4 border-bookWhite rounded-full bg-bookWhite">
                            <AvatarImage src={profile.avatar_url || "/placeholder.svg?height=96&width=96"} alt={`@${displayName}`} className="h-full w-full object-cover" />
                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{avatarFallback}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col justify-end pb-2">
                            <h2 className="text-lg/4 font-semibold text-secondary-light">{displayName}</h2>
                            <p className="text-sm text-secondary-light/70 font-normal">
                                {profile.display_name}
                            </p>
                            <p className="text-xs text-secondary/50 font-normal">
                                <span>{currentFriends} friend{currentFriends !== 1 ? 's' : ''}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-14">
              <div className="space-y-1">
                <p className="text-sm leading-none text-secondary/70 font-normal mt-1">
                    <span>{profile._count.memberships} book club{profile._count.memberships !== 1 ? 's' : ''} </span>
                    {profile.isFriend && profile.addedBooks && (
                      <span>• {profile.addedBooks.length} contributions</span>
                    )}
                </p>
                <div>
                  <p className="text-sm/4 font-normal text-secondary/50 mt-0.5 pt-0">
                    {profile.about || 'No bio available'}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {profile.favorite_genres && profile.favorite_genres.length > 0 ? (
                      profile.favorite_genres.map((genre, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1 f bg-accent/20 text-accent-variant/65">
                          {genre}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary" className="px-3 py-1 font-serif bg-accent/20 text-secondary-light/70">
                        No genres specified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:container">
          {profile.isFriend ? (
            <Tabs defaultValue="currently-reading" className="w-full">
              <TabsList className="grid w-full grid-cols-5 rounded-full h-auto p-1 bg-bookWhite/10 text-primary">
                <TabsTrigger value="currently-reading" className="rounded-full data-[state=active]:text-bookWhite data-[state=active]:bg-secondary">
                  <Books size={32} />
                </TabsTrigger>
                <TabsTrigger value="reading-queue" className="rounded-full data-[state=active]:text-bookWhite data-[state=active]:bg-secondary">
                  <Bookmark size={32} />
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-full data-[state=active]:text-bookWhite data-[state=active]:bg-secondary">
                  <CheckCircle size={32} />
                </TabsTrigger>
                <TabsTrigger value="favorites" className="rounded-full data-[state=active]:text-bookWhite data-[state=active]:bg-secondary">
                  <Heart size={32} />
                </TabsTrigger>
                <TabsTrigger value="contributions" className="rounded-full data-[state=active]:text-bookWhite data-[state=active]:bg-secondary">
                  <Star size={32} />
                </TabsTrigger>
              </TabsList>

            <TabsContent value="currently-reading">
              {currentlyReadingBooks.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  No books currently reading.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {currentlyReadingBooks.map((userBook) => {
                    const currentStatusDisplay = getStatusDisplay(userBook.status);
                    const currentMediaTypeDisplay = getMediaTypeDisplay(userBook.media_type);
                    const currentCommentDisplay = getCommentDisplay(userBook.comment);
                    return (
                      <Card key={userBook.book_id} className="relative overflow-hidden bg-bookWhite py-3">
                        <div className="flex flex-row gap-3 px-4">
                          {/* Book Image */}
                          <div className="w-[100px] flex-shrink-0">
                            <Link href={`/books/${userBook.book_id}`}>
                            <img
                              src={userBook.book.cover_url || "/placeholder.svg"} // Use actual cover URL
                              alt={userBook.book.title || "Book cover"}
                              className="h-auto w-full shadow-md rounded object-cover" // Added object-cover
                            />
                            </Link>
                          </div>
                          {/* Content */}
                          <div className="flex flex-col justify-between flex-1">
                            <CardHeader className="pb-0 px-0 pt-0">
                              <Link href={`/books/${userBook.book_id}`}>
                                <CardTitle className="leading-4">{userBook.book.title}</CardTitle>
                              </Link>
                              <CardDescription className="text-xs">{userBook.book.author}</CardDescription>
                            </CardHeader>

                            <CardContent className="pb-0 px-0">
                              <div className="flex flex-col mb-1">
                                {/* Genre Tags */}
                                <div className="flex flex-wrap gap-1">
                                  {userBook.book.genres?.slice(0, 1).map((genre: string) => (
                                    <span
                                      key={genre}
                                      className="bg-accent/30 text-secondary/40 text-xs/3 font-medium px-2 py-1 rounded-full"
                                    >
                                      {genre}
                                    </span>
                                  ))}
                                </div>
                                {/* Pages & Time */}
                                {userBook.book.pages && (
                                <div className="flex-1">
                                  <p className="text-secondary/80 font-sans font-normal text-sm inline-block">{userBook.book.pages} pages • {userBook.book.reading_time}</p>
                                </div>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 items-center">
                                {/* Added On */}
                                {userBook.added_at && (
                                  <span className="px-2 py-0.5 text-xs font-regular bg-primary-dark/50 text-secondary rounded-full">
                                    Started: {new Date(userBook.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                )}

                                <div className="flex flex-wrap items-center bg-secondary/10 text-secondary rounded-full px-2 py-0.5">
                                  {/* Show the selected icon */}
                                  <currentMediaTypeDisplay.icon className="w-4 h-4" />
                                </div>

                                <div className="flex justify-start items-end">
                                  {/* Current Status Badge */}
                                  <div className="">
                                    <span className={`px-2 py-0.5 text-xs font-regular rounded-full ${currentStatusDisplay.color}`}>
                                      {currentStatusDisplay.label}
                                    </span>
                                  </div>  
                                </div>

                                {/* Personal Note/Comment - Display only for friends */}
                                {currentCommentDisplay && (
                                  <p className="flex items-center gap-1 px-2 py-0.5 text-xs font-regular bg-accent/80 text-secondary rounded-full text-wrap leading-3">
                                    "{currentCommentDisplay}"
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reading-queue">
              {queueBooks.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  No books in reading queue.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {queueBooks.map((userBook) => (
                    <Card key={userBook.book_id} className="relative overflow-hidden bg-bookWhite py-3">
                      <div className="flex flex-row gap-3 px-4">
                        {/* Book Image */}
                        <div className="w-[100px] flex-shrink-0">
                          <Link href={`/books/${userBook.book_id}`}>
                          <img
                            src={userBook.book.cover_url || "/placeholder.svg"}
                            alt={userBook.book.title || "Book cover"}
                            className="h-auto w-full shadow-md rounded object-cover"
                          />
                          </Link>
                        </div>
                        {/* Content */}
                        <div className="flex flex-col flex-1">
                          <CardHeader className="pb-2 px-0 pt-0">
                            <Link href={`/books/${userBook.book_id}`}>
                              <CardTitle className="leading-4">{userBook.book.title}</CardTitle>
                            </Link>
                            <CardDescription className="text-xs">{userBook.book.author}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-0 px-0">
                            {/* Genre Tags */}
                            <div className="flex flex-wrap gap-1">
                              {userBook.book.genres?.slice(0, 1).map((genre: string) => (
                                <span
                                  key={genre}
                                  className="bg-accent/30 text-secondary/40 text-xs/3 font-medium px-2 py-1 rounded-full"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                            {/* Pages & Time */}
                            {userBook.book.pages && (
                            <div className="flex-1">
                              <p className="text-secondary/80 font-sans font-normal text-sm inline-block">{userBook.book.pages} pages • {userBook.book.reading_time}</p>
                            </div>
                            )}
                            {userBook.added_at && (
                              <span className="px-2 py-0.5 text-xs font-regular bg-primary-dark/50 text-secondary rounded-full">
                                Added: {new Date(userBook.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                          </CardContent>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardContent className="p-1 ">
                  {historyBooks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No books in reading history.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-1">
                      {historyBooks.map((userBook) => (
                          <ProfileBookHistoryItem
                            key={userBook.book_id}
                            userBook={userBook}
                            bookStatus={userBook.status}
                            bookMediaType={userBook.media_type}
                            profileUserId={profile.id}
                            profileDisplayName={profile.display_name}
                          />
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardContent className="p-1 ">
                  {favoriteBooks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No favorite books.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-1">
                      {favoriteBooks.map((userBook) => (
                        <div key={userBook.book_id} className="w-auto">
                          <Link href={`/books/${userBook.book_id}`}>
                            <img
                              src={userBook.book.cover_url || "/placeholder.svg"}
                              alt={userBook.book.title || "Book cover"}
                              className="h-full w-full shadow-md rounded object-cover"
                            />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contributions">
              <Card>
                <CardContent className="p-1">
                  {addedBooks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No contributed books.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-1">
                      {addedBooks.map((book) => (
                        <div key={book.id} className="w-auto">
                          <Link href={`/books/${book.id}`}>
                            <img
                              src={book.cover_url || "/placeholder.svg"}
                              alt={book.title || "Book cover"}
                              className="h-full w-full shadow-md rounded object-cover"
                            />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          ) : (
            <Card className="bg-bookWhite/90 rounded-3xl">
              <CardContent className="px-6 py-7 text-center">
                <p className="text-secondary/30 text-sm leading-3 mb-2">
                  You need to be friends with {displayName} to view their reading activity.
                </p>
                <p className="text-secondary/30 text-sm leading-3">
                  Send them a friend request to see their bookshelves and reading progress!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Unfriend Confirmation Dialog */}
      <Dialog open={unfriendDialogOpen} onOpenChange={setUnfriendDialogOpen}>
        <DialogContent className="w-[85vw] rounded-2xl">
          <DialogHeader className="pt-8">
            <DialogTitle className="text-center">Unfriend User?</DialogTitle>
            <DialogDescription className="text-center font-serif leading-5">
              Are you sure you want to unfriend {profile?.display_name || 'this user'}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">This action cannot be undone</p>
                  <p className="text-sm text-red-700 mt-1">
                    You'll no longer be able to see each other's reading activity, and you'll need to send a new friend request to reconnect.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setUnfriendDialogOpen(false)}
              disabled={isUnfriending}
              className="rounded-full flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnfriend}
              disabled={isUnfriending}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full flex-1"
            >
              {isUnfriending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unfriending...
                </>
              ) : (
                "Yes, Unfriend"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
