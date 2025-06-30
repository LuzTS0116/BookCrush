"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookMarked, Inbox, Send, Loader2, Gift, Users, X } from "lucide-react"
import { toast } from "sonner"
import { useSession } from 'next-auth/react'
import { RecommendationCard } from "./RecommendationCard"


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

interface RecommendationsMainProps {
  onClose?: () => void
}

export function RecommendationsMain({ onClose }: RecommendationsMainProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("inbox")
  const [inboxRecommendations, setInboxRecommendations] = useState<BookRecommendation[]>([])
  const [sentRecommendations, setSentRecommendations] = useState<BookRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)


  useEffect(() => {
    if (session?.supabaseAccessToken) {
      fetchRecommendations()
    }
  }, [session?.supabaseAccessToken])

  const fetchRecommendations = async () => {
    if (!session?.supabaseAccessToken) return

    setIsLoading(true)
    try {
      // Fetch both inbox and sent recommendations
      const [inboxResponse, sentResponse] = await Promise.all([
        fetch('/api/recommendations?type=inbox', {
          headers: {
            'Authorization': `Bearer ${session.supabaseAccessToken}`,
          }
        }),
        fetch('/api/recommendations?type=sent', {
          headers: {
            'Authorization': `Bearer ${session.supabaseAccessToken}`,
          }
        })
      ])

      if (!inboxResponse.ok || !sentResponse.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const [inboxData, sentData] = await Promise.all([
        inboxResponse.json(),
        sentResponse.json()
      ])

      setInboxRecommendations(inboxData.recommendations || [])
      setSentRecommendations(sentData.recommendations || [])

      // Count unread recommendations
      const unread = (inboxData.recommendations || []).filter(
        (rec: BookRecommendation) => rec.status === 'PENDING'
      ).length
      setUnreadCount(unread)

    } catch (error: any) {
      console.error('Error fetching recommendations:', error)
      toast.error('Failed to load recommendations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecommendationUpdate = (id: string, status: string) => {
    // Update the recommendation in the appropriate list
    setInboxRecommendations(prev => 
      prev.map(rec => 
        rec.id === id 
          ? { ...rec, status: status as any, responded_at: new Date().toISOString() }
          : rec
      )
    )

    // Update unread count if status changed from PENDING
    if (status !== 'PENDING') {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const handleRecommendationDelete = (id: string) => {
    setSentRecommendations(prev => prev.filter(rec => rec.id !== id))
  }

  // return (
  //   <div className="flex flex-col">
  //      {/* Header */}
  //      <div className="flex flex-col items-center justify-between mb-6 mt-5">
  //        <div>
  //          <h2 className="text-xl font-semibold text-center text-bookWhite">Book Recommendations</h2>
  //          <p className="text-sm text-bookWhite font-serif text-center">Share and discover great reads with friends</p>
  //        </div>
  //      </div>

  //     {/* Tabs */}
  //     <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
  //       <div className="flex justify-center">
  //         <TabsList className="bg-secondary-light text-primary rounded-full">
  //           <TabsTrigger value="inbox" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">
  //             <Inbox className="h-4 w-4 mr-1" />
  //             Inbox
  //             {unreadCount > 0 && (
  //               <Badge variant="secondary" className="bg-primary text-secondary-light ml-1">
  //                 {unreadCount}
  //               </Badge>
  //             )}
  //           </TabsTrigger>
  //           <TabsTrigger value="sent" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">
  //             <Send className="h-4 w-4 mr-1" />
  //             Sent
  //             {/* {sentRecommendations.length > 0 && (
  //               <Badge variant="secondary" className="bg-primary text-secondary-light ml-1">
  //                 {sentRecommendations.length}
  //               </Badge>
  //             )} */}
  //           </TabsTrigger>
  //         </TabsList>
  //       </div>

  //       <TabsContent value="inbox" className="flex-1 mt-0">
  //         <ScrollArea className="h-[400px]">
  //           {inboxRecommendations.length === 0 ? (
  //             <div className="flex flex-col items-center justify-center py-12 text-center">
  //               <div className="p-4 bg-accent/5 rounded-full mb-4">
  //                 <Gift className="h-12 w-12 text-bookWhite/50" />
  //               </div>
  //               <h3 className="text-lg font-semibold text-bookWhite mb-2">No recommendations yet</h3>
  //               <p className="text-sm text-bookWhite/70 max-w-sm">
  //                 When friends recommend books to you, they'll appear here. Start by recommending books to your friends!
  //               </p>
  //             </div>
  //           ) : (
  //             <div className="space-y-3">
  //               {inboxRecommendations.map((recommendation) => (
  //                 <RecommendationCard
  //                   key={recommendation.id}
  //                   recommendation={recommendation}
  //                   type="inbox"
  //                   onUpdate={handleRecommendationUpdate}
  //                 />
  //               ))}
  //             </div>
  //           )}
  //         </ScrollArea>
  //       </TabsContent>

  //       <TabsContent value="sent" className="flex-1 mt-0">
  //         <p>hello world 2</p>
  //       </TabsContent>
  //     </Tabs>
  //   </div>
  // )


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center my-6">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="text-bookWhite font-light">Loading recommendations...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center justify-between mb-6 mt-5">
        <div>
          <h2 className="text-xl font-semibold text-center text-bookWhite">Book Recommendations</h2>
          <p className="text-sm text-bookWhite font-serif text-center">Share and discover great reads with friends</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-center">
          <TabsList className="bg-secondary-light text-primary rounded-full">
            <TabsTrigger value="inbox" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">
              <Inbox className="h-4 w-4 mr-1" />
              Inbox
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-primary-dark/65 text-secondary-light ml-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full">
              <Send className="h-4 w-4 mr-1" />
              Sent
              {/* {sentRecommendations.length > 0 && (
                <Badge variant="secondary" className="bg-primary text-secondary-light ml-1">
                  {sentRecommendations.length}
                </Badge>
              )} */}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="inbox" className="flex-1 mt-0">
          <ScrollArea className="h-[400px]">
            {inboxRecommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-accent/5 rounded-full mb-4">
                  <Gift className="h-12 w-12 text-bookWhite/50" />
                </div>
                <h3 className="text-lg font-semibold text-bookWhite mb-2">No recommendations yet</h3>
                <p className="text-sm text-bookWhite/70 max-w-sm">
                  When friends recommend books to you, they'll appear here. Start by recommending books to your friends!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {inboxRecommendations.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    type="inbox"
                    onUpdate={handleRecommendationUpdate}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="sent" className="flex-1 mt-0">
          <ScrollArea className="h-[400px]">
            {sentRecommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-accent/5 rounded-full mb-4">
                  <Users className="h-12 w-12 text-accent/50" />
                </div>
                <h3 className="text-lg font-semibold text-secondary mb-2">No recommendations sent</h3>
                <p className="text-sm text-secondary/70 max-w-sm">
                  Share your favorite books with friends! Recommendations help friends discover great reads.
                </p>
                <p className="text-xs text-secondary/50">
                  You can recommend books directly from the Books page by clicking the + menu on any book card.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentRecommendations.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    type="sent"
                    onDelete={handleRecommendationDelete}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

    </div>
  )
} 