"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Filter, Plus, Search, Send, ThumbsDown, ThumbsUp, Grid, List, MoreVertical, Upload, ChevronDown, Loader2, Heart as LucideHeart, ThumbsUp as LucideThumbsUp, ThumbsDown as LucideThumbsDown, CheckCircle, X, BookMarked } from "lucide-react" // Added BookMarked icon
import { Heart } from "@phosphor-icons/react"
import Link from "next/link"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"; // Radix DropdownMenu
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Textarea } from "@/components/ui/textarea"

import { BookDetails } from "@/types/book";
import { AddBookDialog } from "./add-book-dialog"
import { ViewBookDetailsDialog } from "./ViewBookDetailsDialog"
import { RecommendBookDialog } from "./recommendations/RecommendBookDialog"
import { toast } from "sonner"; // Changed from react-hot-toast to sonner
import { useSession } from "next-auth/react"; // Add session management

// Define the available shelf types for the dropdown
const SHELF_OPTIONS = [
  { label: "add to Currently Reading", value: "currently_reading" },
  { label: "add to Reading Queue", value: "queue" },
  { label: "marked as Finished", value: "history" },
];

// Define the additional actions for the dropdown
const ADDITIONAL_ACTIONS = [
  { label: "Recommend to Friends", value: "recommend", icon: BookMarked },
];

interface BookReactions {
  HEART: number;
  THUMBS_UP: number;
  THUMBS_DOWN: number;
  LIKE: number;
}

// Extended BookDetails interface to include creator info and shelf status
interface ExtendedBookDetails extends BookDetails {
  added_by_user?: {
    id: string;
    display_name: string;
    nickname: string | null;
    avatar_url: string | null;
  };
  // Add shelf status information
  user_shelf_status?: {
    shelf: 'favorite' | 'currently_reading' | 'queue' | 'history';
    status?: 'in_progress' | 'almost_done' | 'finished' | 'unfinished';
  };
  // For friends library tab - shelf status of the friend who added the book
  friend_shelf_status?: {
    shelf: 'favorite' | 'currently_reading' | 'queue' | 'history';
    status?: 'in_progress' | 'almost_done' | 'finished' | 'unfinished';
    user_name: string;
  };
}

// Helper function to get shelf badge display info
const getShelfBadgeInfo = (shelf: string, status?: string) => {
  switch (shelf) {
    case 'currently_reading':
      if (status === 'in_progress') return { label: '📖 Reading', color: 'bg-blue-100 text-blue-700' };
      if (status === 'almost_done') return { label: '💫 Almost Done', color: 'bg-purple-100 text-purple-700' };
      return { label: '📖 Reading', color: 'bg-blue-100 text-blue-700' };
    case 'queue':
      return { label: '📚 In Queue', color: 'bg-orange-100 text-orange-700' };
    case 'history':
      if (status === 'finished') return { label: '✅ Finished', color: 'bg-green-100 text-green-700' };
      if (status === 'unfinished') return { label: '😑 Unfinished', color: 'bg-gray-100 text-gray-700' };
      return { label: '📖 Read', color: 'bg-green-100 text-green-700' };
    case 'favorite':
      return { label: '❤️ Favorite', color: 'bg-red-100 text-red-700' };
    default:
      return null;
  }
};

// Helper component for shelf status badge
const ShelfStatusBadge = ({ shelf, status, userName }: { shelf: string; status?: string; userName?: string }) => {
  const badgeInfo = getShelfBadgeInfo(shelf, status);
  
  if (!badgeInfo) return null;
  
  return (
    <div className="flex items-center gap-1">
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeInfo.color}`}>
        {badgeInfo.label}
      </span>
      {userName && (
        <span className="text-xs text-muted-foreground">
          by {userName}
        </span>
      )}
    </div>
  );
};

export default function BooksTableContents() {
  const { data: session, status } = useSession(); // Add session management
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("all") // This doesn't seem used in the current JSX
  const [viewMode, setViewMode] = useState<"card" | "table">("card")
  const [activeTab, setActiveTab] = useState("explore") // Track active tab
  
  // Friends Library filters
  const [selectedFriend, setSelectedFriend] = useState("all") // Filter by specific friend
  const [selectedShelfStatus, setSelectedShelfStatus] = useState("all") // Filter by shelf status
  const [friendsList, setFriendsList] = useState<Array<{id: string, name: string}>>([]) // List of friends for filter dropdown
  //reactions
  const [reactions, setReactions] = useState<BookReactions>({ HEART: 0, THUMBS_UP: 0, THUMBS_DOWN: 0, LIKE: 0 })
  /* pagination */
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  /* ------------------------------------------------------------------ */
  /*  UI state                                                           */
  /* ------------------------------------------------------------------ */
  const [books, setBooks] = useState<ExtendedBookDetails[]>([]);

  /* form fields inside the dialog (might be redundant if AddBookDialog handles its own state) */
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  const [open, setOpen] = useState(false); // dialog visibility for AddBookDialog
  const [submitting, setSubmitting] = useState(false); // For form submission in dialog
  const [formError, setFormError] = useState<string | null>(null); // For form errors in dialog
  const [isLoading, setIsLoading] = useState(true); // For loading all books
  const [error, setError] = useState<string | null>(null); // For general fetch errors

  // State to manage per-book loading/feedback for adding to shelf
  // Key: bookId, Value: { isLoading: boolean, message: string | null }
  const [shelfActionsStatus, setShelfActionsStatus] = useState<Record<string, { isLoading: boolean, message: string | null }>>({});

  // State for recommend book dialog
  const [recommendDialog, setRecommendDialog] = useState<{
    isOpen: boolean;
    book: ExtendedBookDetails | null;
  }>({
    isOpen: false,
    book: null
  });

  // Filter books based on search query
  const filteredBooks = books.filter((book) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const titleMatch = book.title?.toLowerCase().includes(query);
    const authorMatch = book.author?.toLowerCase().includes(query);
    const genreMatch = book.genres?.some(genre => genre.toLowerCase().includes(query));
    const creatorMatch = book.added_by_user?.display_name?.toLowerCase().includes(query) ||
                        book.added_by_user?.nickname?.toLowerCase().includes(query);
    
    return titleMatch || authorMatch || genreMatch || creatorMatch;
  });

  // Calculate pagination based on filtered results
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentBooks = filteredBooks.slice(startIndex, endIndex)

  // Function to fetch user's friends for the filter dropdown
  const fetchFriends = async () => {
    if (status !== 'authenticated') {
      console.log('[BooksTable] Not authenticated, skipping friends fetch');
      return;
    }

    if (!session?.supabaseAccessToken) {
      console.log('[BooksTable] No access token, skipping friends fetch');
      return;
    }

    console.log('[BooksTable] Fetching friends for user:', session?.user?.id);
    
    try {
      const response = await fetch('/api/friends?type=friends', {
        credentials: 'include', // Use cookie-based auth since this API uses cookies
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.supabaseAccessToken}`,
        },
      });
      
      if (response.ok) {
        const friendshipsData = await response.json();
        console.log('[BooksTable] Friendships data:', friendshipsData);
        
        // Extract friends from friendship relationships
        const formattedFriends = friendshipsData.map((friendship: any) => {
          // Determine which user is the friend (not the current user)
          const friend = friendship.user_one?.id === session?.user?.id 
            ? friendship.user_two 
            : friendship.user_one;
          
          return {
            id: friend?.id || '',
            name: friend?.nickname || friend?.display_name || 'Unknown'
          };
        }).filter((friend: any) => friend.id); // Filter out any invalid entries
        
        console.log('[BooksTable] Formatted friends:', formattedFriends);
        setFriendsList(formattedFriends);
      } else {
        const errorData = await response.text();
        console.error('[BooksTable] Failed to fetch friends:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  // Function to fetch all books from your API - Updated for Bearer token auth and filtering
  const fetchBooks = async (filter: string = 'all', friendFilter: string = 'all', shelfFilter: string = 'all') => {
    if (status !== 'authenticated' || !session?.supabaseAccessToken) {
      setIsLoading(false);
      setError('Authentication required to fetch books');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Build query parameters
      const params = new URLSearchParams({ filter });
      if (friendFilter !== 'all') params.append('friendFilter', friendFilter);
      if (shelfFilter !== 'all') params.append('shelfFilter', shelfFilter);
      
      console.log('[BooksTable] Fetching books with Bearer token, filter:', filter, 'friendFilter:', friendFilter, 'shelfFilter:', shelfFilter);
      const response = await fetch(`/api/books?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Failed to fetch books: ${response.statusText}`);
      }
      
      const data: ExtendedBookDetails[] = await response.json();
      console.log('[BooksTable] Successfully fetched books:', data.length, 'for filter:', filter);
      setBooks(data);
      // Reset pagination when switching tabs
      setCurrentPage(1);
    } catch (err: any) {
      console.error("Error fetching books:", err);
      setError(err.message || "Could not load books.");
    } finally {
      setIsLoading(false);
    }
  };

  console.log('[BooksTable] Current state:', { 
    booksCount: books.length, 
    isLoading, 
    error, 
    sessionStatus: status,
    hasAccessToken: !!session?.supabaseAccessToken,
    activeTab
  });

  // Fetch books when session becomes available or tab/filters change
  useEffect(() => {
    if (status === 'authenticated' && session?.supabaseAccessToken) {
      // Map tab values to API filter values
      const filterMap: Record<string, string> = {
        'explore': 'all',
        'my-library': 'my-books',
        'friends-library': 'friends'
      };
      fetchBooks(filterMap[activeTab] || 'all', selectedFriend, selectedShelfStatus);
      
      // Fetch friends list when switching to friends library tab
      if (activeTab === 'friends-library' && friendsList.length === 0) {
        fetchFriends();
      }
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
      setError('Please log in to view books');
    }
  }, [status, session?.supabaseAccessToken, activeTab, selectedFriend, selectedShelfStatus]);

  // Fetch friends list when user is authenticated
  useEffect(() => {
    if (status === 'authenticated' && friendsList.length === 0) {
      fetchFriends();
    }
  }, [status]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset filters when switching tabs
    if (value !== 'friends-library') {
      setSelectedFriend('all');
      setSelectedShelfStatus('all');
    }
    // fetchBooks will be called by the useEffect above
  };

  // Callback to update the books list after a new book is added via dialog
  const handleBookAdded = (newBook: BookDetails) => {
    // When a new book is added, refresh the current tab
    const filterMap: Record<string, string> = {
      'explore': 'all',
      'my-library': 'my-books', 
      'friends-library': 'friends'
    };
    fetchBooks(filterMap[activeTab] || 'all', selectedFriend, selectedShelfStatus);
  };

  function formatDate(timestamp: string) {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}.${month}.${year}`;
  }

  // Function to add/move a book to a shelf
  const handleAddToShelf = async (bookId: string, shelf: string) => {
    if (!session?.supabaseAccessToken) {
      toast.error('Authentication required');
      return;
    }

    setShelfActionsStatus(prev => ({
      ...prev,
      [bookId]: { isLoading: true, message: null }
    }));
    
    try {
      // Your API call to add/move the book
      const response = await fetch('/api/shelf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        },
        body: JSON.stringify({ bookId, shelf, status: 'in_progress' }) // Default status for new additions
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add book to shelf');
      }
      
      const result = await response.json();
      console.log('Book added/moved to shelf:', result);

      // Show success toast
      const shelfDisplayName = shelf.replace(/_/g, ' ');
      toast.success(`📚 Added to ${shelfDisplayName}!`);

    } catch (err: any) {
      console.error("Error adding book to shelf:", err);
      toast.error(`Failed to add book: ${err.message}`);
    } finally {
      setShelfActionsStatus(prev => ({
        ...prev,
        [bookId]: { isLoading: false, message: null }
      }));
    }
  };

  // Handle recommend book action
  const handleRecommendBook = (book: ExtendedBookDetails) => {
    setRecommendDialog({
      isOpen: true,
      book: book
    });
  };

  // Handle recommend dialog close
  const handleRecommendDialogClose = () => {
    setRecommendDialog({
      isOpen: false,
      book: null
    });
  };

  // Handle successful recommendation
  const handleRecommendSuccess = () => {
    // Optionally refresh the books or show success message
    toast.success('Book recommendation sent successfully!');
  };

  // Add book to favorites - heart
  const handleFavorite = async (bookId: string) => {
    if (!bookId) return;
    if (!session?.supabaseAccessToken) {
      toast.error('Authentication required');
      return;
    }
    
    // Get the current book
    const currentBook = books.find(book => book.id === bookId);
    if (!currentBook) return;
    
    // Optimistically update UI
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId 
          ? { ...book, is_favorite: !book.is_favorite }
          : book
      )
    );
    
    try {
      const response = await fetch('/api/books/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        },
        body: JSON.stringify({ bookId }),
      });
      
      if (!response.ok) {
        // Revert UI change if API call fails
        setBooks(prevBooks => 
          prevBooks.map(book => 
            book.id === bookId 
              ? { ...book, is_favorite: currentBook.is_favorite }
              : book
          )
        );
        throw new Error('Failed to update favorite status');
      }
      
      const data = await response.json();
      console.log('Favorite status updated:', data);
      
      // If you want to show feedback
      if (data.is_favorite) {
        toast.success('Added to favorites!');
      } else {
        toast.success('Removed from favorites');
      }
      
      // No need to refetch all books - our optimistic update should match the server state
      // unless we added to a new shelf, in which case we'd want to refresh
      // if (data.message === 'Book added to favorites') {
      //   fetchBooks();
      // }
      
    } catch (error) {
      console.error('Error updating favorite status:', error);
      toast.error('Failed to update favorite status');
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-6 pb-20">
        <p className="text-center text-muted-foreground mt-8">Loading...</p>
      </div>
    );
  }

  // Show authentication required message
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-6 pb-20">
        <p className="text-center text-muted-foreground mt-8">Please log in to view books.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      <div className="space-y-5">
        <div className="">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="">
            <div className="flex justify-center">
              <TabsList className="bg-secondary-light text-primary rounded-full mb-4">
                <TabsTrigger
                  value="explore"
                  className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                >
                  Explore
                </TabsTrigger>
                <TabsTrigger
                  value="my-library"
                  className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                >
                  My Library
                </TabsTrigger>
                <TabsTrigger
                  value="friends-library"
                  className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                >
                  Friends Library
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Search and View Controls - Moved below tabs */}
            <div className="flex flex-row gap-2 items-center mb-4">
              {/* Search Input */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-4 -translate-y-1/2 h-4 w-4 text-secondary" />
                <Input
                  placeholder="Search books, authors, genres..."
                  className="pl-10 rounded-full bg-bookWhite/90 text-secondary/85"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {/* View Toggle Buttons */}
              <div className="flex items-center justify-end gap-2">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === "card" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("card")}
                    className={viewMode === "card" ? "bg-primary text-primary-foreground" : ""}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("table")}
                    className={viewMode === "table" ? "bg-primary text-primary-foreground" : ""}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Add Book Button - Show when there are search results in Explore tab */}
            {activeTab === 'explore' && searchQuery.trim() && filteredBooks.length > 0 && (
              <div className="flex justify-center mb-2 py-0">
                <div className="flex flex-col items-center gap-1 bg-secondary/5 rounded-full px-4 pt-0 pb-2">
                  <span className="text-sm text-bookWhite/70">Don't find what you're looking for?</span>
                  <AddBookDialog
                    open={open}
                    onOpenChange={setOpen}
                    books={books}
                    setBooks={setBooks}
                    onBookAdded={handleBookAdded}
                    initialSearchQuery={searchQuery}
                  />
                </div>
              </div>
            )}

            {/* Friends Library Filters */}
            {activeTab === 'friends-library' && (
              <div className="flex flex-row gap-2 justify-evenly mb-4">
                <div className="flex items-center gap-2 w-36">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filter by:</span>
                </div>
                
                {/* Friend Filter */}
                 <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                   <SelectTrigger className="w-40 h-8 text-xs">
                     <SelectValue placeholder="All friends" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">All friends</SelectItem>
                     {friendsList.length === 0 ? (
                       <SelectItem value="no-friends" disabled>
                         No friends found
                       </SelectItem>
                     ) : (
                       friendsList.map((friend) => (
                         <SelectItem key={friend.id} value={friend.id}>
                           {friend.name}
                         </SelectItem>
                       ))
                     )}
                   </SelectContent>
                 </Select>

                {/* Shelf Status Filter */}
                <Select value={selectedShelfStatus} onValueChange={setSelectedShelfStatus}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="All shelves" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All shelves</SelectItem>
                    <SelectItem value="currently_reading">📖 Currently Reading</SelectItem>
                    <SelectItem value="queue">📚 In Queue</SelectItem>
                    <SelectItem value="history">📖 Finished</SelectItem>
                    <SelectItem value="favorite">❤️ Favorites</SelectItem>
                  </SelectContent>
                </Select>

                {/* Clear Filters Button */}
                {(selectedFriend !== 'all' || selectedShelfStatus !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFriend('all');
                      setSelectedShelfStatus('all');
                    }}
                    className="h-8 text-xs p-1.5"
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}

            {isLoading ? (
              <p className="text-center text-muted-foreground mt-8">Loading books...</p>
            ) : error ? (
              <div className="text-center mt-8">
                <p className="text-red-500 mb-4">Error: {error}</p>
                <Button onClick={() => {
                  const filterMap: Record<string, string> = {
                    'explore': 'all',
                    'my-library': 'my-books',
                    'friends-library': 'friends'
                  };
                  fetchBooks(filterMap[activeTab] || 'all', selectedFriend, selectedShelfStatus);
                }} variant="outline">
                  Retry
                </Button>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center text-muted-foreground mt-8">
                {activeTab === 'my-library' ? (
                  <p>You haven&apos;t added any books to your library yet. Click &ldquo;Add Book&rdquo; to get started.</p>
                ) : activeTab === 'friends-library' ? (
                  <p>Your friends haven&apos;t added any books to their libraries yet. Connect with more friends who love reading!</p>
                ) : (
                  <p>No books available yet. Click &ldquo;Add Book&rdquo; to get started or connect with friends.</p>
                )}
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center text-muted-foreground mt-8">
                <p>No books found matching &ldquo;{searchQuery}&rdquo;</p>
                <p className="text-sm mb-4">
                  {activeTab === 'explore' && 'Add the book and contribute to the community!'}
                  {activeTab === 'my-library' && 'Try a different search term or add more books to your library.'}
                  {activeTab === 'friends-library' && 'Your friends haven&apos;t added books matching this search yet.'}
                </p>
                {activeTab === 'explore' && (
                  <div className="flex justify-center">
                    <AddBookDialog
                      open={open}
                      onOpenChange={setOpen}
                      books={books}
                      setBooks={setBooks}
                      onBookAdded={handleBookAdded}
                      initialSearchQuery={searchQuery}
                    />
                  </div>
                )}
              </div>
            ) : (
              <TabsContent value={activeTab} className="space-y-4">
                {viewMode === "card" ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {currentBooks.map((book) => {
                      const bookId = book.id || ''; // Handle undefined book.id
                      const currentShelfStatus = shelfActionsStatus[bookId];
                      return (
                        <Card key={bookId} className="relative flex flex-col gap-2">
                          <div className="flex gap-4 px-4 pt-4 pb-4">
                            {/* Cover Image */}
                            <Link href={`/books/${bookId}`}>
                              <div className="w-[110px] h-35 bg-muted/30 rounded flex items-center justify-center overflow-hidden shrink-0">
                                <img
                                  src={book.cover_url || "/placeholder.svg"}
                                  alt={`${book.title} cover`}
                                  className="object-cover h-full w-full" // Added w-full
                                />
                              </div>
                            </Link>

                            {/* Right Section */}
                            <div className="flex-1 flex flex-col justify-between gap-0.5">
                              {/* Title and Author */}
                              <div>
                                <div className="flex flex-row justify-between">
                                  <div className="flex-1 min-w-0">
                                    <Link href={`/books/${bookId}`}>
                                      <h3 className="text-lg/5 font-semibold break-words text-secondary">{book.title}</h3>
                                    </Link>
                                  </div>
                                  {/* --- NEW: Add to Shelf Dropdown --- */}
                                  {bookId && (
                                    <div className="flex items-start">
                                    <DropdownMenu.Root>
                                      <DropdownMenu.Trigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-xs flex items-end px-0 rounded-full h-auto gap-1 bg-transparent ml-1 border-none"
                                          disabled={currentShelfStatus?.isLoading} // Disable while action is loading
                                        >
                                          <Plus className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                      </DropdownMenu.Trigger>

                                      <DropdownMenu.Portal>
                                        <DropdownMenu.Content
                                          className="w-auto rounded-xl bg-transparent shadow-xl px-1 mr-6 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                                          sideOffset={5}
                                        >
                                        {SHELF_OPTIONS.map((shelf) => (
                                          <DropdownMenu.Item
                                            key={shelf.value}
                                            onSelect={() => handleAddToShelf(bookId, shelf.value)}
                                            className="px-3 py-2 text-xs text-end bg-secondary/90 my-2 rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                                          >
                                            {shelf.label}
                                          </DropdownMenu.Item>
                                        ))}
                                        {/* Additional Actions */}
                                        {ADDITIONAL_ACTIONS.map((action) => (
                                          <DropdownMenu.Item
                                            key={action.value}
                                            onSelect={() => {
                                              if (action.value === 'recommend') {
                                                handleRecommendBook(book);
                                              }
                                            }}
                                            className="px-3 py-2 text-xs text-end bg-accent/90 my-2 text-secondary rounded-md cursor-pointer hover:bg-accent-variant hover:text-bookWhite focus:bg-accent-variant focus:outline-none transition-colors flex justify-end gap-2"
                                          >
                                            {action.label}
                                          </DropdownMenu.Item>
                                        ))}
                                        </DropdownMenu.Content>
                                      </DropdownMenu.Portal>
                                    </DropdownMenu.Root>
                                    </div>
                                  )}
                                </div>
                                <p className="text-secondary/50 text-sm">{book.author}</p>
                                
                                <div>
                                    <div className="flex gap-2">
                                      <div className="flex items-center gap-1">
                                          <Heart
                                              className="h-3 w-3 text-primary"
                                          />
                                          <span className="font-serif font-medium text-xs text-secondary">{book.reactions?.counts?.HEART || 0}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                          <ThumbsUp
                                              className="h-3 w-3 text-accent-variant"
                                          />
                                          <span className="font-serif font-medium text-xs text-secondary">{book.reactions?.counts?.THUMBS_UP || 0}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                          <ThumbsDown
                                              className="h-3 w-3 text-accent"
                                          />
                                          <span className="font-serif font-medium text-xs text-secondary">{book.reactions?.counts?.THUMBS_DOWN || 0}</span>
                                      </div>
                                    </div>
                                  </div>
                              </div>

                              {/* Genre Tags and Shelf Status */}
                              <div className="flex flex-wrap gap-1 items-center">
                                {book.genres?.slice(0, 1).map((genre: string) => (
                                  <span
                                    key={genre}
                                    className="bg-primary/10 text-primary text-xs/3 font-medium px-2 py-1 rounded-full"
                                  >
                                    {genre}
                                  </span>
                                ))}
                                
                                {/* Shelf Status Badge */}
                                {activeTab === 'friends-library' && book.friend_shelf_status ? (
                                  <ShelfStatusBadge 
                                    shelf={book.friend_shelf_status.shelf} 
                                    status={book.friend_shelf_status.status}
                                    userName={book.friend_shelf_status.user_name}
                                  />
                                ) : book.user_shelf_status ? (
                                  <ShelfStatusBadge 
                                    shelf={book.user_shelf_status.shelf} 
                                    status={book.user_shelf_status.status}
                                  />
                                ) : null}
                              </div>

                              {/* Pages & Time */}
                              <div className="flex-1">
                                <p className="text-secondary/60 font-sans font-normal bg-accent/20 rounded-full px-2 text-xs inline-block">{book.pages} pages • {book.reading_time}</p>
                              </div>

                              {/* Meta Info */}
                              <div className="flex flex-row justify-between items-end gap-2 text-sm">
                                <div>
                                  {/* Show who added the book for non-my-library tabs */}
                                  {activeTab !== 'my-library' && book.added_by_user && (
                                    <p className="text-xs leading-none text-secondary/60">
                                      {activeTab === 'explore' ? 'Added by' : 'From'} {book.added_by_user.nickname || book.added_by_user.display_name}
                                    </p>
                                  )}
                                  <p className="text-secondary/60 text-xs font-serif font-medium">
                                    {book.created_at ? new Date(book.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'Unknown'}
                                  </p>
                                </div>
                                {bookId && (
                                  <div className="flex justify-end items-end">
                                      <button
                                        onClick={() => handleFavorite(bookId)}
                                        className={`p-0 absolute bottom-3 right-3`}
                                      >
                                        <Heart
                                          className="h-5 w-5"
                                          color="#C51104"
                                          weight={book.is_favorite ? "fill" : "regular"}
                                        />
                                      </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  // --- Table View ---
                  <div className="rounded-md border">
                    <Table className="rounded-lg">
                      <TableHeader >
                        <TableRow className="py-1 bg-secondary-light">
                          <TableHead className="p-2">Title</TableHead>
                          <TableHead className="p-2">Author</TableHead>
                          <TableHead className="p-2">Pages</TableHead>
                          <TableHead className="p-2">Genre</TableHead>
                          <TableHead className="p-2">Status</TableHead>
                          {activeTab !== 'my-library' && <TableHead className="p-2">Added By</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentBooks.map((book) => {
                          const bookId = book.id || ''; // Handle undefined book.id
                          const currentShelfStatus = shelfActionsStatus[bookId];
                          return (
                            <TableRow key={bookId}>
                              <TableCell className="font-medium p-2"><Link href={`/books/${bookId}`}>{book.title}</Link></TableCell>
                              <TableCell className="p-2">{book.author}</TableCell>
                              <TableCell className="p-2">{book.pages}</TableCell>
                              <TableCell className="p-2">
                                {book.genres?.slice(0, 1).map((genre: string) => (
                                  <span
                                    key={genre}
                                    className=""
                                  >
                                    {genre}
                                  </span>
                                ))}
                              </TableCell>
                              <TableCell className="p-2">
                                {activeTab === 'friends-library' && book.friend_shelf_status ? (
                                  <ShelfStatusBadge 
                                    shelf={book.friend_shelf_status.shelf} 
                                    status={book.friend_shelf_status.status}
                                    userName={book.friend_shelf_status.user_name}
                                  />
                                ) : book.user_shelf_status ? (
                                  <ShelfStatusBadge 
                                    shelf={book.user_shelf_status.shelf} 
                                    status={book.user_shelf_status.status}
                                  />
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              {activeTab !== 'my-library' && (
                                <TableCell className="p-2 text-xs text-secondary/60">
                                  {book.added_by_user && book.added_by_user.id !== session?.user?.id
                                    ? (book.added_by_user.nickname || book.added_by_user.display_name)
                                    : 'You'
                                  }
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink href="#" isActive={currentPage === index + 1} onClick={() => setCurrentPage(index + 1)}>
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext href="#" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Recommend Book Dialog */}
      <RecommendBookDialog
        open={recommendDialog.isOpen}
        onOpenChange={handleRecommendDialogClose}
        book={recommendDialog.book ? {
          id: recommendDialog.book.id,
          title: recommendDialog.book.title,
          author: recommendDialog.book.author,
          cover_url: recommendDialog.book.cover_url
        } : null}
        onSuccess={handleRecommendSuccess}
      />
    </div>
  )
}