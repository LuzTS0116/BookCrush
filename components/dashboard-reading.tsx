"use client";

import { useState, useEffect, useMemo } from "react"; // Added useEffect, useMemo
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, Smartphone, BookOpen, Headphones, Sparkles, ArrowRight, EllipsisVertical, Loader2, Edit3, Check, X } from "lucide-react";
import { Heart } from "@phosphor-icons/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion"; // Retaining these if you plan to use animation
import { BookDetails, BookFile, UserBook, StatusDisplay, TabDisplay } from "@/types/book";
import { toast } from "sonner";
import { useSession } from "next-auth/react"; // Add session management
import { Textarea } from "@/components/ui/textarea";

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

// Define the available shelf types for the dropdown
const SHELF_OPTIONS = [
  { label: "Move to Reading Queue", value: "queue" },
];

// Helper to get status display info
const getStatusDisplay = (statusCode: UserBook['status']): StatusDisplay => {
  return statuses.find(s => s.value === statusCode) || statuses[0]; // Default to "In Progress" if not found
};

// Helper function to get media type display info
const getMediaTypeDisplay = (mediaType: UserBook['media_type']) => {
  return readingOptions.find(option => option.value === mediaType) || readingOptions[1]; // Default to E-Reader
};

export default function DashboardReading() {
  const { data: session, status } = useSession(); // Add session management
  // State to hold books for each shelf
  const [currentlyReadingBooks, setCurrentlyReadingBooks] = useState<UserBook[]>([]);
  const [queueBooks, setQueueBooks] = useState<UserBook[]>([]);
  
  // State for active tab (should match shelf_type enum values)
  const [activeTab, setActiveTab] = useState<UserBook['shelf']>("currently_reading"); 

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to manage per-book loading/feedback for adding to shelf
  // Key: bookId, Value: { isLoading: boolean, message: string | null }
  const [shelfActionsStatus, setShelfActionsStatus] = useState<Record<string, { isLoading: boolean, message: string | null }>>({});

  // State for personal note editing
  const [editingNoteBookId, setEditingNoteBookId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>("");
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);

  // State for confirmation dialogs
  const [confirmRemoval, setConfirmRemoval] = useState<{
    bookId: string | null;
    bookTitle: string | null;
    shelf: 'currently_reading' | 'queue' | null;
  }>({
    bookId: null,
    bookTitle: null,
    shelf: null
  });

  // Function to fetch books from the API
  const fetchBooks = async (shelf: UserBook['shelf']) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/shelf?shelf=${shelf}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch ${shelf} books`);
      }
      const data: UserBook[] = await response.json();
      
      if (shelf === "currently_reading") {
        setCurrentlyReadingBooks(data);
      } else if (shelf === "queue") {
        setQueueBooks(data);
      }
    } catch (err: any) {
      console.error(`Error fetching ${shelf} books:`, err);
      setError(err.message || `Could not load ${shelf} books.`);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect to fetch books when the component mounts or the activeTab changes
  useEffect(() => {
    fetchBooks(activeTab);
  }, [activeTab]); // Dependency array: re-run when activeTab changes

  // Function to handle personal note updates
  const handleNoteUpdate = async (bookId: string, shelf: UserBook['shelf']) => {
    if (!noteText.trim() && !noteText) return; // Allow empty notes to be saved
    
    setIsUpdatingNote(true);
    try {
      const response = await fetch('/api/user-books/comment', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId,
          shelf,
          comment: noteText.trim() || null, // Send null for empty comments
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update note');
      }

      // Update local state optimistically
      const targetBooks = shelf === "currently_reading" ? currentlyReadingBooks : queueBooks;
      const setTargetBooks = shelf === "currently_reading" ? setCurrentlyReadingBooks : setQueueBooks;

      setTargetBooks(prevBooks =>
        prevBooks.map(userBook => 
          userBook.book_id === bookId 
            ? { ...userBook, comment: noteText.trim() || null }
            : userBook
        )
      );

      // Reset editing state
      setEditingNoteBookId(null);
      setNoteText("");
      toast.success(noteText.trim() ? 'Note updated!' : 'Note removed!');

    } catch (err: any) {
      console.error("Error updating note:", err);
      toast.error(`Failed to update note: ${err.message}`);
    } finally {
      setIsUpdatingNote(false);
    }
  };

  // Function to start editing a note
  const startEditingNote = (bookId: string, currentComment: string | null) => {
    setEditingNoteBookId(bookId);
    setNoteText(currentComment || "");
  };

  // Function to cancel editing
  const cancelEditingNote = () => {
    setEditingNoteBookId(null);
    setNoteText("");
  };

  // Function to handle status updates via API
  const handleStatusChange = async (
    bookId: string, 
    currentShelf: UserBook['shelf'], 
    newStatus: UserBook['status']
  ) => {
    try {
      // Optimistic UI update: immediately update the state
      const targetBooks = currentShelf === "currently_reading" ? currentlyReadingBooks : queueBooks;
      const setTargetBooks = currentShelf === "currently_reading" ? setCurrentlyReadingBooks : setQueueBooks;

      setTargetBooks(prevBooks =>
        prevBooks.map(userBook => 
          userBook.book_id === bookId 
            ? { ...userBook, status: newStatus } 
            : userBook
        )
      );

      // Call your API to update the book's status
      const response = await fetch('/api/shelf', {
        method: 'POST', // Use POST for update as per your API definition
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, shelf: currentShelf, status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update book status');
      }

      // If needed, you could re-fetch data or confirm the update here
      // For now, optimistic update is usually sufficient.
      if (newStatus== "finished" || newStatus== "unfinished"){
            setCurrentlyReadingBooks(prevBooks =>
          prevBooks.filter(userBook => 
          userBook.status != "finished" && userBook.status != "unfinished" 
          
        )
      );
      }

    } catch (err: any) {
      console.error("Error updating status:", err);
      alert(`Failed to update status: ${err.message}`); // Show error to user
      // Rollback UI update if API fails (optional, but good for robust apps)
      fetchBooks(currentShelf); // Re-fetch to sync state with DB
    }
  };

  // Function to handle media type updates via API
  const handleMediaTypeChange = async (
    bookId: string, 
    currentShelf: UserBook['shelf'], 
    newMediaType: string
  ) => {
    try {
      // Optimistic UI update: immediately update the state
      const targetBooks = currentShelf === "currently_reading" ? currentlyReadingBooks : queueBooks;
      const setTargetBooks = currentShelf === "currently_reading" ? setCurrentlyReadingBooks : setQueueBooks;

      setTargetBooks(prevBooks =>
        prevBooks.map(userBook => 
          userBook.book_id === bookId 
            ? { ...userBook, media_type: newMediaType as UserBook['media_type'] } 
            : userBook
        )
      );

      // Call the API to update the media type
      const response = await fetch('/api/user-books/media-type', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookId, 
          shelf: currentShelf, 
          mediaType: newMediaType 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update media type');
      }

      console.log(`Media type updated to ${newMediaType} for book ${bookId}`);

    } catch (err: any) {
      console.error("Error updating media type:", err);
      alert(`Failed to update media type: ${err.message}`);
      // Rollback UI update if API fails
      fetchBooks(currentShelf); // Re-fetch to sync state with DB
    }
  };

  // Function to move book from queue to currently reading
  const handleStartReading = async (bookId: string) => {
    try {
      // Optimistically remove from queue
      setQueueBooks(prevBooks => 
        prevBooks.filter(userBook => userBook.book_id !== bookId)
      );

      // Call API to move book to currently_reading shelf
      const response = await fetch('/api/shelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookId, 
          shelf: 'currently_reading', 
          status: 'in_progress' 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start reading book');
      }

      // Show success message
      toast.success('Started reading! Book moved to Currently Reading.');

      // Refresh currently reading books to show the newly moved book
      if (activeTab === "currently_reading") {
        fetchBooks("currently_reading");
      }

    } catch (err: any) {
      console.error("Error starting book:", err);
      toast.error(`Failed to start reading: ${err.message}`);
      // Rollback UI update if API fails
      fetchBooks("queue"); // Re-fetch queue to restore the book
    }
  };

  // Determine which books to display based on the active tab
  const booksToDisplay = useMemo(() => {
    if (activeTab === "currently_reading") {
      return currentlyReadingBooks;
    } else if (activeTab === "queue") {
      return queueBooks;
    }
    return [];
  }, [activeTab, currentlyReadingBooks, queueBooks]); // Recompute when tab or book lists change

  // This `status` state is no longer needed at the top level, 
  // as each book will have its own status. Removed from original `useState`.
  // The `direction` and `prevTab` states for framer-motion are kept if you intend to implement it.
  const [prevTab, setPrevTab] = useState<UserBook['shelf']>("currently_reading"); 
  const direction =
    TABS.findIndex((t) => t.value === activeTab) > TABS.findIndex((t) => t.value === prevTab) ? 1 : -1;

// Add book to favorites - heart
  const handleFavorite = async (bookId: string) => {
    if (!bookId) return;
    
    // Optimistically update UI for both lists
    setCurrentlyReadingBooks(prevBooks => 
      prevBooks.map(userBook => 
        userBook.book_id === bookId 
          ? { ...userBook, is_favorite: !userBook.is_favorite }
          : userBook
      )
    );
    
    setQueueBooks(prevBooks => 
      prevBooks.map(userBook => 
        userBook.book_id === bookId 
          ? { ...userBook, is_favorite: !userBook.is_favorite }
          : userBook
      )
    );
    
    try {
      const response = await fetch('/api/books/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookId }),
      });
      
      if (!response.ok) {
        // Revert UI changes if API call fails
        setCurrentlyReadingBooks(prevBooks => 
          prevBooks.map(userBook => 
            userBook.book_id === bookId 
              ? { ...userBook, is_favorite: !userBook.is_favorite }
              : userBook
          )
        );
        
        setQueueBooks(prevBooks => 
          prevBooks.map(userBook => 
            userBook.book_id === bookId 
              ? { ...userBook, is_favorite: !userBook.is_favorite }
              : userBook
          )
        );
        
        throw new Error('Failed to update favorite status');
      }
      
      const data = await response.json();
      console.log('Favorite status updated:', data);
      
      // Show feedback
      if (data.is_favorite) {
        toast.success('Added to favorites!');
      } else {
        toast.success('Removed from favorites');
      }
      
    } catch (error) {
      console.error('Error updating favorite status:', error);
      toast.error('Failed to update favorite status');
    }
  };

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
        // Get the current book to determine source shelf
        const currentBook = [...currentlyReadingBooks, ...queueBooks].find(book => book.book_id === bookId);
        const sourceShelf = currentBook?.shelf;

        // Optimistic UI updates - only handle moving from currently reading to queue
        if (sourceShelf === "currently_reading" && shelf === "queue") {
          // Moving from currently reading to queue
          setCurrentlyReadingBooks(prevBooks => 
            prevBooks.filter(userBook => userBook.book_id !== bookId)
          );
          toast.success('Book moved to Reading Queue!');
        }

        // API call to update the shelf
        const response = await fetch('/api/shelf', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.supabaseAccessToken}`,
          },
          body: JSON.stringify({ bookId, shelf, status: 'in_progress' })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to move book to shelf');
        }

        const result = await response.json();
        console.log('Book moved to shelf:', result);

        // Clear loading status
        setShelfActionsStatus(prev => ({
          ...prev,
          [bookId]: { isLoading: false, message: null }
        }));

        // Refresh the target shelf if user is viewing it
        if (activeTab === shelf) {
          fetchBooks(shelf as UserBook['shelf']);
        }

      } catch (err: any) {
        console.error("Error moving book to shelf:", err);
        toast.error(`Failed to move book: ${err.message}`);
        
        // Rollback optimistic updates on error
        if (activeTab === "currently_reading") {
          fetchBooks("currently_reading");
        }
        
        setShelfActionsStatus(prev => ({
          ...prev,
          [bookId]: { isLoading: false, message: `Error: ${err.message}` }
        }));

        // Clear error message after a few seconds
        setTimeout(() => {
          setShelfActionsStatus(prev => ({ ...prev, [bookId]: { isLoading: false, message: null } }));
        }, 3000);
      }
    };

  // Function to remove book from queue
  const handleRemoveFromQueue = async (bookId: string) => {
    try {
      // Optimistically remove from queue
      setQueueBooks(prevBooks => 
        prevBooks.filter(userBook => userBook.book_id !== bookId)
      );

      // Call API to remove book from queue shelf
      const response = await fetch('/api/shelf', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookId, 
          shelf: 'queue'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove book from queue');
      }

      // Show success message
      toast.success('Book removed from Reading Queue.');

    } catch (err: any) {
      console.error("Error removing book from queue:", err);
      toast.error(`Failed to remove book: ${err.message}`);
      // Rollback UI update if API fails
      fetchBooks("queue"); // Re-fetch queue to restore the book
    }
  };

  // Function to remove book from currently reading shelf
  const handleRemoveFromCurrentlyReading = async (bookId: string) => {
    try {
      // Optimistically remove from currently reading
      setCurrentlyReadingBooks(prevBooks => 
        prevBooks.filter(userBook => userBook.book_id !== bookId)
      );

      // Call API to remove book from currently reading shelf
      const response = await fetch('/api/shelf', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookId, 
          shelf: 'currently_reading'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove book from shelf');
      }

      // Show success message
      toast.success('Book removed from Currently Reading.');

    } catch (err: any) {
      console.error("Error removing book from currently reading:", err);
      toast.error(`Failed to remove book: ${err.message}`);
      // Rollback UI update if API fails
      fetchBooks("currently_reading"); // Re-fetch currently reading to restore the book
    }
  };

  // Functions to handle confirmation dialogs
  const showRemoveConfirmation = (bookId: string, bookTitle: string, shelf: 'currently_reading' | 'queue') => {
    setConfirmRemoval({
      bookId,
      bookTitle,
      shelf
    });
  };

  const cancelRemoval = () => {
    setConfirmRemoval({
      bookId: null,
      bookTitle: null,
      shelf: null
    });
  };

  const confirmRemovalAction = async () => {
    if (!confirmRemoval.bookId || !confirmRemoval.shelf) return;

    if (confirmRemoval.shelf === 'currently_reading') {
      await handleRemoveFromCurrentlyReading(confirmRemoval.bookId);
    } else if (confirmRemoval.shelf === 'queue') {
      await handleRemoveFromQueue(confirmRemoval.bookId);
    }

    // Close confirmation dialog
    cancelRemoval();
  };

  return (
    <div className="container pb-6 mx-auto px-4">
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Tabs component: controlled by activeTab state */}
          <Tabs 
            value={activeTab} 
            className="space-y-4" 
            onValueChange={(value: string) => {
                setPrevTab(activeTab); // Store previous tab for animation if needed
                setActiveTab(value as UserBook['shelf']);
            }}
          >
            <div className="flex justify-center">
              <TabsList className="bg-secondary-light text-primary rounded-full">
                {TABS.map((tabItem) => (
                  <TabsTrigger
                    key={tabItem.value}
                    value={tabItem.value}
                    className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                  >
                    {tabItem.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Content for "Currently Reading" Tab */}
            <TabsContent value="currently_reading" className="space-y-1">
              {isLoading ? (
                <div className="text-center py-8">Loading books...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">Error: {error}</div>
              ) : currentlyReadingBooks.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  No books currently reading.
                </p>
              ) : (
                <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {currentlyReadingBooks.slice(0, 8).map((userBook) => {
                    const currentStatusDisplay = getStatusDisplay(userBook.status);
                    const bookId = userBook.book_id || '';
                    const currentShelfStatus = shelfActionsStatus[bookId];
                    const currentMediaTypeDisplay = getMediaTypeDisplay(userBook.media_type);
                    return (
                      <Card key={userBook.book_id} className="relative overflow-hidden bg-bookWhite py-3">
                        <div className="flex flex-row gap-3 px-4">
                          {/* Book Image */}
                          <div className="w-[100px] flex-shrink-0">
                            <Link href={`/books/${userBook.book_id}`}>
                            <img
                              src={userBook.book.cover_url || "/placeholder.svg"} // Use actual cover URL
                              alt={userBook.book.title || "Book cover"}
                              className="h-[150px] w-full shadow-md rounded object-cover" // Added object-cover
                            />
                            </Link>
                          </div>
                          {/* Content */}
                          <div className="flex flex-col justify-between flex-1">
                            <CardHeader className="pb-2 px-0 pt-0">
                              <div className="flex flex-row justify-between items-start">
                                <Link href={`/books/${userBook.book_id}`}>
                                  <CardTitle className="leading-5">{userBook.book.title}</CardTitle>
                                </Link>
                                <div>
                                  {/* --- NEW: Change Shelf Dropdown --- */}
                                  {bookId && (
                                  <div className="flex items-start relative">
                                    <DropdownMenu.Root>
                                      <DropdownMenu.Trigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-xs flex items-end px-0 rounded-full h-auto gap-1 bg-transparent ml-1 border-none hover:bg-transparent"
                                          disabled={currentShelfStatus?.isLoading} // Disable while action is loading
                                        >
                                          {currentShelfStatus?.isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                          ) : (
                                            <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
                                          )}
                                        </Button>
                                      </DropdownMenu.Trigger>

                                      <DropdownMenu.Portal>
                                        <DropdownMenu.Content
                                          className="w-auto rounded-xl bg-transparent shadow-xl px-1 mr-6 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                                          sideOffset={5}
                                        >
                                        {SHELF_OPTIONS.filter(shelf => shelf.value !== userBook.shelf).map((shelf) => (
                                          <DropdownMenu.Item
                                            key={shelf.value}
                                            onSelect={() => handleAddToShelf(bookId, shelf.value)}
                                            className="px-3 py-2 text-xs text-center bg-secondary/90 my-2 rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                                            disabled={currentShelfStatus?.isLoading}
                                          >
                                            {shelf.label}
                                          </DropdownMenu.Item>
                                        ))}
                                        <DropdownMenu.Item
                                          onSelect={() => showRemoveConfirmation(bookId, userBook.book.title, 'currently_reading')}
                                          className="px-3 py-2 text-xs text-center bg-red-500/90 my-2 rounded-md cursor-pointer hover:bg-red-600 hover:text-bookWhite focus:bg-red-600 focus:outline-none transition-colors"
                                          disabled={currentShelfStatus?.isLoading}
                                        >
                                          Remove from Shelf
                                        </DropdownMenu.Item>
                                        </DropdownMenu.Content>
                                      </DropdownMenu.Portal>
                                    </DropdownMenu.Root>
                                    {/* Display action status message */}
                                    {currentShelfStatus?.message && (
                                      <p className="absolute top-full mb-1 right-0 text-nowrap text-xs mt-1 bg-primary/85 py-1 px-2 text-center flex-1 rounded-xl z-50" style={{ color: currentShelfStatus.message.startsWith('Error') ? 'red' : 'secondary' }}>
                                        {currentShelfStatus.message}
                                      </p>
                                    )}
                                  </div>
                                  )}
                                </div>
                              </div>
                              <CardDescription>{userBook.book.author}</CardDescription>
                            </CardHeader>

                            <CardContent className="pb-0 px-0">
                              <div className="flex flex-wrap gap-1 mb-2 items-center">
                                {/* Added On */}
                                {userBook.added_at && (
                                  <span className="px-2 py-0.5 text-xs font-regular bg-primary-dark/50 text-secondary rounded-full">
                                    Started: {new Date(userBook.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                )}

                                <div className="flex flex-wrap items-center bg-secondary/10 text-secondary rounded-full px-2 py-0.5">
                                  {/* Show the selected icon */}
                                  <currentMediaTypeDisplay.icon className="w-4 h-4" />
                                  <DropdownMenu.Root>
                                    <DropdownMenu.Trigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs flex items-center rounded-full h-5 px-1 ml-1 gap-1 bg-transparent border-none shadow-sm hover:bg-muted"
                                      >
                                        <ChevronDown className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenu.Trigger>

                                    <DropdownMenu.Portal>
                                      <DropdownMenu.Content
                                        className="min-w-[145px] rounded-xl bg-secondary-light shadow-xl p-1 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                                        sideOffset={5}
                                      >
                                        {readingOptions.map((option) => (
                                          <DropdownMenu.Item
                                            key={option.label}
                                            onSelect={() => handleMediaTypeChange(userBook.book_id, userBook.shelf, option.value)}
                                            className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-primary hover:text-secondary flex items-center gap-2"
                                          >
                                            <option.icon className="w-4 h-4" />
                                            {option.label}
                                          </DropdownMenu.Item>
                                        ))}
                                      </DropdownMenu.Content>
                                    </DropdownMenu.Portal>
                                  </DropdownMenu.Root>
                                </div>

                                <div className="flex justify-start items-end">
                                {/* Current Status Badge */}
                                <div className="">
                                  <span className={`px-2 py-0.5 text-xs font-regular rounded-full ${currentStatusDisplay.color}`}>
                                    {currentStatusDisplay.label}
                                  </span>
                                </div>  
                                <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs flex items-center rounded-full h-5 px-1 ml-1.5 gap-1 bg-bookWhite shadow-sm hover:bg-muted"
                                  >
                                    Book Status <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </DropdownMenu.Trigger>

                                <DropdownMenu.Portal>
                                  <DropdownMenu.Content
                                    className="min-w-[160px] rounded-2xl bg-secondary-light shadow-xl p-1 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                                    sideOffset={5}
                                  >
                                    {statuses.map((s) => (
                                      <DropdownMenu.Item
                                        key={s.value}
                                        onSelect={() => handleStatusChange(userBook.book_id, userBook.shelf, s.value)}
                                        className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                                      >
                                        {s.label}
                                      </DropdownMenu.Item>
                                    ))}
                                  </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                              </DropdownMenu.Root>
                              </div>

                                {/* Personal Note - Interactive editing */}
                                {editingNoteBookId === userBook.book_id ? (
                                  <div className="flex flex-col gap-2 w-full">
                                    <div className="relative">
                                      <Textarea
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        placeholder="Share your thoughts so far - no spoilers!!!"
                                        className="min-h-[60px] text-xs bg-bookWhite p-1.5 border-secondary/20 resize-none"
                                        maxLength={60}
                                      />
                                      <div className="absolute bottom-1 right-1.5 text-xs text-muted-foreground">
                                        {noteText.length}/60
                                      </div>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={cancelEditingNote}
                                        disabled={isUpdatingNote}
                                        className="h-6 px-2 text-xs bg-secondary/10 text-secondary/45 border-none"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleNoteUpdate(userBook.book_id, userBook.shelf)}
                                        disabled={isUpdatingNote}
                                        className="h-6 px-2 text-xs bg-accent hover:bg-accent-variant"
                                      >
                                        {isUpdatingNote ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => startEditingNote(userBook.book_id, userBook.comment)}
                                    className="group cursor-pointer flex items-center gap-1 px-2 py-0.5 text-xs font-regular bg-accent/80 text-secondary rounded-full max-w-[180px] hover:bg-accent transition-colors"
                                  >
                                    <span className="truncate">
                                      {userBook.comment ? `"${userBook.comment}"` : "Add a thought..."}
                                    </span>
                                    <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                  </div>
                                )}
                              </div>
                            </CardContent>

                            <CardFooter className="pt-0 px-0">
                              
                            </CardFooter>
                          </div>
                        </div>
                        <button
                          onClick={() => handleFavorite(userBook.book_id!)}
                          className={`p-0 absolute bottom-2 right-3`}
                        >
                          <Heart
                            className="h-5 w-5"
                            color="#C51104"
                            weight={userBook.is_favorite ? "fill" : "regular"}
                          />
                        </button>
                      </Card>
                    );
                  })}
                </div>
                {currentlyReadingBooks.length > 8 && (
                <div className="flex justify-center pt-4">
                  <Link href="/profile">
                    <Button variant="secondary" className="border-b-2 bg-transparent rounded-none px-1 border-bookWhite/65 font-light pb-0.5">
                      Go to Profile for complete list
                      <ArrowRight />
                    </Button>
                  </Link>
                </div>
                )}
              </>
              )}
            </TabsContent>

            {/* Content for "Reading Queue" Tab */}
            <TabsContent value="queue" className="space-y-1">
              {isLoading ? (
                <div className="text-center py-8">Loading books...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">Error: {error}</div>
              ) : queueBooks.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  No books in reading queue.
                </p>
              ) : (
                <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {queueBooks.slice(0, 8).map((userBook) => {
                    const currentStatusDisplay = getStatusDisplay(userBook.status);
                    const bookId = userBook.book_id || '';
                    const currentShelfStatus = shelfActionsStatus[bookId];
                    const currentMediaTypeDisplay = getMediaTypeDisplay(userBook.media_type);
                    return (
                      <Card key={userBook.book_id} className="relative overflow-hidden bg-bookWhite py-3">
                        <div className="flex flex-row gap-2 px-4">
                          {/* Book Image */}
                          <div className="w-[100px] flex-shrink-0">
                            <Link href={`/books/${userBook.book_id}`}>
                            <img
                              src={userBook.book.cover_url || "/placeholder.svg"}
                              alt={userBook.book.title || "Book cover"}
                              className="h-[150px] w-full shadow-md rounded object-cover"
                            />
                            </Link>
                          </div>
                          {/* Content */}
                          <div className="flex flex-col">
                            <CardHeader className="pb-0.5 px-0 pt-0">
                              <div className="flex flex-row justify-between items-start">
                                <Link href={`/books/${userBook.book_id}`}>
                                  <CardTitle className="leading-5">{userBook.book.title}</CardTitle>
                                </Link>
                                <div>
                                  {/* Queue Management Dropdown */}
                                  {bookId && (
                                  <div className="flex items-start relative">
                                    <DropdownMenu.Root>
                                      <DropdownMenu.Trigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-xs flex items-end px-0 rounded-full h-auto gap-1 bg-transparent ml-1 border-none hover:bg-transparent"
                                          disabled={currentShelfStatus?.isLoading}
                                        >
                                          {currentShelfStatus?.isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                          ) : (
                                            <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
                                          )}
                                        </Button>
                                      </DropdownMenu.Trigger>

                                      <DropdownMenu.Portal>
                                        <DropdownMenu.Content
                                          className="w-auto rounded-xl bg-transparent shadow-xl px-1 mr-6 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                                          sideOffset={5}
                                        >
                                          <DropdownMenu.Item
                                            onSelect={() => showRemoveConfirmation(bookId, userBook.book.title, 'queue')}
                                            className="px-3 py-2 text-xs text-center bg-red-500/90 my-2 rounded-md cursor-pointer hover:bg-red-600 hover:text-bookWhite focus:bg-red-600 focus:outline-none transition-colors"
                                            disabled={currentShelfStatus?.isLoading}
                                          >
                                            Remove from Queue
                                          </DropdownMenu.Item>
                                        </DropdownMenu.Content>
                                      </DropdownMenu.Portal>
                                    </DropdownMenu.Root>
                                    {/* Display action status message */}
                                    {currentShelfStatus?.message && (
                                      <p className="absolute top-full mb-1 right-0 text-nowrap text-xs mt-1 bg-primary/85 py-1 px-2 text-center flex-1 rounded-xl z-50" style={{ color: currentShelfStatus.message.startsWith('Error') ? 'red' : 'secondary' }}>
                                        {currentShelfStatus.message}
                                      </p>
                                    )}
                                  </div>
                                  )}
                                </div>
                              </div>
                              <CardDescription>{userBook.book.author}</CardDescription>
                            </CardHeader>
                            <CardContent className="pb-0 px-0">
                              <div className="flex flex-wrap gap-1.5 mb-1 items-center">
                                {/* Added On */}
                                {userBook.added_at && (
                                  <span className="px-2 py-0.5 text-xs font-regular bg-primary-dark/50 text-secondary rounded-full">
                                    Added to Queue: {new Date(userBook.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                )}

                                {/* Media Type Selector */}
                                {/* <div className="flex flex-wrap items-center bg-secondary/10 text-secondary rounded-full px-2 py-0.5">
                                  {/* Show the selected icon */}
                                  {/* <currentMediaTypeDisplay.icon className="w-4 h-4" />
                                  <DropdownMenu.Root>
                                    <DropdownMenu.Trigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs flex items-center rounded-full h-5 px-1 ml-1 gap-1 bg-transparent border-none shadow-sm hover:bg-muted"
                                      >
                                        <ChevronDown className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenu.Trigger>

                                    <DropdownMenu.Portal>
                                      <DropdownMenu.Content
                                        className="min-w-[145px] rounded-xl bg-secondary-light shadow-xl p-1 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                                        sideOffset={5}
                                      >
                                        {readingOptions.map((option) => (
                                          <DropdownMenu.Item
                                            key={option.label}
                                            onSelect={() => handleMediaTypeChange(userBook.book_id, userBook.shelf, option.value)}
                                            className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-primary hover:text-secondary flex items-center gap-2"
                                          >
                                            <option.icon className="w-4 h-4" />
                                            {option.label}
                                          </DropdownMenu.Item>
                                        ))}
                                      </DropdownMenu.Content>
                                    </DropdownMenu.Portal>
                                  </DropdownMenu.Root>
                                </div> */}

                                {/* Genre Tags */}
                                <div className="flex flex-wrap gap-1">
                                  {userBook.book.genres?.slice(0, 3).map((genre: string) => (
                                    <span
                                      key={genre}
                                      className="bg-accent/30 text-secondary/40 text-xs/3 font-medium px-2 py-1 rounded-full"
                                    >
                                      {genre}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {/* Pages & Time */}
                              <div className="flex-1">
                                <p className="text-secondary/80 font-sans font-normal text-sm inline-block">{userBook.book.pages} pages • {userBook.book.reading_time}</p>
                              </div>
                              {/* Move to currently reading */}
                              <div className="flex items-end justify-start mt-1">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-full text-accent-variant h-6 border-accent-variant bg-accent-variant/5 text-xs font-serif"
                                  onClick={() => handleStartReading(userBook.book_id)}
                                >
                                  Start Reading
                                  <Sparkles className="h-3 w-3"/>
                                </Button>
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0 pb-0 px-0">
                            </CardFooter>
                          </div>
                        </div>
                        <button
                          onClick={() => handleFavorite(userBook.book_id!)}
                          className={`p-0 absolute bottom-2 right-3`}
                        >
                          <Heart
                            className="h-5 w-5"
                            color="#C51104"
                            weight={userBook.is_favorite ? "fill" : "regular"}
                          />
                        </button>
                      </Card>
                    );
                  })}
                </div>
                {queueBooks.length > 8 && (
                <div className="flex justify-center">
                  <Link href="/profile">
                    <Button variant="secondary" className="border-b-2 bg-transparent rounded-none px-1 border-bookWhite/65 font-light pb-0.5">
                      Go to Profile for complete Queue
                      <ArrowRight />
                    </Button>
                  </Link>
                </div>
                )}
              </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmRemoval.bookId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bookWhite rounded-2xl p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-secondary mb-2">
              Remove Book from {confirmRemoval.shelf === 'currently_reading' ? 'Currently Reading' : 'Reading Queue'}?
            </h3>
            <p className="text-secondary/70 mb-4">
              Are you sure you want to remove "{confirmRemoval.bookTitle}" from your {confirmRemoval.shelf === 'currently_reading' ? 'currently reading list' : 'reading queue'}? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={cancelRemoval}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRemovalAction}
                className="rounded-full bg-red-500 hover:bg-red-600 text-bookWhite"
              >
                Remove Book
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}