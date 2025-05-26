"use client"

import type React from "react"
import { useState } from "react"
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
import { useRouter } from 'next/navigation'

export default function ProfileSetupPage() {
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("")
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([])
  const [nickname, setNickname] = useState("")
  const [kindleEmail, setKindleEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const genres = [
    "Fiction",
    "Non-Fiction",
    "Science Fiction",
    "Fantasy",
    "Mystery",
    "Thriller",
    "Romance",
    "Historical Fiction",
    "Biography",
    "Self-Help",
    "Horror",
    "Poetry",
    "Young Adult",
    "Children's",
    "Classics",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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
          kindle_email: kindleEmail.trim() || null
        })
      })

      if (res.status != 201 ) {
        const { message } = await res.json().catch(() => ({}))
        throw new Error(message ?? 'Failed to save profile')
      }

      router.push('/dashboard')                 // success
    } catch (err) {
      setError((err as Error).message)
      console.error(error)
    }
  }

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
                    <AvatarImage src="/placeholder.svg?height=96&width=96" alt="@user" />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {name ? name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-accent hover:bg-primary-light"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-0">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-bookWhite text-secondary border border-secondary-light file:text-bookWhite placeholder:text-secondary/70"
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="space-y-0">
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="bg-bookWhite text-secondary border border-secondary-light file:text-bookWhite placeholder:text-secondary/70"
                    placeholder="Your nickname"
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
                    className="bg-bookWhite text-secondary border border-secondary-light file:text-bookWhite placeholder:text-secondary/70"
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
                  className="min-h-[100px] rounded-2xl font-serif text-sm/4 italic bg-bookWhite text-secondary border border-secondary-light placeholder:text-secondary/70"
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
                    <SelectTrigger className="flex-1 rounded-full">
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
    </div>
    </div>
  )
}
