"use client"

import React, { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Calendar, BookMarked, ChevronRight, Plus, Upload, Share2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import html2canvas from 'html2canvas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useSession } from "next-auth/react";

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

interface QuoteProps {
  quote:  string | null;
  author: string | null;
}

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
  const [showDialog, setShowDialog] = useState(false);
  const [open, setOpen] = useState(false); // For Radix dialog

  const { expired, expiryTime, timeUntilExpiry, isExpiringSoon } = useSupabaseTokenExpiry();
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
  }, []);       
  
  // ← effect runs exactly once (prod) / twice (dev-strict)


// Shareable Image
const handleImageShare = async (ref: HTMLDivElement | null): Promise<string | null> => {
  if (!ref) return null;

  const canvas = await html2canvas(ref, {
    backgroundColor: null,
    useCORS: true,
  });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
  if (!blob) return null;

  const url = URL.createObjectURL(blob);

  // Download automatically
  const a = document.createElement('a');
  a.href = url;
  a.download = 'daily-quote.png';
  a.click();

  return url; // We’ll use this for the preview dialog
};
  
const handleClickShare = async () => {
  if (!quoteImageRef.current) return;

  try {
    const canvas = await html2canvas(quoteImageRef.current);
    const dataUrl = canvas.toDataURL('image/png');

    setDownloadedImageUrl(dataUrl); // Set the image for preview
  } catch (err) {
    console.error('Failed to generate image:', err);
    setDownloadedImageUrl(null);
  }
};

  return (
    <div className="container mx-auto pt-8 pb-6 px-4 mt-[-10px] mb-4 bg-secondary-light rounded-b-3xl">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-bookWhite pb-0">Hello, {session?.user?.name ?? "mysterious reader"}!</h1>
            <p className="text-bookWhite/70 font-serif">Good to see you again! Let's get reading.</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-bookWhite/20 hover:bg-primary-light text-bookWhite rounded-full">
                  <Plus className="mr-2 h-4 w-4" /> Add Book
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Book</DialogTitle>
                  <DialogDescription>Enter the details of the book you want to add to your collection.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cover">Book Cover</Label>
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-40 w-32 bg-muted flex items-center justify-center rounded-md overflow-hidden">
                        <img
                          src="/placeholder.svg?height=160&width=120"
                          alt="Book cover preview"
                          className="max-h-full max-w-full"
                        />
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        <Upload className="mr-2 h-4 w-4" /> Upload Cover
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" placeholder="Enter book title" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="author">Author</Label>
                    <Input id="author" placeholder="Enter author name" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Select>
                      <SelectTrigger id="genre">
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fiction">Fiction</SelectItem>
                        <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                        <SelectItem value="sci-fi">Science Fiction</SelectItem>
                        <SelectItem value="fantasy">Fantasy</SelectItem>
                        <SelectItem value="mystery">Mystery</SelectItem>
                        <SelectItem value="romance">Romance</SelectItem>
                        <SelectItem value="biography">Biography</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pages">Number of Pages</Label>
                    <Input id="pages" type="number" placeholder="Enter number of pages" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="file">Upload Book File (PDF/EPUB)</Label>
                    <Input id="file" type="file" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-primary hover:bg-primary-light text-primary-foreground">
                    Add Book
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Top section: 2 columns */}
          <div className="grid gap-4 grid-cols-5">
            {/* Left Column */}
            <div className="flex flex-col gap-4 col-span-3">
              <Card className="flex-1 bg-[url('/images/today-bg.svg')] bg-cover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-3 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Recommendation</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                <div>
      <p>Token expired: {expired ? 'Yes' : 'No'}</p>
      <p>Expires at: {expiryTime?.toLocaleString()}</p>
      <p>Time until expiry: {timeUntilExpiry} seconds</p>
      <p>Expiring soon: {isExpiringSoon ? 'Yes' : 'No'}</p>
    </div>
                  <div className="text-xl font-bold">Book Name Here</div>
                  <p className="text-xs text-bookBlack">here goes genre tag</p>
                </CardContent>
              </Card>
              <Card className="flex-1 bg-[url('/images/meeting-bg.svg')] bg-cover rounded-bl-3xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-3 pb-2">
                  <CardTitle className="text-sm font-medium">Next Meeting</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-xl font-bold">3 days</div>
                  <p className="text-xs text-bookBlack">May 9, 7:00 PM</p>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div
              onClick={() => setShowOverlay((prev) => !prev)}
              className="relative group h-full col-span-2"
            >
              <div className="h-full flex flex-col justify-between bg-[url('/images/quote-img.png')] bg-cover rounded-br-3xl">
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
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-white p-2 rounded-full shadow-md" onClick={handleClickShare}>
                        <Share2 className="w-6 h-6 text-black" />
                      </Button>
                    </DialogTrigger>
                      <DialogContent className="w-[85vw] rounded-2xl">
                        {!downloadedImageUrl ? (
                          <p className="text-sm text-red-500">Failed to generate image. Try again.</p>
                        ) : (
                          <>
                            <DialogHeader>
                              <DialogTitle className="mt-7 text-center">Ready to share!</DialogTitle>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                              <div className="h-[350px] w-auto overflow-hidden mx-auto rounded-lg shadow-md">
                                <img
                                  src={downloadedImageUrl}
                                  alt="Quote preview"
                                  className="h-full w-auto object-contain mx-auto"
                                />
                              </div>

                              <p className="text-sm text-gray-600 text-center">
                                You can now share this image on Instagram Stories, WhatsApp, or wherever you’d like.
                              </p>

                              <div className="flex justify-center mt-2">
                                <a
                                  href={downloadedImageUrl}
                                  download="quote.png"
                                  className="bg-bookBlack text-white px-4 py-2 rounded-full text-sm hover:bg-bookBlack/90 transition"
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
                </div>
              )}
            </div>

            {/* Hidden Stylized Card to Generate Image */}
            <div
              ref={quoteImageRef}
              className="absolute -top-[9999px] left-0"
              aria-hidden="true"
            >
              <div className="w-[360px] h-[640px] p-8 bg-[url('/images/quote-img.png')] flex flex-col justify-center items-center rounded-2xl shadow-xl">
                <p className="text-3xl font-normal text-center text-secondary-light">"{quote}"</p>
                <p className="text-base mt-4 italic text-center text-secondary-light">— {author}</p>
                <div className="relative">
                  <img src="/images/secondary-logo.svg" alt="App logo" className="absolute bottom-5 mt-8 h-4 opacity-50" />
                </div>
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
