"use client"

import { useState, useEffect  } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"; // Radix DropdownMenu
import { BookOpen, Filter, Plus, Heart, Search, Send, Grid, List, Upload, MoreVertical, ThumbsUp, ThumbsDown,  ChevronDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

import { BookDetails } from "@/types/book";       // ← the interface we defined earlier
import test from "node:test"
import { AddBookDialog } from "./add-book-dialog"
import { ViewBookDetailsDialog } from "./ViewBookDetailsDialog"

// Define the available shelf types for the dropdown
const SHELF_OPTIONS = [
  { label: "Currently Reading", value: "currently_reading" },
  { label: "Reading Queue", value: "queue" },
  { label: "Favorites", value: "favorite" },
];

export default function BooksTableContents() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("all")
  const [viewMode, setViewMode] = useState<"card" | "table">("card")
   /* pagination */
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

 /* ------------------------------------------------------------------ */
  /*  UI state                                                           */
  /* ------------------------------------------------------------------ */
  const [books, setBooks] = useState<BookDetails[]>([]);
  
  /* form fields inside the dialog */
  const [title,  setTitle]  = useState("");
  const [author, setAuthor] = useState("");

  const [open, setOpen] = useState(false); // dialog visibility for AddBookDialog
  const [submitting, setSubmitting] = useState(false); // For form submission in dialog
  const [formError, setFormError] = useState<string | null>(null); // For form errors in dialog
  const [isLoading, setIsLoading] = useState(true); // For loading all books
  const [error, setError] = useState<string | null>(null); // For general fetch errors

  // State to manage per-book loading/feedback for adding to shelf
  // Key: bookId, Value: { isLoading: boolean, message: string | null }
  const [shelfActionsStatus, setShelfActionsStatus] = useState<Record<string, { isLoading: boolean, message: string | null }>>({});

  // Calculate pagination
  const totalPages = Math.ceil(books.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentBooks = books.slice(startIndex, endIndex)

//   Reactions manager
const [activeReactionsBook, setActiveReactionsBook] = useState<string | null>(null);

  
  // Function to fetch books from your API
  const fetchBooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/books'); // Your API route to get all books
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }
      const data: BookDetails[] = await response.json();
      setBooks(data);
      console.log(data[0]);
    } catch (err: any) {
      console.error("Error fetching books:", err);
      setError(err.message || "Could not load books.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch books on component mount
  useEffect(() => {
    fetchBooks();
  }, []); // Empty dependency array means this runs once on mount

  // Callback to update the books list after a new book is added
  const handleBookAdded = (newBook: BookDetails) => {
    setBooks(prev => [newBook, ...prev]); // Add the new book to the top of the list
  };

function formatDate(timestamp: string) {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
  const year = date.getFullYear().toString().slice(-2); // Get last two digits of year

  return `${day}.${month}.${year}`;
}

// Add a book to 'favorite' shelf, status 'in_progress'
 // Function to add/move a book to a shelf
  const handleAddToShelf = async (bookId: string, shelf: string) => {
    setShelfActionsStatus(prev => ({
      ...prev,
      [bookId]: { isLoading: true, message: null }
    }));
    try {
      // Your API call to add/move the book
      const response = await fetch('/api/shelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, shelf, status: 'in_progress' }) // Default status for new additions
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add book to shelf');
      }
      const result = await response.json();
      console.log('Book added/moved to shelf:', result);

      setShelfActionsStatus(prev => ({
        ...prev,
        [bookId]: { isLoading: false, message: `Added to ${shelf.replace(/_/g, ' ')}!` }
      }));

      // Optionally, re-fetch or update the specific book's status in the UI if needed
      // For a global list, just showing the message might be enough.
      // If you want to reflect it immediately in the `books` state, you'd need more complex logic
      // to find the book and update its shelf/status or re-fetch.
      // For now, it just shows a success message.
      setTimeout(() => { // Clear message after a few seconds
        setShelfActionsStatus(prev => ({ ...prev, [bookId]: { isLoading: false, message: null } }));
      }, 3000);

    } catch (err: any) {
      console.error("Error adding book to shelf:", err);
      setShelfActionsStatus(prev => ({
        ...prev,
        [bookId]: { isLoading: false, message: `Error: ${err.message}` }
      }));
    }
  };


  return (
    <div className="container mx-auto px-4 py-6 pb-20">
        <div className="space-y-5">
            <div className="flex justify-center">
            <AddBookDialog 
                open={open} 
                onOpenChange={setOpen} 
                // These props are less critical now for initial data,
                // but still good for the dialog to know about the collection if needed.
                // The real update comes from onBookAdded.
                books={books} // Still pass it down if dialog needs to know *existing* books (e.g. for validation)
                setBooks={setBooks} // Still useful if dialog directly manipulates the array (e.g. for removing/editing later)
                onBookAdded={handleBookAdded} // This is the crucial callback for adding
            />
            </div>
            <div className="grid grid-cols-8 gap-x-2">
                {/* Search Input */}
                <div className="relative col-span-6">
                    <Search className="absolute left-3 top-1/3 pt-1 -translate-y-1/2 h-4 w-4 text-secondary" />
                    <Input
                    placeholder="Search books and more"
                    className="pl-10 rounded-full bg-bookWhite/90"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {/* View Toggle Buttons */}
                <div className="col-span-2 flex items-center justify-end gap-2">
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

            <div className="">
                <Tabs defaultValue="all" className="">
                    <div className="flex justify-center">
                        <TabsList className="bg-secondary-light text-primary rounded-full mb-2">
                        <TabsTrigger
                            value="all"
                            className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                        >
                            All Books
                        </TabsTrigger>
                        <TabsTrigger
                            value="my-books"
                            className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                        >
                            My Books
                        </TabsTrigger>
                        <TabsTrigger
                            value="club-books"
                            className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                        >
                            Added by Friends
                        </TabsTrigger>
                        </TabsList>
                    </div>

                    All Books view
                    {books.length === 0 ? (
                    <p className="text-center text-muted-foreground mt-8">
                        No books yet. Click &ldquo;Add Book&rdquo; to get started.
                    </p>
                    ) : (
                   
                    <TabsContent value="all" className="space-y-4">
                   
                    {viewMode === "card" ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {currentBooks.map((book, i) => (
                         
                            
                            
                            <Card key={i} className="flex flex-col gap-2">
                            <div className="flex gap-4 px-4 pt-4 pb-1">
                                {/* Cover Image */}
                                <div className="w-[100px] h-35 bg-muted/30 rounded flex items-center justify-center overflow-hidden shrink-0">
                                <img
                                    src={book.cover_url || "/placeholder.svg"}
                                    alt={`${book.title} cover`}
                                    className="object-cover h-auto"
                                />
                                </div>

                                {/* Right Section */}
                                <div className="flex-1 flex flex-col justify-between gap-2">
                                {/* Title and Author */}
                                <div>
                                    <h3 className="text-lg/4 font-semibold text-secondary">{book.title}</h3>
                                    <p className="text-secondary/50 text-sm">{book.author}</p>
                                    <div className="flex items-center justify-between">
                                    {/* Reactions Cluster */}
                                    <Dialog open={activeReactionsBook === book.id} onOpenChange={() => setActiveReactionsBook(null)}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex items-center gap-1 text-secondary text-xs hover:bg-transparent"
                                                onClick={() => setActiveReactionsBook(book.id)}
                                            >
                                                ❤️ 12 👍 5 👎 2
                                            </Button>
                                        </DialogTrigger>
                                    
                                        <DialogContent>
                                            <DialogHeader>
                                            <DialogTitle>Book Reactions</DialogTitle>
                                            <DialogDescription>Select your reaction or see who reacted:</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-2">
                                            <Button variant="ghost" className="w-full justify-start">❤️ Like – 12</Button>
                                            <Button variant="ghost" className="w-full justify-start">👍 Helpful – 5</Button>
                                            <Button variant="ghost" className="w-full justify-start">👎 Not for me – 2</Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    {/* More Options Dots */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="ml-auto">
                                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-48 p-2 bg-white rounded shadow-md">
                                        <Button variant="ghost" className="w-full justify-start text-sm">
                                            📚 Add to Favorites
                                        </Button>
                                        <Button variant="ghost" className="w-full justify-start text-sm">
                                            📖 Currently Reading
                                        </Button>
                                        <Button variant="ghost" className="w-full justify-start text-sm">
                                            ⏳ Reading Queue
                                        </Button>
                                        <Button variant="ghost" className="w-full justify-start text-sm">
                                            🧠 Reader
                                        </Button>
                                        </PopoverContent>
                                    </Popover>
                                    </div>
                                </div>

                                {/* Genre Tags */}
                                <div className="flex flex-wrap gap-1">
                                    {book.genres?.slice(0, 3).map((genre: string) => (
                                    <span
                                        key={genre}
                                        className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full"
                                    >
                                        {genre}
                                    </span>
                                    ))}
                                </div>

                                {/* Meta Info */}
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                    <p className="text-secondary">Pages</p>
                                    <p className="inline-block font-medium bg-bookBlack/10 rounded-full px-2 mr-10">{book.pages}</p>
                                    </div>
                                    <div>
                                    <p className="text-secondary">Reading Time</p>
                                    <p className="inline-block font-medium bg-bookBlack/10 rounded-full px-2 mr-3">{book.reading_time}</p>
                                    </div>
                                    <div>
                                    <p className="text-secondary">Added</p>
                                    <p className="font-medium">{formatDate(book.created_at)}</p>
                                    </div>
                                    <div>
                                    <p className="text-secondary">Rating</p>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, index) => (
                                        <span key={index}>
                                            {book.rating > index ? (
                                            <Heart className="w-4 h-4 fill-primary text-primary" />
                                            ) : (
                                            <Heart className="w-4 h-4 text-primary" />
                                            )}
                                        </span>
                                        ))}
                                    </div>
                                    </div>
                                </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <CardFooter className="flex justify-between px-4 pb-4">
                                <ViewBookDetailsDialog book={book} />
                                <Button variant="outline" size="sm" className="text-bookWhite bg-accent-variant border-none">
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
                    )}

                        {/* My Books view */}
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
                    

                             {/* Club Books view */}
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
    </div>
)
}
