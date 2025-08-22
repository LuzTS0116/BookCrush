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
  cover_url?: string
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
    if (!session?.supabaseAccessToken) return

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
      
      // Transform friendship data to friends array
      const friendsList: Friend[] = data.map((friendship: any) => {
        const friend = friendship.user_one?.id === session?.user?.id 
          ? friendship.user_two 
          : friendship.user_one
        
        return {
          id: friend?.id || '',
          display_name: friend?.display_name || 'Unknown',
          avatar_url: friend?.avatar_url
        }
      }).filter((friend: Friend) => friend.id)

      setFriends(friendsList)
    } catch (error) {
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
        <DialogHeader className="flex-shrink-0 mt-5">
          <DialogTitle className="flex items-center justify-center">
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
                    className="pl-10 bg-bookWhite/95 text-secondary placeholder:text-secondary/50"
                  />
                </div>

                {/* Friends List */}
                <ScrollArea className="flex-1 min-h-0">
                  {isFetchingFriends ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-accent" />
                      <span className="ml-2 text-sm text-secondary">Loading friends...</span>
                    </div>
                  ) : filteredFriends.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Users className="h-12 w-12 text-secondary/30 mb-3" />
                      <p className="text-sm text-secondary/70 mb-1">
                        {searchQuery ? 'No friends found' : 'No friends to recommend to'}
                      </p>
                      <p className="text-xs text-secondary/50">
                        {searchQuery ? 'Try a different search term' : 'Add friends to start sharing book recommendations'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredFriends.map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center space-x-3 p-2 hover:bg-bookWhite/30 rounded-md transition-colors"
                        >
                          <Checkbox
                            id={`friend-${friend.id}`}
                            checked={selectedFriends.includes(friend.id)}
                            onCheckedChange={() => handleFriendToggle(friend.id)}
                          />
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage
                              src={friend.avatar_url || undefined}
                              alt={friend.display_name}
                              className="h-full w-full object-cover"
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {friend.display_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                                                     <Label
                             htmlFor={`friend-${friend.id}`}
                             className="flex-1 text-sm font-medium cursor-pointer"
                           >
                             {friend.display_name}
                           </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {selectedFriends.length > 0 && (
                <div className="flex-shrink-0 pt-2">
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''} selected
                  </Badge>
                </div>
              )}
            </div>

            {/* Note Section */}
            <div className="flex-shrink-0 space-y-2">
              <Label htmlFor="recommendation-note" className="text-sm font-medium">
                Add a Note (Optional)
              </Label>
              <Textarea
                id="recommendation-note"
                placeholder="Tell your friends why you loved this book..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[80px] bg-bookWhite/95 text-secondary resize-none placeholder:text-secondary/50"
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-bookWhite/50">
                <span>Share what made this book special to you</span>
                <span>{note.length}/500</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendRecommendations}
            disabled={selectedFriends.length === 0 || isLoading}
            className="bg-accent hover:bg-accent-variant rounded-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Recommendation{selectedFriends.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 