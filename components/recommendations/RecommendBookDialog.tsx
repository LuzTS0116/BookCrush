"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookMarked, Search, Loader2, Users, Send } from "lucide-react"
import { toast } from "sonner"
import { useSession } from 'next-auth/react'

interface Friend {
  id: string
  display_name: string
  avatar_url?: string | null
}

interface Book {
  id: string
  title: string
  author: string
  cover_url: string
}

interface RecommendBookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  book?: Book | null
  onSuccess?: () => void
}

export function RecommendBookDialog({
  open,
  onOpenChange,
  book,
  onSuccess
}: RecommendBookDialogProps) {
  const { data: session } = useSession()
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [note, setNote] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingFriends, setIsFetchingFriends] = useState(false)

  // Fetch friends when dialog opens
  useEffect(() => {
    if (open && session?.supabaseAccessToken && session?.user?.id) {
      fetchFriends()
    }
  }, [open, session?.supabaseAccessToken, session?.user?.id])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedFriends([])
      setNote("")
      setSearchQuery("")
    }
  }, [open])

  const fetchFriends = async () => {
    if (!session?.supabaseAccessToken || !session?.user?.id) return

    setIsFetchingFriends(true)
    try {
      const response = await fetch('/api/friends?type=friends', {
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch friends')
      }

      const data = await response.json()
      console.log('Friends data:', data)
      
      // Extract friend information from friendship objects
      const friendsList: Friend[] = data.map((friendship: any) => {
        // Determine which user is the friend (not the current user)
        const currentUserId = session.user?.id
        const friend = friendship.userId1 === currentUserId ? friendship.user_two : friendship.user_one
        
        return {
          id: friend.id,
          display_name: friend.display_name,
          avatar_url: friend.avatar_url
        }
      })
      
      setFriends(friendsList)
    } catch (error: any) {
      console.error('Error fetching friends:', error)
      toast.error('Failed to load friends')
    } finally {
      setIsFetchingFriends(false)
    }
  }

  const handleFriendToggle = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  const handleSendRecommendations = async () => {
    if (!session?.supabaseAccessToken || !book) {
      toast.error('Authentication required')
      return
    }

    if (selectedFriends.length === 0) {
      toast.error('Please select at least one friend')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/books/${book.id}/recommend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          friendIds: selectedFriends,
          note: note.trim() || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send recommendations')
      }

      const data = await response.json()
      
      toast.success(
        `Successfully recommended "${book.title}" to ${data.success.length} friend${data.success.length > 1 ? 's' : ''}!`
      )

      if (data.errors && data.errors.length > 0) {
        console.warn('Some recommendations failed:', data.errors)
      }

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error('Error sending recommendations:', error)
      toast.error(`Failed to send recommendations: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredFriends = friends.filter(friend =>
    friend.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[90vw] max-h-[85vh] flex flex-col px-4">
        <DialogHeader className="flex-shrink-0 mt-3">
          <DialogTitle className="flex items-center justify-center gap-2">
            Recommend Book
          </DialogTitle>
          <DialogDescription className="font-serif leading-4">
            Share a story — let a friend discover their next great read!
          </DialogDescription>
        </DialogHeader>

        {book && (
          <div className="flex gap-3 p-2 bg-bookWhite/95 rounded-lg flex-shrink-0">
            <img
              src={book.cover_url || "/placeholder.svg"}
              alt={book.title}
              className="w-12 h-16 object-cover rounded shadow-sm"
            />
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h4 className="font-semibold text-secondary truncate leading-none">{book.title}</h4>
              <p className="text-sm text-secondary/70 truncate">by {book.author}</p>
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="space-y-4 h-full flex flex-col">
            {/* Friend Selection */}
            <div className="flex-1 min-h-0 flex flex-col">
              <Label className="text-sm font-medium flex-shrink-0">Select Friends</Label>
              <div className="mt-2 space-y-3 flex-1 min-h-0 flex flex-col">
                {/* Search */}
                <div className="relative flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary/50" />
                  <Input
                    placeholder="Search friends..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-bookWhite/95 text-secondary"
                  />
                </div>

                {/* Friends List - Flexible height */}
                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full border rounded-lg p-2">
                    {isFetchingFriends ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-accent" />
                        <span className="ml-2 text-sm text-secondary/70">Loading friends...</span>
                      </div>
                    ) : filteredFriends.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Users className="h-8 w-8 text-secondary/30 mb-2" />
                        <p className="text-sm text-secondary/70">
                          {searchQuery ? 'No friends found matching your search' : 'No friends found'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredFriends.map((friend) => (
                          <div
                            key={friend.id}
                            className="flex items-center space-x-3 py-1 px-2 rounded-lg hover:bg-accent/5 transition-colors"
                          >
                            <Checkbox
                              id={friend.id}
                              checked={selectedFriends.includes(friend.id)}
                              onCheckedChange={() => handleFriendToggle(friend.id)}
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={friend.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {friend.display_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <label
                              htmlFor={friend.id}
                              className="flex-1 text-sm font-medium cursor-pointer"
                            >
                              {friend.display_name}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Selected Count - Fixed position */}
                {selectedFriends.length > 0 && (
                  <div className="flex-shrink-0">
                    <Badge variant="secondary" className="bg-accent/10 text-accent">
                      {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''} selected
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Note */}
            <div className="flex-shrink-0">
              <Label htmlFor="note" className="text-sm font-medium">
                Personal Note (Optional)
              </Label>
              <Textarea
                id="note"
                placeholder="Add a personal message about why you're recommending this book..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-2 resize-none bg-bookWhite/95 border-none text-secondary placeholder:text-secondary/60 font-light text-sm leading-4"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-bookWhite/50 text-right mt-1">
                {note.length}/500 characters
              </p>
            </div>
          </div>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex gap-2 pt-4 flex-shrink-0 border-t border-border/50 mt-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendRecommendations}
            disabled={isLoading || selectedFriends.length === 0}
            className="flex-1 bg-accent/80 hover:bg-accent-variant text-bookWhite"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Recommendation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 