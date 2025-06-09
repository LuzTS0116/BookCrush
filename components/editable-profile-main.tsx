"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookMarked, ArrowLeft, Mail, Send, Pencil, Save, X, Users, CircleCheckBig, CircleAlert, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Books, Bookmark, CheckCircle } from "@phosphor-icons/react"
import { getDisplayAvatarUrl } from "@/lib/supabase-utils"

interface Profile {
  id: string
  email?: string
  display_name: string
  nickname?: string
  about?: string
  avatar_url?: string
  kindle_email?: string
  favorite_genres: string[]
  created_at: string
  updated_at: string
}

export default function EditableProfileMain() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  // Form states
  const [displayName, setDisplayName] = useState("")
  const [nickname, setNickname] = useState("")
  const [bio, setBio] = useState("")
  const [kindleEmail, setKindleEmail] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("")
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([])

  // Avatar states
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile', {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }

        const profileData = await response.json()
        setProfile(profileData)
        
        
        // Set form values
        setDisplayName(profileData.display_name || "")
        setNickname(profileData.nickname || "")
        setBio(profileData.about || "")
        setKindleEmail(profileData.kindle_email || "")
        setFavoriteGenres(profileData.favorite_genres || [])
        setAvatarUrl(profileData.avatar_url || null)

      } catch (err) {
        setError((err as Error).message)
        console.error('Failed to fetch profile:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const addGenre = () => {
    if (selectedGenre && !favoriteGenres.includes(selectedGenre)) {
      setFavoriteGenres([...favoriteGenres, selectedGenre])
      setSelectedGenre("")
    }
  }

  const removeGenre = (genre: string) => {
    setFavoriteGenres(favoriteGenres.filter((g) => g !== genre))
  }

  // Avatar upload handler
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploadingAvatar(true)
    setError(null)

    try {
      // Create preview URL for immediate display
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)
      console.log("previewUrl", previewUrl)
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
      setAvatarUrl(getDisplayAvatarUrl(path))
      

    } catch (err) {
      setError((err as Error).message)
      console.error('Avatar upload error:', err)
      setAvatarPreview(null)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)
    setError(null)
    
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          display_name: displayName.trim(),
          nickname: nickname.trim(),
          about: bio.trim(),
          kindle_email: kindleEmail.trim() || null,
          favorite_genres: favoriteGenres,
          avatar_url: avatarUrl
        })
      })
      

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save profile')
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      setIsEditing(false)
      
      // Clean up preview URL
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
        setAvatarPreview(null)
      }

    } catch (err) {
      setError((err as Error).message)
      console.error('Failed to save profile:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (!profile) return

    // Reset form values
    setDisplayName(profile.display_name || "")
    setNickname(profile.nickname || "")
    setBio(profile.about || "")
    setKindleEmail(profile.kindle_email || "")
    setFavoriteGenres(profile.favorite_genres || [])
    setAvatarUrl(profile.avatar_url ?? null)
    
    // Clean up preview
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview)
      setAvatarPreview(null)
    }
    
    setIsEditing(false)
    setError(null)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  if (isLoading) {
    return (
      <div className="container mx-auto px-2 py-2 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading profile...</span>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="container mx-auto px-2 py-2 flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-500">
          <p>Failed to load profile</p>
          <p className="text-sm mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const currentAvatar = avatarPreview || avatarUrl
  const displayGenres = isEditing ? favoriteGenres : (profile?.favorite_genres || [])
  console.log("currentAvatar", currentAvatar)

  return (
    <div className="container mx-auto px-2 py-2">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="flex flex-col bg-transparent md:flex-row gap-2">
        <div className="md:w-1/3 bg-transparent">
          <Card className="px-0 bg-bookWhite/90 rounded-b-3xl overflow-hidden">
            <CardHeader className="relative p-0">
              {/* Banner */}
              <div className="relative h-32 w-full bg-gradient-to-r from-primary rounded-b-2xl to-accent">
                <img
                  src="/images/background.png"
                  alt="Banner"
                  className="object-cover w-full h-full"
                />

                {/* Back Button */}
                <button
                  onClick={() => router.back()}
                  className="absolute top-3 left-3 p-2 rounded-full bg-bookWhite/80 backdrop-blur-sm hover:bg-bookWhite shadow-md"
                >
                  <ArrowLeft className="h-5 w-5 text-secondary" />
                </button>

                {/* Edit Button */}
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-bookWhite/80 backdrop-blur-sm hover:bg-bookWhite shadow-md"
                  >
                    <Pencil className="h-5 w-5 text-secondary" />
                  </button>
                )}
              </div>

              {/* Avatar + user info */}
              <div className="flex flex-row px-4 pt-2 pb-2 -mt-15 items-end">
                <div className="flex gap-2 -mt-8 items-end z-20">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-bookWhite rounded-full bg-bookWhite">
                      <AvatarImage 
                        src={currentAvatar} 
                        alt="@user" 
                      />
                      <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                        {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        type="button"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="absolute top-[72px] h-6 w-6 rounded-full bg-accent hover:bg-primary-light"
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Pencil className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col justify-end pb-2">
                    {isEditing ? (
                      <div className="space-y-1">
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="text-sm bg-white/80 border-secondary/20 h-6"
                          placeholder="Display name"
                        />
                        <Input
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          className="text-sm bg-white/80 border-secondary/20 h-6"
                          placeholder="username"
                        />
                      </div>
                    ) : (
                      <>
                        <h2 className="text-lg leading-none font-semibold text-secondary-light">
                          {profile?.display_name || "No name"}
                        </h2>
                        {profile?.nickname && (
                          <p className="text-sm text-secondary/70 font-normal">
                            {profile.nickname}
                          </p>
                        )}
                      </>
                    )}
                    <div className="leading-none">
                      <p className="inline-block text-xs font-serif text-secondary/50 font-medium rounded-full bg-secondary/5 px-2 py-0">
                        25 friends
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* <div className="flex flex-row gap-2 text-center mt-1">
                  <div className="text-secondary font-serif">
                    <p className="text-sm/3 font-semibold"><span className="text-sm pr-2">|</span>24<span className="text-xs"> Read</span></p>
                  </div>
                  <div className="text-secondary-light font-serif">
                    <p className="text-sm/3 font-semibold"><span className="text-sm pr-2">|</span>3<span className="text-xs"> Currently</span></p>
                  </div>
                  <div className="text-secondary-light font-serif">
                    <p className="text-sm/3 font-semibold"><span className="text-sm pr-2">|</span>12<span className="text-xs"> TBR</span><span className="text-sm pl-2">|</span></p>
                  </div>
                </div> */}
                {/* Bio Section */}
                <div>
                  {isEditing ? (
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself and your reading interests..."
                      className="min-h-[80px] rounded-2xl font-serif text-sm/4 italic text-wrap bg-white/60 text-secondary border border-secondary-light placeholder:text-secondary/70"
                    />
                  ) : (
                    <p className="text-sm/4 font-serif font-medium text-secondary/50">
                      {profile?.about || "No bio available"}
                    </p>
                  )}
                </div>

                {/* Kindle Email Section */}
                {isEditing && (
                  <div>
                    <Input
                      value={kindleEmail}
                      onChange={(e) => setKindleEmail(e.target.value)}
                      placeholder="your_kindle@kindle.com"
                      className="bg-white/60 text-secondary border border-secondary-light"
                    />
                  </div>
                )}

                {/* Genres Section */}
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {displayGenres.map((genre) => (
                      <Badge key={genre} variant="secondary" className="px-3 py-1 font-serif bg-accent/20 text-secondary-light/70">
                        {genre}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeGenre(genre)}
                            className="ml-2 text-secondary-light/70 hover:text-secondary"
                          >
                            ×
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  
                  {isEditing && (
                    <div className="flex gap-2 items-center">
                      <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                        <SelectTrigger className="flex-1 rounded-full bg-white/60">
                          <SelectValue placeholder="Add a genre" />
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
                        disabled={!selectedGenre} 
                        className="rounded-full bg-primary-dark text-bookWhite"
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 rounded-full text-bookWhite font-normal bg-accent-variant/80 hover:bg-accent-variant"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Changes
                    </Button>
                    <Button 
                      onClick={handleCancel}
                      variant="outline"
                      disabled={isSaving}
                      className="rounded-full text-bookWhite"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            style={{ display: 'none' }}
          />
        </div>

        {/* Right side - Books tabs */}
        <div className="md:w-2/3">
          <Tabs defaultValue="currently-reading" className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-full h-auto p-1 bg-secondary-light text-primary">
              <TabsTrigger value="currently-reading" className="rounded-full data-[state=active]:text-secondary data-[state=active]:bg-bookWhite">
                <Books size={32} />
              </TabsTrigger>
              <TabsTrigger value="reading-queue" className="rounded-full data-[state=active]:text-secondary data-[state=active]:bg-bookWhite">
                <Bookmark size={32} />
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-full data-[state=active]:text-secondary data-[state=active]:bg-bookWhite">
                <CheckCircle size={32} />
              </TabsTrigger>
              <TabsTrigger value="favorites" className="rounded-full data-[state=active]:text-secondary data-[state=active]:bg-bookWhite">
                <Heart size={32} />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="currently-reading">
              <Card>
                <CardHeader>
                  <CardTitle>Currently Reading</CardTitle>
                  <CardDescription>Books you're currently reading</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {["The Midnight Library", "Klara and the Sun", "Project Hail Mary"].map((book, i) => (
                      <div key={i} className="bg-bookWhite rounded-lg overflow-hidden border border-border">
                        <div
                          className={`h-32 flex items-center justify-center ${
                            i === 0 ? "bg-secondary/20" : i === 1 ? "bg-primary/20" : "bg-accent/20"
                          }`}
                        >
                          <img
                            src="/placeholder.svg?height=120&width=80"
                            alt={book}
                            className="h-24 w-auto shadow-md"
                          />
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium text-sm">{book}</h4>
                          <p className="text-xs text-muted-foreground">
                            {["Matt Haig", "Kazuo Ishiguro", "Andy Weir"][i]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reading-queue">
              <Card>
                <CardHeader>
                  <CardTitle>Reading Queue</CardTitle>
                  <CardDescription>Books in your to-be-read list</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <p className="text-muted-foreground col-span-full text-center py-8">No books in queue yet</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardContent className="p-1">
                  <div className="grid grid-cols-4 gap-1">
                    {[1,2,3,4,5,6,7,8].map((i) => (
                      <div key={i} className="relative w-auto">
                        <img
                          src="/images/book_lovers.jpg"
                          alt="Book cover"
                          className="h-auto w-full shadow-md rounded object-cover"
                        />
                        {i === 7 && (
                          <span className="absolute bottom-1 right-1 bg-accent/70 text-bookWhite text-xs font-bold px-1 py-1 rounded-full shadow-md">
                            <CircleAlert className="h-4 w-4" />
                          </span>
                        )}
                        {i === 8 && (
                          <span className="absolute bottom-1 right-1 bg-green-600/50 text-bookWhite text-xs font-bold px-1 py-1 rounded-full shadow-md">
                            <CircleCheckBig className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardContent className="p-1">
                  <div className="grid grid-cols-4 gap-1">
                    {[1,2,3,4,5,6,7,8].map((i) => (
                      <div key={i} className="w-auto">
                        <img
                          src="/images/glow_of_the_everflame.jpg"
                          alt="Book cover"
                          className="h-[150px] w-full shadow-md rounded object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 