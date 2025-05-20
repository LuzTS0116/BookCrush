"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookMarked, Mail, Pencil, Save, X } from "lucide-react"
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
    "Fiction",
    "Non-Fiction",
    "Science Fiction",
    "Fantasy",
    "Mystery",
    "Thriller",
    "Romance",
    "Historical Fiction",
    "Biography",
    "Self-Help",
    "Horror",
    "Poetry",
    "Young Adult",
    "Children's",
    "Classics",
  ]

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
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <Card>
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
                  <h2 className="text-xl font-bold">{name}</h2>
                )}
                <p className="text-sm text-muted-foreground">Member since May 2023</p>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">About</h3>
                  {isEditing ? (
                    <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[100px]" />
                  ) : (
                    <p className="text-sm text-muted-foreground">{bio}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Kindle Email</h3>
                  {isEditing ? (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Input value={kindleEmail} onChange={(e) => setKindleEmail(e.target.value)} />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{kindleEmail}</span>
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
                    <div className="bg-primary/10 rounded-md p-2">
                      <p className="text-lg font-bold">24</p>
                      <p className="text-xs text-muted-foreground">Books Read</p>
                    </div>
                    <div className="bg-secondary/10 rounded-md p-2">
                      <p className="text-lg font-bold">3</p>
                      <p className="text-xs text-muted-foreground">Currently</p>
                    </div>
                    <div className="bg-accent/10 rounded-md p-2">
                      <p className="text-lg font-bold">12</p>
                      <p className="text-xs text-muted-foreground">In Queue</p>
                    </div>
                  </div>
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
          <Tabs defaultValue="top-books" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="top-books">Top Books</TabsTrigger>
              <TabsTrigger value="currently-reading">Currently Reading</TabsTrigger>
              <TabsTrigger value="reading-queue">Reading Queue</TabsTrigger>
            </TabsList>

            <TabsContent value="top-books" className="mt-6">
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

            <TabsContent value="currently-reading" className="mt-6">
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

            <TabsContent value="reading-queue" className="mt-6">
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
