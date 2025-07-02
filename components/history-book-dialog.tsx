"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UserBook } from "@/types/book";
import { CircleCheckBig, CircleAlert, Heart, ThumbsUp, ThumbsDown, Star, EllipsisVertical, Headphones, Smartphone, BookOpen, BookMarked } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface UserReactionReview {
  reaction: {
    type: 'HEART' | 'THUMBS_UP' | 'THUMBS_DOWN' | 'LIKE';
    created_at: string;
  } | null;
  review: {
    content: string;
    rating: 'HEART' | 'THUMBS_UP' | 'THUMBS_DOWN' | 'LIKE';
    created_at: string;
    updated_at: string;
  } | null;
}

interface HistoryBookDialogProps {
  historyBooks: UserBook;
  onMoveToShelf?: (bookId: string, shelf: string, title: string) => void;
  onRemoveFromShelf?: (bookId: string, title: string) => void;
  onRecommendBook?: (userBook: UserBook) => void;
}

export function HistoryBookDialog({ historyBooks, onMoveToShelf, onRemoveFromShelf, onRecommendBook }: HistoryBookDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [userReactionReview, setUserReactionReview] = useState<UserReactionReview | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch user's reaction and review when dialog opens
  useEffect(() => {
    if (open) {
      fetchUserReactionReview()
    }
  }, [open, historyBooks.book_id])

  const fetchUserReactionReview = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/books/${historyBooks.book_id}/user-reaction-review`)
      if (response.ok) {
        const data = await response.json()
        setUserReactionReview(data)
      } else {
        console.error('Failed to fetch user reaction and review')
      }
    } catch (error) {
      console.error('Error fetching user reaction and review:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReactionIcon = (type: string) => {
    switch (type) {
      case 'HEART':
        return <Heart className="h-4 w-4 text-red-500 fill-red-500" />
      case 'THUMBS_UP':
        return <ThumbsUp className="h-4 w-4 text-green-500 fill-green-500" />
      case 'THUMBS_DOWN':
        return <ThumbsDown className="h-4 w-4 text-red-500 fill-red-500" />
      case 'LIKE':
        return <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
      default:
        return null
    }
  }

  const getReactionLabel = (type: string) => {
    switch (type) {
      case 'HEART':
        return 'Loved it'
      case 'THUMBS_UP':
        return 'Liked it'
      case 'THUMBS_DOWN':
        return 'Disliked it'
      case 'LIKE':
        return 'Enjoyed it'
      default:
        return 'Unknown'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <img
          src={historyBooks.book.cover_url || "/placeholder.svg"}
          alt={historyBooks.book.title || "Book cover"}
          className="h-full w-full shadow-md rounded object-cover"
        />
      </DialogTrigger>
      <DialogContent className="w-[90vw] bg-bookWhite text-secondary rounded-2xl p-3">
        <div className="flex flex-row gap-3 p-0">
          <div className="w-[100px] flex-shrink-0">
            <Link href={`/books/${historyBooks.book_id}`}>
              <img
                src={historyBooks.book.cover_url || "/placeholder.svg"}
                alt={historyBooks.book.title || "Book cover"}
                className="h-auto w-full shadow-md rounded object-cover"
              />
            </Link>
          </div>
          <div className="flex flex-col flex-1">
            <div className="pb-2 px-0 pt-0">
              <div className="flex flex-row justify-between items-start">
                <Link href={`/books/${historyBooks.book_id}`}>
                  <h1 className="text-base leading-5 max-w-40">{historyBooks.book.title}</h1>
                </Link>
              </div>
              <div className="text-xs text-secondary/50">{historyBooks.book.author}</div>
            </div>
            <div className="pb-0 px-0">
              <div className="flex flex-wrap gap-1.5 items-center mb-2">
                <span className="text-xs font-medium text-secondary-light/85 bg-primary/50 px-2 py-1 rounded-full">
                  {historyBooks.status.replace('_', ' ')}
                </span>
                <span className="text-xs font-medium py-1 px-2 bg-accent/40 rounded-full text-secondary/80">
                  {new Date(historyBooks.added_at).toLocaleDateString('en-US', {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>

                {historyBooks.media_type && (
                  <span className="p-1.5 bg-secondary/10 rounded-full text-xs text-secondary-light">
                  {(historyBooks.media_type === "e_reader") ? <Smartphone className="w-4 h-4"/> : (historyBooks.media_type === "audio_book") ? <Headphones className="w-4 h-4"/> : <BookOpen className="w-4 h-4"/>}
                </span>
                )}
                
                {/* 3-dots menu */}
                {(onMoveToShelf || onRemoveFromShelf || onRecommendBook) && (
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs flex items-center px-1 py-1 rounded-full h-auto gap-1 bg-secondary/10 border-none hover:bg-secondary/20 shadow-sm"
                      >
                        <EllipsisVertical className="h-3 w-3 text-secondary" />
                      </Button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="w-auto rounded-xl flex flex-col items-end bg-transparent shadow-xl px-1 mr-12 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1 z-[60]"
                        sideOffset={5}
                      >
                        {onMoveToShelf && (
                          <>
                            <DropdownMenu.Item
                              onSelect={() => onMoveToShelf(historyBooks.book_id, 'currently_reading', historyBooks.book.title)}
                              className="px-3 py-2 text-xs text-center bg-secondary/90 my-1 rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                            >
                              Move to Currently Reading
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onSelect={() => onMoveToShelf(historyBooks.book_id, 'queue', historyBooks.book.title)}
                              className="px-3 py-2 text-xs text-center bg-secondary/90 my-1 rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                            >
                              Move to Reading Queue
                            </DropdownMenu.Item>
                          </>
                        )}
                        {onRecommendBook && (
                          <DropdownMenu.Item
                            onSelect={() => onRecommendBook(historyBooks)}
                            className="px-3 py-2 text-xs text-center bg-accent/90 text-secondary my-1 rounded-md cursor-pointer hover:bg-accent-variant hover:text-secondary focus:bg-accent-variant focus:outline-none transition-colors"
                          >
                            <div className="flex items-center justify-center gap-1">
                              Recommend to Friends
                            </div>
                          </DropdownMenu.Item>
                        )}
                        {onRemoveFromShelf && (
                          <DropdownMenu.Item
                            onSelect={() => onRemoveFromShelf(historyBooks.book_id, historyBooks.book.title)}
                            className="px-3 py-2 text-xs text-center bg-red-700/90 my-1 rounded-md cursor-pointer hover:bg-red-600 hover:text-bookWhite focus:bg-red-600 focus:outline-none transition-colors"
                          >
                            Remove from Shelf
                          </DropdownMenu.Item>
                        )}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                )}

                 
              </div>
              
              {/* User's Reaction and Review Section */}
              {loading ? (
                <div className="mt-3 p-2 bg-bookBlack/5 rounded-lg">
                  <div className="text-xs text-secondary/60">Loading your review...</div>
                </div>
              ) : userReactionReview && (userReactionReview.reaction || userReactionReview.review) ? (
                <div className="mt-3 p-2 bg-bookBlack/5 rounded-lg space-y-0">
                  {/* User's Reaction */}
                  {userReactionReview.reaction && (
                    <div className="flex items-center gap-2 mb-1">
                      {getReactionIcon(userReactionReview.reaction.type)}
                      <span className="text-xs font-bold text-secondary/70">
                         {getReactionLabel(userReactionReview.reaction.type)}
                      </span>
                    </div>
                  )}
                  
                  {/* User's Review */}
                  {userReactionReview.review && (
                    <div className="space-y-1 mt-1">
                      <p className="text-xs text-secondary/70 leading-3">
                        "{userReactionReview.review.content}"
                      </p>
                    </div>
                  )}
                </div>
              ) : open && !loading ? (
                <div className="mt-3 p-2 bg-bookBlack/5 rounded-lg">
                  <div className="text-xs text-secondary/60">You haven't left a review for this book.</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}