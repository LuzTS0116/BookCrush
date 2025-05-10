"use client"

import { useState } from "react"
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Filter, Plus, Search, Send, Grid, List, Upload } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function BooksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("all")
  const [viewMode, setViewMode] = useState<"card" | "table">("card")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Sample books data
  const books = [
    {
      title: "The Midnight Library",
      author: "Matt Haig",
      genre: "Fiction",
      pages: 304,
      reading_speed: "4-5 hours",
      cover: "/placeholder.svg?height=200&width=150",
    },
    {
      title: "Klara and the Sun",
      author: "Kazuo Ishiguro",
      genre: "Science Fiction",
      pages: 320,
      reading_speed: "5-6 hours",
      cover: "/placeholder.svg?height=200&width=150",
    },
    {
      title: "Project Hail Mary",
      author: "Andy Weir",
      genre: "Science Fiction",
      pages: 496,
      reading_speed: "7-9 hours",
      cover: "/placeholder.svg?height=200&width=150",
    },
    {
      title: "The Song of Achilles",
      author: "Madeline Miller",
      genre: "Historical Fiction",
      pages: 416,
      reading_speed: "6-8 hours",
      cover: "/placeholder.svg?height=200&width=150",
    },
    {
      title: "Educated",
      author: "Tara Westover",
      genre: "Memoir",
      pages: 352,
      reading_speed: "5-7 hours",
      cover: "/placeholder.svg?height=200&width=150",
    },
    {
      title: "The Invisible Life of Addie LaRue",
      author: "V.E. Schwab",
      genre: "Fantasy",
      pages: 448,
      reading_speed: "7-8 hours",
      cover: "/placeholder.svg?height=200&width=150",
    },
    {
      title: "Circe",
      author: "Madeline Miller",
      genre: "Fantasy",
      pages: 393,
      reading_speed: "6-7 hours",
      cover: "/placeholder.svg?height=200&width=150",
    },
    {
      title: "The Vanishing Half",
      author: "Brit Bennett",
      genre: "Fiction",
      pages: 352,
      reading_speed: "5-6 hours",
      cover: "/placeholder.svg?height=200&width=150",
    },
    {
      title: "Mexican Gothic",
      author: "Silvia Moreno-Garcia",
      genre: "Horror",
      pages: 320,
      reading_speed: "4-6 hours",
      cover: "/placeholder.svg?height=200&width=150",
    },
  ]

  // Calculate pagination
  const totalPages = Math.ceil(books.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentBooks = books.slice(startIndex, endIndex)

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="container mx-auto py-6 pb-20 md:pb-6">
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Books</h1>
                  <p className="text-muted-foreground">Browse, search, and manage your book collection.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary-light text-primary-foreground">
                        <Plus className="mr-2 h-4 w-4" /> Add Book
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New Book</DialogTitle>
                        <DialogDescription>Enter the details of the book you want to add to your collection.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="cover">Book Cover</Label>
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-40 w-32 bg-muted flex items-center justify-center rounded-md overflow-hidden">
                              <img
                                src="/placeholder.svg?height=160&width=120"
                                alt="Book cover preview"
                                className="max-h-full max-w-full"
                              />
                            </div>
                            <Button variant="outline" size="sm" className="w-full">
                              <Upload className="mr-2 h-4 w-4" /> Upload Cover
                            </Button>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="title">Title</Label>
                          <Input id="title" placeholder="Enter book title" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="author">Author</Label>
                          <Input id="author" placeholder="Enter author name" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="genre">Genre</Label>
                          <Select>
                            <SelectTrigger id="genre">
                              <SelectValue placeholder="Select genre" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fiction">Fiction</SelectItem>
                              <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                              <SelectItem value="sci-fi">Science Fiction</SelectItem>
                              <SelectItem value="fantasy">Fantasy</SelectItem>
                              <SelectItem value="mystery">Mystery</SelectItem>
                              <SelectItem value="romance">Romance</SelectItem>
                              <SelectItem value="biography">Biography</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="pages">Number of Pages</Label>
                          <Input id="pages" type="number" placeholder="Enter number of pages" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="file">Upload Book File (PDF/EPUB)</Label>
                          <Input id="file" type="file" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-primary hover:bg-primary-light text-primary-foreground">
                          Add Book
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search books by title, author..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    <SelectItem value="fiction">Fiction</SelectItem>
                    <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                    <SelectItem value="sci-fi">Science Fiction</SelectItem>
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                    <SelectItem value="mystery">Mystery</SelectItem>
                    <SelectItem value="romance">Romance</SelectItem>
                    <SelectItem value="biography">Biography</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Label htmlFor="view-mode" className="text-sm">
                    View:
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={viewMode === "card" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("card")}
                      className={viewMode === "card" ? "bg-primary text-primary-foreground" : ""}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("table")}
                      className={viewMode === "table" ? "bg-primary text-primary-foreground" : ""}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="all" className="space-y-4">
                <TabsList className="bg-muted text-muted-foreground">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    All Books
                  </TabsTrigger>
                  <TabsTrigger
                    value="my-books"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    My Books
                  </TabsTrigger>
                  <TabsTrigger
                    value="club-books"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Club Books
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {viewMode === "card" ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {currentBooks.map((book, i) => (
                        <Card key={i}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <div>
                                <CardTitle>{book.title}</CardTitle>
                                <CardDescription>{book.author}</CardDescription>
                              </div>
                              <div className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full h-fit">
                                {book.genre}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-4 mb-4">
                              <div className="w-20 h-28 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                                <img
                                  src={book.cover || "/placeholder.svg"}
                                  alt={`${book.title} cover`}
                                  className="max-h-full"
                                />
                              </div>
                              <div className="grid grid-cols-1 gap-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Pages</p>
                                  <p className="font-medium">{book.pages}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Reading Time</p>
                                  <p className="font-medium">{book.reading_speed}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <Button variant="outline" size="sm">
                              <BookOpen className="mr-2 h-4 w-4" /> Details
                            </Button>
                            <Button variant="outline" size="sm">
                              <Send className="mr-2 h-4 w-4" /> Send to Kindle
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">Cover</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Genre</TableHead>
                            <TableHead>Pages</TableHead>
                            <TableHead>Reading Time</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentBooks.map((book, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <div className="w-12 h-16 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                                  <img
                                    src={book.cover || "/placeholder.svg"}
                                    alt={`${book.title} cover`}
                                    className="max-h-full"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{book.title}</TableCell>
                              <TableCell>{book.author}</TableCell>
                              <TableCell>
                                <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                                  {book.genre}
                                </span>
                              </TableCell>
                              <TableCell>{book.pages}</TableCell>
                              <TableCell>{book.reading_speed}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon">
                                    <BookOpen className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon">
                                    <Send className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  )}

                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => setCurrentPage(i + 1)}
                            isActive={currentPage === i + 1}
                            className={currentPage === i + 1 ? "bg-primary text-primary-foreground" : ""}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </TabsContent>

                <TabsContent value="my-books" className="space-y-4">
                  {/* Similar structure as "all" tab but with filtered books */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {currentBooks.slice(0, 3).map((book, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div>
                              <CardTitle>{book.title}</CardTitle>
                              <CardDescription>{book.author}</CardDescription>
                            </div>
                            <div className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full h-fit">
                              {book.genre}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-4 mb-4">
                            <div className="w-20 h-28 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                              <img src={book.cover || "/placeholder.svg"} alt={`${book.title} cover`} className="max-h-full" />
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Pages</p>
                                <p className="font-medium">{book.pages}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Reading Time</p>
                                <p className="font-medium">{book.reading_speed}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button variant="outline" size="sm">
                            <BookOpen className="mr-2 h-4 w-4" /> Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <Send className="mr-2 h-4 w-4" /> Send to Kindle
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="club-books" className="space-y-4">
                  {/* Similar structure as "all" tab but with filtered books */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {currentBooks.slice(3, 6).map((book, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div>
                              <CardTitle>{book.title}</CardTitle>
                              <CardDescription>{book.author}</CardDescription>
                            </div>
                            <div className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full h-fit">
                              {book.genre}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-4 mb-4">
                            <div className="w-20 h-28 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                              <img src={book.cover || "/placeholder.svg"} alt={`${book.title} cover`} className="max-h-full" />
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Pages</p>
                                <p className="font-medium">{book.pages}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Reading Time</p>
                                <p className="font-medium">{book.reading_speed}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button variant="outline" size="sm">
                            <BookOpen className="mr-2 h-4 w-4" /> Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <Send className="mr-2 h-4 w-4" /> Send to Kindle
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
      </div>
      <MobileNav />
    </div>
)
}
