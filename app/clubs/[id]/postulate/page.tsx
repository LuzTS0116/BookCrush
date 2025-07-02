// /app/clubs/[id]/postulate/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link";
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Check, Plus, Search, ThumbsUp, X, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {useParams} from "next/navigation";

export default function PostulateBooksPage({ params }: { params: { id: string } }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [reason, setReason] = useState("")
  const [activeTab, setActiveTab] = useState("search")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Real data state
  const [club, setClub] = useState<any>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingClub, setLoadingClub] = useState(true)
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)

  const {id} = useParams();

  // Fetch club data
  useEffect(() => {
    const fetchClub = async () => {
      try {
        const response = await fetch(`/api/clubs/${id}`)
        if (response.ok) {
          const clubData = await response.json()
          console.log('Club data:', clubData) // Debug log
          setClub(clubData)
        } else {
          toast.error("Failed to load club information")
        }
      } catch (error) {
        toast.error("Error loading club information")
      } finally {
        setLoadingClub(false)
      }
    }

    fetchClub()
  }, [id])

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

    const searchBooks = async () => {
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

    const timeoutId = setTimeout(searchBooks, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const toggleBookSelection = (id: string) => {
    if (selectedBooks.includes(id)) {
      setSelectedBooks(selectedBooks.filter((bookId) => bookId !== id))
    } else {
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

  const formatVotingEndDate = (votingEnds: string) => {
    const endDate = new Date(votingEnds)
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

  const calculateVoteProgress = (voteCount: number) => {
    // Use club memberCount if available, otherwise use max votes from suggestions as fallback
    let totalMembers = club?.memberCount || club?.members?.length || 1
    
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
    <div className="container mx-auto pt-8 pb-16">
      <div className="flex flex-col md:flex-row justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold leading-none mb-2">{club.name}: Next Book Selection</h1>
          <p className="text-bookWhite leading-none font-serif">Recommend books or vote on favorites — your voice helps shape our next club read.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
            <TabsList className="grid w-full grid-cols-2 bg-secondary-light text-primary rounded-full">
              <TabsTrigger value="search" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">Suggest a Book</TabsTrigger>
              <TabsTrigger value="postulated" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">Current Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-3">
              <Card className="p-0 bg-bookWhite">
                <CardHeader className="px-3 pt-3 pb-0 gap-1">
                  <CardTitle>Book Selection</CardTitle>
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
                    <CardTitle>Why This Book?</CardTitle>
                    <CardDescription className="text-sm leading-4 font-normal text-secondary/60">Tell the club why you're suggesting this book(s)</CardDescription>
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
                          placeholder="Share why you think the club would enjoy this book..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="min-h-[80px] bg-secondary/10 border-none text-secondary placeholder:text-secondary/50 text-sm leading-4 p-2"
                        />
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
                        "Submit Suggestion"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="postulated" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Suggestions</CardTitle>
                  <CardDescription>Vote for the book you'd like to read next</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSuggestions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading suggestions...</span>
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No book suggestions yet. Be the first to suggest a book!</p>
                      <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={() => setActiveTab("search")}
                      >
                        Suggest a Book
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {suggestions.map((suggestion: any) => (
                        <div key={suggestion.id} className="border rounded-lg overflow-hidden">
                          <div className="p-4">
                            <div className="flex gap-4">
                              <div className="w-16 h-24 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                                <img src={suggestion.book.cover_url || "/placeholder.svg"} alt={suggestion.book.title} className="max-h-full" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <div>
                                    <h3 className="font-medium">{suggestion.book.title}</h3>
                                    <p className="text-sm text-muted-foreground">{suggestion.book.author}</p>
                                  </div>
                                  <Button
                                    variant={suggestion.has_voted ? "default" : "outline"}
                                    size="sm"
                                    className={suggestion.has_voted ? "bg-primary text-primary-foreground" : ""}
                                    onClick={() => handleVote(suggestion.id, suggestion.has_voted)}
                                  >
                                    <ThumbsUp className="mr-2 h-4 w-4" />
                                    {suggestion.has_voted ? "Voted" : "Vote"} ({suggestion.vote_count})
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {suggestion.book.genres?.map((g: string) => (
                                    <Badge key={g} variant="secondary" className="bg-primary/10 text-primary">
                                      {g}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                                  <div className="flex items-center gap-1">
                                    <span className="text-muted-foreground">Year:</span>
                                    <span>{suggestion.book.published_date}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-muted-foreground">Pages:</span>
                                    <span>{suggestion.book.pages}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Separator className="my-4" />
                            <div className="flex items-start gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={suggestion.suggested_by.avatar_url || "/placeholder.svg"}
                                  alt={suggestion.suggested_by.display_name}
                                />
                                <AvatarFallback>{suggestion.suggested_by.display_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm">
                                  <span className="font-medium">{suggestion.suggested_by.display_name}</span> suggested this book:
                                </p>
                                <p className="text-sm mt-1 text-muted-foreground italic">"{suggestion.reason}"</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-muted/20 p-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Votes: {suggestion.vote_count}</span>
                              <div className="flex items-center gap-2 w-2/3">
                                <Progress 
                                  value={calculateVoteProgress(suggestion.vote_count).percentage} 
                                  className="flex-1 h-2" 
                                />
                                <span className="text-xs text-muted-foreground">
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
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    {suggestions.length > 0 && suggestions[0].voting_ends 
                      ? formatVotingEndDate(suggestions[0].voting_ends)
                      : "No active voting period"
                    }
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab("search")}>
                    Suggest Another Book
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card className="p-0">
            <CardHeader className="px-3 pt-3 pb-2 gap-2">
              <CardTitle>Current Book</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-3">
              <div className="flex flex-row gap-2 bg-secondary/5 p-2.5 rounded-md">
                <div className="w-[80px] flex-shrink-0">                      
                  <Link href={`/books/${club.current_book.id}`}>
                    <img
                      src={club.current_book.cover_url || "/placeholder.svg"}
                      alt={`${club.current_book.title} cover` || "Book cover"}
                      className="h-full w-full rounded-md shadow-md object-cover"
                    />
                  </Link>
                </div>
                <div className="flex-1">
                  <Link href={`/books/${club.current_book.id}`}>
                    <h3 className="text-base leading-none font-medium">{club.current_book.title}</h3>
                  </Link>
                  <p className="text-sm text-secondary-light/70">{club.current_book.author}</p>
                  {/* Genre Tags */}
                  {club.current_book.genres && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {club.current_book.genres?.slice(0, 1).map((genre: string) => (
                      <span
                        key={genre}
                        className="bg-accent/30 text-secondary/40 text-xs/3 font-medium px-2 py-1 rounded-full"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                  )}
                  {/* Pages & Time */}
                  {club.current_book.pages && (
                  <div className="flex-1">
                    <p className="text-secondary/80 font-sans font-normal text-xs inline-block">{club.current_book.pages} pages • {club.current_book.reading_time}</p>
                  </div>
                  )}
                  {club.meetings && club.meetings.length > 0 && (
                    <div className="inline-block">
                      <div className="flex items-center gap-1 bg-accent-variant/75 px-1.5 py-1 text-bookWhite text-xs/3 rounded-full font-serif font-medium">
                        <Calendar className="h-3 w-3 text-bookWhite" />
                        <span>Meeting: {new Date(club.meetings[0].meeting_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-3 p-0">
            <CardHeader className="px-3 pt-3 pb-2">
              <CardTitle>Suggestion Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-3">
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/20 p-0.5">
                    <Check className="h-3 w-3 text-primary-dark" />
                  </div>
                  <span>Aim for books around 250–500 pages.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                    <Check className="h-3 w-3 text-primary-dark" />
                  </div>
                  <span>Pick stories that could spark great conversation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                    <Check className="h-3 w-3 text-primary-dark" />
                  </div>
                  <span>Suggest books you haven’t read yet, so we can explore them together.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                    <Check className="h-3 w-3 text-primary-dark" />
                  </div>
                  <span>You can submit up to 2 books per cycle.</span>
                </li>
              </ul>
              <p>Let your next favorite read find you!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
