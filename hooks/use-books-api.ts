import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'

// Extended session type to include supabaseAccessToken
interface ExtendedSession {
  user?: {
    id?: string
    email?: string
    name?: string
    image?: string
  }
  supabaseAccessToken?: string
  expires: string
}

interface ExtendedBookDetails {
  id?: string
  title: string
  author: string
  cover_url?: string
  genres?: string[]
  pages?: number
  reading_time?: string
  created_at?: string
  is_favorite?: boolean
  reactions?: {
    counts?: {
      HEART?: number
      THUMBS_UP?: number
      THUMBS_DOWN?: number
    }
  }
  added_by_user?: {
    id: string
    display_name: string
    nickname: string | null
    avatar_url: string | null
  }
  user_shelf_status?: {
    shelf: 'favorite' | 'currently_reading' | 'queue' | 'history'
    status?: 'in_progress' | 'almost_done' | 'finished' | 'unfinished'
  }
  friend_shelf_status?: {
    shelf: 'favorite' | 'currently_reading' | 'queue' | 'history'
    status?: 'in_progress' | 'almost_done' | 'finished' | 'unfinished'
    user_name: string
  }
}

interface UseBooksAPIProps {
  session: ExtendedSession | null
  status: string
  abortControllerRef: React.RefObject<AbortController | null>
}

interface UseBooksAPIReturn {
  books: ExtendedBookDetails[]
  isLoading: boolean
  error: string | null
  hasMorePages: boolean
  loadingMore: boolean
  currentServerPage: number
  searchBooks: (query: string) => Promise<void>
  fetchBooks: (filter?: string, friendFilter?: string, shelfFilter?: string, page?: number, limit?: number) => Promise<void>
  loadMoreBooks: () => Promise<void>
  loadInitialData: (filter: string, friendFilter?: string, shelfFilter?: string) => Promise<void>
  setBooks: React.Dispatch<React.SetStateAction<ExtendedBookDetails[]>>
}

const ITEMS_PER_SERVER_PAGE = 50

export function useBooksAPI({ session, status, abortControllerRef }: UseBooksAPIProps): UseBooksAPIReturn {
  const [books, setBooks] = useState<ExtendedBookDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMorePages, setHasMorePages] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentServerPage, setCurrentServerPage] = useState(1)
  
  // Keep track of current filters for loadMoreBooks
  const currentFiltersRef = useRef({
    filter: 'all',
    friendFilter: 'all',
    shelfFilter: 'all'
  })

  const searchBooks = useCallback(async (query: string) => {
    console.log('[useBooksAPI] Search attempt - Session status:', status)
    
    if (status !== 'authenticated' || !session?.supabaseAccessToken) {
      console.error('[useBooksAPI] Authentication failed for search')
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
      console.log('[useBooksAPI] Searching books with query:', query)
      
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
      })
      
      if (!response.ok) {
        console.error('[useBooksAPI] Search API response error:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }))
        console.error('[useBooksAPI] Error data:', errorData)
        throw new Error(errorData.error || `Failed to search books: ${response.status} ${response.statusText}`)
      }
      
      const data: ExtendedBookDetails[] = await response.json()
      console.log('[useBooksAPI] Successfully searched books:', data.length, 'results for query:', query)
      setBooks(data)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error searching books:", err)
        setError(err.message || "Could not search books.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [session, status, abortControllerRef])

  const fetchBooks = useCallback(async (
    filter: string = 'all', 
    friendFilter: string = 'all', 
    shelfFilter: string = 'all', 
    page: number = 1, 
    limit: number = ITEMS_PER_SERVER_PAGE
  ) => {
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

    setIsLoading(true)
    setError(null)
    
    try {
      // Build query parameters
      const params = new URLSearchParams({ 
        filter,
        page: page.toString(),
        limit: limit.toString()
      })
      if (friendFilter !== 'all') params.append('friendFilter', friendFilter)
      if (shelfFilter !== 'all') params.append('shelfFilter', shelfFilter)
      
      console.log('[useBooksAPI] Fetching books with Bearer token, filter:', filter, 'page:', page, 'limit:', limit)
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
      console.log('[useBooksAPI] Successfully fetched books:', data.length, 'for filter:', filter, 'page:', page)
      
      // If it's the first page, replace books array; otherwise, append to existing books
      if (page === 1) {
        setBooks(data)
        setCurrentServerPage(1)
      } else {
        setBooks(prev => [...prev, ...data])
        setCurrentServerPage(page)
      }
      
      // Check if there are more pages (if we got less than the limit, we're at the end)
      setHasMorePages(data.length === limit)
      
      // Update current filters for loadMoreBooks
      currentFiltersRef.current = { filter, friendFilter, shelfFilter }
      
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error fetching books:", err)
        setError(err.message || "Could not load books.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [session, status, abortControllerRef])

  const loadMoreBooks = useCallback(async () => {
    if (!hasMorePages || loadingMore) return
    
    setLoadingMore(true)
    setError(null)
    
    try {
      const { filter, friendFilter, shelfFilter } = currentFiltersRef.current
      await fetchBooks(filter, friendFilter, shelfFilter, currentServerPage + 1, ITEMS_PER_SERVER_PAGE)
      console.log(`[useBooksAPI] Successfully loaded more books. Total now: ${books.length + ITEMS_PER_SERVER_PAGE}`)
    } catch (err: any) {
      console.error('[useBooksAPI] Error loading more books:', err)
      setError('Failed to load more books. Please try again.')
      toast.error('Failed to load more books')
    } finally {
      setLoadingMore(false)
    }
  }, [hasMorePages, loadingMore, currentServerPage, fetchBooks, books.length])

  const loadInitialData = useCallback(async (
    filter: string, 
    friendFilter: string = 'all', 
    shelfFilter: string = 'all'
  ) => {
    // Reset state
    setBooks([])
    setCurrentServerPage(1)
    setHasMorePages(true)
    
    // Load first page
    await fetchBooks(filter, friendFilter, shelfFilter, 1, ITEMS_PER_SERVER_PAGE)
    
    // Load up to 4 more pages (total 5 pages initially) sequentially
    for (let page = 2; page <= 5; page++) {
      // Check hasMorePages state after each fetch
      if (!hasMorePages) break
      await fetchBooks(filter, friendFilter, shelfFilter, page, ITEMS_PER_SERVER_PAGE)
    }
  }, [fetchBooks, hasMorePages])

  return {
    books,
    isLoading,
    error,
    hasMorePages,
    loadingMore,
    currentServerPage,
    searchBooks,
    fetchBooks,
    loadMoreBooks,
    loadInitialData,
    setBooks,
  }
} 