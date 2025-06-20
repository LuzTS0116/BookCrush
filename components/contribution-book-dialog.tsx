"use client";

import React from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"
import Link from "next/link"
import { BookDetails } from "@/types/book";

export function ContributionBookDialog({ addedBooks }: { addedBooks: BookDetails }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <img
          src={addedBooks.cover_url || "/placeholder.svg"}
          alt={addedBooks.title || "Book cover"}
          className="h-full w-full shadow-md rounded object-cover"
        />
      </DialogTrigger>
      <DialogContent className="w-[85vw] bg-bookWhite text-secondary rounded-2xl p-3">
        <div className="flex flex-row gap-3 p-0">
          <div className="w-[100px] flex-shrink-0">
            <Link href={`/books/${addedBooks.id}`}>
              <img
                src={addedBooks.cover_url || "/placeholder.svg"}
                alt={addedBooks.title || "Book cover"}
                className="h-auto w-full shadow-md rounded object-cover"
              />
            </Link>
          </div>
          <div className="flex flex-col flex-1">
            <div className="pb-2 px-0 pt-0">
              <div className="flex flex-row justify-between items-start">
                <Link href={`/books/${addedBooks.id}`}>
                  <h1 className="text-base leading-5 max-w-40">{addedBooks.title}</h1>
                </Link>
              </div>
              <div className="text-xs text-secondary/50">{addedBooks.author}</div>
            </div>
            <div className="pb-0 px-0">
              <div className="flex flex-wrap gap-1.5 items-center">
                {addedBooks.created_at && (
                  <span className="text-xs font-regular text-secondary/80">
                    Contribution: {new Date(addedBooks.created_at).toLocaleDateString('en-US', {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>
                )}
                <div className="flex flex-wrap gap-1">
                  {addedBooks.genres?.slice(0, 3).map((genre: string) => (
                    <span
                      key={genre}
                      className="bg-accent/30 text-secondary/40 text-xs/3 font-medium px-2 py-1 rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-secondary/80 font-sans font-normal text-xs leading-none mt-0 inline-block">
                {addedBooks.pages} pages • {addedBooks.reading_time}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}