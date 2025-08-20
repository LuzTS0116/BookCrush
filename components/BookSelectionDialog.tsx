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
import { useSession } from 'next-auth/react'

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
  const { data: session } = useSession()
  
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
        const response = await fetch(`/api/books/search?q=${encodeURIComponent(debouncedSearch)}`,
          {
            headers: {
              'Authorization': `Bearer ${session?.supabaseAccessToken}`
            }
          }
        )
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
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] rounded-2xl sm:w-[85vw] md:w-[75vw] lg:w-[65vw]">
        <Image 
          src="/images/background.png"
          alt="Create and Manage your Book Clubs | BookCrush"
          width={1622}
          height={2871}
          className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
        />
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl">Select a Book</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Search for a book to set as the club's current book.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-bookWhite sm:top-3 sm:h-5 sm:w-5" />
          <Input
            placeholder="Search books by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 sm:pl-10 bg-bookWhite/15 text-bookWhite placeholder:text-bookWhite/60 h-9 sm:h-10"
          />
        </div>

        <ScrollArea className="h-[300px] sm:h-[400px] md:h-[450px] pr-2 w-full overflow-x-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : books.length > 0 ? (
            <>
            <div className="space-y-3 sm:space-y-4 w-full max-w-full">
              {books.map((book) => (
                <div
                  key={book.id}
                  className={`flex flex-row gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-bookWhite/10 transition-colors w-full max-w-full
                    ${selectedBookId === book.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <div className="w-12 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 bg-muted/30 rounded-md flex justify-center overflow-hidden shrink-0">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={`${book.title} cover`}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground self-center" />
                    )}
                  </div>
                  <div className='flex flex-col w-full min-w-0'>
                    <div className='flex flex-row justify-between items-start gap-2'>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm sm:text-base leading-tight break-words pr-2 overflow-hidden max-h-10 sm:max-h-12">
                          {book.title && book.title.length > 60 
                            ? `${book.title.substring(0, 60)}...` 
                            : book.title}
                        </h4>
                        <p className="text-xs sm:text-sm font-serif text-muted-foreground mt-1 truncate">
                          {book.author && book.author.length > 40 
                            ? `${book.author.substring(0, 40)}...` 
                            : book.author}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <Button
                          size="sm"
                          className="rounded-full h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md min-w-[60px] sm:min-w-[80px]"
                          onClick={() => handleSelect(book.id)}
                          disabled={selecting && selectedBookId === book.id}
                        >
                          {selecting && selectedBookId === book.id ? (
                            <>
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1" />
                              <span className="hidden xs:inline sm:inline">Selecting...</span>
                              <span className="xs:hidden sm:hidden">...</span>
                            </>
                          ) : (
                            <span className="font-semibold">Select</span>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col w-full mt-2 sm:mt-3 min-w-0">
                      <p className="text-xs sm:text-sm font-serif text-bookWhite/80 overflow-hidden break-words word-wrap max-h-18 sm:max-h-12 leading-tight">
                        {book.description && book.description.length > 200 
                          ? `${book.description.substring(0, 200)}...` 
                          : book.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className='flex flex-col items-center mt-6 sm:mt-8 gap-4'>
              <div className="text-center">
                <p className='text-bookWhite text-sm sm:text-base leading-5 mb-3 font-medium'>Don't see what you are looking for?</p>
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
            </div>
            </>
          ) : searchQuery ? (
            <div className="text-center py-8 text-muted-foreground px-4">
              <BookOpen className="mx-auto h-12 w-12 sm:h-16 sm:w-16 mb-4 text-bookWhite/40" />
              <p className="text-sm sm:text-base mb-3 text-bookWhite font-medium">No books found matching "{searchQuery}"</p>
              <p className="text-xs sm:text-sm text-bookWhite/70 mb-6 max-w-md mx-auto leading-relaxed">
                Add the book to our shared library and set it as the club's current book!
              </p>
              <div className="flex justify-center">
                <div className="bg-bookWhite/10 p-4 rounded-lg border border-bookWhite/20">
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
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 text-muted-foreground px-4">
              <Search className="mx-auto h-12 w-12 sm:h-16 sm:w-16 mb-4" />
              <p className="text-sm sm:text-base">Start typing to search for books</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 