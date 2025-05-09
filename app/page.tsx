"use client"


import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Calendar, Users, BookMarked } from "lucide-react"

export default function Home() {
   


  return (
    <div className="min-h-screen bg-gradient-to-b from-bookWhite to-primary/10">
      <header className="container mx-auto py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-bookBlack">BookCircle</h1>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary hover:bg-primary-light text-bookWhite">Sign up</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto py-12">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <h1 className="text-5xl font-bold text-bookBlack">
              Connect with your <span className="text-primary">book club</span> community
            </h1>
            <p className="text-xl text-bookBlack/80">
              Share your reading journey, discover new books, and organize meaningful discussions with friends.
            </p>
            <div className="flex gap-4 pt-4">
              <Link href="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary-light text-bookWhite">
                  Get started
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  Learn more
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="absolute -top-6 -left-6 w-full h-full bg-secondary/20 rounded-2xl"></div>
            <div className="absolute -bottom-6 -right-6 w-full h-full bg-accent/20 rounded-2xl"></div>
            <div className="relative bg-bookWhite p-8 rounded-2xl shadow-lg border border-primary/20">
              <img
                src="/placeholder.svg?height=400&width=500"
                alt="Book club meeting"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-bookWhite p-8 rounded-xl shadow-md border border-primary/20 flex flex-col items-center text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <BookMarked className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-bookBlack mb-2">Track Your Reading</h3>
            <p className="text-bookBlack/70">
              Keep a record of books you've read, are currently reading, and want to read next.
            </p>
          </div>

          <div className="bg-bookWhite p-8 rounded-xl shadow-md border border-primary/20 flex flex-col items-center text-center">
            <div className="bg-secondary/10 p-4 rounded-full mb-4">
              <Users className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-bookBlack mb-2">Join Reading Circles</h3>
            <p className="text-bookBlack/70">
              Create or join reading circles with friends and share your thoughts on books.
            </p>
          </div>

          <div className="bg-bookWhite p-8 rounded-xl shadow-md border border-primary/20 flex flex-col items-center text-center">
            <div className="bg-accent/10 p-4 rounded-full mb-4">
              <Calendar className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-bookBlack mb-2">Schedule Meetings</h3>
            <p className="text-bookBlack/70">
              Plan and organize book club meetings with integrated calendar and notifications.
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-bookBlack text-bookWhite py-12 mt-24">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">BookCircle</h2>
              </div>
              <p className="text-bookWhite/70 max-w-md">
                Connect with fellow readers, share your literary journey, and discover your next favorite book.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-bold mb-4 text-primary">Product</h3>
                <ul className="space-y-2 text-bookWhite/70">
                  <li>Features</li>
                  <li>Pricing</li>
                  <li>FAQ</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4 text-primary">Company</h3>
                <ul className="space-y-2 text-bookWhite/70">
                  <li>About</li>
                  <li>Blog</li>
                  <li>Careers</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4 text-primary">Legal</h3>
                <ul className="space-y-2 text-bookWhite/70">
                  <li>Privacy</li>
                  <li>Terms</li>
                  <li>Cookie Policy</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-bookWhite/10 mt-12 pt-8 text-center text-bookWhite/50">
            <p>© 2025 BookCircle. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
