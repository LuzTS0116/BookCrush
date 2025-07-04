import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2, BookOpen } from "lucide-react"
import { useDebounce } from '@/lib/hooks/use-debounce'
import Image from 'next/image'

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
}

export function BookSelectionDialog({
  open,
  onOpenChange,
  onBookSelect,
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
      <DialogContent className="w-[85vw] rounded-2xl">
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

        <ScrollArea className="h-[400px] pr-1 pl-2 w-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : books.length > 0 ? (
            <div className="space-y-3 w-[70vw]">
              {books.map((book) => (
                <div
                  key={book.id}
                  className={`flex flex-row gap-2 p-3 rounded-lg bg-bookWhite/10 transition-colors w-full
                    ${selectedBookId === book.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <div className="w-20 h-24 bg-muted/30 rounded-md flex items-center justify-center overflow-hidden">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={`${book.title} cover`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className='flex flex-col w-full'>
                    <div className='flex flex-row justify-between items-start'>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-none break-words">{book.title}</h4>
                      </div>
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
                            'Select Book'
                          )}
                        </Button>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-xs font-serif text-muted-foreground">{book.author}</p>
                      <p className="text-xs mt-2 font-serif line-clamp-3">{book.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 mb-4" />
              <p>No books found matching "{searchQuery}"</p>
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