"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Heart, ThumbsUp, ThumbsDown, Send, BookOpen, Calendar, User, Clock, ChevronLeft, MessageSquare } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function BookDetailsView({ params }: { params: { id: string } }) {
  const [reviewText, setReviewText] = useState("")
  const [userRating, setUserRating] = useState<"heart" | "thumbsUp" | "thumbsDown" | null>(null)

  // Mock book data
  const book = {
    id: params.id,
    title: "The Midnight Library",
    author: "Matt Haig",
    cover: "/placeholder.svg?height=400&width=260",
    published: "2020",
    pages: 304,
    genre: ["Fiction", "Fantasy", "Contemporary"],
    isbn: "4.5",
    description: `Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be if you had made other choices... Would you have done anything different, if you had the chance to undo your regrets?
    
    A dazzling novel about all the choices that go into a life well lived, from the internationally bestselling author of Reasons to Stay Alive and How To Stop Time.
    
    Somewhere out beyond the edge of the universe there is a library that contains an infinite number of books, each one the story of another reality. One tells the story of your life as it is, along with another book for the other life you could have lived if you had made a different choice at any point in your life. While we all wonder how our lives might have been, what if you had the chance to go to the library and see for yourself? Would any of these other lives truly be better?`,
    ratings: {
      heart: 128,
      thumbsUp: 87,
      thumbsDown: 12,
    },
    userProgress: 65,
    reviews: [
      {
        id: 1,
        user: {
          name: "Alex Lee",
          avatar: "/placeholder.svg?height=40&width=40",
          initials: "AL",
        },
        rating: "heart",
        text: "This book completely changed my perspective on life choices and regrets. The concept of a library between life and death is so creative and thought-provoking. I couldn't put it down!",
        date: "April 15, 2025",
      },
      {
        id: 2,
        user: {
          name: "Sarah Johnson",
          avatar: "/placeholder.svg?height=40&width=40",
          initials: "SJ",
        },
        rating: "thumbsUp",
        text: "A beautiful exploration of the roads not taken. Matt Haig has a way of making complex philosophical concepts accessible and emotionally resonant. The ending was particularly satisfying.",
        date: "March 28, 2025",
      },
      {
        id: 3,
        user: {
          name: "Mike Peterson",
          avatar: "/placeholder.svg?height=40&width=40",
          initials: "MP",
        },
        rating: "thumbsDown",
        text: "I found the premise interesting but the execution lacking. The main character's journey felt predictable, and some of the alternate lives seemed too convenient for the message the author wanted to convey.",
        date: "February 12, 2025",
      },
    ],
    clubs: [
      {
        id: 1,
        name: "Fiction Lovers",
        members: 12,
        meetingDate: "May 9, 2025",
      },
      {
        id: 2,
        name: "Philosophy & Life",
        members: 8,
        meetingDate: "May 15, 2025",
      },
    ],
  }

  const handleRating = (rating: "heart" | "thumbsUp" | "thumbsDown") => {
    setUserRating(userRating === rating ? null : rating)
  }

  const handleSubmitReview = () => {
    if (reviewText.trim() && userRating) {
      // In a real app, you would submit the review to an API
      console.log({ reviewText, userRating })
      setReviewText("")
      // Don't reset the rating so the user can see what they rated
    }
  }

  const getRatingIcon = (rating: string, size = 5) => {
    switch (rating) {
      case "heart":
        return <Heart className={`h-${size} w-${size} text-primary fill-primary`} />
      case "thumbsUp":
        return <ThumbsUp className={`h-${size} w-${size} text-accent-variant`} />
      case "thumbsDown":
        return <ThumbsDown className={`h-${size} w-${size} text-accent`} />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto pt-4 pb-8 px-6">
      <div className="mb-3">
        <button
        className="target mt-15 flex items-center text-sm text-bookWhite hover:text-foreground transition-colors"
        >
        <ChevronLeft className="w-4 h-4 mr-1 text-bookWhite" />
            Back
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
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

                  <div className="flex justify-center">
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
          </Card>

          <div className="mt-8">
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

              <TabsContent value="reviews" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center">Reviews</CardTitle>
                    <CardDescription className="font-serif font-mediun text-center">See what others think about this book</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {book.reviews.map((review) => (
                        <div key={review.id} className="p-4 border rounded-lg">
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
                          <p className="text-sm">{review.text}</p>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Write a Review</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-2">
                          <p className="text-sm">Your Rating:</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRating("heart")}
                              className={`p-2 rounded-full ${userRating === "heart" ? "bg-primary/30" : "hover:bg-muted"}`}
                            >
                              <Heart
                                className={`h-5 w-5 ${userRating === "heart" ? "text-primary-dark fill-primary-dark" : "text-muted-foreground"}`}
                              />
                            </button>
                            <button
                              onClick={() => handleRating("thumbsUp")}
                              className={`p-2 rounded-full ${userRating === "thumbsUp" ? "bg-accent-variant/30" : "hover:bg-muted"}`}
                            >
                              <ThumbsUp
                                className={`h-5 w-5 ${userRating === "thumbsUp" ? "text-accent-variant" : "text-muted-foreground"}`}
                              />
                            </button>
                            <button
                              onClick={() => handleRating("thumbsDown")}
                              className={`p-2 rounded-full ${userRating === "thumbsDown" ? "bg-accent/25" : "hover:bg-muted"}`}
                            >
                              <ThumbsDown
                                className={`h-5 w-5 ${userRating === "thumbsDown" ? "text-accent" : "text-muted-foreground"}`}
                              />
                            </button>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Share your thoughts on this book..."
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          className="min-h-[120px] bg-secondary text-bookWhite border-none"
                        />
                        <div className="flex justify-end">
                        <Button
                          onClick={handleSubmitReview}
                          disabled={!reviewText.trim() || !userRating}
                          className="bg-primary/75 hover:bg-primary rounded-full text-secondary"
                        >
                          <MessageSquare className="mr-0 h-4 w-4" /> Post Review
                        </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="book-clubs" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center">Book Clubs Reading This</CardTitle>
                    <CardDescription className="font-serif font-mediun text-center">Join a club to discuss this book</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {book.clubs.map((club) => (
                        <div key={club.id} className="p-4 border rounded-lg flex flex-col">
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
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="friends" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center">Friends Reading This</CardTitle>
                    <CardDescription className="font-serif font-mediun text-center">Join a club to discuss this book</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {book.reviews.map((review) => (
                        <div key={review.id} className="p-4 border rounded-lg flex justify-between items-center">
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
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </div>

        <div>
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
          </Card>

          <Card className="mt-6 mb-12">
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
          </Card>
        </div>
      </div>
    </div>
  )
}
