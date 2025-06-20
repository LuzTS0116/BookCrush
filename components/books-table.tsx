"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Filter, Plus, Search, Send, ThumbsDown, ThumbsUp, Grid, List, MoreVertical, Upload, ChevronDown, Loader2, Heart as LucideHeart, ThumbsUp as LucideThumbsUp, ThumbsDown as LucideThumbsDown, CheckCircle } from "lucide-react" // Added more icons
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
import { toast } from "sonner"; // Changed from react-hot-toast to sonner
import { useSession } from "next-auth/react"; // Add session management

// Define the available shelf types for the dropdown
const SHELF_OPTIONS = [
  { label: "Currently Reading", value: "currently_reading" },
  { label: "Reading Queue", value: "queue" },
  { label: "Finished", value: "finished" },
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

// Add interface for the finished book dialog
interface FinishedBookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  book: ExtendedBookDetails | null;
  onSubmit: (reviewText: string, rating: "HEART" | "THUMBS_UP" | "THUMBS_DOWN") => void;
  isSubmitting: boolean;
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

// Add the FinishedBookDialog component
function FinishedBookDialog({ isOpen, onClose, book, onSubmit, isSubmitting }: FinishedBookDialogProps) {
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState<"HEART" | "THUMBS_UP" | "THUMBS_DOWN" | null>(null);

  const handleSubmit = () => {
    if (rating) {
      onSubmit(reviewText, rating);
    }
  };

  const handleSkip = () => {
    onSubmit("", "HEART"); // Submit with empty review and default rating
  };

  const getRatingIcon = (ratingType: "HEART" | "THUMBS_UP" | "THUMBS_DOWN", isSelected: boolean) => {
    const baseClasses = "h-6 w-6";
    const selectedClasses = isSelected ? "ring-2 ring-offset-2" : "";
    
    switch (ratingType) {
      case "HEART":
        return (
          <LucideHeart 
            className={`${baseClasses} ${isSelected ? "text-primary fill-primary ring-primary" : "text-muted-foreground"} ${selectedClasses}`} 
          />
        );
      case "THUMBS_UP":
        return (
          <LucideThumbsUp 
            className={`${baseClasses} ${isSelected ? "text-accent-variant ring-accent-variant" : "text-muted-foreground"} ${selectedClasses}`} 
          />
        );
      case "THUMBS_DOWN":
        return (
          <LucideThumbsDown 
            className={`${baseClasses} ${isSelected ? "text-accent ring-accent" : "text-muted-foreground"} ${selectedClasses}`} 
          />
        );
    }
  };

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setReviewText("");
      setRating(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl">🎉 Congratulations!</DialogTitle>
          <DialogDescription>
            You&apos;ve finished reading <span className="font-semibold">{book?.title}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          {book && (
            <div className="w-24 h-32 rounded-lg overflow-hidden shadow-md">
              <img 
                src={book.cover_url || "/placeholder.svg"} 
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="text-center">
            <h3 className="font-medium">{book?.title}</h3>
            <p className="text-sm text-muted-foreground">by {book?.author}</p>
          </div>
          
          <div className="w-full space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">How did you like it?</label>
              <div className="flex justify-center gap-3">
                {(["HEART", "THUMBS_UP", "THUMBS_DOWN"] as const).map((ratingType) => (
                  <button
                    key={ratingType}
                    type="button"
                    onClick={() => setRating(ratingType)}
                    className={`p-3 rounded-full transition-all hover:bg-muted ${
                      rating === ratingType ? "bg-muted" : ""
                    }`}
                    disabled={isSubmitting}
                  >
                    {getRatingIcon(ratingType, rating === ratingType)}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Share your thoughts (optional)
              </label>
              <Textarea
                placeholder="What did you think about this book? (max 500 characters)"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value.slice(0, 500))}
                className="min-h-[100px] resize-none"
                disabled={isSubmitting}
              />
              <div className="text-xs text-muted-foreground mt-1 text-right">
                {reviewText.length}/500
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Skip Review
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!rating || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finishing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Finished
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BooksTableContents() {
  const { data: session, status } = useSession(); // Add session management
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("all") // This doesn't seem used in the current JSX
  const [viewMode, setViewMode] = useState<"card" | "table">("card")
  const [activeTab, setActiveTab] = useState("all") // Track active tab
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

  // Add state for finished book dialog
  const [finishedBookDialogOpen, setFinishedBookDialogOpen] = useState(false);
  const [selectedBookForFinish, setSelectedBookForFinish] = useState<ExtendedBookDetails | null>(null);
  const [isSubmittingFinishedBook, setIsSubmittingFinishedBook] = useState(false);

  // Calculate pagination
  const totalPages = Math.ceil(books.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentBooks = books.slice(startIndex, endIndex)

  // Function to fetch all books from your API - Updated for Bearer token auth and filtering
  const fetchBooks = async (filter: string = 'all') => {
    if (status !== 'authenticated' || !session?.supabaseAccessToken) {
      setIsLoading(false);
      setError('Authentication required to fetch books');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('[BooksTable] Fetching books with Bearer token, filter:', filter);
      const response = await fetch(`/api/books?filter=${filter}`, {
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

  // Fetch books when session becomes available or tab changes
  useEffect(() => {
    if (status === 'authenticated' && session?.supabaseAccessToken) {
      // Map tab values to API filter values
      const filterMap: Record<string, string> = {
        'all': 'all',
        'my-books': 'my-books',
        'club-books': 'friends' // "Added by Friends" maps to 'friends' filter
      };
      fetchBooks(filterMap[activeTab] || 'all');
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
      setError('Please log in to view books');
    }
  }, [status, session?.supabaseAccessToken, activeTab]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // fetchBooks will be called by the useEffect above
  };

  // Callback to update the books list after a new book is added via dialog
  const handleBookAdded = (newBook: BookDetails) => {
    // When a new book is added, refresh the current tab
    const filterMap: Record<string, string> = {
      'all': 'all',
      'my-books': 'my-books', 
      'club-books': 'friends'
    };
    fetchBooks(filterMap[activeTab] || 'all');
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

    // Special handling for finished shelf - show review dialog
    if (shelf === 'finished') {
      const book = books.find(b => b.id === bookId);
      if (book) {
        setSelectedBookForFinish(book);
        setFinishedBookDialogOpen(true);
      }
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

  // Handle finished book submission with review
  const handleFinishedBookSubmit = async (reviewText: string, rating: "HEART" | "THUMBS_UP" | "THUMBS_DOWN") => {
    if (!selectedBookForFinish || !session?.supabaseAccessToken) {
      toast.error('Authentication required');
      return;
    }

    try {
      setIsSubmittingFinishedBook(true);

      // First, move the book to finished shelf
      const shelfResponse = await fetch('/api/shelf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        },
        body: JSON.stringify({ 
          bookId: selectedBookForFinish.id, 
          shelf: 'history', // Use 'history' for finished books
          status: 'finished' 
        })
      });

      if (!shelfResponse.ok) {
        const errorData = await shelfResponse.json();
        throw new Error(errorData.error || 'Failed to mark book as finished');
      }

      // If there's a review, submit it
      if (reviewText.trim()) {
        const reviewResponse = await fetch(`/api/books/${selectedBookForFinish.id}/reviews`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.supabaseAccessToken}`,
          },
          body: JSON.stringify({
            content: reviewText,
            rating: rating
          })
        });

        if (reviewResponse.ok) {
          const reviewResult = await reviewResponse.json();
          console.log('Review submitted:', reviewResult);
          
          // Update the book's reaction counts optimistically
          setBooks(prevBooks => 
            prevBooks.map(book => 
              book.id === selectedBookForFinish.id 
                ? { 
                    ...book, 
                    reactions: {
                      ...book.reactions,
                      counts: {
                        ...book.reactions?.counts,
                        [rating]: (book.reactions?.counts?.[rating] || 0) + 1
                      }
                    }
                  }
                : book
            )
          );
        }
      }

      // Close dialog and show success message
      setFinishedBookDialogOpen(false);
      setSelectedBookForFinish(null);
      toast.success('🎉 Congratulations! Book marked as finished!');

    } catch (error: any) {
      console.error('Error finishing book:', error);
      toast.error(`Failed to finish book: ${error.message}`);
    } finally {
      setIsSubmittingFinishedBook(false);
    }
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
        <div className="flex justify-center">
          <AddBookDialog
            open={open}
            onOpenChange={setOpen}
            books={books}
            setBooks={setBooks}
            onBookAdded={handleBookAdded}
          />
        </div>
        <div className="grid grid-cols-8 gap-x-2">
          {/* Search Input */}
          <div className="relative col-span-6">
            <Search className="absolute left-3 top-1/3 pt-1 -translate-y-1/2 h-4 w-4 text-secondary" />
            <Input
              placeholder="Search books and more"
              className="pl-10 rounded-full bg-bookWhite/90"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* View Toggle Buttons */}
          <div className="col-span-2 flex items-center justify-end gap-2">
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
                className={viewMode === "table" ? "bg-primary text-primary-foreground" : ""} // Fix: assuming table class
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="">
            <div className="flex justify-center">
              <TabsList className="bg-secondary-light text-primary rounded-full mb-2">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                >
                  Explore
                </TabsTrigger>
                <TabsTrigger
                  value="my-books"
                  className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                >
                  My Library
                </TabsTrigger>
                <TabsTrigger
                  value="club-books"
                  className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                >
                  Friends Library
                </TabsTrigger>
              </TabsList>
            </div>

            {isLoading ? (
              <p className="text-center text-muted-foreground mt-8">Loading books...</p>
            ) : error ? (
              <div className="text-center mt-8">
                <p className="text-red-500 mb-4">Error: {error}</p>
                <Button onClick={() => {
                  const filterMap: Record<string, string> = {
                    'all': 'all',
                    'my-books': 'my-books',
                    'club-books': 'friends'
                  };
                  fetchBooks(filterMap[activeTab] || 'all');
                }} variant="outline">
                  Retry
                </Button>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center text-muted-foreground mt-8">
                {activeTab === 'my-books' ? (
                  <p>No books added by you yet. Click &ldquo;Add Book&rdquo; to get started.</p>
                ) : activeTab === 'club-books' ? (
                  <p>No books added by your friends yet. Connect with friends who love reading!</p>
                ) : (
                  <p>No books yet. Click &ldquo;Add Book&rdquo; to get started or connect with friends.</p>
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
                                            className="px-3 py-2 text-xs text-center bg-secondary/90 my-2 rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                                          >
                                            {shelf.label}
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
                                {activeTab === 'club-books' && book.friend_shelf_status ? (
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
                                  {/* Show who added the book for non-my-books tabs */}
                                  {activeTab !== 'my-books' && book.added_by_user && (
                                    <p className="text-xs leading-none text-secondary/60">
                                      Added by {book.added_by_user.nickname || book.added_by_user.display_name}
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
                          {activeTab !== 'my-books' && <TableHead className="p-2">Added By</TableHead>}
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
                                {activeTab === 'club-books' && book.friend_shelf_status ? (
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
                              {activeTab !== 'my-books' && (
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
      <FinishedBookDialog
        isOpen={finishedBookDialogOpen}
        onClose={() => {
          setFinishedBookDialogOpen(false);
          setSelectedBookForFinish(null);
        }}
        book={selectedBookForFinish}
        onSubmit={handleFinishedBookSubmit}
        isSubmitting={isSubmittingFinishedBook}
      />
    </div>
  )
}