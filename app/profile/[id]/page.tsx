"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookMarked, ArrowLeft, Mail, Send, Pencil, Save, X, Users, CircleCheckBig, CircleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Books, Bookmark, CheckCircle } from "@phosphor-icons/react"

export default function ProfileMain() {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("Jane Doe")
  const [bio, setBio] = useState(
    "Book lover, coffee enthusiast, and aspiring writer. I enjoy fiction, fantasy, and historical novels.",
  )
  const [kindleEmail, setKindleEmail] = useState("jane_kindle@kindle.com")
  const [selectedGenre, setSelectedGenre] = useState("")
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(["Fiction", "Fantasy", "Historical Fiction"])

  const genres = [
  "Biography",
  "Children's",
  "Classics",
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
];

  const addGenre = () => {
    if (selectedGenre && !favoriteGenres.includes(selectedGenre)) {
      setFavoriteGenres([...favoriteGenres, selectedGenre])
      setSelectedGenre("")
    }
  }

  const removeGenre = (genre: string) => {
    setFavoriteGenres(favoriteGenres.filter((g) => g !== genre))
  }

  return (
    <div className="container mx-auto px-2 py-2">
      <div className="flex flex-col bg-transparent md:flex-row gap-2">
        <div className="md:w-1/3 bg-transparent">
          <Card className="px-0 bg-bookWhite/90 rounded-3xl overflow-hidden">
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

                {/* Avatar + user info (1/4 above the banner) */}
                <div className="flex flex-row px-4 pt-2 pb-4 -mt-15 items-end">
                    <div className="absolute left-4 bottom-0 flex gap-2 items-end translate-y-1/2">
                        <Avatar className="h-24 w-24 border-4 border-bookWhite rounded-full bg-bookWhite">
                            <AvatarImage src="/placeholder.svg?height=96&width=96" alt="@user" />
                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">JD</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col justify-end pb-2">
                            <h2 className="text-lg/4 font-semibold text-secondary-light">{name}</h2>
                            <p className="text-xs text-secondary/50 font-normal">
                                25 friends
                            </p>
                            <div className="flex flex-row gap-2 text-center mt-1">
                                <div className="text-secondary font-serif">
                                    <p className="text-sm/3 font-semibold"><span className="text-sm pr-2">|</span>24<span className="text-xs"> Read</span></p>
                                </div>
                                <div className="text-secondary-light font-serif">
                                    <p className="text-sm/3 font-semibold"><span className="text-sm pr-2">|</span>3<span className="text-xs"> Currently</span></p>
                                </div>
                                <div className="text-secondary-light font-serif">
                                    <p className="text-sm/3 font-semibold"><span className="text-sm pr-2">|</span>12<span className="text-xs"> TBR</span><span className="text-sm pl-2">|</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-14">
              <div className="space-y-3">
                <div>
                  <p className="text-sm/4 font-serif font-normal text-secondary/50">{bio}</p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {favoriteGenres.map((genre) => (
                      <Badge key={genre} variant="secondary" className="px-3 py-1 bg-primary/10 text-primary">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* <div>
                  <h3 className="text-sm font-medium mb-2">My Top 5 Books</h3>
                    <div className="flex gap-2">
                      <div className="bg-secondary-light/10 p-4 w-full rounded-md flex gap-4 items-start">
                        <img
                          src="/placeholder.svg?height=120&width=80"
                          alt="{bookname}"
                          className="h-24 w-16 shadow-md shrink-0"
                        />
                        
                        <div className="flex flex-col justify-between">
                          <div>
                            <p className="font-semibold text-sm/4">Title Goes Here</p>
                            <p className="text-secondary/50 font-serif font-normal text-xs/4">
                              by Author Test
                            </p>
                            <p className="inline-block text-secondary font-light text-xs">
                              561 pages • 7h 42min
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs text-secondary bg-secondary/10 px-2 rounded-full italic">
                              Romantasy
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                </div> */}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:w-2/3">
          <Tabs defaultValue="currently-reading" className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-full p-0 text-bookWhite">
              <TabsTrigger value="currently-reading" className="rounded-full data-[state=active]:text-primary">
                <Books size={32} />
              </TabsTrigger>
              <TabsTrigger value="reading-queue" className="rounded-full data-[state=active]:text-primary">
                <Bookmark size={32} />
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-full data-[state=active]:text-primary">
                <CheckCircle size={32} />
              </TabsTrigger>
              <TabsTrigger value="favorites" className="rounded-full data-[state=active]:text-primary">
                <Heart size={32} />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="currently-reading">
              <Card>
                <CardHeader>
                  <CardTitle>My Top 5 Books</CardTitle>
                  <CardDescription>Your all-time favorite books</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                          <BookMarked className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">
                            {
                              [
                                "Pride and Prejudice",
                                "To Kill a Mockingbird",
                                "The Great Gatsby",
                                "1984",
                                "The Hobbit",
                              ][i - 1]
                            }
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {
                              ["Jane Austen", "Harper Lee", "F. Scott Fitzgerald", "George Orwell", "J.R.R. Tolkien"][
                                i - 1
                              ]
                            }
                          </p>
                        </div>
                        {isEditing && (
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reading-queue">
              <Card>
                <CardHeader>
                  <CardTitle>Currently Reading</CardTitle>
                  <CardDescription>Books you're currently reading</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {["The Midnight Library", "Klara and the Sun", "Project Hail Mary"].map((book, i) => (
                      <div key={i} className="bg-bookWhite rounded-lg overflow-hidden border border-border">
                        <div
                          className={`h-32 flex items-center justify-center ${
                            i === 0 ? "bg-secondary/20" : i === 1 ? "bg-primary/20" : "bg-accent/20"
                          }`}
                        >
                          <img
                            src="/placeholder.svg?height=120&width=80"
                            alt={book}
                            className="h-24 w-auto shadow-md"
                          />
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium text-sm">{book}</h4>
                          <p className="text-xs text-muted-foreground">
                            {["Matt Haig", "Kazuo Ishiguro", "Andy Weir"][i]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardContent className="p-1 ">
                  <div className="grid grid-cols-4 gap-1">
                    <div className="w-auto">
                        <img
                            src="/images/book_lovers.jpg" // Use actual cover URL
                            alt="Book cover"
                            className="h-auto w-full shadow-md rounded object-cover" // Added object-cover
                        />
                    </div>
                    <div className="w-auto">
                        <img
                            src="/images/book_lovers.jpg" // Use actual cover URL
                            alt="Book cover"
                            className="h-auto w-full shadow-md rounded object-cover" // Added object-cover
                        />
                    </div>
                    <div className="w-auto">
                        <img
                            src="/images/book_lovers.jpg" // Use actual cover URL
                            alt="Book cover"
                            className="h-auto w-full shadow-md rounded object-cover" // Added object-cover
                        />
                    </div>
                    <div className="w-auto">
                        <img
                            src="/images/book_lovers.jpg" // Use actual cover URL
                            alt="Book cover"
                            className="h-auto w-full shadow-md rounded object-cover" // Added object-cover
                        />
                    </div>
                    <div className="w-auto">
                        <img
                            src="/images/book_lovers.jpg" // Use actual cover URL
                            alt="Book cover"
                            className="h-auto w-full shadow-md rounded object-cover" // Added object-cover
                        />
                    </div>
                    <div className="w-auto">
                        <img
                            src="/images/book_lovers.jpg" // Use actual cover URL
                            alt="Book cover"
                            className="h-auto w-full shadow-md rounded object-cover" // Added object-cover
                        />
                    </div>
                    <div className="relative w-auto">
                        <img
                            src="/images/book_lovers.jpg" // Use actual cover URL
                            alt="Book cover"
                            className="h-auto w-full shadow-md rounded object-cover" // Added object-cover
                        />
                        <span className="absolute bottom-1 right-1 bg-accent/70 text-bookWhite text-xs font-bold px-1 py-1 rounded-full shadow-md">
                            <CircleAlert className="h-4 w-4" />
                        </span>
                    </div>
                    <div className="relative w-auto">
                        <img
                            src="/images/book_lovers.jpg" // Use actual cover URL
                            alt="Book cover"
                            className="h-auto w-full shadow-md rounded object-cover" // Added object-cover
                        />
                        <span className="absolute bottom-1 right-1 bg-green-600/50 text-bookWhite text-xs font-bold px-1 py-1 rounded-full shadow-md">
                            <CircleCheckBig className="h-4 w-4" />
                        </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardContent className="p-1 ">
                  <div className="grid grid-cols-4 gap-1">
                    <div className="w-auto">
                        <img
                            src="/images/glow_of_the_everflame.jpg" // Use actual cover URL
                            alt="Book cover"
                            className="h-[150px] w-full shadow-md rounded object-cover" // Added object-cover
                        />
                    </div>
                    <div className="w-auto">
                        <img
                            src="/images/glow_of_the_everflame.jpg" // Use actual cover URL
                            alt="Book cover"
                            className="h-[150px] w-full shadow-md rounded object-cover" // Added object-cover
                        />
                    </div>
                    <div className="w-auto">
                        <img
                            src="/images/glow_of_the_everflame.jpg" // Use actual cover URL
                            alt="Book cover"
                            className="h-[150px] w-full shadow-md rounded object-cover" // Added object-cover
                        />
                    </div>
                    <div className="w-auto">
                        <img
                            src="/images/glow_of_the_everflame.jpg" // Use actual cover URL
                            alt="Book cover"
                            className="h-[150px] w-full shadow-md rounded object-cover" // Added object-cover
                        />
                    </div>
                    <div className="w-auto">
                        <img
                            src="/images/glow_of_the_everflame.jpg" // Use actual cover URL
                            alt="Book cover"
                            className="h-[150px] w-full shadow-md rounded object-cover" // Added object-cover
                        />
                    </div>
                    <div className="w-auto">
                        <img
                            src="/images/glow_of_the_everflame.jpg" // Use actual cover URL
                            alt="Book cover"
                            className="h-[150px] w-full shadow-md rounded object-cover" // Added object-cover
                        />
                    </div>
                    <div className="w-auto">
                        <img
                            src="/images/glow_of_the_everflame.jpg" // Use actual cover URL
                            alt="Book cover"
                            className="h-[150px] w-full shadow-md rounded object-cover" // Added object-cover
                        />
                    </div>
                    <div className="w-auto">
                        <img
                            src="/images/glow_of_the_everflame.jpg" // Use actual cover URL
                            alt="Book cover"
                            className="h-[150px] w-full shadow-md rounded object-cover" // Added object-cover
                        />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
