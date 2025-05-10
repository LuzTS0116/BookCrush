"use client"

import Link from "next/link"
import Image from "next/image";
import { Button } from "@/components/ui/button"
import { Books, CalendarHeart, DiscoBall } from '@phosphor-icons/react';

export default function Welcome() {

  return (
    <div className="min-h-screen bg-secondary">
      <header className="container mx-auto py-6 flex justify-between items-center">
        <div className="w-[40vw] max-w-[350px]">
          <Image 
            src="/images/main-logo.svg"
            alt="Reading a Book in a Castle | BookCrush"
            width={400}
            height={200}
            className="text-2xl font-bold text-bookBlack"
          />
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button className="bg-primary text-secondary hover:bg-primary-dark">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" className="border-primary bg-secondary hover:bg-secondary-light text-primary hover:text-bookWhite">Sign up</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto py-12">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <h1 className="text-5xl font-bold text-bookWhite">
              Connect with your <span className="text-accent">book club</span> community
            </h1>
            <p className="text-xl text-bookWhite font-serif font-light">
              Share your reading journey, discover new books, and organize meaningful discussions with friends.
            </p>
            <div className="flex gap-4 pt-4">
              <Link href="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary-dark/100 text-secondary">
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
            <div className="absolute -top-3 -left-3 w-full h-full bg-secondary-light rounded-2xl"></div>
            <div className="absolute -bottom-3 -right-3 w-full h-full bg-primary-dark rounded-2xl"></div>
            <div className="relative bg-bookWhite p-2 rounded-2xl shadow-lg border border-primary/20">
              <Image
                src="/images/welcome-page.png"
                alt="Book club meeting"
                width={400}
                height={500}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-primary-dark p-8 rounded-xl shadow-md border border-primary/20 flex flex-col items-center text-center">
            <div className="bg-secondary/10 p-4 rounded-full mb-4">
              <Books className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-bookBlack mb-2">Track Your Reading</h3>
            <p className="text-bookBlack/70 font-serif font-normal">
              Keep a record of books you've read, are currently reading, and want to read next.
            </p>
          </div>

          <div className="bg-primary-dark p-8 rounded-xl shadow-md border border-secondary/6 flex flex-col items-center text-center">
            <div className="bg-secondary/10 p-4 rounded-full mb-4">
              <DiscoBall className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-bookBlack mb-2">Join Reading Circles</h3>
            <p className="text-bookBlack/70 font-serif font-normal">
              Create or join book clubs with friends and share your thoughts on books.
            </p>
          </div>

          <div className="bg-primary-dark p-8 rounded-xl shadow-md border border-primary/20 flex flex-col items-center text-center">
            <div className="bg-secondary/10 p-4 rounded-full mb-4">
              <CalendarHeart className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-bookBlack mb-2">Schedule Meetings</h3>
            <p className="text-bookBlack/70 font-serif font-normal">
              Plan and organize book club meetings with integrated calendar and notifications.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}