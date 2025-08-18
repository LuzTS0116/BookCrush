"use client"

import Link from "next/link"
import Image from "next/image";
import { Button } from "@/components/ui/button"
import { Books, CalendarHeart, DiscoBall } from '@phosphor-icons/react';
import RotatingText from "react-rotating-text";

export default function Welcome() {

  return (
    <div className="container px-0 py-9">
      <header className="flex justify-between items-center px-5 mb-16">
        <div className="w-[40vw] max-w-[350px]">
          <Image 
            src="/images/main-logo.svg"
            alt="Reading a Book in a Castle | BookCrush"
            width={400}
            height={200}
            className="text-2xl font-bold text-bookBlack"
          />
        </div>
        <div className="flex gap-2">
          <Link href="/login">
            <Button className="bg-primary text-secondary rounded-full hover:bg-primary-dark">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" className="border-primary bg-secondary rounded-full hover:bg-secondary-light text-primary hover:text-bookWhite">Sign up</Button>
          </Link>
        </div>
      </header>

      <main className="">
        <div className="flex flex-col gap-12 px-5 items-center">
          <div className="relative flex flex-col justify-center space-y-4 text-center h-[70vh] min-h-[500px]">
            {/* ✨ Top Left Sparkles */}
            <img
              src="/images/sparkle.svg"
              alt="sparkle"
              className="absolute top-4 right-6 w-4 animate-float-slow-twinkle opacity-80"
            />
            <img
              src="/images/sparkle.svg"
              alt="sparkle"
              className="absolute top-12 right-20 w-6 animate-float-twinkle opacity-70"
            />

            {/* ✨ Bottom Right Sparkles */}
            <img
              src="/images/sparkle.svg"
              alt="sparkle"
              className="absolute bottom-4 left-8 w-3 animate-float-twinkle opacity-90"
            />
            <img
              src="/images/sparkle.svg"
              alt="sparkle"
              className="absolute bottom-12 left-20 w-5 animate-float-slow-twinkle opacity-80"
            />
            <img
              src="/images/sparkle.svg"
              alt="sparkle"
              className="absolute bottom-6 left-32 w-4 animate-float-twinkle opacity-60"
            />
            <div>
              <h1 className="text-5xl leading-10 font-bold text-bookWhite pb-4">
                For <span className="text-accent italic">readers</span> who want to
              </h1>
              <RotatingText
                items={["share", "connect", "discover"]}
                typingInterval={90}
                className="text-secondary text-5xl font-bold bg-primary-dark/70 px-2 py-1 rounded-md"
              />
            </div>
            <p className="text-lg leading-5 text-bookWhite font-serif font-light pt-4">
              Join your friends in a shared space for book lovers — organize, join book clubs, recommend, and enjoy books together.
            </p>
            <div className="flex justify-center pt-1">
              <Link href="/signup">
                <Button size="sm" className="bg-accent rounded-full hover:bg-primary-dark/100 text-secondary">
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-secondary-light px-5 py-5 mt-12 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-[url('/images/share.png')] bg-cover p-4 rounded-xl flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-secondary mb-1">Share your bookshelf</h3>
            <p className="text-bookBlack/80 font-serif font-normal leading-4">
              Keep track of what you’re reading and see what your friends are into.
            </p>
          </div>

          <div className="bg-[url('/images/join.png')] bg-cover p-4 rounded-xl flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-secondary mb-1">Join and create clubs</h3>
            <p className="text-bookBlack/80 font-serif font-normal leading-4">
              Whether you're into romance or thrillers, there's a club for that — or start your own!
            </p>
          </div>

          <div className="bg-[url('/images/plan.png')] bg-cover p-4 rounded-xl flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-secondary mb-1">Plan your reads together</h3>
            <p className="text-bookBlack/80 font-serif font-normal leading-4">
             Build and manage your personal reading queue and explore your friends’ lists to stay inspired.
            </p>
          </div>

          <div className="bg-[url('/images/react.png')] bg-cover p-4 rounded-xl flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-secondary mb-1">Review, discuss & react</h3>
            <p className="text-bookBlack/80 font-serif font-normal leading-4">
              React to books, share your thoughts, and keep the conversation going — even after the last page.
            </p>
          </div>
        </div>

        <div className="relative my-12 flex flex-col items-center text-center py-20 px-4 rounded-3xl overflow-hidden">
          {/* Sparkle glow behind */}
          <img
            src="/images/sparkle.svg"
            alt="sparkle"
            className="absolute top-6 left-9 w-10 opacity-30 animate-float-twinkle"
          />
          <img
            src="/images/sparkle.svg"
            alt="sparkle"
            className="absolute bottom-0 right-1/4 md:right-9 w-14 opacity-20 animate-float-slow-twinkle"
          />
          <h2 className="text-4xl sm:text-5xl font-bold text-bookWhite tracking-tight mb-2 z-10">
            Celebrate <span className="text-primary italic">stories</span> with friends
          </h2>
          <p className="text-lg sm:text-xl leading-5 font-serif text-bookWhite z-10">
            Your digital book nook — a space to read, connect, and feel inspired.
          </p>
        </div>

      </main>
    </div>
  )
}