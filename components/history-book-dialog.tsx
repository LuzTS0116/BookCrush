"use client";

import React from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"
import Link from "next/link"
import { UserBook } from "@/types/book";
import { CircleCheckBig, CircleAlert } from "lucide-react";

export function HistoryBookDialog({ historyBooks }: { historyBooks: UserBook }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <img
          src={historyBooks.book.cover_url || "/placeholder.svg"}
          alt={historyBooks.book.title || "Book cover"}
          className="h-full w-full shadow-md rounded object-cover"
        />
      </DialogTrigger>
      <DialogContent className="w-[85vw] bg-bookWhite text-secondary rounded-2xl p-3">
        <div className="flex flex-row gap-3 p-0">
          <div className="w-[100px] flex-shrink-0">
            <Link href={`/books/${historyBooks.book_id}`}>
              <img
                src={historyBooks.book.cover_url || "/placeholder.svg"}
                alt={historyBooks.book.title || "Book cover"}
                className="h-auto w-full shadow-md rounded object-cover"
              />
            </Link>
          </div>
          <div className="flex flex-col flex-1">
            <div className="pb-2 px-0 pt-0">
              <div className="flex flex-row justify-between items-start">
                <Link href={`/books/${historyBooks.book_id}`}>
                  <h1 className="text-base leading-5 max-w-40">{historyBooks.book.title}</h1>
                </Link>
              </div>
              <div className="text-xs text-secondary/50">{historyBooks.book.author}</div>
            </div>
            <div className="pb-0 px-0">
              <div className="flex flex-wrap gap-1.5 items-center">
                {historyBooks.book.created_at && (
                  <span className="text-xs font-regular text-secondary/80">
                    Contribution: {new Date(historyBooks.book.created_at).toLocaleDateString('en-US', {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>
                )}
                <div className="flex flex-wrap gap-1">
                  {historyBooks.book.genres?.slice(0, 3).map((genre: string) => (
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
                {historyBooks.book.pages} pages • {historyBooks.book.reading_time}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}