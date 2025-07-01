"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookDetails, BookFile, UserBook, StatusDisplay, TabDisplay } from "@/types/book";
import { CircleCheckBig, CircleAlert, Heart, ThumbsUp, ThumbsDown, Star, EllipsisVertical, Headphones, Smartphone, BookOpen, BookMarked } from "lucide-react";

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
  bookStatus: string;
  bookMediaType: string;
}

export function ProfileBookHistory({ historyBooks, bookStatus, bookMediaType }: HistoryBookDialogProps) {
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
                    <div className="flex items-center gap-2">
                      {getReactionIcon(userReactionReview.reaction.type)}
                      <span className="text-xs font-bold text-secondary/70">
                         {getReactionLabel(userReactionReview.reaction.type)}
                      </span>
                    </div>
                  )}
                  
                  {/* User's Review */}
                  {userReactionReview.review && (
                    <div className="space-y-1">
                      <p className="text-xs text-secondary/70 italic leading-relaxed">
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