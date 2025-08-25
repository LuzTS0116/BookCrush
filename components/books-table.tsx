"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Plus, Search, ChevronDown, Loader2, Grid, List, BookMarked, ThumbsUp, ThumbsDown, User, CircleAlert, X } from "lucide-react"
import { Heart, Books, Bookmark, CheckCircle } from "@phosphor-icons/react"
import Link from "next/link"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Image from "next/image"
import { BookDetails } from "@/types/book"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AddBookDialog } from "./add-book-dialog"
import { RecommendBookDialog } from "./recommendations/RecommendBookDialog"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

// ✅ IMPROVEMENT 7: Constants for type safety
const SHELF_OPTIONS = [
  { label: "add to Currently Reading", value: "currently_reading" },
  { label: "add to Reading Queue", value: "queue" },
  { label: "marked as Finished", value: "history" },
] as const

const ADDITIONAL_ACTIONS = [
  { label: "Recommend to Friends", value: "recommend", icon: BookMarked },
] as const

const FILTER_MAP = {
  'explore': 'all',
  'my-library': 'my-books',
  'friends-library': 'friends'
} as const

const ITEMS_PER_PAGE = 50

// ✅ IMPROVEMENT 3: Consolidated state types
interface BookTableState {
  activeTab: string
  viewMode: "card" | "table"
  searchQuery: string
  selectedFriend: string
  selectedShelfStatus: string
  autoLoadEnabled: boolean
}

interface ExtendedBookDetails extends BookDetails {
  added_by_user?: {
    id: string
    display_name: string
    avatar_url: string | null
  }
  user_shelf_status?: {
    shelf: 'favorite' | 'currently_reading' | 'queue' | 'history'
    status?: 'in_progress' | 'almost_done' | 'finished' | 'unfinished'
  }
  friends_shelf_statuses?: Array<{
    shelf: 'favorite' | 'currently_reading' | 'queue' | 'history'
    status?: 'in_progress' | 'almost_done' | 'finished' | 'unfinished'
    user_name: string
    user_id: string
    avatar_url: string | null
  }>
}

// Helper function to get shelf badge display info
const getShelfBadgeInfo = (shelf: string, status?: string) => {
  switch (shelf) {
    case 'currently_reading':
      if (status === 'in_progress') return { label: 'In Progress', icon: Books, color: 'bg-secondary-light/15 text-secondary-light/90' };
      if (status === 'almost_done') return { label: 'Almost Done', icon: Books, color: 'bg-secondary-light/15 text-secondary-light/90' };
      return { label: 'In Progress', icon: Books, color: 'bg-secondary-light/15 text-secondary-light/90' };
    case 'queue':
      return { label: 'In Queue', icon: Bookmark, color: 'bg-[#DAA520]/15 text-[#B8860B]/75' };
    case 'history':
      if (status === 'finished') return { label: 'Finished', icon: CheckCircle, color: 'bg-accent-variant/15 text-accent-variant' };
      if (status === 'unfinished') return { label: 'Unfinished', icon: CircleAlert, color: 'bg-accent/15 text-accent' };
      return { label: 'Finished', icon: CheckCircle, color: 'bg-accent-variant/15 text-accent-variant' };
    case 'favorite':
      return { label: 'Favorited', icon: Heart, color: 'bg-red-100 text-red-400' };  
      //return null; // No badge for favorite - heart icon already shows favorite status
    default:
      return null;
  }
};

// Helper component for shelf status badge
const ShelfStatusBadge = React.memo(({ shelf, status, userName, id }: { shelf: string; status?: string; userName?: string; id?: string }) => {
  const badgeInfo = getShelfBadgeInfo(shelf, status);
  
  if (!badgeInfo) return null;
  
  return (
    <div className="flex items-center gap-1">
      <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full max-w-[210px] truncate ${badgeInfo.color}`}>
        <badgeInfo.icon size={14}/> {badgeInfo.label} {userName && (
        <span className="text-xs">
          by @<Link href={`/profile/${id}`}>{userName}</Link>
        </span>
      )}
      </span>
    </div>
  );
});

ShelfStatusBadge.displayName = 'ShelfStatusBadge'

// Component for displaying multiple friends' shelf statuses
const MultipleFriendsShelfStatus = React.memo(({ 
  friendsShelfStatuses 
}: { 
  friendsShelfStatuses: Array<{
    shelf: string
    status?: string
    user_name: string
    user_id: string
    avatar_url: string | null
  }>
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  if (!friendsShelfStatuses || friendsShelfStatuses.length === 0) {
    return null
  }
  
  // If only one friend, show the regular badge
  if (friendsShelfStatuses.length === 1) {
    const friend = friendsShelfStatuses[0]
    return (
      <ShelfStatusBadge 
        shelf={friend.shelf} 
        status={friend.status}
        userName={friend.user_name}
        id={friend.user_id}
      />
    )
  }
  
  // If multiple friends, show the "+n friends" clickable text with dialog
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <button className="bg-secondary-light/10 text-secondary-light/70 text-xs/3 font-medium px-2 py-1 rounded-full hover:bg-secondary-light/20 hover:text-secondary-light cursor-pointer">
          added by {friendsShelfStatuses.length} friends
        </button>
      </DialogTrigger>
      <DialogContent className="w-[85vw] max-w-[500px]">
        <Image 
          src="/images/background.png"
          alt="Create and Manage your Book Clubs | BookCrush"
          width={1622}
          height={2871}
          className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
        />
        <DialogHeader>
          <DialogTitle className="mt-3 text-lg/5 max-w-[200px] mx-auto">Friends with this book on their shelves</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {friendsShelfStatuses.map((friend, index) => (
            <div key={`${friend.user_id}-${index}`} className="flex items-center justify-between p-2 bg-bookWhite/95 rounded-lg">
              <div className="flex flex-row items-center gap-1.5">
                <Avatar className="h-6 w-6 flex-shrink-0 border-2 border-secondary/20">
                  <AvatarImage
                    src={friend.avatar_url || undefined}
                    alt={friend.user_name || 'User'}
                    className="h-full w-full object-cover"
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {friend.user_name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium text-sm text-secondary"><Link href={`/profile/${friend.user_id}`}>{friend.user_name}</Link></p>
              </div>
              <div>
                <ShelfStatusBadge 
                  shelf={friend.shelf} 
                  status={friend.status}
                />
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
})

MultipleFriendsShelfStatus.displayName = 'MultipleFriendsShelfStatus'

// ✅ IMPROVEMENT 2: Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timeoutId)
  }, [value, delay])

  return debouncedValue
}

// ✅ IMPROVEMENT 2: Custom hook for infinite scroll with tab loading protection
function useInfiniteScroll(
  enabled: boolean,
  onLoadMore: () => void,
  threshold = 200
) {
  useEffect(() => {
    if (!enabled) return

    const handleScroll = () => {
      // Double-check enabled state at scroll time (in case of rapid state changes)
      if (!enabled) return
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      const nearBottom = scrollTop + windowHeight >= documentHeight - threshold
      
      if (nearBottom) {
        
        onLoadMore()
      }
    }

    const throttledHandleScroll = throttle(handleScroll, 200)
    window.addEventListener('scroll', throttledHandleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll)
      
    }
  }, [enabled, onLoadMore, threshold])
}

// Utility function for throttling
function throttle(func: Function, delay: number) {
  let timeoutId: NodeJS.Timeout
  let lastExecTime = 0
  
  return function (...args: any[]) {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

// ✅ IMPROVEMENT 1: Extracted and memoized BookCard component
const BookCard = React.memo(({ 
  book, 
  onAddToShelf, 
  onRecommend, 
  onFavorite, 
  isLoading,
  activeTab,
  sessionUserId 
}: {
  book: ExtendedBookDetails
  onAddToShelf: (bookId: string, shelf: string) => void
  onRecommend: (book: ExtendedBookDetails) => void
  onFavorite: (bookId: string) => void
  isLoading: boolean
  activeTab: string
  sessionUserId?: string
}) => {
  const bookId = book.id || ''

  return (
    <Card className="relative flex flex-col gap-2">
      <div className="flex gap-4 px-4 pt-4 pb-4">
        {/* ✅ IMPROVEMENT 6: Accessibility - lazy loading and proper alt text */}
        <Link href={`/books/${bookId}`} className="shrink-0">
          <div className="w-[110px] h-35 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
            <img
              src={book.cover_url || "/placeholder.svg"}
              alt={`${book.title} cover`}
              className="object-cover h-full w-full"
              loading="lazy"
            />
          </div>
        </Link>

        <div className="flex-1 flex flex-col justify-between gap-0.5">
          <div>
            <div className="flex flex-row justify-between">
              <div className="flex-1 min-w-0">
                <Link href={`/books/${bookId}`}>
                  <h3 className="text-lg/5 font-semibold break-words text-secondary">
                    {book.title}
                  </h3>
                </Link>
              </div>
              
              {/* ✅ IMPROVEMENT 6: Accessibility - ARIA labels */}
              {bookId && (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs flex items-start justify-end px-0 rounded-full h-6 w-6 gap-1 bg-transparent ml-1 border-none hover:bg-secondary/5"
                      disabled={isLoading}
                      aria-label="Add book to shelf"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                    <DropdownMenu.Content 
                      className="flex flex-col items-end rounded-xl bg-transparent shadow-xl px-1 mr-8 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                    >
                      {SHELF_OPTIONS.map((shelf) => (
                        <DropdownMenu.Item
                          key={shelf.value}
                          onSelect={() => onAddToShelf(bookId, shelf.value)}
                          className="w-fit px-3 py-2 text-xs text-end bg-secondary/90 my-1 rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                        >
                          {shelf.label}
                        </DropdownMenu.Item>
                      ))}
                      
                      {ADDITIONAL_ACTIONS.map((action) => (
                        <DropdownMenu.Item
                          key={action.value}
                          onSelect={() => action.value === 'recommend' && onRecommend(book)}
                          className="w-fit px-3 py-2 text-xs text-end bg-accent/90 my-1 text-secondary rounded-md cursor-pointer hover:bg-accent-variant hover:text-bookWhite focus:bg-accent-variant focus:outline-none transition-colors flex justify-end gap-2"
                        >
                          {action.label}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              )}
            </div>
            
            <p className="text-secondary/50 text-sm">{book.author}</p>
            
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-primary" />
                <span className="font-serif font-medium text-xs text-secondary">
                  {book.reactions?.counts?.HEART || 0}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3 text-accent-variant" />
                <span className="font-serif font-medium text-xs text-secondary">
                  {book.reactions?.counts?.THUMBS_UP || 0}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsDown className="h-3 w-3 text-accent" />
                <span className="font-serif font-medium text-xs text-secondary">
                  {book.reactions?.counts?.THUMBS_DOWN || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 items-center">
            {book.genres?.slice(0, 1).map((genre: string) => (
              <span
                key={genre}
                className="bg-primary/20 text-primary-dark text-xs/3 font-medium px-2 py-1 rounded-full"
              >
                {genre}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-1 items-center pt-1">
            {/* Shelf Status Badge */}
            {activeTab === 'friends-library' && book.friends_shelf_statuses && book.friends_shelf_statuses.length > 0 ? (
              <MultipleFriendsShelfStatus 
                friendsShelfStatuses={book.friends_shelf_statuses}
              />
            ) : book.user_shelf_status ? (
              <div className="animate-in fade-in duration-300">
                <ShelfStatusBadge 
                  shelf={book.user_shelf_status.shelf} 
                  status={book.user_shelf_status.status}
                />
              </div>
            ) : null}
          </div>

          {book.pages && (
            <div className="flex-1">
              <p className="text-secondary/60 font-sans font-normal bg-accent/20 rounded-full px-2 text-xs inline-block">
                {book.pages} pages • {book.reading_time}
              </p>
            </div>
          )}

          <div className="flex flex-row justify-between items-end gap-2 text-sm">
            <div>
              {activeTab !== 'my-library' && book.added_by_user && (
                <p className="text-xs leading-none text-secondary/60">
                  {activeTab === 'explore' ? 'Added by' : 'Added by'}{' '}
                  @<Link href={`/profile/${book.added_by_user.id}`}>{book.added_by_user.display_name}</Link>
                </p>
              )}
              <p className="text-secondary/60 text-xs font-serif font-medium">
                {book.created_at ? 
                  new Date(book.created_at).toLocaleDateString('en-US', {
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric'
                  }) : 'Unknown'
                }
              </p>
            </div>
            
            {bookId && (
              <button
                onClick={() => onFavorite(bookId)}
                className="p-0 absolute bottom-3 right-3"
                aria-label={book.is_favorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  className="h-5 w-5"
                  color="#C51104"
                  weight={book.is_favorite ? "fill" : "regular"}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
})

BookCard.displayName = 'BookCard'

// ✅ IMPROVEMENT 1: Memoized loading skeleton
const LoadingSkeleton = React.memo(() => (
  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mt-4">
    {Array.from({ length: 6 }, (_, index) => (
      <Card key={`skeleton-${index}`} className="relative flex flex-col gap-2 animate-pulse">
        <div className="flex gap-4 px-4 pt-4 pb-4">
          <div className="w-[110px] h-35 bg-muted/50 rounded shrink-0" />
          <div className="flex-1 flex flex-col justify-between gap-2">
            <div>
              <div className="h-5 bg-muted/50 rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted/30 rounded w-1/2 mb-3" />
              <div className="flex gap-2">
                <div className="h-6 bg-muted/30 rounded-full w-16" />
                <div className="h-6 bg-muted/20 rounded-full w-12" />
              </div>
            </div>
            <div className="h-4 bg-muted/30 rounded w-24" />
            <div className="h-3 bg-muted/20 rounded w-20" />
          </div>
        </div>
      </Card>
    ))}
  </div>
))

LoadingSkeleton.displayName = 'LoadingSkeleton'

// ✅ Tab loading component with suspense-like behavior
const TabLoadingSuspense = React.memo(() => (
  <div className="flex flex-col items-center justify-center min-h-64 py-2 animate-in fade-in duration-300">
    <div className="relative">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse" />
    </div>
    <div className="mt-0 text-center space-y-0 animate-in slide-in-from-bottom-4 duration-500 delay-150">
      <p className="text-lg font-medium text-secondary">Loading content...</p>
      <p className="text-sm text-muted-foreground">Switching to your selected tab</p>
    </div>
    
    {/* Skeleton preview cards with staggered animation */}
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mt-8 w-full max-w-4xl animate-in slide-in-from-bottom-8 duration-700 delay-300">
      {Array.from({ length: 3 }, (_, index) => (
        <Card 
          key={`tab-skeleton-${index}`} 
          className="relative flex flex-col gap-2 animate-pulse"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex gap-4 px-4 pt-4 pb-4">
            <div className="w-[110px] h-35 bg-muted/50 rounded shrink-0" />
            <div className="flex-1 flex flex-col justify-between gap-2">
              <div>
                <div className="h-5 bg-muted/50 rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted/30 rounded w-1/2 mb-3" />
                <div className="flex gap-2">
                  <div className="h-6 bg-muted/30 rounded-full w-16" />
                </div>
              </div>
              <div className="h-4 bg-muted/30 rounded w-24" />
              <div className="h-3 bg-muted/20 rounded w-20" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
))

TabLoadingSuspense.displayName = 'TabLoadingSuspense'

// ✅ Main optimized component
export default function BooksTableOptimized() {
  const { data: session, status } = useSession()
  
  // ✅ IMPROVEMENT 3: Consolidated state
  const [state, setState] = useState<BookTableState>({
    activeTab: "explore",
    viewMode: "card",
    searchQuery: "",
    selectedFriend: "all",
    selectedShelfStatus: "all",
    autoLoadEnabled: true,
  })

  // Remaining individual state
  const [books, setBooks] = useState<ExtendedBookDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTabLoading, setIsTabLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMorePages, setHasMorePages] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [friendsList, setFriendsList] = useState<Array<{id: string, name: string}>>([])
  const [shelfActionsStatus, setShelfActionsStatus] = useState<Record<string, { isLoading: boolean, message: string | null }>>({})
  const [open, setOpen] = useState(false)
  const [recommendDialog, setRecommendDialog] = useState<{
    isOpen: boolean
    book: ExtendedBookDetails | null
  }>({ isOpen: false, book: null })

  // ✅ IMPROVEMENT 4: AbortController for cleanup
  const abortControllerRef = useRef<AbortController | null>(null)

  // ✅ IMPROVEMENT 2: Memoized values
  const debouncedSearchQuery = useDebounce(state.searchQuery, 300)
  
  const currentFilter = useMemo(() => 
    FILTER_MAP[state.activeTab as keyof typeof FILTER_MAP] || 'all',
    [state.activeTab]
  )
  
  const displayBooks = useMemo(() => books, [books])

  // ✅ IMPROVEMENT 2: Memoized callbacks
  const updateState = useCallback((updates: Partial<BookTableState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // Function to fetch user's friends for the filter dropdown
  const fetchFriends = useCallback(async () => {
    if (status !== 'authenticated' || !session?.supabaseAccessToken) {
      return
    }
    
    try {
      const response = await fetch('/api/friends?type=friends', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        },
      })
      
      if (response.ok) {
        const friendshipsData = await response.json()
        
        // Extract friends from friendship relationships
        const formattedFriends = friendshipsData.map((friendship: any) => {
          // Determine which user is the friend (not the current user)
          const friend = friendship.user_one?.id === session?.user?.id 
            ? friendship.user_two 
            : friendship.user_one
          
          return {
            id: friend?.id || '',
            name: friend?.display_name || 'Unknown'
          }
        }).filter((friend: any) => friend.id) // Filter out any invalid entries
        
        setFriendsList(formattedFriends)
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
    }
  }, [session, status])

  // Forward declaration - will be defined later
  const handleTabChangeImpl = useCallback(async (value: string, fetchBooksFunc: typeof fetchBooks) => {
    // Set tab loading state
    setIsTabLoading(true)
    setError(null)
    
    // Add timeout protection to prevent stuck loading state
    const timeoutId = setTimeout(() => {
      console.warn('Tab loading timeout - forcing completion')
      setIsTabLoading(false)
      setError('Loading took too long. Please try refreshing the page.')
    }, 10000) // 10 second timeout
    
    try {
      updateState({ 
        activeTab: value, 
        searchQuery: '',
        selectedFriend: value !== 'friends-library' ? 'all' : state.selectedFriend,
        selectedShelfStatus: value !== 'friends-library' ? 'all' : state.selectedShelfStatus,
      })
      
      // Clear current books to show loading state immediately
      setBooks([])
      setCurrentPage(1)
      setHasMorePages(true)
      
      // Get the filter for the new tab
      const filterMap: Record<string, string> = {
        'explore': 'all',
        'my-library': 'my-books',
        'friends-library': 'friends'
      }
      const newFilter = filterMap[value] || 'all'
      
      // Fetch friends list when switching to friends library tab
      if (value === 'friends-library' && friendsList.length === 0) {
        await fetchFriends()
      }
      
      // Fetch books for the new tab
      await fetchBooksFunc(
        newFilter, 
        value !== 'friends-library' ? 'all' : state.selectedFriend,
        value !== 'friends-library' ? 'all' : state.selectedShelfStatus,
        1
      )
      
      // Clear timeout since operation completed successfully
      clearTimeout(timeoutId)
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('Error switching tabs:', err)
      
      // Set more specific error messages
      if (err.name === 'AbortError') {
        setError('Tab loading was cancelled. Please try again.')
      } else if (err.message?.includes('Authentication')) {
        setError('Authentication expired. Please refresh the page and log in again.')
      } else {
        setError('Failed to load tab content. Please check your connection and try again.')
      }
    } finally {
      setIsTabLoading(false)
    }
  }, [state.selectedFriend, state.selectedShelfStatus, friendsList.length, updateState, fetchFriends])

  const handleSearchChange = useCallback((query: string) => {
    updateState({ searchQuery: query })
  }, [updateState])

  const handleClearSearch = useCallback(() => {
    updateState({ searchQuery: '' })
  }, [updateState])

  // ✅ IMPROVEMENT 4: API calls with AbortController
  const searchBooks = useCallback(async (query: string) => {
    if (status !== 'authenticated' || !session?.supabaseAccessToken) {
      setError('Authentication required to search books')
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }))
        throw new Error(errorData.error || `Failed to search books: ${response.status} ${response.statusText}`)
      }
      
      const data: ExtendedBookDetails[] = await response.json()
      setBooks(data)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error searching books:", err)
        setError(err.message || "Could not search books.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [session, status])

  const fetchBooks = useCallback(async (filter: string = 'all', friendFilter: string = 'all', shelfFilter: string = 'all', page: number = 1) => {
    if (status !== 'authenticated' || !session?.supabaseAccessToken) {
      setIsLoading(false)
      setError('Authentication required to fetch books')
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    // Only set regular loading if not already in tab loading state
    if (!isTabLoading && page === 1) {
      setIsLoading(true)
    }
    if (page > 1) setLoadingMore(true)
    setError(null)
    
    try {
      // Build query parameters
      const params = new URLSearchParams({ 
        filter,
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString()
      })
      if (friendFilter !== 'all') params.append('friendFilter', friendFilter)
      if (shelfFilter !== 'all') params.append('shelfFilter', shelfFilter)
      
      const response = await fetch(`/api/books?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }))
        throw new Error(errorData.error || `Failed to fetch books: ${response.statusText}`)
      }
      
      const data: ExtendedBookDetails[] = await response.json()
      
      // Only update state if the request wasn't aborted and we're not in the middle of a tab change
      if (!abortControllerRef.current?.signal.aborted) {
        if (page === 1) {
          setBooks(data)
          
          setCurrentPage(1)
        } else {
          setBooks(prev => [...prev, ...data])
          setCurrentPage(page)
        }
        
        setHasMorePages(data.length === ITEMS_PER_PAGE)
      }
      
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error fetching books:", err)
        // Only set error if we're not in tab loading state (to avoid conflicts)
        if (!isTabLoading) {
          setError(err.message || "Could not load books.")
        }
      } 
    } finally {
      if (!isTabLoading) {
        setIsLoading(false)
      }
      setLoadingMore(false)
    }
  }, [session, status, isTabLoading])

  // Now create the actual handleTabChange that uses fetchBooks
  const handleTabChange = useCallback(async (value: string) => {
    await handleTabChangeImpl(value, fetchBooks)
  }, [handleTabChangeImpl, fetchBooks])

  const loadMoreBooks = useCallback(async () => {
    if (!hasMorePages || loadingMore || isTabLoading) return
    
    try {
      await fetchBooks(currentFilter, state.selectedFriend, state.selectedShelfStatus, currentPage + 1)
    } catch (err: any) {
      console.error('Error loading more books:', err)
      setError('Failed to load more books. Please try again.')
      toast.error('Failed to load more books')
    }
  }, [hasMorePages, loadingMore, isTabLoading, currentFilter, currentPage, state.selectedFriend, state.selectedShelfStatus, fetchBooks])

  const handleAddToShelf = useCallback(async (bookId: string, shelf: string) => {
    if (!session?.supabaseAccessToken) {
      toast.error('Authentication required')
      return
    }

    // Find the current book to store its previous state for rollback
    const currentBook = books.find(book => book.id === bookId)
    if (!currentBook) return

    // Set loading state
    setShelfActionsStatus(prev => ({
      ...prev,
      [bookId]: { isLoading: true, message: null }
    }))
    
    // Optimistic update: immediately update the book's shelf status
    const optimisticShelfStatus = {
      shelf: shelf as 'favorite' | 'currently_reading' | 'queue' | 'history',
      status: 'in_progress' as 'in_progress' | 'almost_done' | 'finished' | 'unfinished'
    }
    
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId 
          ? { 
              ...book, 
              user_shelf_status: optimisticShelfStatus
            }
          : book
      )
    )
    
    // Show immediate visual feedback
    const shelfDisplayName = shelf.replace(/_/g, ' ')
    toast.success(`Adding to ${shelfDisplayName}...`, { duration: 1000 })
    
    try {
      const response = await fetch('/api/shelf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        },
        body: JSON.stringify({ bookId, shelf, status: 'in_progress' })
      })
      
      if (!response.ok) {
        // Rollback optimistic update on error
        setBooks(prevBooks => 
          prevBooks.map(book => 
            book.id === bookId 
              ? { 
                  ...book, 
                  user_shelf_status: currentBook.user_shelf_status
                }
              : book
          )
        )
        
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add book to shelf')
      }
      
      const shelfDisplayName = shelf.replace(/_/g, ' ')
      toast.success(`Successfully added to ${shelfDisplayName}!`)

    } catch (err: any) {
      console.error("Error adding book to shelf:", err)
      toast.error(`Failed to add book: ${err.message}`)
    } finally {
      setShelfActionsStatus(prev => ({
        ...prev,
        [bookId]: { isLoading: false, message: null }
      }))
    }
  }, [session?.supabaseAccessToken, books])

  const handleRecommendBook = useCallback((book: ExtendedBookDetails) => {
    setRecommendDialog({ isOpen: true, book })
  }, [])

  const handleFavorite = useCallback(async (bookId: string) => {
    if (!bookId) return
    if (!session?.supabaseAccessToken) {
      toast.error('Authentication required')
      return
    }
    
    // Get the current book
    const currentBook = books.find(book => book.id === bookId)
    if (!currentBook) return
    
    // Optimistically update UI
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId 
          ? { ...book, is_favorite: !book.is_favorite }
          : book
      )
    )
    
    try {
      const response = await fetch('/api/books/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        },
        body: JSON.stringify({ bookId }),
      })
      
      if (!response.ok) {
        // Revert UI change if API call fails
        setBooks(prevBooks => 
          prevBooks.map(book => 
            book.id === bookId 
              ? { ...book, is_favorite: currentBook.is_favorite }
              : book
          )
        )
        throw new Error('Failed to update favorite status')
      }
      
      const data = await response.json()
      
      if (data.is_favorite) {
        toast.success('Added to favorites!')
      } else {
        toast.success('Removed from favorites')
      }
      
    } catch (error) {
      console.error('Error updating favorite status:', error)
      toast.error('Failed to update favorite status')
    }
  }, [session?.supabaseAccessToken, books])

  const handleBookAdded = useCallback((newBook: BookDetails) => {
    if (state.searchQuery.trim()) {
      searchBooks(state.searchQuery)
    } else {
      fetchBooks(currentFilter, state.selectedFriend, state.selectedShelfStatus, 1)
    }
  }, [state.searchQuery, currentFilter, state.selectedFriend, state.selectedShelfStatus, searchBooks, fetchBooks])

  // ✅ IMPROVEMENT 2: Infinite scroll hook - disabled during tab loading
  useInfiniteScroll(
    state.autoLoadEnabled && !state.searchQuery.trim() && hasMorePages && !loadingMore && !isTabLoading,
    loadMoreBooks,
    200
  )

  // Effects
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      searchBooks(debouncedSearchQuery)
    }
  }, [debouncedSearchQuery, searchBooks])

  useEffect(() => {
    if (status === 'authenticated' && session?.supabaseAccessToken && !state.searchQuery.trim() && !isTabLoading) {
      fetchBooks(currentFilter, state.selectedFriend, state.selectedShelfStatus, 1)
    }
  }, [status, session?.supabaseAccessToken, state.searchQuery, currentFilter, state.selectedFriend, state.selectedShelfStatus, fetchBooks, isTabLoading])

  // Fetch friends list when user is authenticated
  useEffect(() => {
    if (status === 'authenticated' && friendsList.length === 0) {
      fetchFriends()
    }
  }, [status, friendsList.length, fetchFriends])

  // ✅ IMPROVEMENT 4: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Early returns for loading/error states
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-6 pb-20">
        <p className="text-center text-muted-foreground mt-8">Please log in to view books.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      <div className="space-y-5">
        <Tabs value={state.activeTab} onValueChange={handleTabChange}>
          <div className="flex justify-center">
            <TabsList className="bg-secondary-light text-primary rounded-full mb-4">
              <TabsTrigger 
                value="explore" 
                className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full flex items-center gap-2"
                disabled={isTabLoading}
              >
                Explore
                {isTabLoading && state.activeTab === 'explore' && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="my-library" 
                className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full flex items-center gap-2"
                disabled={isTabLoading}
              >
                My Library
                {isTabLoading && state.activeTab === 'my-library' && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="friends-library" 
                className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full flex items-center gap-2"
                disabled={isTabLoading}
              >
                Friends Library
                {isTabLoading && state.activeTab === 'friends-library' && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </TabsTrigger>
            </TabsList>
          </div>

            {/* Search and Controls Bar */}
            <div className="flex flex-col gap-2 mb-0">
              {/* Search Bar */}
              <div className="flex justify-center gap-1.5">
                <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl">
                  <Search className={`absolute left-3 top-4 -translate-y-1/2 h-4 w-4 ${isTabLoading ? 'text-muted-foreground/50' : 'text-secondary'}`} />
                  <Input
                    placeholder="Search books, authors, genres..."
                    className={`pl-10 ${state.searchQuery.trim() && !isTabLoading ? 'pr-10' : 'pr-4'} rounded-full bg-bookWhite/90 text-secondary/85 transition-opacity ${isTabLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={state.searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    disabled={isTabLoading}
                  />
                  {state.searchQuery.trim() && !isTabLoading && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary/10 rounded-full transition-colors"
                      aria-label="Clear search"
                      type="button"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-secondary" />
                    </button>
                  )}
                  {isTabLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant={state.viewMode === "card" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => updateState({ viewMode: "card" })}
                    aria-label="Card view"
                    disabled={isTabLoading}
                    className={`px-2 h-8 w-8 ${state.viewMode === "card" ? 'shadow-sm bg-primary-dark text-secondary focus:bg-primary-dark active:bg-primary-dark' : 'bg-secondary-light/50 text-bookWhite border border-bookWhite/30'} ${isTabLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Grid className="h-8 w-8" />
                  </Button>
                  <Button
                    variant={state.viewMode === "table" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => updateState({ viewMode: "table" })}
                    aria-label="Table view"
                    disabled={isTabLoading}
                    className={`px-2 h-8 w-8 ${state.viewMode === "table" ? 'shadow-sm bg-primary-dark text-secondary focus:bg-primary-dark active:bg-primary-dark' : 'bg-secondary-light/50 text-bookWhite border border-bookWhite/30'} ${isTabLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <List className="h-8 w-8" />
                  </Button>
                </div>
              </div>
              
              {/* Controls Row */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Left side - Filters (Friends Library only) */}
                <div className="flex items-center gap-2">
                  {state.activeTab === 'friends-library' && (
                    <div className={`flex items-center gap-2 transition-opacity ${isTabLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      {/* Friend Filter */}
                      <Select 
                        value={state.selectedFriend} 
                        onValueChange={(value) => updateState({ selectedFriend: value })}
                        disabled={isTabLoading}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue placeholder="All friends" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-secondary/90 backdrop-blur-sm border-none shadow-lg">
                          <SelectItem 
                            value="all"
                            className="cursor-pointer rounded-xl px-3 py-2 text-bookWhite/80 focus:bg-accent focus:text-secondary hover:bg-accent/70 hover:text-secondary/70 data-[state=checked]:bg-accent data-[state=checked]:text-secondary [&_svg]:hidden"
                          >
                            All friends
                          </SelectItem>
                          {friendsList.length === 0 ? (
                            <SelectItem 
                              value="no-friends" 
                              disabled
                            >
                              No friends found
                            </SelectItem>
                          ) : (
                            friendsList.map((friend) => (
                              <SelectItem 
                                key={friend.id}
                                value={friend.id}
                                className="cursor-pointer rounded-xl px-3 py-2 text-bookWhite/80 focus:bg-accent focus:text-secondary hover:bg-accent/70 hover:text-secondary/70 data-[state=checked]:bg-accent data-[state=checked]:text-secondary [&_svg]:hidden"
                              >
                                {friend.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      {/* Shelf Status Filter */}
                      <Select 
                        value={state.selectedShelfStatus} 
                        onValueChange={(value) => updateState({ selectedShelfStatus: value })}
                        disabled={isTabLoading}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue placeholder="All shelves" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-secondary/90 backdrop-blur-sm border-none shadow-lg">
                          <SelectItem 
                            value="all"
                            className="cursor-pointer rounded-xl px-3 py-2 text-bookWhite/80 focus:bg-accent focus:text-secondary hover:bg-accent/70 hover:text-secondary/70 data-[state=checked]:bg-accent data-[state=checked]:text-secondary [&_svg]:hidden"
                          >
                            All shelves
                          </SelectItem>
                          <SelectItem 
                            value="currently_reading"
                            className="cursor-pointer rounded-xl px-3 py-2 text-bookWhite/80 focus:bg-accent focus:text-secondary hover:bg-accent/70 hover:text-secondary/70 data-[state=checked]:bg-accent data-[state=checked]:text-secondary [&_svg]:hidden"
                          >
                            Currently Reading
                          </SelectItem>
                          <SelectItem 
                            value="queue"
                            className="cursor-pointer rounded-xl px-3 py-2 text-bookWhite/80 focus:bg-accent focus:text-secondary hover:bg-accent/70 hover:text-secondary/70 data-[state=checked]:bg-accent data-[state=checked]:text-secondary [&_svg]:hidden"
                          >
                            In Queue
                          </SelectItem>
                          <SelectItem 
                            value="history"
                            className="cursor-pointer rounded-xl px-3 py-2 text-bookWhite/80 focus:bg-accent focus:text-secondary hover:bg-accent/70 hover:text-secondary/70 data-[state=checked]:bg-accent data-[state=checked]:text-secondary [&_svg]:hidden"
                          >
                            Finished
                          </SelectItem>
                          <SelectItem 
                            value="favorite"
                            className="cursor-pointer rounded-xl px-3 py-2 text-bookWhite/80 focus:bg-accent focus:text-secondary hover:bg-accent/70 hover:text-secondary/70 data-[state=checked]:bg-accent data-[state=checked]:text-secondary [&_svg]:hidden"
                          >
                            Favorites
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Clear Filters Button */}
                      {(state.selectedFriend !== 'all' || state.selectedShelfStatus !== 'all') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateState({ selectedFriend: 'all', selectedShelfStatus: 'all' })
                          }}
                          className="h-8 text-xs px-3 rounded-full"
                          disabled={isTabLoading}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

          {/* Add Book Button */}
          {state.activeTab === 'explore' && state.searchQuery.trim() && displayBooks.length > 0 && (
            <div className="flex justify-center mb-2 py-0">
              <div className="flex flex-col items-center gap-1 bg-secondary/5 rounded-full px-4 pt-0 pb-2">
                <span className="text-sm text-bookWhite/70">Don't find what you're looking for?</span>
                <AddBookDialog
                  open={open}
                  onOpenChange={setOpen}
                  books={books}
                  setBooks={setBooks}
                  onBookAdded={handleBookAdded}
                  initialSearchQuery={state.searchQuery}
                />
              </div>
            </div>
          )}



          {/* Content */}
          <TabsContent value={state.activeTab} className="space-y-4">
            {isTabLoading ? (
              <TabLoadingSuspense />
            ) : isLoading && books.length === 0 ? (
              <div className="flex items-center justify-center min-h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center mt-8">
                <p className="text-red-500 mb-4">Error: {error}</p>
                <Button 
                  onClick={() => fetchBooks(currentFilter, state.selectedFriend, state.selectedShelfStatus, 1)} 
                  variant="outline"
                >
                  Retry
                </Button>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center text-muted-foreground mt-8">
                {state.activeTab === 'my-library' ? (
                  <div className="space-y-4">
                    <p>You haven&apos;t added any books to your library yet. Click &ldquo;Add Book&rdquo; to get started.</p>
                    <div className="flex justify-center">
                      <AddBookDialog
                        open={open}
                        onOpenChange={setOpen}
                        books={books}
                        setBooks={setBooks}
                        onBookAdded={handleBookAdded}
                        initialSearchQuery={state.searchQuery}
                      />
                    </div>
                  </div>
                ) : state.activeTab === 'friends-library' ? (
                  <p>Your friends haven&apos;t added any books to their libraries yet. Connect with more friends who love reading!</p>
                ) : (
                  <div className="space-y-4">
                    <p>No books available yet. Click &ldquo;Add Book&rdquo; to get started or connect with friends.</p>
                    <div className="flex justify-center">
                      <AddBookDialog
                        open={open}
                        onOpenChange={setOpen}
                        books={books}
                        setBooks={setBooks}
                        onBookAdded={handleBookAdded}
                        initialSearchQuery={state.searchQuery}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : displayBooks.length === 0 ? (
              <div className="text-center text-muted-foreground mt-8">
                <p>No books found matching &ldquo;{state.searchQuery}&rdquo;</p>
                <p className="text-sm mb-4">
                  {state.activeTab === 'explore' && 'Add the book and contribute to the community!'}
                  {state.activeTab === 'my-library' && 'Try a different search term or the book and contribute to the community!'}
                  {state.activeTab === 'friends-library' && 'Your friends dont have books matching this search. Add the book and contribute to the community!'}
                </p>
                {state.activeTab === 'explore' && (
                  <div className="flex justify-center">
                    <AddBookDialog
                      open={open}
                      onOpenChange={setOpen}
                      books={books}
                      setBooks={setBooks}
                      onBookAdded={handleBookAdded}
                      initialSearchQuery={state.searchQuery}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                {state.viewMode === "card" ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {displayBooks.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onAddToShelf={handleAddToShelf}
                        onRecommend={handleRecommendBook}
                        onFavorite={handleFavorite}
                        isLoading={shelfActionsStatus[book.id || '']?.isLoading || false}
                        activeTab={state.activeTab}
                        sessionUserId={session?.user?.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Pages</TableHead>
                          <TableHead>Genre</TableHead>
                          <TableHead>Status</TableHead>
                          {state.activeTab !== 'my-library' && <TableHead>Added By</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayBooks.map((book) => (
                          <TableRow key={book.id}>
                            <TableCell>
                              <Link href={`/books/${book.id}`}>{book.title}</Link>
                            </TableCell>
                            <TableCell>{book.author}</TableCell>
                            <TableCell>{book.pages}</TableCell>
                            <TableCell>
                              {book.genres?.slice(0, 1).map((genre) => (
                                <span key={genre}>{genre}</span>
                              ))}
                            </TableCell>
                            <TableCell>
                              {state.activeTab === 'friends-library' && book.friends_shelf_statuses && book.friends_shelf_statuses.length > 0 ? (
                                <MultipleFriendsShelfStatus 
                                  friendsShelfStatuses={book.friends_shelf_statuses}
                                />
                              ) : book.user_shelf_status ? (
                                <div className="animate-in fade-in duration-300">
                                  <ShelfStatusBadge 
                                    shelf={book.user_shelf_status.shelf} 
                                    status={book.user_shelf_status.status}
                                  />
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            {state.activeTab !== 'my-library' && (
                              <TableCell className="text-xs text-muted-foreground">
                                {book.added_by_user && book.added_by_user.id !== session?.user?.id
                                  ? book.added_by_user.display_name
                                  : 'You'
                                }
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Loading skeleton */}
                {loadingMore && <LoadingSkeleton />}

                {/* Load more section */}
                {!state.searchQuery.trim() && hasMorePages && (
                  <div className={`flex flex-col items-center gap-4 my-8 transition-opacity ${isTabLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Auto-load while scrolling:</span>
                      <Button
                        onClick={() => updateState({ autoLoadEnabled: !state.autoLoadEnabled })}
                        variant="outline"
                        size="sm"
                        className={`px-3 py-1 text-xs ${state.autoLoadEnabled ? 'bg-primary text-primary-foreground' : ''}`}
                        disabled={isTabLoading}
                      >
                        {state.autoLoadEnabled ? 'ON' : 'OFF'}
                      </Button>
                    </div>

                    <Button 
                      onClick={loadMoreBooks}
                      disabled={loadingMore || isTabLoading}
                      variant="outline"
                      className="px-8 py-3"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading more books...
                        </>
                      ) : isTabLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Switching tabs...
                        </>
                      ) : (
                        <>
                          Load More Books
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* End of collection message */}
                {!state.searchQuery.trim() && !hasMorePages && books.length > 0 && (
                  <div className="flex justify-center my-8">
                    <div className="text-sm text-muted-foreground bg-muted/30 rounded-full px-4 py-2">
                      📚 You've reached the end of the collection!
                    </div>
                  </div>
                )}

                {/* Scroll Status Info */}
                {!state.searchQuery.trim() && displayBooks.length > 0 && !isTabLoading && (
                  <div className="text-center mt-6 text-sm text-muted-foreground">
                    Showing {displayBooks.length} books
                    {hasMorePages && (
                      <span className="ml-2">• Scroll down or click "Load More" for more content</span>
                    )}
                  </div>
                )}

                {/* Tab Loading Status */}
                {isTabLoading && displayBooks.length > 0 && (
                  <div className="text-center mt-6 text-sm text-amber-600 bg-amber-50 rounded-full px-4 py-2 mx-auto w-fit">
                    <Loader2 className="inline h-3 w-3 mr-2 animate-spin" />
                    Scroll temporarily disabled during tab loading...
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Recommend Dialog */}
      <RecommendBookDialog
        open={recommendDialog.isOpen}
        onOpenChange={(open) => setRecommendDialog(prev => ({ ...prev, isOpen: open }))}
        book={recommendDialog.book && recommendDialog.book.id ? {
          id: recommendDialog.book.id,
          title: recommendDialog.book.title,
          author: recommendDialog.book.author,
          cover_url: recommendDialog.book.cover_url
        } : null}
        onSuccess={() => toast.success('Book recommendation sent successfully!')}
      />
    </div>
  )
} 