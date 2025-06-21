"use client"

import React, { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Share2, Calendar, MapPin, Book, Heart, Star } from "lucide-react"
import Image from "next/image"
import html2canvas from 'html2canvas';
import {Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useSession } from "next-auth/react";
import Link from "next/link"

function useSupabaseTokenExpiry() {
  const { data: session } = useSession();
  
  const getExpiryInfo = () => {
    if (!session?.supabaseAccessToken) {
      return { expired: true, expiryTime: null, timeUntilExpiry: 0 };
    }
    
    try {
      const payload = JSON.parse(atob(session.supabaseAccessToken.split('.')[1]));
      const expiryTime = new Date(payload.exp * 1000);
      const now = new Date();
      const timeUntilExpiry = expiryTime.getTime() - now.getTime();
      
      return {
        expired: timeUntilExpiry <= 0,
        expiryTime,
        timeUntilExpiry: Math.floor(timeUntilExpiry / 1000), // in seconds
        isExpiringSoon: timeUntilExpiry < (5 * 60 * 1000) // 5 minutes
      };
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return { expired: true, expiryTime: null, timeUntilExpiry: 0 };
    }
  };
  
  return getExpiryInfo();
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  date: string;
  duration_minutes: number | null;
  location: string | null;
  meeting_type: string;
  club: {
    id: string;
    name: string;
  };
  book?: {
    id: string;
    title: string;
    author: string;
  } | null;
}

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_url: string | null;
  pages: number | null;
  genres: string[];
  rating: number | null;
  reading_time: string;
  created_at: string;
  reactions: {
    counts: {
      HEART: number;
      LIKE: number;
      THUMBS_UP: number;
      THUMBS_DOWN: number;
      total: number;
    };
    userReaction: string | null;
  };
  is_favorite: boolean;
}

interface QuoteProps {
  quote:  string | null;
  author: string | null;
}

// Helper function to format the time until meeting
const formatTimeUntilMeeting = (meetingDate: string): string => {
  const now = new Date();
  const meeting = new Date(meetingDate);
  const diffMs = meeting.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Happening now';
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else {
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  }
};

// Helper function to format the meeting date and time
const formatMeetingDateTime = (meetingDate: string): string => {
  const date = new Date(meetingDate);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Helper function to format when book was added
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else {
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffMinutes}min${diffMinutes > 1 ? 's' : ''} ago`;
  }
};

export default function DashboardPage({
  quote:  initialQuote,
  author: initialAuthor,
}: QuoteProps) {

  const { data: session, status } = useSession(); 
   // local state seeded with whatever the server gave us
  const [quote,  setQuote]  = useState(initialQuote);
  const [author, setAuthor] = useState(initialAuthor);
  const [showOverlay, setShowOverlay] = useState(false);
  const quoteImageRef = useRef<HTMLDivElement>(null);
  const [downloadedImageUrl, setDownloadedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false); // For Radix dialog

  // Next meeting state
  const [nextMeeting, setNextMeeting] = useState<Meeting | null>(null);
  const [meetingLoading, setMeetingLoading] = useState(true);
  const [meetingError, setMeetingError] = useState<string | null>(null);

  // Latest book state
  const [latestBook, setLatestBook] = useState<Book | null>(null);
  const [bookLoading, setBookLoading] = useState(true);
  const [bookError, setBookError] = useState<string | null>(null);

const { expired, expiryTime, timeUntilExpiry, isExpiringSoon } = useSupabaseTokenExpiry();

// Fetch quotes
useEffect(() => {
    // Nothing to do if the server already provided a quote
    if (quote && author) return;

    (async () => {
      try {
        const res  = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotes`, {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('API error');

        const data: { quote: string; author: string } = await res.json();
        setQuote(data.quote);
        setAuthor(data.author);
      } catch {
        setQuote('A reader lives a thousand lives before he dies…');
        setAuthor('George R. R. Martin');
      }
    })();
  }, []);    // ← effect runs exactly once (prod) / twice (dev-strict)

// Fetch next meeting
useEffect(() => {
  const fetchNextMeeting = async () => {
    if (status !== 'authenticated' || !session?.supabaseAccessToken) {
      setMeetingLoading(false);
      return;
    }

    try {
      setMeetingLoading(true);
      setMeetingError(null);

      const response = await fetch('/api/meetings?next=true', {
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch meetings: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.meetings && data.meetings.length > 0) {
        setNextMeeting(data.meetings[0]);
      } else {
        setNextMeeting(null);
      }
    } catch (error) {
      console.error('Error fetching next meeting:', error);
      setMeetingError(error instanceof Error ? error.message : 'Failed to load meeting');
    } finally {
      setMeetingLoading(false);
    }
  };

  fetchNextMeeting();
}, [status, session?.supabaseAccessToken]);

// Fetch latest book
useEffect(() => {
  const fetchLatestBook = async () => {
    if (status !== 'authenticated' || !session?.supabaseAccessToken) {
      setBookLoading(false);
      return;
    }

    try {
      setBookLoading(true);
      setBookError(null);

      const response = await fetch('/api/books?latest=true', {
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        setLatestBook(data[0]);
      } else {
        setLatestBook(null);
      }
    } catch (error) {
      console.error('Error fetching latest book:', error);
      setBookError(error instanceof Error ? error.message : 'Failed to load book');
    } finally {
      setBookLoading(false);
    }
  };

  fetchLatestBook();
}, [status, session?.supabaseAccessToken]);

const handleClickShare = async () => {
  if (!quoteImageRef.current) return;
  
  setLoading(true);
  setShowOverlay((prev) => !prev)
  try {
    const canvas = await html2canvas(quoteImageRef.current);
    const dataUrl = canvas.toDataURL("image/png");
    setDownloadedImageUrl(dataUrl);
    setOpen(true); // Only open the dialog after the image is ready
     
  } catch (err) {
    console.error("Failed to generate image:", err);
    setDownloadedImageUrl(null);
    setOpen(true); // Open dialog anyway to show error
  } finally {
    setLoading(false);
    setShowOverlay((prev) => !prev)
    
  }
};

  return (
    <div className="container mx-auto pt-8 pb-6 px-4 mt-[-10px] mb-4 bg-secondary-light rounded-b-3xl">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-bookWhite pb-0">Hello, {session?.user?.name?.split(" ")[0] ?? "mysterious reader"}!</h1>
            <p className="text-bookWhite/70 font-serif">Good to see you again! Let's get reading.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Top section: 2 columns */}
          <div className="grid gap-4 grid-cols-5">
            {/* Left Column */}
            <div className="flex flex-col gap-4 col-span-3">
              <Card className="flex-1 bg-[url('/images/today-bg.svg')] bg-cover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-3 pb-2">
                  <CardTitle className="text-sm font-medium">Recently Added Book</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  {bookLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs text-bookBlack">Loading...</span>
                    </div>
                  ) : bookError ? (
                    <div>
                      <div className="text-sm font-bold text-red-600">Error</div>
                      <p className="text-xs text-bookBlack">{bookError}</p>
                    </div>
                  ) : latestBook ? (
                    <div className="flex items-start gap-3">
                      {/* Book Info */}
                      <Link href={`/books/${latestBook.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-bold text-bookBlack leading-tight truncate max-w-40">
                          {latestBook.title}
                        </div>
                        <div className="flex flex-row gap-1.5">
                          <p className="text-xs text-bookBlack/80 truncate max-w-32">by {latestBook.author}</p>
                          <p className="text-xs text-bookBlack/35">{formatTimeAgo(latestBook.created_at)}</p>
                        </div>
                      </div>
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xl font-bold">No books yet</div>
                      <p className="text-xs text-bookBlack">Add your first book to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="flex-1 bg-[url('/images/meeting-bg.svg')] bg-cover rounded-bl-3xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-3 pb-2">
                  <CardTitle className="text-sm font-medium">Next Meeting</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  {meetingLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs text-bookBlack">Loading...</span>
                    </div>
                  ) : meetingError ? (
                    <div>
                      <div className="text-sm font-bold text-red-600">Error</div>
                      <p className="text-xs text-bookBlack">{meetingError}</p>
                    </div>
                  ) : nextMeeting ? (
                    <Link href={`/calendar`}>
                    <div>
                      <div className="text-xl font-bold">{formatTimeUntilMeeting(nextMeeting.date)}</div>
                      <p className="text-xs text-bookBlack">{formatMeetingDateTime(nextMeeting.date)}</p>
                    </div>
                    </Link>
                  ) : (
                    <div>
                      <div className="text-xl font-bold">No meetings</div>
                      <p className="text-xs text-bookBlack">No upcoming meetings scheduled</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div
              onClick={() => setShowOverlay((prev) => !prev)}
              className="relative group h-full col-span-2"
            >
              <div ref={quoteImageRef} className="h-full flex flex-col justify-between bg-[url('/images/quote-img1.png')] bg-cover rounded-t-lg rounded-bl-lg rounded-br-3xl">
                <div className="flex-1 flex flex-col justify-center pt-4 px-3">
                  <blockquote className="text-[13px]/4 text-center font-semibold text-bookBlack">
                    {quote}
                  </blockquote>
                  <p className="text-xs mt-2 text-center text-bookBlack">{author}</p>
                </div>
              </div>
              

              {/* Overlay with centered Share button */}
              {showOverlay && (
                <div className="absolute inset-0 bg-black/50 flex items-center rounded-br-3xl justify-center z-10">
                  <Button onClick={handleClickShare} className="bg-white p-2 rounded-full shadow-md z-20">
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <Share2 className="w-6 h-6 text-black" />
                    )}
                  </Button>
               </div>
              )}
              </div>

                  <Dialog open={open} onOpenChange={setOpen}>
                      <DialogContent className="w-[85vw] rounded-2xl px-0 py-1">
                        <Image 
                          src="/images/background.png"
                          alt="Create and Manage your Book Clubs | BookCrush"
                          width={1622}
                          height={2871}
                          className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
                        />
                        {!downloadedImageUrl ? (
                          <p className="text-sm text-red-500">Failed to generate image. Try again.</p>
                        ) : (
                          <>
                            <DialogHeader className="px-6 pt-4">
                              <DialogTitle className="mt-7 text-center">Ready to share!</DialogTitle>
                              <DialogDescription>You can now share this quote on Instagram Stories, WhatsApp, or wherever you'd like.</DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-2 py-0">
                              <div className="h-[45vh] w-auto overflow-hidden mx-auto rounded-lg shadow-md">
                                <img
                                  src={downloadedImageUrl}
                                  alt="Quote preview"
                                  className="h-full w-auto object-contain mx-auto"
                                />
                              </div>

                              <div className="flex justify-end mt-4 mr-4">
                                <a
                                  href={downloadedImageUrl}
                                  download="quote.png"
                                  className="bg-primary text-secondary px-4 py-2 rounded-full text-sm hover:bg-primary-dark transition"
                                >
                                  Download image
                                </a>
                              </div>
                            </div>

                            <DialogFooter className="justify-end">
                            </DialogFooter>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                
              
            

            {/* Hidden Stylized Card to Generate Image */}
            <div
              ref={quoteImageRef}
              className="absolute -top-[9999px] left-0"
              aria-hidden="true"
            >
              <div className="w-[1080px] h-[1920px] pl-[138px] pr-[160px] bg-[url('/images/quote-img.png')] flex flex-col justify-center rounded-2xl shadow-xl">
                <p className="text-[55px] font-normal leading-[63px] text-secondary-light">"{quote}"</p>
                <p className="text-[45px] mt-4 font-serif font-medium text-secondary-light">— {author}</p>
              </div>
            </div>
          </div>

          {/* Bottom full-width card */}
          {/* <Card className="bg-accent-variant text-bookWhite">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-3 pb-2">
              <CardTitle className="text-sm font-medium">Recently added book</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-2xl font-bold">The Midnight Library</div>
              <p className="text-xs text-bookBlack">by Matt Haig</p>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  )
}
