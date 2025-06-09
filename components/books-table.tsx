"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Filter, Plus, Search, Send, ThumbsDown, ThumbsUp, Grid, List, MoreVertical, Upload, ChevronDown } from "lucide-react" // Added ChevronDown for dropdown
import { Heart } from "@phosphor-icons/react"
import Link from "next/link"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"; // Radix DropdownMenu
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

import { BookDetails } from "@/types/book";
import { AddBookDialog } from "./add-book-dialog"
import { ViewBookDetailsDialog } from "./ViewBookDetailsDialog"
import { toast } from "sonner"; // Changed from react-hot-toast to sonner

// Define the available shelf types for the dropdown
const SHELF_OPTIONS = [
  { label: "Currently Reading", value: "currently_reading" },
  { label: "Reading Queue", value: "queue" },
  { label: "Finished", value: "finished" },
];

interface BookReactions {
  HEART: number;
  THUMBS_UP: number;
  THUMBS_DOWN: number;
  LIKE: number;
}

export default function BooksTableContents() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("all") // This doesn't seem used in the current JSX
  const [viewMode, setViewMode] = useState<"card" | "table">("card")
  //reactions
  const [reactions, setReactions] = useState<BookReactions>({ HEART: 0, THUMBS_UP: 0, THUMBS_DOWN: 0, LIKE: 0 })
  /* pagination */
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  /* ------------------------------------------------------------------ */
  /*  UI state                                                           */
  /* ------------------------------------------------------------------ */
  const [books, setBooks] = useState<BookDetails[]>([]);

  /* form fields inside the dialog (might be redundant if AddBookDialog handles its own state) */
  const [title, setTitle] = useState("");
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


  // Function to fetch all books from your API
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
    } catch (err: any) {
      console.error("Error fetching books:", err);
      setError(err.message || "Could not load books.");
    } finally {
      setIsLoading(false);
    }
  };
  console.log(books)

  // Fetch books on component mount
  useEffect(() => {
    fetchBooks();
  }, []);

  // Fetch reactions on component mount
    useEffect(() => {
      const fetchReactions = async () => {
        try {
          
          // Fetch reactions
          const [reactionsResponse] = await Promise.all([
            fetch(`/api/books/${id}/reactions`)
          ])
  
          if (reactionsResponse.ok) {
            const reactionsData = await reactionsResponse.json()
            setReactions(reactionsData.reactions)
          } else {
            console.error('Failed to fetch reactions')
          }
  
        } catch (error) {
          console.error('Error fetching reactions:', error)
        } finally {
        }
      }
  
      fetchReactions()
    }, [])

  // Callback to update the books list after a new book is added via dialog
  const handleBookAdded = (newBook: BookDetails) => {
    setBooks(prev => [newBook, ...prev]);
  };

  function formatDate(timestamp: string) {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}.${month}.${year}`;
  }

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

  // Add book to favorites - heart
  const handleFavorite = async (bookId: string) => {
    if (!bookId) return;
    
    // Get the current book
    const currentBook = books.find(book => book.id === bookId);
    if (!currentBook) return;
    
    // Optimistically update UI
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId 
          ? { ...book, is_favorite: !book.is_favorite }
          : book
      )
    );
    
    try {
      const response = await fetch('/api/books/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookId }),
      });
      
      if (!response.ok) {
        // Revert UI change if API call fails
        setBooks(prevBooks => 
          prevBooks.map(book => 
            book.id === bookId 
              ? { ...book, is_favorite: currentBook.is_favorite }
              : book
          )
        );
        throw new Error('Failed to update favorite status');
      }
      
      const data = await response.json();
      console.log('Favorite status updated:', data);
      
      // If you want to show feedback
      if (data.is_favorite) {
        toast.success('Added to favorites!');
      } else {
        toast.success('Removed from favorites');
      }
      
      // No need to refetch all books - our optimistic update should match the server state
      // unless we added to a new shelf, in which case we'd want to refresh
      // if (data.message === 'Book added to favorites') {
      //   fetchBooks();
      // }
      
    } catch (error) {
      console.error('Error updating favorite status:', error);
      toast.error('Failed to update favorite status');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      <div className="space-y-5">
        <div className="flex justify-center">
          <AddBookDialog
            open={open}
            onOpenChange={setOpen}
            books={books}
            setBooks={setBooks}
            onBookAdded={handleBookAdded}
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
                className={viewMode === "table" ? "bg-primary text-primary-foreground" : ""} // Fix: assuming table class
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

            {isLoading ? (
              <p className="text-center text-muted-foreground mt-8">Loading books...</p>
            ) : error ? (
              <p className="text-center text-red-500 mt-8">Error: {error}</p>
            ) : books.length === 0 ? (
              <p className="text-center text-muted-foreground mt-8">
                No books yet. Click &ldquo;Add Book&rdquo; to get started.
              </p>
            ) : (
              <TabsContent value="all" className="space-y-4">
                {viewMode === "card" ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {currentBooks.map((book) => {
                      const currentShelfStatus = shelfActionsStatus[book.id];
                      return (
                        <Card key={book.id} className="flex flex-col gap-2">
                          <div className="flex gap-4 px-4 pt-4 pb-4">
                            {/* Cover Image */}
                            <Link href={`/books/${book.id}`}>
                              <div className="w-[110px] h-35 bg-muted/30 rounded flex items-center justify-center overflow-hidden shrink-0">
                                <img
                                  src={book.cover_url || "/placeholder.svg"}
                                  alt={`${book.title} cover`}
                                  className="object-cover h-full w-full" // Added w-full
                                />
                              </div>
                            </Link>

                            {/* Right Section */}
                            <div className="flex-1 flex flex-col justify-between gap-2">
                              {/* Title and Author */}
                              <div>
                                <div className="flex flex-row justify-between">
                                  <div className="flex-1 min-w-0">
                                    <Link href={`/books/${book.id}`}>
                                      <h3 className="text-lg/5 font-semibold break-words text-secondary">{book.title}</h3>
                                    </Link>
                                  </div>
                                  {/* --- NEW: Add to Shelf Dropdown --- */}
                                  <div className="flex items-start">
                                  <DropdownMenu.Root>
                                    <DropdownMenu.Trigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs flex items-end px-0 rounded-full h-auto gap-1 bg-transparent ml-1 border-none"
                                        disabled={currentShelfStatus?.isLoading} // Disable while action is loading
                                      >
                                        <Plus className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    </DropdownMenu.Trigger>

                                    <DropdownMenu.Portal>
                                      <DropdownMenu.Content
                                        className="w-auto rounded-xl bg-transparent shadow-xl px-1 mr-6 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                                        sideOffset={5}
                                      >
                                      {SHELF_OPTIONS.map((shelf) => (
                                        <DropdownMenu.Item
                                          key={shelf.value}
                                          onSelect={() => handleAddToShelf(book.id, shelf.value)}
                                          className="px-3 py-2 text-xs text-center bg-secondary/90 my-2 rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                                        >
                                          {shelf.label}
                                        </DropdownMenu.Item>
                                      ))}
                                      </DropdownMenu.Content>
                                    </DropdownMenu.Portal>
                                  </DropdownMenu.Root>
                                  {/* Display action status message */}
                                  {currentShelfStatus?.message && (
                                    <p className="absolute top-full mb-1 right-0 text-nowrap text-xs mt-1 bg-primary/85 py-1 px-2 text-center flex-1 rounded-xl z-50" style={{ color: currentShelfStatus.message.startsWith('Error') ? 'red' : 'secondary' }}>
                                      {currentShelfStatus.message}
                                    </p>
                                  )}
                                  </div>
                                </div>
                                <p className="text-secondary/50 text-sm">{book.author}</p>
                                <div>
                                    <div className="flex gap-2">
                                      <div className="flex items-center gap-1">
                                          <Heart
                                              className="h-3 w-3 text-primary"
                                          />
                                          <span className="font-serif font-medium text-xs text-secondary">{book.reactions.counts.HEART}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                          <ThumbsUp
                                              className="h-3 w-3 text-accent-variant"
                                          />
                                          <span className="font-serif font-medium text-xs text-secondary">{book.reactions.counts.THUMBS_UP}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                          <ThumbsDown
                                              className="h-3 w-3 text-accent"
                                          />
                                          <span className="font-serif font-medium text-xs text-secondary">{book.reactions.counts.THUMBS_DOWN}</span>
                                      </div>
                                    </div>
                                  </div>
                              </div>

                              {/* Genre Tags */}
                              <div className="flex flex-wrap gap-1">
                                {book.genres?.slice(0, 1).map((genre: string) => (
                                  <span
                                    key={genre}
                                    className="bg-primary/10 text-primary text-xs/3 font-medium px-2 py-1 rounded-full"
                                  >
                                    {genre}
                                  </span>
                                ))}
                              </div>

                              {/* Pages & Time */}
                              <div className="flex-1">
                                <p className="text-secondary/80 font-sans font-normal bg-accent/25 rounded-full px-2 text-sm inline-block">{book.pages} pages • {book.reading_time}</p>
                              </div>

                              {/* Meta Info */}
                              <div className="flex flex-row justify-between items-end gap-2 text-sm">
                                <div>
                                  <p className="text-secondary/60 text-xs font-serif font-medium">
                                    Added <span> {new Date(book.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                                  </p>
                                </div>
                                <div className="flex justify-end items-end">
                                    <button
                                      onClick={() => handleFavorite(book.id!)}
                                      className={`p-0`}
                                    >
                                      <Heart
                                        className="h-5 w-5"
                                        color="#C51104"
                                        weight={book.is_favorite ? "fill" : "regular"}
                                      />
                                    </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  // --- Table View (Placeholder) ---
                  <div className="rounded-md border">
                    <Table className="rounded-lg">
                      <TableHeader >
                        <TableRow className="py-1 bg-secondary-light">
                          <TableHead className="p-2">Title</TableHead>
                          <TableHead className="p-2">Author</TableHead>
                          <TableHead className="p-2">Pages</TableHead>
                          <TableHead className="p-2">Genre</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentBooks.map((book) => {
                          const currentShelfStatus = shelfActionsStatus[book.id];
                          return (
                            <TableRow key={book.id}>
                              <TableCell className="font-medium p-2"><Link href={`/books/${book.id}`}>{book.title}</Link></TableCell>
                              <TableCell className="p-2">{book.author}</TableCell>
                              <TableCell className="p-2">{book.pages}</TableCell>
                              <TableCell className="p-2">
                                {book.genres?.slice(0, 1).map((genre: string) => (
                                  <span
                                    key={genre}
                                    className=""
                                  >
                                    {genre}
                                  </span>
                                ))}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink href="#" isActive={currentPage === index + 1} onClick={() => setCurrentPage(index + 1)}>
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext href="#" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}