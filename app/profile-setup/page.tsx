"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pencil, Save } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation'

// Simple loading component
function LoadingClubs() {
  return (
    <div className="container mx-auto px-4 py-6 pb-20 flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <span className="ml-3 text-lg text-muted-foreground">Loading...</span>
    </div>
  );
}

export default function ProfileSetupPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("")
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([])
  const [nickname, setNickname] = useState("")
  const [kindleEmail, setKindleEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  
  // Profile picture states
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)
  const [isUploadingPicture, setIsUploadingPicture] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectedFrom = searchParams.get('redirectedFrom')

  const genres = [
    "Biography",
    "Children's",
    "Classics",
    "Dark Romance",
    "Fantasy",
    "Fiction",
    "Historical Fiction",
    "Horror",
    "Literary Fiction",
    "Manga",
    "Mystery",
    "Non-Fiction",
    "Poetry",
    "Romance",
    "Romantasy",
    "Science Fiction",
    "Self-Help",
    "Thriller",
    "Young Adult"
  ]

  const addGenre = () => {
    if (selectedGenre && !favoriteGenres.includes(selectedGenre)) {
      setFavoriteGenres([...favoriteGenres, selectedGenre])
      setSelectedGenre("")
    }
  }

  const removeGenre = (genre: string) => {
    setFavoriteGenres(favoriteGenres.filter((g) => g !== genre))
  }

  // Profile picture upload handler
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB')
      return
    }

    setIsUploadingPicture(true)
    setError(null)

    try {
      // Create preview URL for immediate display
      const previewUrl = URL.createObjectURL(file)
      setProfilePicturePreview(previewUrl)

      // Get presigned URL
      const presignResponse = await fetch('/api/profile/presign', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type
        })
      })

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json()
        throw new Error(errorData.error || 'Failed to get upload URL')
      }

      const { signedUrl, path } = await presignResponse.json()

      // Upload file to storage
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image')
      }

      // Store the path for form submission
      setAvatarUrl(path)

    } catch (err) {
      setError((err as Error).message)
      console.error('Profile picture upload error:', err)
      // Clear preview on error
      setProfilePicturePreview(null)
    } finally {
      setIsUploadingPicture(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[ProfileSetupPage] handleSubmit triggered');
    e.preventDefault()
    setError(null)
    setIsLoading(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        credentials: 'include',                 // ← sends Supabase cookies
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          display_name: name.trim(),
          about: bio.trim(),
          favorite_genres: favoriteGenres,      // array of strings
          nickname: nickname.trim(),
          kindle_email: kindleEmail.trim() || null,
          avatar_url: avatarUrl       // include avatar URL path
        })
      })

      if (!res.ok) {
        let errorPayload: { error?: string; details?: string } = {};
        try {
          errorPayload = await res.json();
        } catch (jsonError) {
          console.error('Failed to parse error JSON from API:', jsonError);
          throw new Error(res.statusText || `Failed to save profile. Server responded with ${res.status}`);
        }

        const message = errorPayload.details
                        ? `${errorPayload.error || 'Error'}: ${errorPayload.details}`
                        : errorPayload.error || `Failed to save profile. Status: ${res.status}`;
        throw new Error(message);
      }

      // Redirect back to the original page if there was one
      router.push(redirectedFrom || '/dashboard')
    } catch (err) {
      setError((err as Error).message)
      console.error(err)
    }finally {
        setIsLoading(false);
      }
  }

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Cleanup profile picture preview URL
  useEffect(() => {
    return () => {
      if (profilePicturePreview && profilePicturePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePicturePreview);
      }
    };
  }, [profilePicturePreview]);

  return (
    <div className="relative w-full h-auto overflow-hidden px-4 pt-9">
      <Image 
        src="/images/background.png"
        alt="Create and Manage your Book Clubs | BookCrush"
        width={1622}
        height={2871}
        className="absolute inset-0 w-auto h-full lg:w-full lg:h-auto object-cover z-[-1]"
      />
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent px-4 pt-6 pb-6">
        <Link href="/" className="flex items-center gap-2 mb-8 w-[40vw] max-w-[250px]">
          <Image 
              src="/images/main-logo.svg"
              alt="Reading a Book in a Castle | BookCrush"
              width={400}
              height={200}
          />
        </Link>
        {isLoading ? (
        <LoadingClubs />
        
      ) : error ? (
        <div className="container mx-auto px-4 py-6 pb-20 flex items-center justify-center min-h-[400px]">
          <div className="text-center text-red-500">
            <p>Failed to load profile setup page</p>
            <p className="text-sm mt-2">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <Card className="w-full max-w-2xl border-primary/20 bg-[url('/images/quote-bg.svg')] bg-cover">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl/6 font-bold text-center text-secondary">Complete Your Profile</CardTitle>
            <CardDescription className="text-center text-base/5 font-medium font-serif">
              Your story matters too — add a few details and join the community.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex flex-col items-center mb-2">
                <div className="relative mb-2">
                  <Avatar className="h-[160px] w-[160px]">
                    <AvatarImage 
                      src={profilePicturePreview || "/placeholder.svg?height=96&width=96"} 
                      alt="@user" 
                    />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {name ? name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPicture}
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-accent hover:bg-primary-light"
                  >
                    {isUploadingPicture ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Pencil className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleProfilePictureUpload}
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  style={{ display: 'none' }}
                />
                {profilePicturePreview && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Profile picture uploaded successfully
                  </p>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-0">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/60 text-secondary border border-secondary-light file:text-bookWhite placeholder:text-secondary/70"
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="space-y-0">
                  <Label htmlFor="nickname">Username</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="bg-white/60 text-secondary border border-secondary-light file:text-bookWhite placeholder:text-secondary/70"
                    placeholder="Your username"
                    required
                  />
                </div>
                <div className="space-y-0">
                  <Label htmlFor="kindle-email">Kindle Email (Optional)</Label>
                  <Input
                    id="kindle-email"
                    type="email"
                    value={kindleEmail}
                    onChange={(e) => setKindleEmail(e.target.value)}
                    className="bg-white/60 text-secondary border border-secondary-light file:text-bookWhite placeholder:text-secondary/70"
                    placeholder="your_kindle@kindle.com"
                  />
                </div>
              </div>

              <div className="space-y-0">
                <Label htmlFor="bio">About You</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself and your reading interests..."
                  className="min-h-[100px] rounded-2xl font-serif text-sm/4 italic bg-white/60 text-secondary border border-secondary-light placeholder:text-secondary/70"
                />
              </div>

              <div className="space-y-1">
                <Label>Favorite Genres</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {favoriteGenres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="px-3 py-1 text-primary-dark">
                      {genre}
                      <button
                        type="button"
                        onClick={() => removeGenre(genre)}
                        className="ml-2 text-primary-dark hover:text-primary"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {favoriteGenres.length === 0 && (
                    <p className="text-sm text-muted-foreground">Tell us what you love to read</p>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="flex-1 rounded-full bg-white/60">
                      <SelectValue placeholder="Select a genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addGenre} disabled={!selectedGenre} className="rounded-full bg-primary-dark text-bookWhite">
                    Add
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSubmit} className="rounded-full text-bookWhite font-normal bg-accent-variant/80 hover:bg-accent-variant">
              Save Profile
            </Button>
          </CardFooter>
        </Card>
        )}
    </div>
    </div> 
  )
}
