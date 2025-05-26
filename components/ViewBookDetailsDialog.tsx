'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ViewBookDetailsDialogProps {
  book: {
    title: string
    author?: string
    cover?: string
    description?: string
    publishedDate?: string
    genres?: string[]
    pageCount?: number
  }
}

export function ViewBookDetailsDialog({ book }: ViewBookDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-bookWhite bg-secondary-light border-none px-3"
        >
          View Details
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[85vw] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{book.title}</DialogTitle>
          {book.author && (
            <DialogDescription className="text-sm text-muted-foreground">
              by {book.author}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-4 mt-2">
          {book.cover && (
            <img
              src={book.cover}
              alt={`${book.title} cover`}
              className="w-full md:w-40 h-auto rounded-lg shadow"
            />
          )}

          <div className="flex-1 space-y-2 text-sm">
            {book.description && (
              <p className="text-muted-foreground whitespace-pre-line">
                {book.description}
              </p>
            )}

            <ul className="text-muted-foreground mt-4 space-y-1">
              {book.publishedDate && <li>📅 Published: {book.publishedDate}</li>}
              {book.pageCount && <li>📖 Pages: {book.pageCount}</li>}
              {book.genres?.length > 0 && (
                <li>
                  🏷️ Genres:{' '}
                  {book.genres.slice(0, 3).join(', ')}
                </li>
              )}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}