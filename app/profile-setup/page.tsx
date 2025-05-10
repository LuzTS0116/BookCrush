"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, Pencil, Save } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProfileSetupPage() {
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("")
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([])
  const [kindleEmail, setKindleEmail] = useState("")

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle profile setup logic here
    console.log({ name, bio, favoriteGenres, kindleEmail })
    // Redirect to dashboard after successful profile setup
    window.location.href = "/dashboard"
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-bookWhite to-primary/10 p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <BookOpen className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-bookBlack">BookCircle</h1>
      </Link>

      <Card className="w-full max-w-2xl border-primary/20">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Tell us a bit about yourself and your reading preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder.svg?height=96&width=96" alt="@user" />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {name ? name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary hover:bg-primary-light"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kindle-email">Kindle Email (Optional)</Label>
                <Input
                  id="kindle-email"
                  type="email"
                  value={kindleEmail}
                  onChange={(e) => setKindleEmail(e.target.value)}
                  placeholder="your_kindle@kindle.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself and your reading interests..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Favorite Genres</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {favoriteGenres.map((genre) => (
                  <Badge key={genre} variant="secondary" className="px-3 py-1 bg-primary/10 text-primary">
                    {genre}
                    <button
                      type="button"
                      onClick={() => removeGenre(genre)}
                      className="ml-2 text-primary hover:text-primary-light"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {favoriteGenres.length === 0 && (
                  <p className="text-sm text-muted-foreground">Add some of your favorite genres</p>
                )}
              </div>
              <div className="flex gap-2">
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="flex-1">
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
                <Button type="button" onClick={addGenre} disabled={!selectedGenre}>
                  Add
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary-light">
            <Save className="mr-2 h-4 w-4" />
            Complete Profile
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
