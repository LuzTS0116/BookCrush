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
  bookStatus: UserBook['status'];
  bookMediaType: UserBook['media_type'];
  profileUserId: string;
  profileDisplayName: string | null;
}

export function ProfileBookHistory({ historyBooks, bookStatus, bookMediaType, profileUserId, profileDisplayName }: HistoryBookDialogProps) {
    const [open, setOpen] = React.useState(false)
    // const [bookReviews, setBookReviews] = useState<any[]>([]);
    const [userReaction, setUserReaction] = useState<any>(null);
    const [loading, setLoading] = useState(false)
  
    // Fetch book reviews and user's reaction when dialog opens
    const fetchBookDetails = async () => {
      if (!open) return;
      
      setLoading(true);
      try {
        // Fetch reviews
        // const reviewsResponse = await fetch(`/api/books/${historyBooks.book_id}/reviews`);
        // if (reviewsResponse.ok) {
        //   const reviews = await reviewsResponse.json();
        //   setBookReviews(reviews);
        // }
  
        // Fetch user's reaction and review
        const reactionResponse = await fetch(`/api/books/${historyBooks.book_id}/user-reaction-review?userId=${profileUserId}`);
        if (reactionResponse.ok) {
          const data = await reactionResponse.json();
          // Combine reaction and review data for easier display
          const combined = {
            type: data.reaction?.type || data.review?.rating,
            content: data.review?.content,
            created_at: data.reaction?.created_at || data.review?.created_at
          };
          setUserReaction(combined.type ? combined : null);
        }
      } catch (error) {
        console.error('Error fetching book details:', error);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchBookDetails();
    }, [open, historyBooks.book_id]);
  

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

  const firstName = profileDisplayName.split(" ")[0]

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
                  <h1 className="text-base leading-4 font-semibold max-w-40">{historyBooks.book.title}</h1>
                </Link>
              </div>
              <div className="text-xs text-secondary/50">{historyBooks.book.author}</div>
            </div>
            <div className="pb-0 px-0">
              <div className="flex flex-wrap gap-1.5 items-center mb-2">
                <span className="text-xs font-medium text-secondary-light/85 bg-primary/50 px-2 py-1 rounded-full">
                  {bookStatus}
                </span>
                <span className="text-xs font-medium py-1 px-2 bg-accent/40 rounded-full text-secondary/80">
                  {new Date(historyBooks.added_at).toLocaleDateString('en-US', {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
                {bookMediaType && (
                  <span className="p-1.5 bg-secondary/10 rounded-full text-xs text-secondary-light">
                    {(bookMediaType === "e_reader") ? <Smartphone className="w-4 h-4"/> : (bookMediaType === "audio_book") ? <Headphones className="w-4 h-4"/> : <BookOpen className="w-4 h-4"/>}
                  </span>
                )}
                {/* Personal Comment */}
                {historyBooks.comment && (
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <p className="text-sm italic">"{historyBooks.comment}"</p>
                  </div>
                )}
            </div>

            {/* User's Reaction */}
              {loading ? (
                <div className="mt-3 p-2 bg-secondary/5 rounded-lg">
                  <div className="text-xs text-secondary/60">Loading review...</div>
                </div>
              ) : userReaction && (userReaction.type) ? (
                <div className="mt-2 max-h-40 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-1">
                    {getReactionIcon(userReaction.type)}
                    <span className="text-sm font-medium">
                      {getReactionLabel(userReaction.type)}
                    </span>
                  </div>
                  {userReaction.content && (
                    <div className="bg-secondary/5 p-2 rounded-lg">
                      <p className="text-xs text-secondary/60 leading-4">{userReaction.content}</p>
                    </div>
                  )}
                </div>
              ) : open && !loading ? (
                <div className="mt-3 p-2 bg-secondary/5 rounded-lg">
                  <div className="text-xs leading-none text-secondary/60">{firstName} hasn't left a review for this book.</div>
                </div>
              ) : null }
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
