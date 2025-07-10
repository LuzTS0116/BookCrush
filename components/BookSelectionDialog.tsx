import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2, BookOpen } from "lucide-react"
import { useDebounce } from '@/lib/hooks/use-debounce'
import Image from 'next/image'
import { AddBookDialog } from '@/components/add-book-dialog'
import { BookDetails } from "@/types/book"

interface Book {
  id: string
  title: string
  author: string
  cover_url: string
  description: string
}

interface BookSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBookSelect: (bookId: string) => Promise<void>
  addBookDialogOpen: boolean
  setAddBookDialogOpen: (open: boolean) => void
  allBooks: BookDetails[]
  setAllBooks: React.Dispatch<React.SetStateAction<BookDetails[]>>
  onBookAdded: (newBook: BookDetails) => void
}

export function BookSelectionDialog({
  open,
  onOpenChange,
  onBookSelect,
  addBookDialogOpen,
  setAddBookDialogOpen,
  allBooks,
  setAllBooks,
  onBookAdded,
}: BookSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)
  
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Search for books when the debounced query changes
  useEffect(() => {
    async function searchBooks() {
      if (!debouncedSearch.trim()) {
        setBooks([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/books/search?q=${encodeURIComponent(debouncedSearch)}`)
        if (!response.ok) throw new Error('Failed to search books')
        const data = await response.json()
        setBooks(data)
      } catch (error) {
        console.error('Error searching books:', error)
        setBooks([])
      } finally {
        setLoading(false)
      }
    }

    searchBooks()
  }, [debouncedSearch])

  // Handle book selection
  const handleSelect = async (bookId: string) => {
    setSelectedBookId(bookId)
    setSelecting(true)
    try {
      await onBookSelect(bookId)
      onOpenChange(false) // Close dialog on success
    } catch (error) {
      console.error('Error selecting book:', error)
    } finally {
      setSelecting(false)
      setSelectedBookId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] rounded-2xl">
        <Image 
          src="/images/background.png"
          alt="Create and Manage your Book Clubs | BookCrush"
          width={1622}
          height={2871}
          className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
        />
        <DialogHeader>
          <DialogTitle>Select a Book</DialogTitle>
          <DialogDescription>
            Search for a book to set as the club's current book.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-2 h-4 w-4 text-bookWhite" />
          <Input
            placeholder="Search books by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-bookWhite/15 text-bookWhite placeholder:text-bookWhite/60 pt-0.5"
          />
        </div>

        <ScrollArea className="h-[400px] pr-2">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : books.length > 0 ? (
            <>
            <div className="space-y-2">
              {books.map((book) => (
                <div
                  key={book.id}
                  className={`flex flex-row gap-2 p-2.5 rounded-lg bg-bookWhite/10 transition-colors
                    ${selectedBookId === book.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <div className="w-[60px] h-24 bg-muted/30 rounded-md flex justify-center overflow-hidden shrink-0">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={`${book.title} cover`}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className='flex flex-col w-full'>
                    <div className='flex flex-row justify-between items-start'>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm leading-none break-words">{book.title}</h4>
                        <p className="text-xs font-serif text-muted-foreground">{book.author}</p>
                      </div>
                      <div>
                        <Button
                          size="sm"
                          className="rounded-full h-6 px-2 ml-2"
                          onClick={() => handleSelect(book.id)}
                          disabled={selecting && selectedBookId === book.id}
                        >
                          {selecting && selectedBookId === book.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Selecting...
                            </>
                          ) : (
                            'Select'
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col w-auto">
                      <p className="text-xs mt-2 font-serif line-clamp-3 max-w-[52vw]">{book.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className='flex flex-col items-center mt-4 gap-3'>
              <p className='text-bookWhite text-sm leading-4'>Don't see what you are looking for?</p>
              <AddBookDialog
                  open={addBookDialogOpen}
                  onOpenChange={setAddBookDialogOpen}
                  books={allBooks}
                  setBooks={setAllBooks}
                  onBookAdded={onBookAdded}
                  initialSearchQuery={searchQuery}
                />
            </div>
            </>
          ) : searchQuery ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 mb-4" />
              <p>No books found matching "{searchQuery}"</p>
              <p className="text-sm text-bookWhite/60 mb-4">
                Add the book to our shared library and set it as the club's current book!
              </p>
              <div className="flex justify-center">
                <AddBookDialog
                  open={addBookDialogOpen}
                  onOpenChange={setAddBookDialogOpen}
                  books={allBooks}
                  setBooks={setAllBooks}
                  onBookAdded={onBookAdded}
                  initialSearchQuery={searchQuery}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="mx-auto h-12 w-12 mb-4" />
              <p>Start typing to search for books</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 