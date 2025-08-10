"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookMarked, ArrowLeft, Mail, Send, Pencil, Award, Save, X, Users, CircleCheckBig, CircleAlert, Loader2, Star, Smartphone, BookOpen, Headphones, ChevronDown, Sparkles, EllipsisVertical, Edit3, Check, Heart as LucideHeart, ThumbsUp as LucideThumbsUp, ThumbsDown as LucideThumbsDown, GripVertical, MessageSquare, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { FavoriteBookDialog } from "./favorite-book-dialog"
import { ContributionBookDialog } from "./contribution-book-dialog"
import { HistoryBookDialog } from "./history-book-dialog"
import MyFeedback from "./my-feedback"
import { RecommendationsMain } from "./recommendations/RecommendationsMain"
import Image from "next/image"
import { useFeedbackNotifications } from "@/hooks/use-feedback-notifications"
import { useRecommendationNotifications } from "@/hooks/use-recommendation-notifications"
import { FinishedBookDialog } from "./dashboard-reading"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Books, Bookmark, CheckCircle } from "@phosphor-icons/react"
import { RecommendBookDialog } from "./recommendations/RecommendBookDialog"
import { CustomGoalsDialog } from "./ui/custom-goals-dialog"
import { getDisplayAvatarUrl } from "@/lib/supabase-utils"
import { BookDetails, BookFile, UserBook, StatusDisplay, TabDisplay } from "@/types/book"
import Link from "next/link"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner"
import { useSession } from 'next-auth/react'
import { useGoals } from '@/lib/goals-context'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import FriendsMain from "./friends-main"

// Helper constants and functions from profile-details.tsx
const statuses: StatusDisplay[] = [
  { label: "⏳ In Progress", value: "in_progress", color: "bg-accent-variant text-bookWhite" },
  { label: "💫 Almost Done", value: "almost_done", color: "bg-accent-variant text-bookWhite" },
  { label: "🔥 Finished", value: "finished", color: "bg-accent-variant text-bookWhite" },
  { label: "😑 Unfinished", value: "unfinished", color: "bg-accent-variant text-bookWhite" },
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

// Define the available shelf types for the dropdown
const SHELF_OPTIONS = [
  { label: "Move to Reading Queue", value: "queue" },
];

// Define shelf options for history books
const HISTORY_SHELF_OPTIONS = [
  { label: "Move to Currently Reading", value: "currently_reading" },
  { label: "Move to Reading Queue", value: "queue" },
];

// History Book Item Component - simplified without external menu
interface HistoryBookItemProps {
  userBook: UserBook;
  onMoveToShelf: (bookId: string, shelf: string, title: string) => void;
  onRemoveFromShelf: (bookId: string, title: string) => void;
  onRecommendBook?: (userBook: UserBook) => void;
}

function HistoryBookItem({ userBook, onMoveToShelf, onRemoveFromShelf, onRecommendBook }: HistoryBookItemProps) {
  return (
    <div className="relative w-auto">
      <HistoryBookDialog 
        historyBooks={userBook} 
        onMoveToShelf={onMoveToShelf}
        onRemoveFromShelf={onRemoveFromShelf}
        onRecommendBook={onRecommendBook}
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

// Sortable Queue Book Item Component using @dnd-kit
interface SortableQueueBookProps {
  userBook: UserBook;
  onStartReading: (bookId: string) => void;
  onRemove: (bookId: string, title: string) => void;
  onRecommendBook: (userBook: UserBook) => void;
}

function SortableQueueBook({ 
  userBook, 
  onStartReading, 
  onRemove,
  onRecommendBook
}: SortableQueueBookProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: userBook.book_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`relative overflow-hidden bg-bookWhite py-3 transition-all ${
        isDragging ? 'opacity-50 z-50' : ''
      }`}
      data-testid="sortable-queue-book"
    >
      <div className="flex flex-row pl-0 pr-3">
        {/* Drag Handle */}
        <div 
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-100 flex flex-col justify-center rounded cursor-grab active:cursor-grabbing touch-none select-none"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        {/* Book Image */}
        <div className="w-[100px] flex-shrink-0 mr-2">
          <Link href={`/books/${userBook.book_id}`}>
            <img
              src={userBook.book.cover_url || "/placeholder.svg"}
              alt={userBook.book.title || "Book cover"}
              className="h-full w-full shadow-md rounded object-cover"
            />
          </Link>
        </div>
        {/* Content */}
        <div className="flex flex-col flex-1">
          <CardHeader className="pb-0 px-0 pt-0">
            <div className="flex flex-row justify-between items-start">
              <Link href={`/books/${userBook.book_id}`}>
                <CardTitle className="leading-5">{userBook.book.title}</CardTitle>
              </Link>
              <div className="flex items-center gap-1">
                {/* Drag Handle
                <div 
                  {...attributes}
                  {...listeners}
                  className="p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing touch-none"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div> */}
                
                {/* Queue Management Dropdown */}
                <div className="flex items-start relative">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs flex items-end px-0 rounded-full h-auto gap-1 bg-transparent ml-1 border-none hover:bg-transparent"
                      >
                        <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="w-auto rounded-xl bg-transparent shadow-xl px-1 mr-6 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                        sideOffset={5}
                      >
                      <DropdownMenu.Item
                        onSelect={() => onRecommendBook(userBook)}
                        className="px-3 py-2 text-xs text-center bg-accent/90 text-secondary my-2 rounded-md cursor-pointer hover:bg-accent-variant hover:text-secondary focus:bg-accent-variant focus:outline-none transition-colors"
                      >
                        <div className="flex items-center justify-center gap-1">
                          Recommend to Friends
                        </div>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onSelect={() => onRemove(userBook.book_id, userBook.book.title)}
                        className="px-3 py-2 text-xs text-center bg-red-700/90 my-2 rounded-md cursor-pointer hover:bg-red-800 hover:text-bookWhite focus:bg-red-600 focus:outline-none transition-colors"
                      >
                        Remove from Shelf
                      </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </div>
            </div>
            <CardDescription className="text-xs">{userBook.book.author}</CardDescription>
          </CardHeader>
          <CardContent className="pb-0 pt-1 px-0">
            <div className="flex flex-wrap gap-1.5 mb-0 items-center">
              {/* Added On */}
              {userBook.added_at && (
                <span className="px-2 py-0.5 text-xs font-regular bg-primary-dark/50 text-secondary rounded-full">
                  Added to Queue: {new Date(userBook.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}

              {/* Genre Tags */}
              <div className="flex flex-wrap gap-1">
                {userBook.book.genres?.slice(0, 2).map((genre: string) => (
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
            <div className="flex items-end justify-start mt-0.5">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full text-accent-variant h-6 border-accent-variant bg-accent-variant/5 text-xs font-serif"
                onClick={() => onStartReading(userBook.book_id)}
              >
                Start Reading
                <Sparkles className="h-3 w-3"/>
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

interface Profile {
  id: string
  email?: string
  display_name: string | null;
  full_name?: string | null;
  about?: string | null;
  avatar_url?: string | null;
  kindle_email?: string | null;
  favorite_genres: string[] | null;
  created_at: string
  updated_at: string
  userBooks?: UserBook[]
  addedBooks: any[]
  _count: {
    friendshipsAsUser1: number,
    friendshipsAsUser2: number,
    memberships: number;
  };
}

export default function EditableProfileMain() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { optimisticallyUpdateGoalProgress, rollbackOptimisticUpdate, refreshGoals } = useGoals()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  // State to manage per-book loading/feedback for adding to shelf
  const [shelfActionsStatus, setShelfActionsStatus] = useState<Record<string, { isLoading: boolean, message: string | null }>>({})

  // State for personal note editing
  const [editingNoteBookId, setEditingNoteBookId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState<string>("")
  const [isUpdatingNote, setIsUpdatingNote] = useState(false)

  // State for confirmation dialogs
  const [confirmRemoval, setConfirmRemoval] = useState<{
    bookId: string | null;
    bookTitle: string | null;
    shelf: 'currently_reading' | 'queue' | 'history' | null;
  }>({
    bookId: null,
    bookTitle: null,
    shelf: null
  })

  // State for removal loading
  const [isRemoving, setIsRemoving] = useState(false)

  // State for feedback dialog
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false)

  // State for recommendations dialog
  const [isRecommendationsDialogOpen, setIsRecommendationsDialogOpen] = useState(false)

  // State for custom goals dialog
  const [isCustomGoalsDialogOpen, setIsCustomGoalsDialogOpen] = useState(false)

  // State for recommend book dialog
  const [recommendDialog, setRecommendDialog] = useState<{
    isOpen: boolean;
    book: UserBook | null;
  }>({
    isOpen: false,
    book: null
  });

  // State for friends dialog
  const [isFriendsDialogOpen, setIsFriendsDialogOpen] = useState(false);

  // Check for feedback notifications
  const { hasUnreadReplies, unreadCount } = useFeedbackNotifications();
  
  // Check for recommendation notifications
  const { hasUnread: hasUnreadRecommendations, unreadCount: recommendationCount } = useRecommendationNotifications();

  // @dnd-kit sensors with optimized touch handling
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Book state variables
  const [currentlyReadingBooks, setCurrentlyReadingBooks] = useState<UserBook[]>([])
  const [queueBooks, setQueueBooks] = useState<UserBook[]>([])
  const [historyBooks, setHistoryBooks] = useState<UserBook[]>([])
  const [favoriteBooks, setFavoriteBooks] = useState<UserBook[]>([])
  const [addedBooks, setAddedBooks] = useState<BookDetails[]>([])

  // Form states
  const [displayName, setDisplayName] = useState("")
  const [fullName, setFullName] = useState("")
  const [bio, setBio] = useState("")
  const [kindleEmail, setKindleEmail] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("")
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([])

  // Avatar states
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null) // Storage key for new uploads
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const genres = [
    "Biography",
    "Children's",
    "Classics",
    "Dark Romance",
    "Fantasy",
    "Fiction",
    "Historical Fiction",
    "Horror",
    "Literary Fiction",
    "Manga",
    "Mystery",
    "Non-Fiction",
    "Poetry",
    "Romance",
    "Romantasy",
    "Science Fiction",
    "Self-Help",
    "Thriller",
    "Young Adult"
  ]

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.supabaseAccessToken) {
      toast.error("No session found");
      return;
    }
      try {
        const response = await fetch('/api/profile', {
          headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }

        const profileData: Profile = await response.json()
        setProfile(profileData)
        console.log("profileData", profileData)
        
        // Set form values
        setDisplayName(profileData.display_name || "")
        setFullName(profileData.full_name || "")
        setBio(profileData.about || "")
        setKindleEmail(profileData.kindle_email || "")
        setFavoriteGenres(profileData.favorite_genres || [])

        // Categorize books based on shelf
        if (profileData.userBooks) {
          const currentlyReading = profileData.userBooks.filter((book: UserBook) => book.shelf === 'currently_reading')
          const queue = profileData.userBooks.filter((book: UserBook) => book.shelf === 'queue')
          const history = profileData.userBooks
            .filter((book: UserBook) => book.shelf === 'history')
            .sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime())
          const favorites = profileData.userBooks
            .filter((book: UserBook) => book.is_favorite === true)
            .sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime())
          
          setCurrentlyReadingBooks(currentlyReading)
          setQueueBooks(queue)
          setHistoryBooks(history)
          setFavoriteBooks(favorites)
        }

        if (profileData.addedBooks) {
          const sortedAddedBooks = profileData.addedBooks.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          setAddedBooks(sortedAddedBooks)
        }

      } catch (err) {
        setError((err as Error).message)
        console.error('Failed to fetch profile:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  // Check for URL parameter to auto-open custom goals dialog
  useEffect(() => {
    const openGoals = searchParams.get('openGoals')
    if (openGoals === 'true') {
      setIsCustomGoalsDialogOpen(true)
      // Remove the parameter from URL without causing a navigation
      const url = new URL(window.location.href)
      url.searchParams.delete('openGoals')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  const addGenre = () => {
    if (selectedGenre && !favoriteGenres.includes(selectedGenre)) {
      setFavoriteGenres([...favoriteGenres, selectedGenre])
      setSelectedGenre("")
    }
  }

  const removeGenre = (genre: string) => {
    setFavoriteGenres(favoriteGenres.filter((g) => g !== genre))
  }

  // Avatar upload handler
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB')
      return
    }

    setIsUploadingAvatar(true)
    setError(null)

    try {
      // Create preview URL for immediate display
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)
      console.log("previewUrl", previewUrl)
      // Get presigned URL
      const presignResponse = await fetch('/api/profile/presign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.supabaseAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type
        })
      })

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json()
        throw new Error(errorData.error || 'Failed to get upload URL')
      }

      const { signedUrl, path } = await presignResponse.json()

      // Upload file to storage
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image')
      }

      // Store the path for form submission
      setAvatarUrl(path)
      
      // Show success feedback
      toast.success('Avatar uploaded! Don\'t forget to save your changes.')

    } catch (err) {
      setError((err as Error).message)
      console.error('Avatar upload error:', err)
      setAvatarPreview(null)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    if (!session?.supabaseAccessToken) {
      toast.error("No session found");
      return;
    }

    setIsSaving(true)
    setError(null)

    
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: displayName.trim(),
          full_name: fullName.trim(),
          about: bio.trim(),
          kindle_email: kindleEmail.trim() || null,
          favorite_genres: favoriteGenres,
          ...(avatarUrl && { avatar_url: avatarUrl }) // Only include avatar_url if there's a new upload
        })
      })
      

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save profile')
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      setAvatarUrl(null) // Reset since the avatar is now saved in the profile
      setIsEditing(false)
      
      // Show success message
      toast.success('Profile updated successfully!')
      
      // Keep the preview URL for a bit longer to show immediate feedback
      // The server response should already include the properly formatted avatar_url
      // but we'll clean up the preview after ensuring the new URL is loaded
      setTimeout(() => {
        if (avatarPreview && avatarPreview.startsWith('blob:')) {
          URL.revokeObjectURL(avatarPreview)
          setAvatarPreview(null)
        }
      }, 2000) // Give more time for the new avatar to load

    } catch (err) {
      setError((err as Error).message)
      console.error('Failed to save profile:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (!profile) return

    // Reset form values
    setDisplayName(profile.display_name || "")
    setFullName(profile.full_name || "")
    setBio(profile.about || "")
    setKindleEmail(profile.kindle_email || "")
    setFavoriteGenres(profile.favorite_genres || [])
    setAvatarUrl(null) // Reset to null - only for new uploads
    
    // Clean up preview
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview)
      setAvatarPreview(null)
    }
    
    setIsEditing(false)
    setError(null)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

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
      if (shelf === "currently_reading") {
        setCurrentlyReadingBooks(prevBooks =>
          prevBooks.map(userBook => 
            userBook.book_id === bookId 
              ? { ...userBook, comment: noteText.trim() || null }
              : userBook
          )
        );
      }

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
      if (currentShelf === "currently_reading") {
        setCurrentlyReadingBooks(prevBooks =>
          prevBooks.map(userBook => 
            userBook.book_id === bookId 
              ? { ...userBook, status: newStatus } 
              : userBook
          )
        );
      }

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

      // If unfinished, remove from currently reading and add to history
      if (newStatus === "unfinished") {
        const updatedBook = currentlyReadingBooks.find(b => b.book_id === bookId);
        if (updatedBook) {
          setCurrentlyReadingBooks(prevBooks =>
            prevBooks.filter(userBook => userBook.book_id !== bookId)
          );
          setHistoryBooks(prevBooks => [
            { ...updatedBook, status: newStatus, shelf: 'history' as UserBook['shelf'] },
            ...prevBooks
          ]);
        }
        toast.success('Book marked as unfinished and moved to history!');
      } else {
        toast.success('Status updated!');
      }

    } catch (err: any) {
      console.error("Error updating status:", err);
      toast.error(`Failed to update status: ${err.message}`);
      // Rollback UI update if API fails
      if (currentShelf === "currently_reading") {
        setCurrentlyReadingBooks(prevBooks =>
          prevBooks.map(userBook => 
            userBook.book_id === bookId 
              ? { ...userBook, status: userBook.status } 
              : userBook
          )
        );
      }
    }
  };

  const shareDialogCallback = () => {
    setFinishedBookDialog({ isOpen: false, book: null, bookId: null, currentShelf: null });
  };

  // Function to handle finished book review submission
  const handleFinishedBookReview = async (reviewText: string | null, rating: "HEART" | "THUMBS_UP" | "THUMBS_DOWN" | null, skipReview: boolean = false) => {
    if (!finishedBookDialog.bookId || !finishedBookDialog.currentShelf) return;

    setIsSubmittingFinishedReview(true);
    
    // Optimistically update goal progress immediately
    optimisticallyUpdateGoalProgress(1);
    
    try {
      // Submit review if text is provided and not skipping review
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

      // Optimistic UI updates: Remove from currently reading and add to history
      const finishedBook = currentlyReadingBooks.find(b => b.book_id === finishedBookDialog.bookId);
      if (finishedBook) {
        setCurrentlyReadingBooks(prevBooks =>
          prevBooks.filter(userBook => userBook.book_id !== finishedBookDialog.bookId)
        );
        setHistoryBooks(prevBooks => [
          { ...finishedBook, status: 'finished' as UserBook['status'], shelf: 'history' as UserBook['shelf'] },
          ...prevBooks
        ]);
      }

      // Close dialog and show success message
      //setFinishedBookDialog({ isOpen: false, book: null, bookId: null, currentShelf: null });
      if (skipReview) {
        toast.success('Book marked as finished!');
      } else {
        toast.success('Book marked as finished! Thanks for sharing your thoughts.');
      }

    } catch (err: any) {
      console.error("Error submitting finished book review:", err);
      toast.error(`Failed to submit: ${err.message}`);
      // Rollback optimistic goal update on error
      rollbackOptimisticUpdate();
    } finally {
      setIsSubmittingFinishedReview(false);
      // Refresh goals to get the actual updated state from server
      // This will correct any discrepancies between optimistic and actual updates
      setTimeout(() => {
        refreshGoals();
      }, 1000); // Small delay to ensure server has processed the update
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
      if (currentShelf === "currently_reading") {
        setCurrentlyReadingBooks(prevBooks =>
          prevBooks.map(userBook => 
            userBook.book_id === bookId 
              ? { ...userBook, media_type: newMediaType as UserBook['media_type'] } 
              : userBook
          )
        );
      }

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

      toast.success('Media type updated!');

    } catch (err: any) {
      console.error("Error updating media type:", err);
      toast.error(`Failed to update media type: ${err.message}`);
      // Rollback UI update if API fails - refetch or revert
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
      const updatedResponse = await fetch('/api/shelf?shelf=currently_reading', {
        headers: {
          'Authorization': `Bearer ${session?.supabaseAccessToken}`
        }
      });
      if (updatedResponse.ok) {
        const updatedBooks = await updatedResponse.json();
        setCurrentlyReadingBooks(updatedBooks);
      }

    } catch (err: any) {
      console.error("Error starting book:", err);
      toast.error(`Failed to start reading: ${err.message}`);
      // Rollback UI update if API fails
      const rollbackResponse = await fetch('/api/shelf?shelf=queue', {
        headers: {
          'Authorization': `Bearer ${session?.supabaseAccessToken}`
        }
      });
      if (rollbackResponse.ok) {
        const rollbackBooks = await rollbackResponse.json();
        setQueueBooks(rollbackBooks);
      }
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

      // Refresh the target shelf to show the newly moved book
      if (shelf === "queue") {
        const updatedResponse = await fetch('/api/shelf?shelf=queue', {
          headers: {
            'Authorization': `Bearer ${session?.supabaseAccessToken}`
          }
        });
        if (updatedResponse.ok) {
          const updatedBooks = await updatedResponse.json();
          setQueueBooks(updatedBooks);
        }
      }

    } catch (err: any) {
      console.error("Error moving book to shelf:", err);
      toast.error(`Failed to move book: ${err.message}`);
      
      // Rollback optimistic updates on error
      const rollbackResponse = await fetch('/api/shelf?shelf=currently_reading', {
        headers: {
          'Authorization': `Bearer ${session?.supabaseAccessToken}`
        }
      });
      if (rollbackResponse.ok) {
        const rollbackBooks = await rollbackResponse.json();
        setCurrentlyReadingBooks(rollbackBooks);
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
      const rollbackResponse = await fetch('/api/shelf?shelf=queue', {
        headers: {
          'Authorization': `Bearer ${session?.supabaseAccessToken}`
        }
      });
      if (rollbackResponse.ok) {
        const rollbackBooks = await rollbackResponse.json();
        setQueueBooks(rollbackBooks);
      }
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
      const rollbackResponse = await fetch('/api/shelf?shelf=currently_reading', {
        headers: {
          'Authorization': `Bearer ${session?.supabaseAccessToken}`
        }
      });
      if (rollbackResponse.ok) {
        const rollbackBooks = await rollbackResponse.json();
        setCurrentlyReadingBooks(rollbackBooks);
      }
    }
  };

  // Drag and drop handlers
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = queueBooks.findIndex((book) => book.book_id === active.id);
    const newIndex = queueBooks.findIndex((book) => book.book_id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder the array using @dnd-kit's arrayMove utility
    const newOrder = arrayMove(queueBooks, oldIndex, newIndex);
    
    // Optimistically update the UI
    setQueueBooks(newOrder);

    try {
      // Update positions in the database
      const updates = newOrder.map((book: UserBook, index: number) => ({
        bookId: book.book_id,
        position: index + 1 // 1-based position
      }));

      const response = await fetch('/api/shelf/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session?.supabaseAccessToken}` },
        body: JSON.stringify({ updates, shelf: 'queue' })
      });

      if (!response.ok) {
        throw new Error('Failed to update book order');
      }

      toast.success('Reading queue reordered!');
    } catch (error: any) {
      console.error('Error updating book order:', error);
      toast.error('Failed to save new order');
      // Revert to original order on error
      const originalResponse = await fetch('/api/shelf?shelf=queue', {
        headers: {
          'Authorization': `Bearer ${session?.supabaseAccessToken}`
        }
      });
      if (originalResponse.ok) {
        const originalBooks = await originalResponse.json();
        setQueueBooks(originalBooks);
      }
    }
  };

  // Functions to handle confirmation dialogs
  const showRemoveConfirmation = (bookId: string, bookTitle: string, shelf: 'currently_reading' | 'queue' | 'history') => {
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

    setIsRemoving(true);

    try {
      if (confirmRemoval.shelf === 'currently_reading') {
        await handleRemoveFromCurrentlyReading(confirmRemoval.bookId);
      } else if (confirmRemoval.shelf === 'queue') {
        await handleRemoveFromQueue(confirmRemoval.bookId);
      } else if (confirmRemoval.shelf === 'history') {
        await handleRemoveFromHistory(confirmRemoval.bookId, confirmRemoval.bookTitle || 'Unknown Book');
      }

      // Close confirmation dialog
      cancelRemoval();
    } catch (error) {
      // Error handling is already done in the individual functions
      console.error('Error in confirmRemovalAction:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  // Handle favorite change from FavoriteBookDialog
  const handleFavoriteChange = (bookId: string, isFavorite: boolean) => {
    if (!isFavorite) {
      // If unfavorited, remove from favoriteBooks list
      setFavoriteBooks(prev => prev.filter(userBook => userBook.book_id !== bookId));
    }
    // Note: If favorited, the book would need to be added to favorites list
    // but since this is called from FavoriteBookDialog which only shows books
    // that are already favorited, we only handle the unfavorite case
  };

  // Function to handle moving books from history to other shelves
  const handleMoveFromHistory = async (bookId: string, targetShelf: string, bookTitle: string) => {
    try {
      // Optimistically remove from history
      setHistoryBooks(prevBooks => 
        prevBooks.filter(userBook => userBook.book_id !== bookId)
      );

      // Call API to move book to target shelf
      const response = await fetch('/api/shelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session?.supabaseAccessToken}` },
        body: JSON.stringify({ 
          bookId, 
          shelf: targetShelf, 
          status: targetShelf === 'currently_reading' ? 'in_progress' : 'in_progress'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to move book');
      }

      // Show success message
      const shelfName = targetShelf === 'currently_reading' ? 'Currently Reading' : 'Reading Queue';
      toast.success(`"${bookTitle}" moved to ${shelfName}!`);

      // Refresh the target shelf to show the newly moved book
      if (targetShelf === 'currently_reading') {
        const updatedResponse = await fetch('/api/shelf?shelf=currently_reading', {
          headers: {
            'Authorization': `Bearer ${session?.supabaseAccessToken}`
          }
        });
        if (updatedResponse.ok) {
          const updatedBooks = await updatedResponse.json();
          setCurrentlyReadingBooks(updatedBooks);
        }
      } else if (targetShelf === 'queue') {
        const updatedResponse = await fetch('/api/shelf?shelf=queue', {
          headers: {
            'Authorization': `Bearer ${session?.supabaseAccessToken}`
          }
        });
        if (updatedResponse.ok) {
          const updatedBooks = await updatedResponse.json();
          setQueueBooks(updatedBooks);
        }
      }

    } catch (err: any) {
      console.error("Error moving book from history:", err);
      toast.error(`Failed to move book: ${err.message}`);
      
      // Rollback optimistic update on error
      const rollbackResponse = await fetch('/api/shelf?shelf=history', {
        headers: {
          'Authorization': `Bearer ${session?.supabaseAccessToken}`
        }
      });
      if (rollbackResponse.ok) {
        const rollbackBooks = await rollbackResponse.json();
        setHistoryBooks(rollbackBooks.sort((a: UserBook, b: UserBook) => 
          new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
        ));
      }
    }
  };

  // Function to handle removing books from history shelf
  const handleRemoveFromHistory = async (bookId: string, bookTitle: string) => {
    try {
      // Optimistically remove from history
      setHistoryBooks(prevBooks => 
        prevBooks.filter(userBook => userBook.book_id !== bookId)
      );

      // Call API to remove book from history shelf
      const response = await fetch('/api/shelf', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session?.supabaseAccessToken}` },
        body: JSON.stringify({ 
          bookId, 
          shelf: 'history'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove book from history');
      }

      // Show success message
      toast.success(`"${bookTitle}" removed from reading history.`);

    } catch (err: any) {
      console.error("Error removing book from history:", err);
      toast.error(`Failed to remove book: ${err.message}`);
      
      // Rollback optimistic update on error
      const rollbackResponse = await fetch('/api/shelf?shelf=history', {
        headers: {
          'Authorization': `Bearer ${session?.supabaseAccessToken}`
        }
      });
      if (rollbackResponse.ok) {
        const rollbackBooks = await rollbackResponse.json();
        setHistoryBooks(rollbackBooks.sort((a: UserBook, b: UserBook) => 
          new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
        ));
      }
    }
  };

  // Function to show confirmation for history book removal
  const showHistoryRemoveConfirmation = (bookId: string, bookTitle: string) => {
    showRemoveConfirmation(bookId, bookTitle, 'history');
  };

  // Function to handle feedback icon click
  const handleFeedbackIconClick = () => {
    setIsFeedbackDialogOpen(true);
  };

  // Function to handle recommendations icon click
  const handleRecommendationsIconClick = () => {
    setIsRecommendationsDialogOpen(true);
  };

  // Function to handle custom goals icon click
  const handleCustomGoalsIconClick = () => {
    setIsCustomGoalsDialogOpen(true);
  };

  // Handle recommend book action
  const handleRecommendBook = (userBook: UserBook) => {
    setRecommendDialog({
      isOpen: true,
      book: userBook
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
    toast.success('Book recommendation sent successfully!');
  };

  // Effect to mark feedback as viewed when dialog opens
  useEffect(() => {
    if (isFeedbackDialogOpen) {
      // Trigger the MyFeedback component to mark feedback as viewed
      console.log("marking feedback as viewed")
      window.dispatchEvent(new CustomEvent('markFeedbackAsViewed'));
    }
  }, [isFeedbackDialogOpen]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-2 py-2 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading profile...</span>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="container mx-auto px-2 py-2 flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-500">
          <p>Failed to load profile</p>
          <p className="text-sm mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }
  const friendships_as_user1 = profile?._count?.friendshipsAsUser1 || 0;
  const friendships_as_user2 = profile?._count?.friendshipsAsUser2 || 0;
  // Priority: 1) Preview blob URL (immediate feedback), 2) Profile's formatted public URL
  // Note: avatarUrl contains storage key, not display URL, so we don't use it for display
  const currentAvatar = avatarPreview || profile?.avatar_url
  const displayGenres = isEditing ? favoriteGenres : (profile?.favorite_genres || [])
  const currentFriends = friendships_as_user1 + friendships_as_user2;
  

  return (
    <div className="container mx-auto px-2 py-2">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="flex flex-col bg-transparent md:flex-row gap-2">
        <div className="md:w-1/3 bg-transparent">
          <Card className="px-0 bg-bookWhite/90 rounded-b-3xl rounded-t-none overflow-hidden">
            <CardHeader className="relative p-0">
              {/* Banner */}
              <div className="relative h-32 w-full rounded-b-2xl">
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

                {/* Feedback, Recommendations, Custom Goals, and Edit Buttons */}
                {!isEditing && (
                  <div className="absolute top-3 right-3 flex gap-3">

                    {/* Custom Goals Button */}
                    <button
                      onClick={handleCustomGoalsIconClick}
                      className="p-1.5 rounded-full bg-bookWhite/80 backdrop-blur-sm hover:bg-bookWhite shadow-md"
                      title="Set reading goals"
                    >
                      <Award className="h-6 w-6 text-secondary" />
                    </button>

                    {/* Recommendations Button */}
                    <button
                      onClick={handleRecommendationsIconClick}
                      className="relative p-2 rounded-full bg-bookWhite/80 backdrop-blur-sm hover:bg-bookWhite shadow-md"
                      title={hasUnreadRecommendations ? `You have ${recommendationCount} new book recommendation${recommendationCount === 1 ? '' : 's'}` : 'Book recommendations'}
                    >
                      <BookMarked className="h-5 w-5 text-secondary" />
                      {/* Recommendation notification badge */}
                      {hasUnreadRecommendations && (
                        <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 flex items-center justify-center border-2 border-secondary">
                          <span className="text-[8px] text-bookWhite font-bold leading-none">
                            {recommendationCount > 9 ? '9+' : recommendationCount}
                          </span>
                        </div>
                      )}
                    </button>

                    {/* Feedback Button */}
                    <button
                      onClick={handleFeedbackIconClick}
                      className="relative p-2 rounded-full bg-bookWhite/80 backdrop-blur-sm hover:bg-bookWhite shadow-md"
                      title={hasUnreadReplies ? `You have ${unreadCount} new feedback ${unreadCount === 1 ? 'reply' : 'replies'}` : 'View my feedback'}
                    >
                      <MessageSquare className="h-5 w-5 text-secondary" />
                      {/* Feedback notification badge */}
                      {hasUnreadReplies && (
                        <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 flex items-center justify-center border-2 border-secondary">
                          <span className="text-[7px] font-thin text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        </div>
                      )}
                    </button>
                    
                    {/* Edit Button */}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 rounded-full bg-bookWhite/80 backdrop-blur-sm hover:bg-bookWhite shadow-md"
                    >
                      <Pencil className="h-5 w-5 text-secondary" />
                    </button>
                  </div>
                )}
              </div>

              {/* Avatar + user info */}
              <div className="flex flex-row px-4 pt-2 pb-2 -mt-15 items-end">
                <div className="flex gap-2 -mt-8 items-end z-20">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-bookWhite rounded-full bg-bookWhite">
                      <AvatarImage 
                        src={currentAvatar || undefined} 
                        alt="@user" 
                      />
                      <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                        {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        type="button"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="absolute top-[72px] h-6 w-6 rounded-full bg-accent hover:bg-primary-light"
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Pencil className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col justify-end pb-2">
                    {isEditing ? (
                      <div className="space-y-1">
                        <Input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="text-sm bg-white/80 border-secondary/20 h-6"
                          placeholder="Full name (optional)"
                        />
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="text-sm bg-white/80 border-secondary/20 h-6"
                          placeholder="Username"
                        />
                        
                      </div>
                    ) : (
                      <>
                        <h2 className="text-lg leading-none font-semibold text-secondary-light">
                          {profile?.full_name || "No name"}
                        </h2>
                        {profile?.display_name && (
                          <p className="text-sm text-secondary/70 font-normal">
                            {profile.display_name}
                          </p>
                        )}
                        <p className="text-xs text-secondary/50 font-normal">
                          <button 
                            onClick={() => setIsFriendsDialogOpen(true)}
                            className="hover:text-secondary/70 transition-colors cursor-pointer underline-offset-2 hover:underline"
                          >
                            {currentFriends} friend{currentFriends !== 1 ? 's' : ''}
                          </button>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <p className="text-sm leading-none text-secondary/70 font-normal mt-1">
                  <span>{profile?._count?.memberships || 0} book club{(profile?._count?.memberships || 0) !== 1 ? 's' : ''} </span>
                  <span>• {profile?.addedBooks?.length || 0} contributions</span>
                </p>

                <div>
                  {isEditing ? (
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself and your reading interests..."
                      className="min-h-[80px] rounded-2xl font-serif text-sm/4 italic text-wrap bg-white/60 text-secondary border border-secondary-light placeholder:text-secondary/70"
                    />
                  ) : (
                    <p className="text-sm/4 font-serif font-medium text-secondary/50">
                      {profile?.about || "No bio available"}
                    </p>
                  )}
                </div>

                {/* Kindle Email Section */}
                {isEditing && (
                  <div>
                    <Input
                      value={kindleEmail}
                      onChange={(e) => setKindleEmail(e.target.value)}
                      placeholder="your_kindle@kindle.com"
                      className="bg-white/60 text-secondary border border-secondary-light"
                    />
                  </div>
                )}

                {/* Genres Section */}
                <div>
                  <div className="flex flex-wrap gap-2 mt-3 mb-2">
                    {displayGenres.map((genre) => (
                      <Badge key={genre} variant="secondary" className="px-3 py-1 font-serif bg-accent/20 text-secondary-light/70">
                        {genre}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeGenre(genre)}
                            className="ml-2 text-secondary-light/70 hover:text-secondary"
                          >
                            ×
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  
                  {isEditing && (
                    <div className="flex gap-2 items-center">
                      <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                        <SelectTrigger className="flex-1 rounded-full bg-white/60">
                          <SelectValue placeholder="Add a genre" />
                        </SelectTrigger>
                        <SelectContent>
                          {genres.map((genre) => (
                            <SelectItem key={genre} value={genre}>
                              {genre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button" 
                        onClick={addGenre} 
                        disabled={!selectedGenre} 
                        className="rounded-full bg-primary-dark text-bookWhite"
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 rounded-full text-bookWhite font-normal bg-accent-variant/80 hover:bg-accent-variant"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Changes
                    </Button>
                    <Button 
                      onClick={handleCancel}
                      variant="outline"
                      disabled={isSaving}
                      className="rounded-full text-bookWhite"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            style={{ display: 'none' }}
          />
        </div>

        {/* Right side - Books tabs */}
        <div className="md:w-2/3">
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
                <Card>
                  <CardHeader>
                    <CardTitle>Currently Reading</CardTitle>
                    <CardDescription>Books you're currently reading</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">No books currently reading</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {currentlyReadingBooks.map((userBook) => {
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
                                src={userBook.book.cover_url || "/placeholder.svg"}
                                alt={userBook.book.title || "Book cover"}
                                className="h-auto w-full shadow-md rounded object-cover"
                              />
                            </Link>
                          </div>
                          {/* Content */}
                          <div className="flex flex-col flex-1">
                            <CardHeader className="pb-2 px-0 pt-0">
                              <div className="flex flex-row justify-between items-start">
                                <Link href={`/books/${userBook.book_id}`}>
                                  <CardTitle className="leading-5">{userBook.book.title}</CardTitle>
                                </Link>
                                <div>
                                  {/* Shelf Management Dropdown */}
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
                                          className="w-auto rounded-xl flex flex-col justify-end bg-transparent shadow-xl px-1 mr-7 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                                          sideOffset={5}
                                        >
                                        {SHELF_OPTIONS.filter(shelf => shelf.value !== userBook.shelf).map((shelf) => (
                                          <DropdownMenu.Item
                                            key={shelf.value}
                                            onSelect={() => handleAddToShelf(bookId, shelf.value)}
                                            className="px-3 py-2 text-xs text-center bg-secondary/90 my-1 rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                                            disabled={currentShelfStatus?.isLoading}
                                          >
                                            {shelf.label}
                                          </DropdownMenu.Item>
                                        ))}
                                        <DropdownMenu.Item
                                          onSelect={() => handleRecommendBook(userBook)}
                                          className="px-3 py-2 text-xs text-center bg-accent/90 my-1 text-secondary rounded-md cursor-pointer hover:bg-accent-variant hover:text-secondary focus:bg-accent-variant focus:outline-none transition-colors"
                                        >
                                          <div className="flex items-center justify-center gap-1">
                                            Recommend to Friends
                                          </div>
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item
                                          onSelect={() => showRemoveConfirmation(bookId, userBook.book.title, 'currently_reading')}
                                          className="px-3 py-2 text-xs text-end w-[132px] self-end bg-red-700/90 my-1 rounded-md cursor-pointer hover:bg-red-600 hover:text-bookWhite focus:bg-red-600 focus:outline-none transition-colors"
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
                              <CardDescription className="text-xs">{userBook.book.author}</CardDescription>
                            </CardHeader>

                            <CardContent className="pb-0 pt-0 px-0">
                              <div className="flex flex-wrap gap-1 mb-2 items-center">
                                {/* Added On */}
                                {userBook.added_at && (
                                  <span className="px-2 py-0.5 text-xs font-regular bg-primary-dark/50 text-secondary rounded-full">
                                    Started: {new Date(userBook.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                )}

                                <div className="flex flex-wrap items-center bg-secondary/10 text-secondary rounded-full px-2 py-0.5">
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
                                  <div className="flex flex-col gap-2 w-full mt-2">
                                    <div className="relative">
                                      <Textarea
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        placeholder="Share short thought - no spoilers!!!"
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
                                    className="group cursor-pointer flex items-center gap-1 px-2 py-0.5 text-xs font-regular bg-accent/80 text-secondary rounded-full max-w-[180px] hover:bg-accent transition-colors mt-1"
                                  >
                                    <span className="truncate">
                                      {userBook.comment ? `"${userBook.comment}"` : "Add a thought..."}
                                    </span>
                                    <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                  </div>
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
                <Card>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">No books in queue yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  <div className="text-center text-sm text-muted-foreground mb-2">
                    <GripVertical className="h-4 w-4 inline mr-1" />
                    Drag books to reorder your reading queue
                  </div>
                  <style jsx>{`
                    .sortable-container {
                      -webkit-transform: translateZ(0);
                      transform: translateZ(0);
                      -webkit-backface-visibility: hidden;
                      backface-visibility: hidden;
                      will-change: transform;
                    }
                  `}</style>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    autoScroll={{ enabled: false }}
                  >
                    <SortableContext
                      items={queueBooks.map(book => book.book_id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 sortable-container">
                        {queueBooks.map((userBook) => (
                          <SortableQueueBook
                            key={userBook.book_id}
                            userBook={userBook}
                            onStartReading={handleStartReading}
                            onRemove={(bookId: string, title: string) => showRemoveConfirmation(bookId, title, 'queue')}
                            onRecommendBook={handleRecommendBook}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardContent className="p-1">
                  {historyBooks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No books in reading history.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-1">
                      {historyBooks.map((userBook) => (
                        <HistoryBookItem
                          key={userBook.book_id}
                          userBook={userBook}
                          onMoveToShelf={handleMoveFromHistory}
                          onRemoveFromShelf={showHistoryRemoveConfirmation}
                          onRecommendBook={handleRecommendBook}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardContent className="p-1">
                  {favoriteBooks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No favorite books.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-1">
                      {favoriteBooks.map((userBook) => (
                        <FavoriteBookDialog 
                          key={userBook.book_id}
                          userBook={userBook} 
                          onFavoriteChange={handleFavoriteChange}
                        />
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
                          <ContributionBookDialog addedBooks={book} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>


          </Tabs>
        </div>
      </div>

      {/* Add the FinishedBookDialog component */}
      <FinishedBookDialog
        isOpen={finishedBookDialog.isOpen}
        onClose={closeFinishedBookDialog}
        book={finishedBookDialog.book}
        onSubmit={handleFinishedBookReview}
        isSubmitting={isSubmittingFinishedReview}
        shareDialogCallback={shareDialogCallback}
      />

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="max-w-[400px] w-[90vw] max-h-[80vh] overflow-hidden p-3">
          <Image 
            src="/images/background.png"
            alt="Create and Manage your Book Clubs | BookCrush"
            width={1622}
            height={2871}
            className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
          />
          <DialogHeader>
            <DialogTitle className="text-bookWhite mt-5">My Feedback</DialogTitle>
            <DialogDescription className="text-bookWhite font-serif">
              View your submitted feedback and admin responses
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pr-2">
            <MyFeedback />
          </div>
        </DialogContent>
      </Dialog>

      {/* Recommendations Dialog */}
      <Dialog open={isRecommendationsDialogOpen} onOpenChange={setIsRecommendationsDialogOpen}>
        <DialogContent className="max-w-[400px] w-[95vw] max-h-[85vh] p-6 overflow-hidden">
          <DialogHeader className="relative z-20">
            <DialogTitle className="text-bookWhite mt-3">Book Recommendations</DialogTitle>
            <DialogDescription className="text-bookWhite/80 font-serif">
              Share and discover great reads with friends
            </DialogDescription>
          </DialogHeader>
          <div className="absolute inset-0 z-0">
            <Image 
              src="/images/background.png"
              alt="Book Recommendations | BookCrush"
              width={1622}
              height={2871}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div className="relative z-10 max-h-[60vh] overflow-y-auto">
            <RecommendationsMain onClose={() => setIsRecommendationsDialogOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Recommend Book Dialog */}
      <RecommendBookDialog
        open={recommendDialog.isOpen}
        onOpenChange={handleRecommendDialogClose}
        book={recommendDialog.book ? {
          id: recommendDialog.book.book_id,
          title: recommendDialog.book.book.title,
          author: recommendDialog.book.book.author,
          cover_url: recommendDialog.book.book.cover_url
        } : null}
        onSuccess={handleRecommendSuccess}
      />

      {/* Custom Goals Dialog */}
      <CustomGoalsDialog
        open={isCustomGoalsDialogOpen}
        onOpenChange={setIsCustomGoalsDialogOpen}
      />

      {/* Friends Dialog */}
      <Dialog open={isFriendsDialogOpen} onOpenChange={setIsFriendsDialogOpen}>
        <DialogContent className="w-[85vw] rounded-2xl">
          <Image 
            src="/images/background.png"
            alt="Create and Manage your Book Clubs | BookCrush"
            width={1622}
            height={2871}
            className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
          />
          <DialogHeader className="flex justify-start">
            <DialogTitle>My Connections</DialogTitle>
          </DialogHeader>
          <FriendsMain />
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      {confirmRemoval.bookId && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="bg-bookWhite/95 w-[80vw] rounded-2xl p-4 max-w-md mx-4 shadow-xl pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-secondary/70 text-center leading-5">
              Are you sure you want to remove "{confirmRemoval.bookTitle}" from your {
                confirmRemoval.shelf === 'currently_reading' ? 'currently reading shelf' : 
                confirmRemoval.shelf === 'queue' ? 'reading queue' : 
                'reading history'
              }?
            </p>
            <p className="text-secondary/70 text-center leading-5 mb-3">This action cannot be undone.</p>
                          <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={cancelRemoval}
                  disabled={isRemoving}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmRemovalAction}
                  disabled={isRemoving}
                  className="rounded-full bg-red-700 hover:bg-red-800 text-bookWhite"
                >
                  {isRemoving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Remove Book'
                  )}
                </Button>
              </div>
          </div>
        </div>
      )}
    </div>
  )
} 