"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"
import Link from "next/link"
import { UserBook } from "@/types/book"
import { Heart } from "@phosphor-icons/react";
import { toast } from "sonner"; // Changed from react-hot-toast to sonner
import { useSession } from "next-auth/react"; // Add session management
import { BookDetails } from "@/types/book";

// Extended BookDetails interface to include creator info
interface ExtendedBookDetails extends BookDetails {
  added_by_user?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export function FavoriteBookDialog({ 
  userBook, 
  onFavoriteChange
}: { 
   userBook: UserBook;
  onFavoriteChange?: (bookId: string, isFavorite: boolean) => void;
}) {
  const { data: session, status } = useSession(); // Add session management
  const [open, setOpen] = React.useState(false)
  // Local state to track favorite status for this specific book
  const [isFavorite, setIsFavorite] = useState(userBook.is_favorite || false);

  // Sync local state when userBook prop changes
  useEffect(() => {
    setIsFavorite(userBook.is_favorite || false);
  }, [userBook.is_favorite]);

  // Add book to favorites - heart
  const handleFavorite = async (bookId: string) => {
    if (!bookId) return;
    if (!session?.supabaseAccessToken) {
      toast.error('Authentication required');
      return;
    }
    
    // Store current state for potential revert
    const currentFavoriteState = isFavorite;
    
    // Optimistically update UI
    setIsFavorite(!isFavorite);
    
    try {
      const response = await fetch('/api/books/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        },
        body: JSON.stringify({ bookId }),
      });
      
      if (!response.ok) {
        // Revert UI change if API call fails
        setIsFavorite(currentFavoriteState);
        throw new Error('Failed to update favorite status');
      }
      
      const data = await response.json();
      console.log('Favorite status updated:', data);
      
      // Update state with actual server response to ensure consistency
      setIsFavorite(data.is_favorite);
      
      // Notify parent component of the change
      onFavoriteChange?.(bookId, data.is_favorite);
      
      // Show feedback
      if (data.is_favorite) {
        toast.success('Added to favorites!');
      } else {
        toast.success('Removed from favorites');
      }
      
    } catch (error) {
      console.error('Error updating favorite status:', error);
      toast.error('Failed to update favorite status');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <img
          src={userBook.book.cover_url || "/placeholder.svg"}
          alt={userBook.book.title || "Book cover"}
          className="h-full w-full shadow-md rounded object-cover"
        />
      </DialogTrigger>
      <DialogContent className="w-[85vw] bg-bookWhite text-secondary rounded-2xl p-3">
        <div className="flex flex-row gap-3 p-0">
          <div className="w-[100px] flex-shrink-0">
            <Link href={`/books/${userBook.book_id}`}>
              <img
                src={userBook.book.cover_url || "/placeholder.svg"}
                alt={userBook.book.title || "Book cover"}
                className="h-auto w-full shadow-md rounded object-cover"
              />
            </Link>
          </div>
          <div className="flex flex-col flex-1">
            <div className="pb-2 px-0 pt-0">
              <div className="flex flex-row justify-between items-start">
                <Link href={`/books/${userBook.book_id}`}>
                  <h1 className="text-base leading-5 max-w-40">{userBook.book.title}</h1>
                </Link>
              </div>
              <div className="text-xs text-secondary/50">{userBook.book.author}</div>
            </div>
            <div className="pb-0 px-0">
              <div className="flex flex-wrap gap-1.5 items-center">
                <div className="flex flex-wrap gap-1">
                  {userBook.book.genres?.slice(0, 3).map((genre: string) => (
                    <span
                      key={genre}
                      className="bg-accent/30 text-secondary/40 text-xs/3 font-medium px-2 py-1 rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-secondary/80 font-sans font-normal text-sm inline-block">
                {userBook.book.pages} pages • {userBook.book.reading_time}
              </p>
              {userBook.book_id && (
                    <div className="flex justify-end items-end">
                        <button
                        onClick={() => handleFavorite(userBook.book_id)}
                        className={`p-0 absolute bottom-3 right-3`}
                        >
                        <Heart
                            className="h-5 w-5"
                            color="#C51104"
                            weight={isFavorite ? "fill" : "regular"}
                        />
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}