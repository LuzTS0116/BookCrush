"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Check, Plus, Search, ThumbsUp, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

export default function PostulateBooksPage({ params }: { params: { id: string } }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBooks, setSelectedBooks] = useState<number[]>([])
  const [reason, setReason] = useState("")
  const [activeTab, setActiveTab] = useState("search")

  // Mock club data
  const club = {
    id: params.id,
    name: "Fiction Lovers",
    description: "A group dedicated to contemporary fiction and literary novels.",
    members: 12,
    currentBook: {
      title: "The Midnight Library",
      author: "Matt Haig",
      cover: "/placeholder.svg?height=200&width=150",
      meetingDate: "May 9, 2025",
    },
  }

  // Mock search results
  const searchResults = [
    {
      id: 1,
      title: "Cloud Cuckoo Land",
      author: "Anthony Doerr",
      cover: "/placeholder.svg?height=200&width=150",
      genre: ["Historical Fiction", "Literary Fiction"],
      year: "2021",
      pages: 640,
    },
    {
      id: 2,
      title: "The Lincoln Highway",
      author: "Amor Towles",
      cover: "/placeholder.svg?height=200&width=150",
      genre: ["Historical Fiction", "Adventure"],
      year: "2021",
      pages: 592,
    },
    {
      id: 3,
      title: "Sea of Tranquility",
      author: "Emily St. John Mandel",
      cover: "/placeholder.svg?height=200&width=150",
      genre: ["Science Fiction", "Literary Fiction"],
      year: "2022",
      pages: 272,
    },
  ]

  // Mock postulated books
  const postulatedBooks = [
    {
      id: 4,
      title: "Tomorrow, and Tomorrow, and Tomorrow",
      author: "Gabrielle Zevin",
      cover: "/placeholder.svg?height=200&width=150",
      genre: ["Literary Fiction", "Contemporary"],
      year: "2022",
      pages: 416,
      postulatedBy: {
        name: "Sarah Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "SJ",
      },
      reason:
        "This novel about friendship, love, and video game design has been on my TBR list for months. I think it would spark great discussions about creativity and relationships.",
      votes: 5,
      hasVoted: true,
    },
    {
      id: 5,
      title: "Lessons in Chemistry",
      author: "Bonnie Garmus",
      cover: "/placeholder.svg?height=200&width=150",
      genre: ["Historical Fiction", "Humor"],
      year: "2022",
      pages: 390,
      postulatedBy: {
        name: "Alex Lee",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "AL",
      },
      reason:
        "A brilliant female scientist in the 1960s becomes a cooking show host. It's funny, poignant, and tackles gender discrimination in a unique way.",
      votes: 3,
      hasVoted: false,
    },
    {
      id: 6,
      title: "The Seven Husbands of Evelyn Hugo",
      author: "Taylor Jenkins Reid",
      cover: "/placeholder.svg?height=200&width=150",
      genre: ["Historical Fiction", "LGBTQ+"],
      year: "2017",
      pages: 389,
      postulatedBy: {
        name: "Mike Peterson",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "MP",
      },
      reason:
        "This book about a fictional Hollywood star has been recommended to me multiple times. It explores fame, sexuality, and the price of success.",
      votes: 2,
      hasVoted: false,
    },
  ]

  const toggleBookSelection = (id: number) => {
    if (selectedBooks.includes(id)) {
      setSelectedBooks(selectedBooks.filter((bookId) => bookId !== id))
    } else {
      setSelectedBooks([...selectedBooks, id])
    }
  }

  const handlePostulate = () => {
    // In a real app, you would submit the postulation to an API
    console.log({ selectedBooks, reason })
    setSelectedBooks([])
    setReason("")
    setActiveTab("postulated")
  }

  const handleVote = (id: number) => {
    // In a real app, you would submit the vote to an API
    console.log({ votedFor: id })
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{club.name}: Next Book Selection</h1>
          <p className="text-muted-foreground">Suggest books for the next meeting or vote on existing suggestions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Suggest a Book</TabsTrigger>
              <TabsTrigger value="postulated">Current Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Search for Books</CardTitle>
                  <CardDescription>Find books to suggest for the next meeting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by title, author, or ISBN..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    {searchResults.map((book) => (
                      <div
                        key={book.id}
                        className={`p-4 border rounded-lg flex gap-4 ${
                          selectedBooks.includes(book.id) ? "border-primary bg-primary/5" : ""
                        }`}
                      >
                        <div className="w-16 h-24 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                          <img src={book.cover || "/placeholder.svg"} alt={book.title} className="max-h-full" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium">{book.title}</h3>
                              <p className="text-sm text-muted-foreground">{book.author}</p>
                            </div>
                            <Button
                              variant={selectedBooks.includes(book.id) ? "default" : "outline"}
                              size="icon"
                              className={selectedBooks.includes(book.id) ? "bg-primary text-primary-foreground" : ""}
                              onClick={() => toggleBookSelection(book.id)}
                            >
                              {selectedBooks.includes(book.id) ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {book.genre.map((g) => (
                              <Badge key={g} variant="secondary" className="bg-primary/10 text-primary">
                                {g}
                              </Badge>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Year:</span>
                              <span>{book.year}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Pages:</span>
                              <span>{book.pages}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedBooks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Why This Book?</CardTitle>
                    <CardDescription>Tell the group why you're suggesting this book</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedBooks.map((id) => {
                          const book = searchResults.find((b) => b.id === id)
                          if (!book) return null
                          return (
                            <div key={id} className="flex items-center gap-2 p-2 border rounded-md">
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
                        <Label htmlFor="reason">Why are you suggesting this book?</Label>
                        <Textarea
                          id="reason"
                          placeholder="Share why you think the club would enjoy this book..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={handlePostulate}
                      disabled={selectedBooks.length === 0 || !reason.trim()}
                      className="w-full bg-primary hover:bg-primary-light"
                    >
                      Submit Suggestion
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
                  <div className="space-y-6">
                    {postulatedBooks.map((book) => (
                      <div key={book.id} className="border rounded-lg overflow-hidden">
                        <div className="p-4">
                          <div className="flex gap-4">
                            <div className="w-16 h-24 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                              <img src={book.cover || "/placeholder.svg"} alt={book.title} className="max-h-full" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <div>
                                  <h3 className="font-medium">{book.title}</h3>
                                  <p className="text-sm text-muted-foreground">{book.author}</p>
                                </div>
                                <Button
                                  variant={book.hasVoted ? "default" : "outline"}
                                  size="sm"
                                  className={book.hasVoted ? "bg-primary text-primary-foreground" : ""}
                                  onClick={() => handleVote(book.id)}
                                  disabled={book.hasVoted}
                                >
                                  <ThumbsUp className="mr-2 h-4 w-4" />
                                  {book.hasVoted ? "Voted" : "Vote"} ({book.votes})
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {book.genre.map((g) => (
                                  <Badge key={g} variant="secondary" className="bg-primary/10 text-primary">
                                    {g}
                                  </Badge>
                                ))}
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Year:</span>
                                  <span>{book.year}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Pages:</span>
                                  <span>{book.pages}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Separator className="my-4" />
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={book.postulatedBy.avatar || "/placeholder.svg"}
                                alt={book.postulatedBy.name}
                              />
                              <AvatarFallback>{book.postulatedBy.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm">
                                <span className="font-medium">{book.postulatedBy.name}</span> suggested this book:
                              </p>
                              <p className="text-sm mt-1">{book.reason}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-muted/20 p-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Votes: {book.votes}</span>
                            <Progress value={(book.votes / 12) * 100} className="w-2/3 h-2 bg-muted" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-muted-foreground">Voting ends in 5 days</p>
                  <Button variant="outline" onClick={() => setActiveTab("search")}>
                    Suggest Another Book
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Current Book</CardTitle>
              <CardDescription>What we're currently reading</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="w-32 h-48 bg-muted/30 rounded-md flex items-center justify-center overflow-hidden mb-4">
                  <img
                    src={club.currentBook.cover || "/placeholder.svg"}
                    alt={club.currentBook.title}
                    className="max-h-full"
                  />
                </div>
                <h3 className="text-lg font-bold text-center">{club.currentBook.title}</h3>
                <p className="text-sm text-muted-foreground text-center">{club.currentBook.author}</p>
                <div className="flex items-center gap-2 mt-4 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Meeting: {club.currentBook.meetingDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Suggestion Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Books should be available in paperback or e-book format</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Ideally between 250-500 pages for monthly reading</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Consider books that will generate good discussion</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Try to suggest books you haven't read yet</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Each member can suggest up to 2 books per cycle</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
