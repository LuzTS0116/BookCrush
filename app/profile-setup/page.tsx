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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Pencil, Save, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from "next-auth/react";

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
  const { data: session, status, update } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("")
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([])
  const [nickname, setNickname] = useState("")
  const [kindleEmail, setKindleEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
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
      setError(null) // Clear any previous errors
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
    setSuccess(null)

    try {
      // Create preview URL for immediate display
      const previewUrl = URL.createObjectURL(file)
      setProfilePicturePreview(previewUrl)

      // Get presigned URL
      const presignResponse = await fetch('/api/profile/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.supabaseAccessToken}`
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
      setSuccess('Profile picture uploaded successfully!')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload profile picture';
      setError(errorMessage)
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
    
    // Clear previous messages
    setError(null)
    setSuccess(null)
    
    // Basic validation
    if (!name.trim()) {
      setError('Full name is required');
      return;
    }
    
    if (!nickname.trim()) {
      setError('Username is required');
      return;
    }
    
    if (kindleEmail && !kindleEmail.includes('@')) {
      setError('Please enter a valid Kindle email address');
      return;
    }
    
    setIsSubmitting(true);

    if (!session?.supabaseAccessToken) {
      setError("Please log in to complete your profile");
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: name.trim(),
          about: bio.trim(),
          favorite_genres: favoriteGenres,
          nickname: nickname.trim(),
          kindle_email: kindleEmail.trim() || null,
          avatar_url: avatarUrl
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

      setSuccess('Profile saved successfully! Redirecting...');
      console.log('Profile completed successfully, triggering session update...');
      
      // Update the session to reflect profile completion
      await update();
      
      // Small delay to ensure session propagation, then redirect
      setTimeout(() => {
        const redirectPath = redirectedFrom || '/dashboard';
        console.log('Redirecting to:', redirectPath);
        window.location.href = redirectPath; // Use window.location for more reliable redirect
      }, 1000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile';
      setError(errorMessage)
      console.error(err)
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    setIsLoading(false);
    
    // Get nickname from URL parameters and use it as initial display name
    const nicknameFromUrl = searchParams.get('nickname');
    if (nicknameFromUrl) {
      setName(nicknameFromUrl); // Use nickname as initial display name
      setNickname(nicknameFromUrl); // Also set the nickname field
    }
  }, [searchParams]);

  // Cleanup profile picture preview URL
  useEffect(() => {
    return () => {
      if (profilePicturePreview && profilePicturePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePicturePreview);
      }
    };
  }, [profilePicturePreview]);

  // Auto-clear success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);



  return (
    <div className="relative w-full h-auto overflow-hidden px-4 pt-9 pb-8">
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
        
      ) : error && !isSubmitting ? (
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
        <Card className="w-full max-w-2xl border-primary/20 bg-[url('/images/quote-bg.svg')] bg-cover mb-12">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl/6 font-bold text-center text-secondary">Complete Your Profile</CardTitle>
            <CardDescription className="text-center text-base/5 font-medium font-serif">
              Your story matters too — add a few details and join the community.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-500/20 border-red-500/30 text-red-100">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Success Alert */}
            {success && (
              <Alert className="mb-4 bg-green-500/20 border-green-500/30 text-green-100">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            {/* Loading Alert for form submission */}
            {isSubmitting && (
              <Alert className="mb-4 bg-primary/20 border-primary/30 text-bookWhite">
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Saving your profile...</AlertDescription>
              </Alert>
            )}
            
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
                    disabled={isUploadingPicture || isSubmitting}
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-accent hover:bg-primary-light disabled:opacity-50"
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
                  disabled={isSubmitting}
                />
                {isUploadingPicture && (
                  <p className="text-xs text-primary mt-1 flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Uploading image...
                  </p>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-0">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/60 text-secondary border border-secondary-light file:text-bookWhite placeholder:text-secondary/70"
                    placeholder="Your full name"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-0">
                  <Label htmlFor="nickname">Username *</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="bg-white/60 text-secondary border border-secondary-light file:text-bookWhite placeholder:text-secondary/70"
                    placeholder="Your username"
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                        className="ml-2 text-primary-dark hover:text-primary disabled:opacity-50"
                        disabled={isSubmitting}
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
                  <Select 
                    value={selectedGenre} 
                    onValueChange={setSelectedGenre}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="flex-1 rounded-full bg-white/60 disabled:opacity-50">
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
                  <Button 
                    type="button" 
                    onClick={addGenre} 
                    disabled={!selectedGenre || isSubmitting} 
                    className="rounded-full bg-primary-dark text-bookWhite disabled:opacity-50"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleSubmit} 
              className="rounded-full text-bookWhite font-normal bg-accent-variant/80 hover:bg-accent-variant disabled:opacity-50"
              disabled={isSubmitting || isUploadingPicture}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        )}
    </div>
    </div> 
  )
}
