import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2, BookOpen } from "lucide-react"
import { useDebounce } from '@/lib/hooks/use-debounce'

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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select a Book</DialogTitle>
          <DialogDescription>
            Search for a book to set as the club's current book.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : books.length > 0 ? (
            <div className="space-y-4">
              {books.map((book) => (
                <div
                  key={book.id}
                  className={`flex gap-4 p-3 rounded-lg border transition-colors
                    ${selectedBookId === book.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <div className="w-16 h-24 bg-muted/30 rounded-md flex items-center justify-center overflow-hidden">
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
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium leading-none truncate">{book.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{book.author}</p>
                    <p className="text-sm mt-2 line-clamp-2">{book.description}</p>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => handleSelect(book.id)}
                      disabled={selecting && selectedBookId === book.id}
                    >
                      {selecting && selectedBookId === book.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Selecting...
                        </>
                      ) : (
                        'Select Book'
                      )}
                    </Button>
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