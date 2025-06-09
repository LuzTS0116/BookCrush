"use client";

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Label } from "@/components/ui/label";
import { Heart as PhosphorHeart } from "@phosphor-icons/react";
import { Heart, ThumbsUp, ArrowLeft, ThumbsDown, Plus, Send, BookOpen, Calendar, User, Clock, ChevronLeft, MessageSquare, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { BookDetails } from "@/types/book";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useParams } from "next/navigation";
import BookFileUpload from "@/components/book-file-upload";

// Define types for our data
interface BookReview {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    initials: string;
  };
  rating: "HEART" | "THUMBS_UP" | "THUMBS_DOWN";
  text: string;
  date: string;
}

interface BookReactions {
  HEART: number;
  THUMBS_UP: number;
  THUMBS_DOWN: number;
  LIKE: number;
}

interface BookData {
  id: string;
  title: string;
  author: string;
  cover: string;
  published: string;
  pages: number;
  genre: string[];
  isbn: string;
  description: string;
  reading_time: string;
  userProgress: number;
  clubs: Array<{
    id: string;
    name: string;
    members: number;
    meetingDate: string;
  }>;
}

// Define the available shelf types for the dropdown
const SHELF_OPTIONS = [
  { label: "Currently Reading", value: "currently_reading" },
  { label: "Reading Queue", value: "queue" },
  { label: "Finished", value: "finished" },
];

// Add a separate KindleEmailDialog component
function KindleEmailDialog({ 
  open, 
  onOpenChange, 
  selectedFileId, 
  onSend 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  selectedFileId: string | null; 
  onSend: (fileId: string, email: string) => void; 
}) {
  const [email, setEmail] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enter Kindle Email Address</DialogTitle>
          <DialogDescription>
            We need your Kindle email address to deliver the book. You can find this in your Kindle settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="kindle-email">Kindle Email</Label>
            <Input
              id="kindle-email"
              type="email"
              placeholder="your-kindle@kindle.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              if (selectedFileId) {
                onSend(selectedFileId, email);
                onOpenChange(false);
              }
            }}
            disabled={!email.includes('@')}
          >
            Send to Kindle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BookDetailsView({ params }: { params: { id: string } }) {
  const [reviewText, setReviewText] = useState("")
  const [userRating, setUserRating] = useState<"HEART" | "THUMBS_UP" | "THUMBS_DOWN" | null>(null)
  const [userReaction, setUserReaction] = useState<"HEART" | "THUMBS_UP" | "THUMBS_DOWN" | null>(null)
  const [reviews, setReviews] = useState<BookReview[]>([])
  const [reactions, setReactions] = useState<BookReactions>({ HEART: 0, THUMBS_UP: 0, THUMBS_DOWN: 0, LIKE: 0 })
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [userFavorite, setUserFavorite] = useState<Record<string, boolean>>({});
  const [englishFile, setEnglishFile] = useState<File | null>(null)
  const [spanishFile, setSpanishFile] = useState<File | null>(null)

  // New state for book data
  const [book, setBook] = useState<BookData | null>(null)
  const [isLoadingBook, setIsLoadingBook] = useState(true)
  const [bookError, setBookError] = useState<string | null>(null)

  const [books, setBooks] = useState<BookDetails[]>([]);

  // Key: bookId, Value: { isLoading: boolean, message: string | null }
  const [shelfActionsStatus, setShelfActionsStatus] = useState<Record<string, { isLoading: boolean, message: string | null }>>({});

  const router = useRouter();
  const {id} = useParams();

  // Add state for storing book files
  const [bookFiles, setBookFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Add new state variables for Kindle delivery
  const [isSendingToKindle, setIsSendingToKindle] = useState<Record<string, boolean>>({});
  const [kindleEmailDialogOpen, setKindleEmailDialogOpen] = useState(false);
  const [customKindleEmail, setCustomKindleEmail] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Add a function to fetch book files
  const fetchBookFiles = async () => {
    try {
      setIsLoadingFiles(true);
      const response = await fetch(`/api/books/files?bookId=${id}`);
      
      if (response.ok) {
        const files = await response.json();
        console.log(files)
        setBookFiles(files);
      } else {
        console.error('Failed to fetch book files');
      }
    } catch (error) {
      console.error('Error fetching book files:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Add useEffect to fetch files on component mount
  useEffect(() => {
    if (id) {
      fetchBookFiles();
    }
  }, [id]);

  // Fetch book data
  
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setIsLoadingBook(true)
        setBookError(null)
        
        const response = await fetch(`/api/books/${id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setBookError('Book not found')
          } else {
            setBookError('Failed to load book details')
          }
          return
        }
        
        const bookData = await response.json()
        setBook(bookData)
        
      } catch (error) {
        console.error('Error fetching book:', error)
        setBookError('Failed to load book details')
      } finally {
        setIsLoadingBook(false)
      }
    }

    fetchBook()
  }, [id])

  // Fetch reviews and reactions on component mount
  useEffect(() => {
    const fetchReviewsAndReactions = async () => {
      try {
        setIsLoadingReviews(true)
        
        // Fetch reviews and reactions in parallel
        const [reviewsResponse, reactionsResponse] = await Promise.all([
          fetch(`/api/books/${id}/reviews`),
          fetch(`/api/books/${id}/reactions`)
        ])

        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json()
          setReviews(reviewsData)
        } else {
          console.error('Failed to fetch reviews')
        }

        if (reactionsResponse.ok) {
          const reactionsData = await reactionsResponse.json()
          setReactions(reactionsData.reactions)
          setUserReaction(reactionsData.userReaction)
        } else {
          console.error('Failed to fetch reactions')
        }

      } catch (error) {
        console.error('Error fetching reviews and reactions:', error)
      } finally {
        setIsLoadingReviews(false)
      }
    }

    fetchReviewsAndReactions()
  }, [id])

  // Show loading state
  if (isLoadingBook) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Loading book details...</span>
      </div>
    )
  }

  // Show error state
  if (bookError || !book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{bookError || 'Book not found'}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Add separate handler for quick reactions (not part of reviews)
  const handleQuickReaction = async (rating: "HEART" | "THUMBS_UP" | "THUMBS_DOWN") => {
    try {
      // Toggle rating using existing reaction API
      const response = await fetch('/api/reactions/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId: id,
          targetType: 'BOOK',
          type: rating
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update local state based on the operation
        if (result.operation === 'created') {
          // Remove any existing reaction first
          if (userReaction) {
            setReactions(prev => ({
              ...prev,
              [userReaction]: Math.max(0, prev[userReaction] - 1)
            }))
          }
          
          // Add new reaction
          setReactions(prev => ({
            ...prev,
            [rating]: prev[rating] + 1
          }))
          setUserReaction(rating)
          toast.success('Reaction added!')
        } else {
          // Reaction was removed
          setReactions(prev => ({
            ...prev,
            [rating]: Math.max(0, prev[rating] - 1)
          }))
          setUserReaction(null)
          toast.success('Reaction removed!')
        }
      } else {
        toast.error('Failed to update reaction')
      }
    } catch (error) {
      console.error('Error updating reaction:', error)
      toast.error('Failed to update reaction')
    }
  }

  const handleRating = (rating: "HEART" | "THUMBS_UP" | "THUMBS_DOWN") => {
    // For reviews, just set the rating locally - it will be submitted with the review
    if (!isSubmittingReview) {
      setUserRating(rating)
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewText.trim() || !userRating) {
      toast.error('Please provide both a rating and review text')
      return
    }

    try {
      setIsSubmittingReview(true)

      const response = await fetch(`/api/books/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: reviewText,
          rating: userRating
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Add the new review to the top of the list
        setReviews(prev => [result.review, ...prev])
        
        // Update the reaction count in the main display only if this is a new review
        // Check if user already had a review (this would be an update vs new review)
        const existingReviewIndex = reviews.findIndex(review => review.user.id === result.review.user.id)
        if (existingReviewIndex === -1) {
          // This is a new review, update reaction count
          setReactions(prev => ({
            ...prev,
            [userRating]: prev[userRating] + 1
          }))
        }
        
        // Reset the form
        setReviewText("")
        // Keep the rating selected for potential future reviews
        
        toast.success('Review posted successfully!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to post review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to post review')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const getRatingIcon = (rating: string, size = 5) => {
    switch (rating) {
      case "HEART":
        return <Heart className={`h-${size} w-${size} text-primary fill-primary`} />
      case "THUMBS_UP":
        return <ThumbsUp className={`h-${size} w-${size} text-accent-variant`} />
      case "THUMBS_DOWN":
        return <ThumbsDown className={`h-${size} w-${size} text-accent`} />
      default:
        return null
    }
  }

  // Function to add/move a book to a shelf
  const handleAddToShelf = async (bookId: string, shelf: string) => {
    setShelfActionsStatus(prev => ({
      ...prev,
      [bookId]: { isLoading: true, message: null }
    }));
    try {
      // Your API call to add/move the book
      const response = await fetch('/api/shelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, shelf, status: 'in_progress' }) // Default status for new additions
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add book to shelf');
      }
      const result = await response.json();
      console.log('Book added/moved to shelf:', result);

      setShelfActionsStatus(prev => ({
        ...prev,
        [bookId]: { isLoading: false, message: `Added to ${shelf.replace(/_/g, ' ')}!` }
      }));

      // Clear message after a few seconds
      setTimeout(() => {
        setShelfActionsStatus(prev => ({ ...prev, [bookId]: { isLoading: false, message: null } }));
      }, 3000);

    } catch (err: any) {
      console.error("Error adding book to shelf:", err);
      setShelfActionsStatus(prev => ({
        ...prev,
        [bookId]: { isLoading: false, message: `Error: ${err.message}` }
      }));
    }
  };

  // Add book to favorites - heart
  const handleFavorite = (bookId: string) => {
    setUserFavorite(prev => ({
      ...prev,
      [bookId]: !prev[bookId],
    }));
  };

  // Update the hasFileOfLanguage function to check the language field
  const hasFileOfLanguage = (files: any[], language: string): boolean => {
    return files.some(file => 
      file.language?.toLowerCase() === language.toLowerCase() || 
      // Fallback to check name/storage_key in case language field isn't set
      file.original_name?.toLowerCase().includes(language.toLowerCase()) ||
      file.storage_key?.toLowerCase().includes(language.toLowerCase())
    );
  };

  // Add function to handle sending to Kindle
  const handleSendToKindle = async (fileId: string, customEmail?: string) => {
    try {
      setIsSendingToKindle(prev => ({ ...prev, [fileId]: true }));
      
      const response = await fetch('/api/books/files/kindle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileId,
          customEmail
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send to Kindle');
      }
      
      const result = await response.json();
      toast.success(result.message || 'Book sent to Kindle!');
      
    } catch (error: any) {
      console.error('Error sending to Kindle:', error);
      
      if (error.message.includes('No Kindle email found')) {
        // If user doesn't have a Kindle email set up, open dialog to provide one
        setSelectedFileId(fileId);
        setKindleEmailDialogOpen(true);
      } else {
        toast.error(error.message || 'Failed to send to Kindle');
      }
    } finally {
      setIsSendingToKindle(prev => ({ ...prev, [fileId]: false }));
    }
  };

  // Function to find file ID by language
  const getFileIdByLanguage = (files: any[], language: string): string | null => {
    const file = files.find(file => 
      file.language?.toLowerCase() === language.toLowerCase() || 
      file.original_name?.toLowerCase().includes(language.toLowerCase()) || 
      file.storage_key?.toLowerCase().includes(language.toLowerCase())
    );
    return file?.id || null;
  };

  // Updated handleSendToKindle function to work with the dialog component
  const handleSendToKindleWithEmail = (fileId: string, email: string) => {
    handleSendToKindle(fileId, email);
  };

  return (
    <div className="space-y-3 px-2 mb-16">
      {/* Header Section */}
        <Card className="bg-bookWhite/90 rounded-xl overflow-hidden mt-0">
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
                    onClick={() => router.back()} // You can also use navigate("/previous") if using React Router
                    className="absolute top-3 left-3 p-2 rounded-full bg-bookWhite/80 backdrop-blur-sm hover:bg-bookWhite shadow-md"
                >
                    <ArrowLeft className="h-5 w-5 text-secondary" />
                </button>
            </div>
            <div className="flex flex-row justify-between gap-2 p-3 pb-2">
              <div>
                <div className="w-36 h-56 bg-muted/30 rounded-md flex items-center justify-center overflow-hidden">
                  <img src={book.cover || "/placeholder.svg"} alt={book.title} className="max-h-full" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex flex-row justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-base/5 break-words font-bold text-secondary-light">{book.title}</h1>
                  </div>
                  <div className="flex items-start">
                    <button
                      onClick={() => handleFavorite(book.id)}
                      className={`py-0 pl-0 pr-3 -mt-0.5`}
                    >
                      <PhosphorHeart
                        className="h-5 w-5"
                        color="#C51104"
                        weight={userFavorite[book.id] ? "fill" : "regular"}
                      />
                    </button>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs flex items-end px-0 rounded-full h-auto gap-1 bg-transparent border-none"
                        // disabled={currentShelfStatus?.isLoading} // Disable while action is loading
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
                            onSelect={() => handleAddToShelf(book.id, shelf.value)}
                            className="px-3 py-2 text-xs text-center bg-secondary/90 my-2 rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                          >
                            {shelf.label}
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                  </div>
                </div>
                <p className="text-sm text-secondary font-serif">by {book.author}</p>
                <span className="text-xs/3 text-secondary/50 font-serif">published: {book.published}</span>
                <div className="flex flex-row gap-3 mt-2">
                  <div className="flex justify-center gap-2">
                      <div className="flex gap-1">
                          <Heart className="h-3 w-3 text-primary fill-primary" />
                          <span className="font-serif font-medium text-xs text-secondary">{reactions.HEART}</span>
                      </div>
                      <div className="flex gap-1">
                          <ThumbsUp className="h-3 w-3 text-accent-variant" />
                          <span className="font-serif font-medium text-xs text-secondary">{reactions.THUMBS_UP}</span>
                      </div>
                      <div className="flex gap-1">
                          <ThumbsDown className="h-3 w-3 text-accent" />
                          <span className="font-serif font-medium text-xs text-secondary">{reactions.THUMBS_DOWN}</span>
                      </div>
                  </div>
                  <p className="underline text-center font-serif text-xs text-secondary-light">view reviews</p>
                </div>

                <div className="flex flex-wrap gap-1 mt-2 mb-2">
                  {book.genre.map((g) => (
                    <Badge key={g} variant="secondary" className="bg-primary/50 text-secondary/50 font-medium font-serif">
                      {g}
                    </Badge>
                  ))}
                </div> 
                <div className="flex-1">
                  <span className="font-medium font-serif text-xs/3 text-secondary-light bg-secondary/5 rounded-full px-2 py-0.5">{book.pages} pages • {book.reading_time}</span>
                </div>

                <div className="mt-2">
                  {/* Quick Reaction Section */}
                  <div className="flex flex-col items-start gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleQuickReaction("HEART")}
                        className={`p-1 rounded-full transition-colors ${
                          userReaction === "HEART" 
                            ? "bg-primary/30 ring-2 ring-primary/50" 
                            : "hover:bg-primary/20"
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${
                          userReaction === "HEART" 
                            ? "text-primary fill-primary" 
                            : "text-primary"
                        }`} />
                      </button>
                      <button
                        onClick={() => handleQuickReaction("THUMBS_UP")}
                        className={`p-1 rounded-full transition-colors ${
                          userReaction === "THUMBS_UP" 
                            ? "bg-accent-variant/30 ring-2 ring-accent-variant/50" 
                            : "hover:bg-accent-variant/20"
                        }`}
                      >
                        <ThumbsUp className={`h-5 w-5 ${
                          userReaction === "THUMBS_UP" 
                            ? "text-accent-variant" 
                            : "text-accent-variant"
                        }`} />
                      </button>
                      <button
                        onClick={() => handleQuickReaction("THUMBS_DOWN")}
                        className={`p-1 rounded-full transition-colors ${
                          userReaction === "THUMBS_DOWN" 
                            ? "bg-accent/30 ring-2 ring-accent/50" 
                            : "hover:bg-accent/20"
                        }`}
                      >
                        <ThumbsDown className={`h-5 w-5 ${
                          userReaction === "THUMBS_DOWN" 
                            ? "text-accent" 
                            : "text-accent"
                        }`} />
                      </button>
                    </div>
                  </div>
                  {/* <div className="flex flex-col ml-0">
                    <span className="text-xs/3 text-secondary-light font-semibold">OpenLibrary</span>
                    <div className="flex-1">
                      <span className="font-medium text-xs/3 text-secondary-light bg-secondary/5 rounded-full px-2 py-0.5">⭐ {book.isbn}</span>
                    </div>
                  </div> */}
                  
                </div>

                {/* <div className="flex items-center justify-center gap-6 mb-6">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleRating("heart")}
                      className={`p-2 rounded-full ${userRating === "heart" ? "bg-red-100" : "hover:bg-muted"}`}
                    >
                      <Heart
                        className={`h-6 w-6 ${userRating === "heart" ? "text-red-500 fill-red-500" : "text-muted-foreground"}`}
                      />
                    </button>
                    <span className="text-sm font-medium mt-1">{book.ratings.heart}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleRating("thumbsUp")}
                      className={`p-2 rounded-full ${userRating === "thumbsUp" ? "bg-green-100" : "hover:bg-muted"}`}
                    >
                      <ThumbsUp
                        className={`h-6 w-6 ${userRating === "thumbsUp" ? "text-green-500" : "text-muted-foreground"}`}
                      />
                    </button>
                    <span className="text-sm font-medium mt-1">{book.ratings.thumbsUp}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleRating("thumbsDown")}
                      className={`p-2 rounded-full ${userRating === "thumbsDown" ? "bg-amber-100" : "hover:bg-muted"}`}
                    >
                      <ThumbsDown
                        className={`h-6 w-6 ${userRating === "thumbsDown" ? "text-amber-500" : "text-muted-foreground"}`}
                      />
                    </button>
                    <span className="text-sm font-medium mt-1">{book.ratings.thumbsDown}</span>
                  </div>
                </div> */}

                
              </div>
            </div>
            <div className="flex flex-col px-3 py-1">
              <div className="rounded-xl bg-primary/25 px-3 py-3 w-full mb-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs leading-none text-secondary-light/60 text-center font-semibold mb-2">English E-Pub</span>
                    {hasFileOfLanguage(bookFiles, 'english') ? (
                      <Button 
                        variant="outline" 
                        className="rounded-full bg-accent-variant/80 hover:bg-accent-variant text-bookWhite border-none px-2 h-8 text-xs"
                        onClick={() => handleSendToKindle(getFileIdByLanguage(bookFiles, 'english') || '', customKindleEmail)}
                        disabled={isSendingToKindle[getFileIdByLanguage(bookFiles, 'english') || '']}
                      >
                        {isSendingToKindle[getFileIdByLanguage(bookFiles, 'english') || ''] ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        {isSendingToKindle[getFileIdByLanguage(bookFiles, 'english') || ''] ? 'Sending...' : 'Send to Kindle'}
                      </Button>
                    ) : (
                      <BookFileUpload
                        bookId={id as string}
                        bookTitle={book.title}
                        language="english"
                        onFileUploaded={fetchBookFiles}
                      />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs leading-none text-secondary-light/60 text-center font-semibold mb-2">Spanish E-Pub</span>
                    {hasFileOfLanguage(bookFiles, 'spanish') ? (
                      <Button 
                        variant="outline" 
                        className="rounded-full bg-accent-variant/80 hover:bg-accent-variant text-bookWhite border-none px-2 h-8 text-xs"
                        onClick={() => handleSendToKindle(getFileIdByLanguage(bookFiles, 'spanish') || '', customKindleEmail)}
                        disabled={isSendingToKindle[getFileIdByLanguage(bookFiles, 'spanish') || '']}
                      >
                        {isSendingToKindle[getFileIdByLanguage(bookFiles, 'spanish') || ''] ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        {isSendingToKindle[getFileIdByLanguage(bookFiles, 'spanish') || ''] ? 'Sending...' : 'Send to Kindle'}
                      </Button>
                    ) : (
                      <BookFileUpload
                        bookId={id as string}
                        bookTitle={book.title}
                        language="spanish"
                        onFileUploaded={fetchBookFiles}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <Separator className="my-3" />
            <div>
              <h2 className="text-base text-secondary-light font-bold mb-0">Overview</h2>
              <div className="text-sm space-y-2 whitespace-pre-line font-serif leading-4">{book.description}</div>
            </div>
          </CardContent>
        </Card>
      
      {/* <div className="mb-3">
        <button
        className="target mt-15 flex items-center text-sm text-bookWhite hover:text-foreground transition-colors"
        >
        <ChevronLeft className="w-4 h-4 mr-1 text-bookWhite" />
            Back
        </button>
      </div> */}
      
        
          {/* <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 flex justify-center">
                  <div className="w-48 h-72 bg-muted/30 rounded-md flex items-center justify-center overflow-hidden">
                    <img src={book.cover || "/placeholder.svg"} alt={book.title} className="max-h-full" />
                  </div>
                </div>
                <div className="w-full">
                  <h1 className="text-3xl/4 font-bold text-secondary-light text-center mb-2">{book.title}</h1>
                  <p className="text-xl text-secondary font-serif text-center">by {book.author}</p>
                  <div className="flex flex-col justify-center gap-0 mb-4 mt-1">
                    <div className="flex justify-center gap-2">
                        <div className="flex gap-1">
                            <Heart
                                className="h-4 w-4 text-primary fill-primary"
                            />
                            <span className="font-serif font-medium text-sm text-secondary">22</span>
                        </div>
                        <div className="flex gap-1">
                            <ThumbsUp
                                className="h-4 w-4 text-accent-variant"
                            />
                            <span className="font-serif font-medium text-sm text-secondary">35</span>
                        </div>
                        <div className="flex gap-1">
                            <ThumbsDown
                                className="h-4 w-4 text-accent"
                            />
                            <span className="font-serif font-medium text-sm text-secondary">2</span>
                        </div>
                    </div>
                    <p className="underline text-center font-serif text-xs text-secondary-light">reviews</p>
                  </div>
                  

                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {book.genre.map((g) => (
                      <Badge key={g} variant="secondary" className="bg-primary/10 text-primary">
                        {g}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex flex-col">
                      <span className="text-sm/3 text-secondary-light/60 text-center">Published</span>
                      <span className="font-bold font-serif text-center">{book.published}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm/3 text-secondary-light/60 text-center">Pages</span>
                      <span className="font-bold font-serif text-center">{book.pages}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm/3 text-secondary-light/60 text-center">OpenLibrary Rating</span>
                      <span className="font-bold font-serif text-center">{book.isbn}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm/3 text-secondary-light/60 text-center">Reading Time</span>
                      <span className="font-medium text-center">~5 hours</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-primary/15 px-4 py-2 w-full mb-4">
                    <p className="text-center text-secondary-light font-semibold mb-2">E-Book File</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <span className="text-sm/3 text-secondary-light/60 text-center mb-1">English</span>
                            <Button variant="outline" className="rounded-full bg-primary/50 text-secondary-light border-none px-2 h-6">
                                <Send className="mr-0 h-3 w-3" /> Send to Kindle
                            </Button>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm/3 text-secondary-light/60 text-center">Spanish</span>
                            <span className="text-center italic text-secondary-light/60 mt-1">not available</span>
                        </div>
                    </div>
                  </div> */}

                  {/* <div className="flex items-center justify-center gap-6 mb-6">
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => handleRating("heart")}
                        className={`p-2 rounded-full ${userRating === "heart" ? "bg-red-100" : "hover:bg-muted"}`}
                      >
                        <Heart
                          className={`h-6 w-6 ${userRating === "heart" ? "text-red-500 fill-red-500" : "text-muted-foreground"}`}
                        />
                      </button>
                      <span className="text-sm font-medium mt-1">{book.ratings.heart}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => handleRating("thumbsUp")}
                        className={`p-2 rounded-full ${userRating === "thumbsUp" ? "bg-green-100" : "hover:bg-muted"}`}
                      >
                        <ThumbsUp
                          className={`h-6 w-6 ${userRating === "thumbsUp" ? "text-green-500" : "text-muted-foreground"}`}
                        />
                      </button>
                      <span className="text-sm font-medium mt-1">{book.ratings.thumbsUp}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => handleRating("thumbsDown")}
                        className={`p-2 rounded-full ${userRating === "thumbsDown" ? "bg-amber-100" : "hover:bg-muted"}`}
                      >
                        <ThumbsDown
                          className={`h-6 w-6 ${userRating === "thumbsDown" ? "text-amber-500" : "text-muted-foreground"}`}
                        />
                      </button>
                      <span className="text-sm font-medium mt-1">{book.ratings.thumbsDown}</span>
                    </div>
                  </div> */}

                  {/* <div className="flex justify-center">
                    <Button className="bg-accent hover:bg-primary-light rounded-full">
                      Update Status
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h2 className="text-xl font-bold mb-4">Overview</h2>
                <div className="text-sm space-y-4 whitespace-pre-line">{book.description}</div>
              </div>
            </CardContent>
          </Card> */}

          {/* <div className="flex flex-col gap-4 mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">E-book Files</h3>
              <BookFileUpload 
                bookId={id as string} 
                bookTitle={book.title} 
                onFileUploaded={fetchBookFiles} 
              />
            </div>
            
            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Loading files...</span>
              </div>
            ) : bookFiles.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">
                No e-book files available yet. Upload one to read the book.
              </p>
            ) : (
              <div className="space-y-2">
                {bookFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-secondary-light/50 rounded-lg">
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <p className="font-medium">{file.original_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size_bytes / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <a
                      href={`/api/books/files/download?fileId=${file.id}`}
                      download={file.original_name}
                      className="px-3 py-1 text-sm bg-primary text-white rounded-full hover:bg-primary/90"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div> */}

          <div className="">
            <Tabs defaultValue="reviews" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-secondary-light text-primary rounded-full">
                <TabsTrigger 
                    value="reviews"
                    className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                >Reviews</TabsTrigger>
                <TabsTrigger 
                    value="book-clubs"
                    className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                >Book Clubs</TabsTrigger>
                <TabsTrigger 
                    value="friends"
                    className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                >Friends</TabsTrigger>
              </TabsList>

              <TabsContent value="reviews" className="mt-3">
                <Card className="p-3">
                  <CardHeader className="p-0">
                    <CardTitle className="">Reviews</CardTitle>
                    <CardDescription className="font-serif font-medium">See what others think about this book</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 px-0 pt-3 pb-2">
                    {isLoadingReviews ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground">Loading reviews...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reviews.length > 0 ? (
                          reviews.map((review) => (
                            <div key={review.id} className="p-2 bg-secondary/5 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={review.user.avatar || "/placeholder.svg"} alt={review.user.name} />
                                    <AvatarFallback>{review.user.initials}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-base/4">{review.user.name}</p>
                                    <p className="text-xs font-serif text-secondary-light/60">{review.date}</p>
                                  </div>
                                </div>
                                {getRatingIcon(review.rating)}
                              </div>
                              <p className="text-sm ml-12">{review.text}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No reviews yet. Be the first to share your thoughts!</p>
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-0">Write a Review</h3>
                      <p className="text-xs text-muted-foreground mb-3">Share your detailed thoughts about this book</p>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-0">
                          <p className="text-sm font-medium">Rate this book:</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRating("HEART")}
                              className={`p-2 rounded-full transition-colors ${userRating === "HEART" ? "bg-primary/30" : "hover:bg-muted"}`}
                              disabled={isSubmittingReview}
                            >
                              <Heart
                                className={`h-5 w-5 ${userRating === "HEART" ? "text-primary-dark fill-primary-dark" : "text-muted-foreground"}`}
                              />
                            </button>
                            <button
                              onClick={() => handleRating("THUMBS_UP")}
                              className={`p-2 rounded-full transition-colors ${userRating === "THUMBS_UP" ? "bg-accent-variant/30" : "hover:bg-muted"}`}
                              disabled={isSubmittingReview}
                            >
                              <ThumbsUp
                                className={`h-5 w-5 ${userRating === "THUMBS_UP" ? "text-accent-variant" : "text-muted-foreground"}`}
                              />
                            </button>
                            <button
                              onClick={() => handleRating("THUMBS_DOWN")}
                              className={`p-2 rounded-full transition-colors ${userRating === "THUMBS_DOWN" ? "bg-accent/25" : "hover:bg-muted"}`}
                              disabled={isSubmittingReview}
                            >
                              <ThumbsDown
                                className={`h-5 w-5 ${userRating === "THUMBS_DOWN" ? "text-accent" : "text-muted-foreground"}`}
                              />
                            </button>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Share your thoughts on this book..."
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          className="min-h-[120px] bg-secondary-light text-bookWhite border-none"
                          disabled={isSubmittingReview}
                        />
                        <div className="flex justify-end">
                        <Button
                          onClick={handleSubmitReview}
                          disabled={!reviewText.trim() || !userRating || isSubmittingReview}
                          className="bg-primary/75 hover:bg-primary rounded-full text-secondary"
                        >
                          {isSubmittingReview ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <MessageSquare className="mr-2 h-4 w-4" />
                          )}
                          {isSubmittingReview ? 'Posting Review...' : 'Post Review'}
                        </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="book-clubs" className="mt-3">
                <Card className="p-3">
                  <CardHeader className="p-0">
                    <CardTitle className="">Book Clubs Reading This</CardTitle>
                    <CardDescription className="font-serif font-medium">Join a club to discuss this book</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 px-0 pt-3 pb-2">
                    <div className="space-y-3">
                      {book.clubs && book.clubs.length > 0 ? (
                        book.clubs.map((club) => (
                          <div key={club.id} className="p-2 border rounded-lg flex flex-col">
                            <div>
                              <div className="flex flex-wrap justify-between">
                                  <h3 className="font-medium">{club.name}</h3>
                                  <Button variant="outline" className="rounded-full bg-primary border-none">View Club</Button>
                              </div>
                              <div className="flex flex-col gap-0 mt-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1 font-serif text-secondary-light/60">
                                  <User className="h-4 w-4" />
                                  <span>{club.members} members</span>
                                </div>
                                <div className="flex items-center gap-1 font-serif text-secondary-light/60">
                                  <Calendar className="h-4 w-4" />
                                  <span>Meeting: {club.meetingDate}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No book clubs are currently reading this book.</p>
                          <Button variant="outline" className="mt-3 rounded-full">
                            Browse Clubs
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="friends" className="mt-3">
                <Card className="p-3">
                  <CardHeader className="p-0">
                    <CardTitle className="">Friends Reading This</CardTitle>
                    <CardDescription className="font-serif font-medium">See which friends are reading this book</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 px-0 pt-3 pb-2">
                    <div className="space-y-3">
                    {book.clubs && book.clubs.length > 0 ? (
                      reviews.slice(0, 3).map((review) => (
                        <div key={review.id} className="p-2 bg-secondary/5 rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-2">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={review.user.avatar || "/placeholder.svg"} alt={review.user.name} />
                                <AvatarFallback>{review.user.initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-base/4">{review.user.name}</p>
                                <p className="text-xs font-serif text-secondary-light/60">Started {review.date}</p>
                              </div>
                          </div>
                          <Button variant="outline" className="rounded-full bg-primary border-none">Profile</Button>
                        </div>
                      ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No friends are currently reading this book.</p>
                          <Button variant="outline" className="mt-3 rounded-full">
                            Browse Clubs
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        

        {/* <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Similar Books</CardTitle>
              <CardDescription className="font-serif font-mediun text-center">You might also enjoy these</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["The Invisible Life of Addie LaRue", "How to Stop Time", "A Thousand Splendid Suns"].map(
                  (title, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <div className="w-12 h-16 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                        <img src="/placeholder.svg?height=64&width=40" alt={title} className="max-h-full" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{title}</p>
                        <p className="text-xs font-serif text-secondary-light/60">
                          {["V.E. Schwab", "Matt Haig", "Khaled Hosseini"][i]}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card> */}

          {/* <Card className="mt-6 mb-12">
            <CardHeader>
              <CardTitle className="text-center">Reading Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-sm">Average Reading Time</span>
                  </div>
                  <span className="font-medium">4.8 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <span className="text-sm">People Reading</span>
                  </div>
                  <span className="font-medium">142</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="text-sm">Completion Rate</span>
                  </div>
                  <span className="font-medium">87%</span>
                </div>
              </div>
            </CardContent>
          </Card> */}
        {/* </div> */}
        <KindleEmailDialog
      open={kindleEmailDialogOpen}
      onOpenChange={setKindleEmailDialogOpen}
      selectedFileId={selectedFileId}
      onSend={handleSendToKindleWithEmail}
    />
    </div>

    
    
  )
}
