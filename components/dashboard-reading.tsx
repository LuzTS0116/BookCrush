"use client";

import { useState, useEffect, useRef, useMemo } from "react"; // Added useEffect, useMemo
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, Smartphone, BookOpen, Headphones, Sparkles, ArrowRight, EllipsisVertical, Loader2, Edit3, Check, X, Heart as LucideHeart, ThumbsUp as LucideThumbsUp, ThumbsDown as LucideThumbsDown } from "lucide-react";
import { Heart } from "@phosphor-icons/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion"; // Retaining these if you plan to use animation
import { BookDetails, BookFile, UserBook, StatusDisplay, TabDisplay } from "@/types/book";
import { toast } from "sonner";
import { useSession } from "next-auth/react"; // Add session management
import Image from "next/image";
import html2canvas from "html2canvas";
import { ShareAchievementDialog } from "./ShareAchievementDialog";
import { launchConfettiRealistic } from '@/lib/confetti-utils' // adjust the path to your utils
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

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

// Add interface for the finished book dialog
interface FinishedBookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  book: UserBook | null;
  onSubmit: (reviewText: string | null, rating: "HEART" | "THUMBS_UP" | "THUMBS_DOWN" | null, skipReview: boolean) => void;
  isSubmitting: boolean;
  shareDialogCallback : () => void;
}

// Add the FinishedBookDialog component
export function FinishedBookDialog({ isOpen, onClose, book, onSubmit, isSubmitting, shareDialogCallback }: FinishedBookDialogProps) {
  const { data: session } = useSession(); // Add session management
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState<"HEART" | "THUMBS_UP" | "THUMBS_DOWN" | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [downloadedImageUrl, setDownloadedImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [hasFiredConfetti, setHasFiredConfetti] = useState(false)
  const [skipReview, setSkipReview] = useState(false);

  const imageRef = useRef(null);

  

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setReviewText("");
      setRating(null);
    }
  }, [isOpen]);

  // Confetti Effect when opening dialog
  useEffect(() => {
    if (isOpen && !hasFiredConfetti) {
      launchConfettiRealistic()
      setHasFiredConfetti(true)
    }
  }, [isOpen, hasFiredConfetti])

  // Reset it if needed when closing the dialog
  useEffect(() => {
    if (!isOpen) setHasFiredConfetti(false)
  }, [isOpen])

  // const handleSubmit = () => {
  //   if (!rating) {
  //     toast.error('Please select a rating');
  //     return;
  //   }
  //   onSubmit(reviewText, rating);
  // };

  const getRatingIcon = (ratingType: "HEART" | "THUMBS_UP" | "THUMBS_DOWN", isSelected: boolean) => {
    const baseClasses = "h-5 w-5";
    const selectedClasses = isSelected ? "" : "";
    
    switch (ratingType) {
      case "HEART":
        return (
          <LucideHeart 
            className={`${baseClasses} ${isSelected ? "text-primary fill-primary rounded-full" : "text-muted-foreground"} ${selectedClasses}`} 
          />
        );
      case "THUMBS_UP":
        return (
          <LucideThumbsUp 
            className={`${baseClasses} ${isSelected ? "text-accent-variant rounded-full" : "text-muted-foreground"} ${selectedClasses}`} 
          />
        );
      case "THUMBS_DOWN":
        return (
          <LucideThumbsDown 
            className={`${baseClasses} ${isSelected ? "text-accent rounded-full" : "text-muted-foreground"} ${selectedClasses}`} 
          />
        );
      default:
        return null;
    }
  };

  function clampText(text: string, maxChars = 240) {
    return text.length > maxChars ? text.slice(0, maxChars).trim() + "…" : text;
  }

  const generateAndOpenShareDialog = async (book: UserBook | null) => {
    const element = document.getElementById("share-image-preview");

    if (!element) {
      console.error("Could not find preview image element")
      return;
    }

    if (!book?.book.cover_url) {
      console.error("Book cover URL is missing, cannot generate share image.");
      toast.error("Book cover image not available for sharing.");
      setShareDialogOpen(true); // Open dialog to inform user
      return;
    }

    try {
      setLoadingImage(true); // Set loading true before starting image process
      // Give a small delay to ensure image is fully rendered/decoded by the browser
      await new Promise(resolve => setTimeout(resolve, 100)); 

      const canvas = await html2canvas(element,{
        useCORS: true});
      const dataUrl = canvas.toDataURL("image/png");
      setDownloadedImageUrl(dataUrl);
      setShareDialogOpen(true); // Open the Share dialog
    } catch (err) {
      console.error("Failed to generate share image:", err);
      setDownloadedImageUrl(null);
      setShareDialogOpen(true); // Still open dialog to show error
    } finally {
      setLoadingImage(false); // Ensure loading is false regardless of success or failure
    }
  };

  const handleSubmit = async (skipReview: boolean = false) => {

  if (!rating && !skipReview) {
    toast.error("Please select a rating");
    return;
  }

  try {
    // If skipReview is true, submit null for reviewText and rating
    if (skipReview) {

      onSubmit(null, null, true); // Wait for review to be submitted
      setSkipReview(true);
    } else {
      onSubmit(reviewText, rating, false); // Wait for review to be submitted
    }
       // Then open share dialog
    if (isSubmitting == false){
      generateAndOpenShareDialog(book);
    }
    //shareDialogCallback();
  } catch (err) {
    console.error("Error submitting review:", err);
    toast.error("Something went wrong.");
  }
};

  if (!book) return null;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[85vw] bg-bookWhite p-3 text-secondary">
        <Image 
          src="/images/quote-bg.png"
          alt="Create and Manage your Book Clubs | BookCrush"
          width={1622}
          height={2871}
          className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
        />
        <DialogHeader className="p-0 pt-5">
          <DialogTitle className="text-secondary-light">
            <p className="py-2 px-8 bg-accent/25 rounded-lg mt-3 mb-4 text-xl">🎉 Congratulations 🎉</p>
            <div className="flex flex-row gap-3">
              <div className="flex justify-center mb-1">
                <img
                  src={book.book.cover_url || "/placeholder.svg"}
                  alt={book.book.title}
                  className="w-42 h-auto object-cover rounded shadow-sm"
                />
              </div>
              <div className="flex flex-col">
                <p className="text-lg font-light text-left leading-5">You've finished <span className="font-bold">{book.book.title}</span>!</p>
                <p className="text-secondary-light/80 text-sm font-light text-left leading-4 mt-3">Your journey with this book just ended. Share your thoughts with your reading community.</p>
                <div className="flex justify-start gap-3 mt-3">
                  <button
                    onClick={() => setRating("HEART")}
                    className={`p-2 rounded-full transition-colors ${
                      rating === "HEART" 
                        ? "bg-primary/30" 
                        : "hover:bg-secondary/20"
                    }`}
                    disabled={isSubmitting}
                  >
                    {getRatingIcon("HEART", rating === "HEART")}
                  </button>
                  <button
                    onClick={() => setRating("THUMBS_UP")}
                    className={`p-2 rounded-full transition-all ${
                      rating === "THUMBS_UP" 
                        ? "bg-accent-variant/20" 
                        : "hover:bg-secondary/10"
                    }`}
                    disabled={isSubmitting}
                  >
                    {getRatingIcon("THUMBS_UP", rating === "THUMBS_UP")}
                  </button>
                  <button
                    onClick={() => setRating("THUMBS_DOWN")}
                    className={`p-2 rounded-full transition-all ${
                      rating === "THUMBS_DOWN" 
                        ? "bg-accent/25" 
                        : "hover:bg-secondary/10"
                    }`}
                    disabled={isSubmitting}
                  >
                    {getRatingIcon("THUMBS_DOWN", rating === "THUMBS_DOWN")}
                  </button>
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {/* Review Text */}
        <div className="space-y-1">
          <Textarea
            placeholder="Book Review - Any thoughts you'd like to share? What will you remember most about this book? (optional)"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="min-h-[80px] bg-[#FAF9F6]/60 border-secondary-light/30 text-secondary/80 text-sm font-light leading-4 placeholder:text-secondary/50 placeholder:text-sm placeholder:leading-4 placeholder:italic"
            disabled={isSubmitting}
          />
          <p className="text-xs text-secondary/50 text-right">
            {reviewText.length}/500 characters
          </p>
        </div>

        <DialogFooter className="gap-1">
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="rounded-full text-bookWhite bg-secondary-light"
          >
            Skip Review
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={!rating || isSubmitting}
            className="rounded-full bg-accent hover:bg-accent-variant"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Finish & Review
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Share Dialog */}
      <ShareAchievementDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        downloadedImageUrl={downloadedImageUrl}
        loading={loadingImage}
        shareDialogCallback={shareDialogCallback}
        skipReview={skipReview}
        
      />

      {/* Hidden image for generation */}
      <div id="share-image-preview" ref={imageRef} className="absolute -top-[9999px] left-0" aria-hidden="true">
        <div className="w-[1080px] h-[1920px] bg-[url('/images/finished-bg.png')] flex flex-col items-center pt-[292px] px-12 pb-8 text-center">
          <p className="text-[65px] text-secondary leading-none">{session?.user?.name?.split(" ")[0]}</p>
          <p className={`text-[46px] text-secondary-light font-light ${reviewText ? "mb-[100px]" : "mb-[152px]"}`}>just finished reading</p>
          <div className="p-4 bg-[url('/images/background.png')] object-cover overflow-hidden rounded-lg w-[320px] h-auto">
            <img
              src={book.book.cover_url ||"/placeholder.svg"}
              alt="Book cover"
              className="w-[312px] h-auto rounded shadow-lg z-50"
              crossOrigin="anonymous"
              onLoad={() => setLoadingImage(false)}
              onError={() => setLoadingImage(false)}
            />
          </div>
          <p className="text-[60px] font-normal leading-none mt-2 text-center max-w-[620px] text-secondary">{book.book.title}</p>
          <p className="text-[35px] font-serif text-secondary-light/55 leading-none mt-2 mb-16 text-center">{book.book.author}</p>
          <div className="relative flex flex-col items-center">
            {rating && (
              <div className={`z-50 mt-6 ${reviewText ? "absolute -top-10" : "mb-8"}`}>
                <p className="text-[65px] leading-[32px] w-[120px] h-[120px] rounded-full p-3 bg-bookWhite border-[4px] border-accent">
                  {rating === "HEART" ? "💖" : rating === "THUMBS_UP" ? "👍" : "👎"}
                </p>
              </div>
            )}
            {reviewText && (
              <div className="w-[680px] rounded-3xl px-6 pb-8 pt-[40px] mt-16 bg-bookWhite/75 z-20">
                <p className="text-[35px] text-secondary/70 font-serif leading-none text-center">"{clampText(reviewText)}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>

  );
}

export default function DashboardReading() {
  const { data: session, status } = useSession(); // Add session management
  // State to hold books for each shelf
  const [currentlyReadingBooks, setCurrentlyReadingBooks] = useState<UserBook[]>([]);
  const [queueBooks, setQueueBooks] = useState<UserBook[]>([]);
  
  // State for active tab (should match shelf_type enum values)
  const [activeTab, setActiveTab] = useState<UserBook['shelf']>("currently_reading"); 

  const [isLoading, setIsLoading] = useState(false);
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

  // Add state for the finished book dialog
  const [finishedBookDialog, setFinishedBookDialog] = useState<{
    isOpen: boolean;
    book: UserBook | null;
    bookId: string | null;
    currentShelf: UserBook['shelf'] | null;
  }>({
    isOpen: false,
    book: null,
    bookId: null,
    currentShelf: null
  });
  const [isSubmittingFinishedReview, setIsSubmittingFinishedReview] = useState(false);

  const router = useRouter();


  // Function to fetch books from the API
  const fetchBooks = async (shelf: UserBook['shelf']) => {
    // Don't make API call if we don't have authentication
    if (status !== 'authenticated' || !session?.supabaseAccessToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
   
    try {
      const response = await fetch(`/api/shelf?shelf=${shelf}`, {
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        }
      });
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
    // Only fetch books if session is loaded and we have an access token
    if (session?.supabaseAccessToken) {
      fetchBooks(activeTab);
    }
  }, [activeTab, session?.supabaseAccessToken]); // Dependency array: re-run when activeTab, session status, or token changes

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

  // Modified handleStatusChange function
  const handleStatusChange = async (
    bookId: string, 
    currentShelf: UserBook['shelf'], 
    newStatus: UserBook['status']
  ) => {
    // If the new status is "finished", open the review dialog instead of immediately updating
    if (newStatus === "finished") {
      const book = [...currentlyReadingBooks, ...queueBooks].find(b => b.book_id === bookId);
      if (book) {
        setFinishedBookDialog({
          isOpen: true,
          book,
          bookId,
          currentShelf
        });
        return; // Don't proceed with status update yet
      }
    }

    // For all other status changes, proceed as normal
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session?.supabaseAccessToken}` },
        body: JSON.stringify({ bookId, shelf: currentShelf, status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update book status');
      }

      // If the status is unfinished, also remove from currently reading
      if (newStatus === "unfinished") {
        setCurrentlyReadingBooks(prevBooks =>
          prevBooks.filter(userBook => userBook.book_id !== bookId)
        );
      }

    } catch (err: any) {
      console.error("Error updating status:", err);
      toast.error(`Failed to update status: ${err.message}`);
      // Rollback UI update if API fails
      fetchBooks(currentShelf);
    }
  };

  const shareDialogCallback = () => {
    setFinishedBookDialog({ isOpen: false, book: null, bookId: null, currentShelf: null }); 
  }

  // Function to handle finished book review submission
  const handleFinishedBookReview = async (reviewText: string | null, rating: "HEART" | "THUMBS_UP" | "THUMBS_DOWN" | null, skipReview: boolean = false) => {
    if (!finishedBookDialog.bookId || !finishedBookDialog.currentShelf) return;

    setIsSubmittingFinishedReview(true);
    
    try {
      // Submit review if text is provided
      if (reviewText && reviewText.trim() && !skipReview) {
        const reviewResponse = await fetch(`/api/books/${finishedBookDialog.bookId}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: reviewText.trim(),
            rating: rating
          })
        });

        if (!reviewResponse.ok) {
          const errorData = await reviewResponse.json();
          throw new Error(errorData.error || 'Failed to submit review');
        }
      } else if (rating && !skipReview) {
        // If no review text, just submit the rating as a reaction
        const reactionResponse = await fetch('/api/reactions/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetId: finishedBookDialog.bookId,
            targetType: 'BOOK',
            type: rating
          })
        });

        if (!reactionResponse.ok) {
          const errorData = await reactionResponse.json();
          throw new Error(errorData.error || 'Failed to submit rating');
        }
      }

      // Update book status to finished
      const statusResponse = await fetch('/api/shelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session?.supabaseAccessToken}` },
        body: JSON.stringify({ 
          bookId: finishedBookDialog.bookId, 
          shelf: finishedBookDialog.currentShelf, 
          status: 'finished' 
        })
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        throw new Error(errorData.error || 'Failed to mark book as finished');
      }

      // Remove from currently reading since it's now finished
      setCurrentlyReadingBooks(prevBooks =>
        prevBooks.filter(userBook => userBook.book_id !== finishedBookDialog.bookId)
      );

      // Close dialog and show success message
      //setFinishedBookDialog({ isOpen: false, book: null, bookId: null, currentShelf: null });
      

      toast.success('Book marked as finished! Thanks for sharing your thoughts.');

    } catch (err: any) {
      console.error("Error submitting finished book review:", err);
      toast.error(`Failed to submit: ${err.message}`);
    } finally {
      setIsSubmittingFinishedReview(false);
    }
  };

  // Function to close the finished book dialog
  const closeFinishedBookDialog = () => {
    setFinishedBookDialog({ isOpen: false, book: null, bookId: null, currentShelf: null });
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
        headers: { 'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session?.supabaseAccessToken}` },
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
        headers: { 'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session?.supabaseAccessToken}` },
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
        headers: { 'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session?.supabaseAccessToken}` },
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
  
  const handleGoToLibrary = () => {
    router.push('/books'); // Navigate to the friends page where the full activity is shown
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
        <div className="grid gap-6">
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
              {status === "loading" || isLoading ? (
                <div className="text-center py-8">Loading books...</div>
              ) : status === "unauthenticated" ? (
                <div className="text-center py-8 text-muted-foreground">Please sign in to view your books.</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">Error: {error}</div>
              ) : currentlyReadingBooks.length === 0 ? (
                <div className="py-4 px-7">
                  <p className="col-span-full text-sm text-center text-bookWhite mb-2">No books in your “Currently Reading” shelf.</p>
                  <p className="col-span-full text-sm leading-4 text-center font-thin text-bookWhite/70">Need some inspiration? Head to the shared library to pick your next read!</p>
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      className="rounded-full border-none bg-primary mt-3 text-secondary"
                      onClick={handleGoToLibrary}
                    >
                      Shared Library 
                    </Button>
                  </div>
                </div>
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
                        {/* Three dots menu - positioned absolutely relative to the entire card */}
                        {bookId && (
                          <div className="absolute top-3 right-3 z-20">
                            <DropdownMenu.Root>
                              <DropdownMenu.Trigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs flex items-center justify-center w-6 h-6 p-0 rounded-full bg-bookWhite/80 border-none hover:bg-bookWhite shadow-sm"
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
                                  className="rounded-xl flex flex-col justify-end bg-transparent shadow-xl px-1 mr-8 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
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
                                  className="px-3 py-2 w-[132px] self-end text-xs text-end bg-red-700/90 rounded-md cursor-pointer hover:bg-red-600 hover:text-bookWhite focus:bg-red-600 focus:outline-none transition-colors"
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
                              {/* Title and Author - no more right padding needed */}
                              <div>
                                <Link href={`/books/${userBook.book_id}`}>
                                  <CardTitle className="leading-5">{userBook.book.title}</CardTitle>
                                </Link>
                                <CardDescription>{userBook.book.author}</CardDescription>
                              </div>
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
                                {/* Unified Status Badge with Dropdown */}
                                <DropdownMenu.Root>
                                  <DropdownMenu.Trigger asChild>
                                    <button className={`px-2 py-0.5 text-xs font-regular rounded-full cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 ${currentStatusDisplay.color}`}>
                                      {currentStatusDisplay.label}
                                      <ChevronDown className="h-3 w-3" />
                                    </button>
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
                                        placeholder="Share a short thought - no spoilers!!!"
                                        className="min-h-[60px] text-xs bg-bookWhite p-1.5 border-secondary/20 resize-none"
                                        maxLength={32}
                                      />
                                      <div className="absolute bottom-1 right-1.5 text-xs text-muted-foreground">
                                        {noteText.length}/32
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
                                    <Edit3 className="h-3 w-3 opacity-75 group-hover:opacity-100 transition-opacity flex-shrink-0" />
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
              {status === "loading" || isLoading ? (
                <div className="text-center py-8">Loading books...</div>
              ) : status === "unauthenticated" ? (
                <div className="text-center py-8 text-muted-foreground">Please sign in to view your books.</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">Error: {error}</div>
              ) : queueBooks.length === 0 ? (
                <div className="py-4 px-7">
                  <p className="col-span-full text-sm text-center text-bookWhite mb-2">Your reading queue is empty.</p>
                  <p className="col-span-full text-sm leading-4 text-center font-thin text-bookWhite/70">Head to the shared library and queue up a few reads to keep your bookshelf flowing with stories!</p>
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      className="rounded-full border-none bg-primary mt-3 text-secondary"
                      onClick={handleGoToLibrary}
                    >
                      Shared Library 
                    </Button>
                  </div>
                </div>
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
                        {/* Three dots menu - positioned absolutely relative to the entire card */}
                        {bookId && (
                          <div className="absolute top-3 right-3 z-20">
                            <DropdownMenu.Root>
                              <DropdownMenu.Trigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs flex items-center justify-center w-6 h-6 p-0 rounded-full bg-bookWhite/80 border-none hover:bg-bookWhite shadow-sm"
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
                                    className="px-3 py-2 text-xs text-center bg-red-700/90 my-2 rounded-md cursor-pointer hover:bg-red-800 hover:text-bookWhite focus:bg-red-600 focus:outline-none transition-colors"
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
                              {/* Title and Author - no more right padding needed */}
                              <div>
                                <Link href={`/books/${userBook.book_id}`}>
                                  <CardTitle className="leading-5">{userBook.book.title}</CardTitle>
                                </Link>
                                <CardDescription>{userBook.book.author}</CardDescription>
                              </div>
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
          <div className="bg-bookWhite/95 w-[80vw] rounded-2xl p-4 max-w-md mx-4 shadow-xl">
            <p className="text-secondary/70 text-center leading-5">
              Are you sure you want to remove "{confirmRemoval.bookTitle}" from your {confirmRemoval.shelf === 'currently_reading' ? 'currently reading shelf' : 'reading queue'}?
            </p>
            <p className="text-secondary/70 text-center leading-5 mb-3">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={cancelRemoval}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRemovalAction}
                className="rounded-full bg-red-700 hover:bg-red-800 text-bookWhite"
              >
                Remove Book
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add the FinishedBookDialog component before the closing div */}
      <FinishedBookDialog
        isOpen={finishedBookDialog.isOpen}
        onClose={closeFinishedBookDialog}
        book={finishedBookDialog.book}
        onSubmit={handleFinishedBookReview}
        isSubmitting={isSubmittingFinishedReview}
        shareDialogCallback={shareDialogCallback}
      />
    </div>
  );
}