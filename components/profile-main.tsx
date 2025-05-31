"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookMarked, Mail, Send, Pencil, Save, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col bg-transparent md:flex-row gap-8">
        <div className="md:w-1/3 bg-transparent">
          <Card className="px-0 bg-bookWhite/90 rounded-3xl">
            <CardHeader className="relative pb-0">
              <div className="absolute right-4 top-4">
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)} className="h-8 w-8">
                  {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="/placeholder.svg?height=96&width=96" alt="@user" />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">JD</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary hover:bg-primary-light"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {isEditing ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-center font-bold text-xl mb-2"
                  />
                ) : (
                  <h2 className="text-xl/4 font-bold text-secondary-light">{name}</h2>
                )}
                <p className="text-sm text-secondary/50 font-serif font-normal">25 Friends</p>
                <p className="text-sm text-secondary/50 font-serif font-normal">Member since May 2023</p>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-0 text-secondary-light">About</h3>
                  {isEditing ? (
                    <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[100px]" />
                  ) : (
                    <p className="text-sm/4 font-serif font-normal text-secondary/50">{bio}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-0">Kindle Email</h3>
                  {isEditing ? (
                    <div className="flex items-center">
                      <Send className="mr-2 h-4 w-4 text-secondary" />
                      <Input value={kindleEmail} onChange={(e) => setKindleEmail(e.target.value)} />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Send className="mr-2 h-4 w-4 text-accent-variant" />
                      <span className="text-sm font-serif text-secondary/50">{kindleEmail}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Favorite Genres</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {favoriteGenres.map((genre) => (
                      <Badge key={genre} variant="secondary" className="px-3 py-1 bg-primary/10 text-primary">
                        {genre}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeGenre(genre)}
                            className="ml-2 text-primary hover:text-primary-light"
                          >
                            ×
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a genre" />
                        </SelectTrigger>
                        <SelectContent>
                          {genres
                            .filter((genre) => !favoriteGenres.includes(genre))
                            .map((genre) => (
                              <SelectItem key={genre} value={genre}>
                                {genre}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" onClick={addGenre} disabled={!selectedGenre}>
                        Add
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Reading Stats</h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-accent-variant rounded-md p-2">
                      <p className="text-lg font-bold text-bookWhite">24</p>
                      <p className="text-xs text-bookWhite">Books Read</p>
                    </div>
                    <div className="bg-accent rounded-md p-2">
                      <p className="text-lg font-bold">3</p>
                      <p className="text-xs text-secondary">Currently</p>
                    </div>
                    <div className="bg-primary-dark rounded-md p-2">
                      <p className="text-lg font-bold text-secondary">12</p>
                      <p className="text-xs text-secondary">In Queue</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">My Top 5 Books</h3>
                  {isEditing ? (
                    <div className="flex items-center">
                      <Send className="mr-2 h-4 w-4 text-secondary" />
                      <Input value={kindleEmail} onChange={(e) => setKindleEmail(e.target.value)} />
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>
            </CardContent>
            {isEditing && (
              <CardFooter>
                <Button className="w-full bg-primary hover:bg-primary-light" onClick={() => setIsEditing(false)}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="md:w-2/3">
          <Tabs defaultValue="currently-reading" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-full">
              <TabsTrigger value="currently-reading" className="rounded-full">Currently Reading</TabsTrigger>
              <TabsTrigger value="reading-queue" className="rounded-full">Reading Queue</TabsTrigger>
              <TabsTrigger value="history" className="rounded-full">History</TabsTrigger>
            </TabsList>

            <TabsContent value="currently-reading" className="mt-6">
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

            <TabsContent value="reading-queue" className="mt-6">
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

            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reading Queue</CardTitle>
                  <CardDescription>Books you plan to read next</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      "Tomorrow, and Tomorrow, and Tomorrow",
                      "Sea of Tranquility",
                      "The Lincoln Highway",
                      "Cloud Cuckoo Land",
                      "The Invisible Life of Addie LaRue",
                    ].map((book, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                          <BookMarked className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{book}</h4>
                          <p className="text-xs text-muted-foreground">
                            {
                              [
                                "Gabrielle Zevin",
                                "Emily St. John Mandel",
                                "Amor Towles",
                                "Anthony Doerr",
                                "V.E. Schwab",
                              ][i]
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
          </Tabs>
        </div>
      </div>
    </div>
  )
}
