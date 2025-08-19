"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BookMarked, Plus, Check, X, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useSession } from 'next-auth/react'
import Link from "next/link"

interface BookRecommendation {
  id: string
  book_id: string
  from_user_id: string
  to_user_id: string
  note?: string | null
  status: 'PENDING' | 'READ' | 'ADDED' | 'DISMISSED'
  created_at: string
  read_at?: string | null
  responded_at?: string | null
  book: {
    id: string
    title: string
    author: string
    cover_url: string
    genres: string[]
    description?: string
    pages?: number
    reading_time?: string
  }
  from_user?: {
    id: string
    display_name: string
    avatar_url?: string | null
  }
  to_user?: {
    id: string
    display_name: string
    avatar_url?: string | null
  }
}

interface RecommendationCardProps {
  recommendation: BookRecommendation
  type: 'inbox' | 'sent'
  onUpdate?: (id: string, status: string) => void
  onDelete?: (id: string) => void
}

export function RecommendationCard({ 
  recommendation, 
  type, 
  onUpdate, 
  onDelete 
}: RecommendationCardProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const handleAddToShelf = async (shelf: 'queue' | 'currently_reading') => {
    if (!session?.supabaseAccessToken) {
      toast.error('Authentication required')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/recommendations/${recommendation.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addToShelf',
          shelf: shelf
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add book to shelf')
      }

      const shelfName = shelf === 'currently_reading' ? 'Currently Reading' : 'Reading Queue'
      toast.success(`"${recommendation.book.title}" added to ${shelfName}!`)
      
      if (onUpdate) {
        onUpdate(recommendation.id, 'ADDED')
      }
    } catch (error: any) {
      console.error('Error adding book to shelf:', error)
      toast.error(`Failed to add book: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = async () => {
    if (!session?.supabaseAccessToken) {
      toast.error('Authentication required')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/recommendations/${recommendation.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'DISMISSED'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to dismiss recommendation')
      }

      toast.success('Recommendation dismissed')
      
      if (onUpdate) {
        onUpdate(recommendation.id, 'DISMISSED')
      }
    } catch (error: any) {
      console.error('Error dismissing recommendation:', error)
      toast.error(`Failed to dismiss: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!session?.supabaseAccessToken) {
      toast.error('Authentication required')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/recommendations/${recommendation.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete recommendation')
      }

      toast.success('Recommendation deleted')
      
      if (onDelete) {
        onDelete(recommendation.id)
      }
    } catch (error: any) {
      console.error('Error deleting recommendation:', error)
      toast.error(`Failed to delete: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusBadge = () => {
    switch (recommendation.status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">New</Badge>
      case 'READ':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Viewed</Badge>
      case 'ADDED':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Added to Shelf</Badge>
      case 'DISMISSED':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Dismissed</Badge>
      default:
        return null
    }
  }

  const otherUser = type === 'inbox' ? recommendation.from_user : recommendation.to_user

  return (
    <Card className="bg-bookWhite/90 hover:bg-bookWhite transition-colors">
      <CardContent className="p-2.5">
        <div className="flex flex-col">
          <div className="flex flex-row gap-2">
            {/* Book Cover */}
            <div className="w-20 h-auto flex-shrink-0">
              <Link href={`/books/${recommendation.book.id}`}>
                <img
                  src={recommendation.book.cover_url || "/placeholder.svg"}
                  alt={recommendation.book.title}
                  className="w-full h-auto object-cover rounded shadow-sm hover:shadow-md transition-shadow"
                />
              </Link>
            </div>

            {/* Content */}
            <div className="flex flex-col w-full">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <Link href={`/books/${recommendation.book.id}`}>
                    <h3 className="font-semibold text-secondary leading-none hover:text-secondary/80 transition-colors truncate max-w-[175px]">
                      {recommendation.book.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-secondary/70 truncate max-w-[175px]">
                    by {recommendation.book.author}
                  </p>
                </div>
                {getStatusBadge()}
              </div>

              {/* User info and note */}
              <div className="mb-1 leading-3 italic mt-1">
                {/* <Avatar className="h-6 w-6">
                  <AvatarImage src={otherUser?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs text-bookWhite">
                    {otherUser?.display_name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar> */}
                <span className="text-xs text-secondary-light/70">
                  {type === 'inbox' ? 'from' : 'sent to'} {otherUser?.display_name} •
                </span>
                <span className="text-xs text-secondary-light/50">
                  {" "}{formatDate(recommendation.created_at)}
                </span>
              </div>

              {/* Genre Tags */}
              <div className="flex flex-wrap gap-1">
                {recommendation.book.genres?.slice(0, 1).map((genre: string) => (
                  <span
                    key={genre}
                    className="bg-accent/30 text-secondary/40 text-xs/3 font-medium px-2 py-1 rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Book details */}
              {recommendation.book.pages && (
                <div className="flex-1 mb-1">
                  <p className="inline-block text-xs text-secondary/60 rounded-full bg-primary/80 py-0.5 px-2">{recommendation.book.pages} pages • {recommendation.book.reading_time}</p>
                </div>
              )}

              {/* Note */}
              {type === 'sent' && (
                <>
                {recommendation.note && (
                <div className="bg-accent-variant/10 rounded-lg p-1 mb-2">
                  <p className="text-sm text-secondary/65 italic leading-4">
                    "{recommendation.note}"
                  </p>
                </div>
                )}
                </>
              )}

            </div>
          </div>
          
          {/* Note */}
          {type === 'inbox' && (
            <>
            {recommendation.note && (
            <div className="bg-accent-variant/10 rounded-lg p-1 my-2">
              <p className="text-sm text-secondary/65 italic">
                "{recommendation.note}"
              </p>
            </div>
            )}
            </>
          )}

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-1">
            {type === 'inbox' && recommendation.status === 'PENDING' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleAddToShelf('queue')}
                  disabled={isLoading}
                  className="bg-accent/90 hover:bg-accent-variant text-bookWhite rounded-full h-7 px-3 text-xs"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      Queue
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAddToShelf('currently_reading')}
                  disabled={isLoading}
                  variant="outline"
                  className="rounded-full text-accent-variant h-7 border-accent-variant bg-accent-variant/5 hover:bg-accent-variant text-xs font-serif"
                >
                  Start Reading
                  <Sparkles className="h-3 w-3"/>
                </Button>
                <Button
                  size="sm"
                  onClick={handleDismiss}
                  disabled={isLoading}
                  variant="outline"
                  className="rounded-full h-7 px-3 text-xs text-secondary font-serif bg-secondary-light/10"
                >
                  Dismiss
                </Button>
              </>
            )}

            {type === 'sent' && (
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
                variant="outline"
                className="rounded-full h-7 px-3 text-xs text-red-800 border-red-800 font-serif bg-red-800/10"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <X className="h-3 w-3" />
                    Delete
                  </>
                )}
              </Button>
            )}

            {type === 'inbox' && recommendation.status === 'ADDED' && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" />
                Added to your shelf
              </Badge>
            )}
          </div>
          
        </div>
      </CardContent>
    </Card>
  )
} 