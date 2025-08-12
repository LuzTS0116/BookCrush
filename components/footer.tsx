"use client"

import Link from "next/link"
import Image from "next/image";

export default function Footer() {

  return (
    <footer className="bg-bookBlack text-bookWhite py-12">
    <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between">
        <div className="mb-8 md:mb-0">
            <div className="flex items-center gap-2 mb-4 w-[40vw] max-w-[350px]">
                <Image 
                    src="/images/main-logo.svg"
                    alt="Reading a Book in a Castle | BookCrush"
                    width={400}
                    height={200}
                />
            </div>
            <p className="text-bookWhite/70 max-w-md">
            Connect with friends, share your bookshelves, and discover your next favorite book.
            </p>
        </div>
        <div className="md:flex md:flex-col">
        <div className="grid grid-cols-2 gap-8">
            <div>
            <h3 className="font-bold mb-2 text-primary">Company</h3>
            <ul className="space-y-1 text-bookWhite/40">
                <li>About</li>
                <li>Contact</li>
                <li>Feedback</li>
            </ul>
            </div>
            <div>
            <h3 className="font-bold mb-2 text-primary">Legal</h3>
            <ul className="space-y-1 text-bookWhite/40">
                <li>Privacy</li>
                <li>Terms</li>
                <li>Cookie Policy</li>
            </ul>
            </div>
        </div>
        <p className="text-bookWhite/70 mt-8 text-sm italic max-w-md">
            *footer links not available in this early stage.
        </p>
        </div>
        </div>
        <div className="border-t border-bookWhite/10 mt-9 pt-8 text-center text-bookWhite/50">
        <p className="text-base mb-4 text-center">
            Made possible with data from <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Open Library</a> and inspiring quotes from <a href="https://zenquotes.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">ZenQuotes API</a>.
        </p>
        <p>© 2025 BookCrush. All rights reserved.</p>
        <p>Developed by Luz&Michael.</p>
        </div>
    </div>
    </footer>
  )
}