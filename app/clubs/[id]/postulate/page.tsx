// /app/clubs/[id]/postulate/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link";
import Image from "next/image";
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Check, Plus, Search, ThumbsUp, X, Loader2, BookOpen, ArrowLeft, MessageSquare } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {useParams} from "next/navigation";
import { AddBookDialog } from "@/components/add-book-dialog"
import { BookDetails } from "@/types/book"
import { useRouter } from "next/navigation"

interface CurrentBookDetails {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  genres?: string[];
  description: string;
  reading_time: string | null;
  pages: number | null;
}

interface ClubMembership {
  id: string; // Membership ID
  user_id: string;
  club_id: string;
  role: 'MEMBER' | 'ADMIN' | 'OWNER';
  status: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LEFT' | 'BANNED';
  joined_at: string; // ISO Date string  
  user: { // Added this nested user object based on your API structure
    display_name: string;
    avatar_url?: string | null; // Optional: if your API provides user avatar
    // Add other user fields like id, initials if they are part of this nested object
  };
}

interface ClubData {
  id: string; // Club ID (UUID)
  name: string;
  description: string;
  memberCount: number; // Using memberCount from your schema suggestion
  ownerId: string; // The ID of the club owner
  // Current user's specific relationship to *this* club (these come from backend)
  currentUserMembershipStatus: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LEFT' | null;
  currentUserIsAdmin: boolean; // True if current user is owner_id or an ADMIN role for this club
  memberships: ClubMembership[];
  current_book: CurrentBookDetails | null;
  meetings: Array<{
    id: string;
    meeting_date: string;
    location: string;
    title?: string;
  }>; // Add meetings property
  
  // Voting cycle management
  voting_cycle_active: boolean;
  voting_starts_at: string | null;
  voting_ends_at: string | null;
  voting_started_by: string | null;
}

export default function PostulateBooksPage({ params }: { params: { id: string } }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [reason, setReason] = useState("")
  const [activeTab, setActiveTab] = useState("search")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Real data state
  const [club, setClub] = useState<ClubData | null>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingClub, setLoadingClub] = useState(true)
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)

  // Add Book Dialog state
  const [addBookDialogOpen, setAddBookDialogOpen] = useState(false)
  const [allBooks, setAllBooks] = useState<BookDetails[]>([]) // For AddBookDialog

  const router = useRouter();
  const {id} = useParams();

  // Function to fetch full club details from the API
    const fetchClub = useCallback(async () => {
      setLoadingClub(true);
      try {
        const response = await fetch(`/api/clubs/${id}`); // Call your new API endpoint
        if (!response.ok) {
          throw new Error(`Failed to fetch club data: ${response.statusText}`);
        }
        const data: ClubData = await response.json(); // Cast to ClubData interface
        setClub(data);
        
      } catch (err: any) {
        toast.error(`Error fetching club details: ${err.message}`);
        console.error("Error fetching club details:", err);
        setClub(null); // Set to null on error
      } finally {
        setLoadingClub(false);
      }
    }, [id]);
    
    // Initial data load on component mount
    useEffect(() => {
      fetchClub();
    }, [fetchClub]); // Depend on memoized fetch function
  // useEffect(() => {
  //   const fetchClub = async () => {
  //     try {
  //       const response = await fetch(`/api/clubs/${id}`)
  //       if (response.ok) {
  //         const clubData = await response.json()
  //         console.log('Club data:', clubData) // Debug log
  //         setClub(clubData)
  //       } else {
  //         toast.error("Failed to load club information")
  //       }
  //     } catch (error) {
  //       toast.error("Error loading club information")
  //     } finally {
  //       setLoadingClub(false)
  //     }
  //   }

  //   fetchClub()
  // }, [id])

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`/api/clubs/${id}/suggestions`)
        if (response.ok) {
          const suggestionsData = await response.json()
          console.log('Suggestions data:', suggestionsData) // Debug log
          setSuggestions(suggestionsData)
        } else {
          toast.error("Failed to load suggestions")
        }
      } catch (error) {
        toast.error("Error loading suggestions")
      } finally {
        setLoadingSuggestions(false)
      }
    }

    fetchSuggestions()
  }, [id])

  // Search books with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timeoutId = setTimeout(searchBooks, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const toggleBookSelection = (id: string) => {
    if (selectedBooks.includes(id)) {
      setSelectedBooks(selectedBooks.filter((bookId) => bookId !== id))
    } else {
      // Check if user is trying to add more than 2 books
      if (selectedBooks.length >= 2) {
        toast.error("You can only suggest up to 2 books per cycle.")
        return
      }
      setSelectedBooks([...selectedBooks, id])
    }
  }

  const handlePostulate = async () => {
    if (selectedBooks.length === 0 || !reason.trim()) return
    
    setSubmitting(true)
    try {
      // Submit each selected book as a suggestion
      for (const bookId of selectedBooks) {
        const response = await fetch(`/api/clubs/${id}/suggestions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ book_id: bookId, reason: reason.trim() })
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to submit suggestion')
        }
      }
      
      toast.success('Book suggestion(s) submitted successfully!')
      setSelectedBooks([])
      setReason("")
      setActiveTab("postulated")
      
      // Refresh suggestions
      const response = await fetch(`/api/clubs/${id}/suggestions`)
      if (response.ok) {
        const suggestionsData = await response.json()
        setSuggestions(suggestionsData)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit suggestion')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (suggestionId: string, hasVoted: boolean) => {
    try {
      const method = hasVoted ? 'DELETE' : 'POST'
      const response = await fetch(`/api/clubs/${id}/suggestions/${suggestionId}/vote`, {
        method,
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record vote')
      }
      
      const result = await response.json()
      toast.success(hasVoted ? 'Vote removed' : 'Vote recorded')
      
      // Update the suggestion in local state
      setSuggestions(prev => prev.map(suggestion => 
        suggestion.id === suggestionId 
          ? { ...suggestion, has_voted: !hasVoted, vote_count: result.vote_count }
          : suggestion
      ))
    } catch (error: any) {
      toast.error(error.message || 'Failed to record vote')
    }
  }

  // Add Book Dialog callback functions
  const handleBookAdded = (newBook: BookDetails) => {
    // Add the new book to our local state
    setAllBooks(prev => [...prev, newBook])
    // Optionally refresh search to include the newly added book
    if (searchQuery.trim()) {
      // Re-run the search to potentially include the newly added book
      searchBooks()
    }
    toast.success('Book added successfully! You can now suggest it to the club.')
  }

  // Check if voting is currently active
  const isVotingActive = club?.voting_cycle_active && 
    club.voting_ends_at && 
    new Date(club.voting_ends_at) > new Date()

  const calculateVoteProgress = (voteCount: number) => {
    // Use club memberCount if available, otherwise use max votes from suggestions as fallback
    let totalMembers = club?.memberCount || club?.memberships?.length || 1
    
    // If we have suggestions, use the highest vote count + 2 as a reasonable estimate
    if (suggestions.length > 0 && totalMembers === 1) {
      const maxVotes = Math.max(...suggestions.map(s => s.vote_count))
      totalMembers = Math.max(maxVotes + 2, 3) // At least 3 members for reasonable progress
    }

    const percentage = Math.min((voteCount / totalMembers) * 100, 100)
    console.log(`Vote calculation: ${voteCount}/${totalMembers} = ${percentage}%`) // Debug log
    
    return {
      percentage: Math.round(percentage),
      totalMembers
    }
  }

  const formatVotingEndDate = (club: ClubData) => {
    if (!club.voting_cycle_active || !club.voting_ends_at) {
      return "No active voting cycle"
    }

    const endDate = new Date(club.voting_ends_at)
    const now = new Date()
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft > 1) {
      return `Voting ends in ${daysLeft} days`
    } else if (daysLeft === 1) {
      return "Voting ends tomorrow"
    } else if (daysLeft === 0) {
      return "Voting ends today"
    } else {
      return "Voting has ended"
    }
  }

  const searchBooks = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}&limit=10`)
      if (response.ok) {
        const results = await response.json()
        setSearchResults(results || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      toast.error("Error searching books")
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  if (loadingClub) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading club information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Club Not Found</h1>
          <p className="text-muted-foreground">The club you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative w-full h-auto overflow-hidden">
      <Image 
        src="/images/background.png"
        alt="Create and Manage your Book Clubs | BookCrush"
        width={1622}
        height={2871}
        className="absolute inset-0 w-auto h-full md:w-full md:h-auto object-cover z-[-1]"
      />
      <div className="container mx-auto px-4 pt-3 pb-20">
        <button
            onClick={() => router.back()} // Revert to browser history navigation
            className="mb-3 p-2 rounded-full bg-bookWhite/80 backdrop-blur-sm hover:bg-bookWhite shadow-md"
        >
            <ArrowLeft className="h-5 w-5 text-secondary" />
        </button>
        <div className="flex flex-col md:flex-row justify-between mb-3">
          <div>
            <h1 className="text-2xl font-semibold leading-none mb-1">{club.name}:<span className="font-normal">{" "}Next Book Selection</span></h1>
            <p className="text-bookWhite leading-none font-serif">Recommend books or vote on favorites — your voice helps shape our next club read.</p>
          </div>
        </div>

        <Card className="my-3 p-0 bg-bookWhite/10">
          <CardContent className="px-3 py-3">
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-primary/40 p-0.5">
                  <Check className="h-2 w-2 text-bookWhite" />
                </div>
                <span className="text-bookWhite/85 text-sm leading-none font-thin">Aim for books around 250–500 pages.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-primary/40 p-0.5">
                  <Check className="h-2 w-2 text-bookWhite" />
                </div>
                <span className="text-bookWhite/85 text-sm leading-none font-thin">Pick stories that could spark great conversation.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-primary/40 p-0.5">
                  <Check className="h-2 w-2 text-bookWhite" />
                </div>
                <span className="text-bookWhite/85 text-sm leading-none font-thin">Suggest books you haven't read yet, so we can explore them together.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-primary/40 p-0.5">
                  <Check className="h-2 w-2 text-bookWhite" />
                </div>
                <span className="text-bookWhite/85 text-sm leading-none font-thin">You can submit up to 2 books per cycle.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
              <TabsList className="grid w-full grid-cols-2 bg-secondary-light text-primary rounded-full">
                <TabsTrigger value="search" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">Suggest a Book</TabsTrigger>
                <TabsTrigger value="postulated" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">Current Suggestions</TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-3">
                {/* Voting Status Alert */}
                {!isVotingActive && (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          Voting is not currently active. You can still suggest books, but voting will only be possible when a voting cycle is started.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="p-0 bg-bookWhite">
                  <CardHeader className="px-3 pt-3 pb-0 gap-1">
                    <CardTitle className="flex justify-between items-center">
                      <span>Book Selection</span>
                      <span className="text-sm font-normal text-secondary/60">
                        {selectedBooks.length}/2 selected
                      </span>
                    </CardTitle>
                    <CardDescription className="text-sm leading-4 font-normal text-secondary/60">Share a book you think deserves the spotlight. Your suggestion could be our next club pick!</CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 pt-2 pb-3">
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-2 h-4 w-4 text-secondary" />
                      <Input
                        placeholder="Search by title or author"
                        className="pl-10 bg-secondary/10 text-secondary placeholder:text-secondary/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {loading && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Searching...</span>
                      </div>
                    )}

                    {/* Show Add Book option when no results found */}
                    {!loading && searchQuery.trim() && searchResults.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-secondary/60 mb-4">No books found matching "{searchQuery}"</p>
                        <p className="text-sm text-secondary/50 mb-4">
                          Add the book to our collection and suggest it to the club!
                        </p>
                        <div className="flex justify-center">
                          <AddBookDialog
                            open={addBookDialogOpen}
                            onOpenChange={setAddBookDialogOpen}
                            books={allBooks}
                            setBooks={setAllBooks}
                            onBookAdded={handleBookAdded}
                            initialSearchQuery={searchQuery}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {searchResults.map((book) => (
                        <div
                          key={book.id}
                          className={`p-2 rounded-lg flex gap-2 ${
                            selectedBooks.includes(book.id) ? "border-primary bg-secondary/5" : "bg-secondary/10"
                          }`}
                        >
                          <div className="w-16 h-auto bg-secondary/10 rounded flex items-center justify-center overflow-hidden">
                            <img src={book.cover_url || "/placeholder.svg"} alt={book.title} className="max-h-full" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-row justify-between">
                              <div>
                                <h3 className="font-medium leading-none">{book.title}</h3>
                                <p className="text-xs font-serif leading-none text-secondary/70">{book.author}</p>
                              </div>
                              <Button
                                variant={selectedBooks.includes(book.id) ? "default" : "outline"}
                                size="icon"
                                className={selectedBooks.includes(book.id) ? "bg-primary text-primary-foreground border-none h-6 w-6 px-2" : "bg-accent text-secondary border-none h-6 w-6 px-2"}
                                onClick={() => toggleBookSelection(book.id)}
                                disabled={!selectedBooks.includes(book.id) && selectedBooks.length >= 2}
                                title={!selectedBooks.includes(book.id) && selectedBooks.length >= 2 ? "Maximum 2 books allowed" : ""}
                              >
                                {selectedBooks.includes(book.id) ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            {/* Genre Tags */}
                            <div className="flex flex-wrap mt-1">
                              {book.genres?.slice(0, 1).map((genre: string) => (
                                <span
                                  key={genre}
                                  className="bg-accent/30 text-secondary/40 text-xs/3 font-medium px-2 py-1 rounded-full"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                            {/* Pages & Time */}
                            <div className="flex-1">
                              <p className="text-secondary/80 font-sans font-normal text-sm inline-block">{book.pages} pages • {book.reading_time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {selectedBooks.length > 0 && (
                  <Card className="p-0 bg-bookWhite">
                    <CardHeader className="px-3 pt-3 pb-0 gap-2">
                      <CardTitle className="flex justify-between items-center">
                        <span>Why This Book?</span>
                        <span className={`text-sm font-normal px-2 py-1 rounded-full ${
                          selectedBooks.length === 2 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {selectedBooks.length}/2 books
                        </span>
                      </CardTitle>
                      <CardDescription className="text-sm leading-4 font-normal text-secondary/60">Tell the club why you're suggesting {selectedBooks.length === 1 ? 'this book' : 'these books'}</CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 pt-2 pb-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {selectedBooks.map((id) => {
                            const book = searchResults.find((b) => b.id === id)
                            if (!book) return null
                            return (
                              <div key={id} className="flex items-center gap-2 py-1 pr-1 pl-2 bg-accent-variant/30 text-secondary-light rounded-xl">
                                <span className="text-sm font-medium">{book.title}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => toggleBookSelection(id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                        <div className="space-y-2">
                          <Textarea
                            id="reason"
                            placeholder={`Share why you think the club would enjoy ${selectedBooks.length === 1 ? 'this book' : 'these books'}...`}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[80px] bg-secondary/10 border-none text-secondary placeholder:text-secondary/50 text-sm leading-4 p-2"
                          />
                          {selectedBooks.length === 2 && (
                            <p className="text-xs text-green-600 bg-green-50 p-2 rounded-md">
                              ✅ Perfect! You've reached the maximum of 2 book suggestions per cycle.
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="px-3 pt-0 pb-3 flex justify-end">
                      <Button
                        onClick={handlePostulate}
                        disabled={selectedBooks.length === 0 || !reason.trim() || submitting}
                        className="rounded-full bg-primary hover:bg-primary-light"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          `Submit ${selectedBooks.length === 1 ? 'Suggestion' : 'Suggestions'} (${selectedBooks.length})`
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="postulated" className="space-y-6">
                <Card className="p-0">
                  <CardHeader className="px-3 pt-3 pb-2 gap-1">
                    <CardTitle>Current Suggestions</CardTitle>
                    <CardDescription className="text-sm leading-4 font-normal text-secondary/60">Vote for the book you'd like to read next</CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 pt-0 pb-3">
                    {loadingSuggestions ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading suggestions...</span>
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-2">No book suggestions yet.</p>
                        <p className="text-sm text-secondary/60 mb-4">
                          Be the first to suggest a book for the club!
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-4 text-secondary bg-primary/80 hover:bg-primary border-none rounded-full" 
                          onClick={() => setActiveTab("search")}
                        >
                          Suggest a Book
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {suggestions.map((suggestion: any) => (
                          <div key={suggestion.id} className="rounded-lg overflow-hidden bg-secondary/10">
                            <div className="">
                              <div className="flex gap-2 p-2">
                                <div className="w-16 h-auto rounded flex justify-center overflow-hidden">
                                  <img src={suggestion.book.cover_url || "/placeholder.svg"} alt={suggestion.book.title} className="max-h-full" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-row justify-between">
                                    <div>
                                      <h3 className="font-medium leading-none">{suggestion.book.title}</h3>
                                      <p className="text-xs font-serif leading-none text-secondary/70">{suggestion.book.author}</p>
                                    </div>
                                    <div className="">
                                      <Button
                                        variant={suggestion.has_voted ? "default" : "outline"}
                                        size="sm"
                                        className={suggestion.has_voted ? "bg-primary text-primary-foreground rounded-full h-6" : "text-bookWhite bg-secondary-light rounded-full h-6"}
                                        onClick={() => handleVote(suggestion.id, suggestion.has_voted)}
                                        disabled={!club?.voting_cycle_active}
                                        title={!club?.voting_cycle_active ? "Voting is not currently active" : ""}
                                      >
                                        <ThumbsUp className="h-2 w-2" />
                                        {suggestion.has_voted ? "Voted" : "Vote"}
                                      </Button>
                                    </div>
                                  </div>
                                  {/* Genre Tags */}
                                  <div className="flex flex-wrap mt-1">
                                    {suggestion.book.genres?.slice(0, 1).map((genre: string) => (
                                      <span
                                        key={genre}
                                        className="bg-accent/30 text-secondary/40 text-xs/3 font-medium px-2 py-1 rounded-full"
                                      >
                                        {genre}
                                      </span>
                                    ))}
                                  </div>
                                  {/* Pages & Time */}
                                  <div className="flex-1">
                                    <p className="text-secondary/80 font-sans font-normal text-sm inline-block">{suggestion.book.pages} pages • {suggestion.book.reading_time}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-start gap-1 mt-1 px-2 pt-1 pb-1 border-t border-secondary/30">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage
                                    src={suggestion.suggested_by.avatar_url || "/placeholder.svg"}
                                    alt={suggestion.suggested_by.display_name}
                                  />
                                  <AvatarFallback>{suggestion.suggested_by.display_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm">
                                    <span className="font-medium">{suggestion.suggested_by.display_name}</span> suggested this book
                                  </p>
                                  <p className="text-xs text-secondary/70 leading-none">"{suggestion.reason}"</p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-secondary/15 p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Votes: {suggestion.vote_count}</span>
                                <div className="flex items-center gap-2 w-2/3">
                                  <Progress 
                                    value={calculateVoteProgress(suggestion.vote_count).percentage} 
                                    className="flex-1 h-2" 
                                  />
                                  <span className="text-xs text-secondary/50">
                                    {calculateVoteProgress(suggestion.vote_count).percentage}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col items-end px-3 pt-0 pb-3 gap-0.5">
                    <p className="text-sm text-secondary/60">
                      {club ? formatVotingEndDate(club) : "No active voting period"}
                    </p>
                    <Button variant="outline" onClick={() => setActiveTab("search")} className="rounded-full bg-accent text-secondary border-none h-8">
                      Suggest Another Book
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Voting management is now handled in the club details page */}
      </div>
    </div>
  )
}
