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
        <p>© 2025 BookCrush. All rights reserved.</p>
        <p>Developed by MangoDigital.</p>
        </div>
    </div>
    </footer>
  )
}