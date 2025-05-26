"use client"

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, ChevronLeft } from "lucide-react";
import { BookDetails } from "@/types/book";

interface BookSuggestion {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  subject?: string[];
  
}

// interface BookDetails {
//   title: string;
//   author: string;
//   coverUrl: string;
//   pages?: number;
//   subjects?: string[];
//   publishDate?: string;
//   description?: string;
//   rating?: number;
// }

interface AddBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  books: BookDetails[];
  setBooks: (books: BookDetails[]|[])=> void;
  onBookAdded: (newBook: BookDetails) => void; 

}



export const AddBookDialog: React.FC<AddBookDialogProps> = ({ open, onOpenChange, books, setBooks, onBookAdded }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookDetails | null>(null);
  const [englishFile, setEnglishFile] = useState<File | null>(null);
  const [spanishFile, setSpanishFile] = useState<File | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null); 
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setValidationError(null); // Clear error when dialog is opened
    }
    // Also clear error if selectedBook changes, implying a new search/selection
    if (selectedBook) {
      setValidationError(null);
    }
  }, [open, selectedBook]);

  const fetchSuggestions = async (query: string) => {
    const res = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=50`);
    const data = await res.json();
    setSuggestions(data.docs);
  };

const handleSelect = async (suggestion: BookSuggestion) => {
  let cover_url = "/placeholder.svg";
  const workKey = suggestion.key;

  let pages: number | undefined;
  let subjects: string[] = [];
  let published_date: string | undefined;
  let description: string | undefined;
  let rating: number | undefined;

  try {
    const res = await fetch(`https://openlibrary.org${workKey}.json`);
    const data = await res.json();

    subjects = data.subjects || [];
    // publishDate = data.created?.value?.slice(0, 10);
    

    // 📆 Extract publish year only
    if (data.created?.value) {
      published_date = new Date(data.created.value).getFullYear().toString();
    }

    // 📝 Handle description (can be string or { value: string })
    if (typeof data.description === "string") {
      description = data.description;
    } else if (data.description?.value) {
      description = data.description.value;
    }

    // ⭐ Fetch ratings
    try {
        const ratingRes = await fetch(`https://openlibrary.org${workKey}/ratings.json`);
        const ratingData = await ratingRes.json();

        if (ratingData.summary?.average) {
        rating = Math.round(ratingData.summary.average * 10) / 10; // round to 1 decimal
        }
    } catch (ratingErr) {
        console.warn("No rating available for", workKey);
    }

    const editionRes = await fetch(`https://openlibrary.org${workKey}/editions.json?limit=50`);
    const editionData = await editionRes.json();
    const editions = editionData.entries || [];

    function containsNonLatin(text: string) {
      return /[^\u0000-\u007F]/.test(text);
    }

    const englishEditions = editions
      .filter((edition: any) => {
        const isEnglish = edition.languages?.some((lang: any) => lang.key === "/languages/eng");
        const cleanTitle = !containsNonLatin(edition.title || '') && !containsNonLatin(edition.subtitle || '');
        return isEnglish && cleanTitle;
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.publish_date || "1900").getTime();
        const dateB = new Date(b.publish_date || "1900").getTime();
        return dateB - dateA;
      });

    // Find edition with either pages or cover
    const preferredEdition = englishEditions.find(
      (ed: any) => ed.covers?.length || ed.number_of_pages
    );

    if (preferredEdition) {
      if (preferredEdition.covers?.length) {
        cover_url = `https://covers.openlibrary.org/b/id/${preferredEdition.covers[0]}-L.jpg`;
      }
      if (preferredEdition.number_of_pages) {
        pages = preferredEdition.number_of_pages;
      }
    }

    // Still no cover? Use fallback from any edition with cover
    if (cover_url === "/placeholder.svg") {
      const fallback = editions.find((e: any) => e.covers?.length);
      if (fallback?.covers?.length) {
        cover_url = `https://covers.openlibrary.org/b/id/${fallback.covers[0]}-L.jpg`;
      } else if (data.covers?.length) {
        cover_url = `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`;
      }
    }

    // Still no pages? Try grabbing from any edition
    if (!pages) {
      const fallbackWithPages = editions.find((e: any) => e.number_of_pages);
      if (fallbackWithPages) {
        pages = fallbackWithPages.number_of_pages;
      }
    }

  } catch (err) {
    console.error("Error fetching book details:", err);
  }

   function getReadingTime(pages? : number  | undefined): string {
    if (!pages) return 'N/A';
    const totalMinutes = Math.round(pages); // assuming 1 page ≈ 1 minute
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    } else {
        return `${minutes}min`;
    }
  };

  // --- APPLY FILTER AND FORMAT TO SUBJECTS ---
    const processedSubjects = subjects
      .filter((genre) => typeof genre === 'string' && /^[\w\s,]+$/.test(genre)) // Ensure it's a string and apply filter
      .map((genre) => genre.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())) // Apply formatting
      .slice(0, 4); // Apply slice here (changed from 3 to 4)


  
  setSelectedBook({
    title: suggestion.title,
    author: suggestion.author_name?.[0] || "",
    cover_url,
    pages,
    genres: processedSubjects,
    reading_time: getReadingTime(pages),
    published_date,
    description,
    rating,
  });


 

  setSuggestions([]);
  setShowAllSuggestions(false);
  setTitle("");
};

  useEffect(() => {
    if (!title || selectedBook) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => fetchSuggestions(title), 300);
    setDebounceTimer(timer);
  }, [title]);



  const handleAddBook = async () => {
  if (!selectedBook) {
      setValidationError("Please select a book first.");
      return;
    }
  // ---ALREADY EXISTING BOOK VALIDATION LOGIC ---
    const existingBook = books.find(
      (book) => book.title.toLowerCase() === selectedBook.title.toLowerCase()
    );

    if (existingBook) {
      setValidationError("This book title already exists in the collection.");
      return; // Stop the function here if validation fails
    }
    // --- END ALREADY EXISTING BOOK VALIDATION LOGIC ---
 setIsLoading(true); // Start loading
 setValidationError(null); 
  try {
    // Step 1: If there's a file, get a presigned upload URL
    let englishFileData = null;
    if (englishFile) {
      // Get presigned URL
      const presignResponse = await fetch('/api/books/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: englishFile.name,
          contentType: englishFile.type
        })
      });
      
      if (!presignResponse.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { signedUrl, path } = await presignResponse.json();
      
      // Upload the file
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': englishFile.type },
        body: englishFile
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }
      
      englishFileData = {
        storageKey: path,
        originalName: englishFile.name,
        size: englishFile.size
      };
    }
    
    // Step 2: Create the book entry with metadata and file reference
    const bookData = {
      title: selectedBook.title,
      author: selectedBook.author,
      description: selectedBook.description,
      reading_speed: selectedBook.reading_time,
      pages: selectedBook.pages,
      subjects: selectedBook.genres,
      coverUrl: selectedBook.cover_url,
      publishDate: selectedBook.published_date,
      rating: selectedBook.rating,
      ...englishFileData // Include file data if available
    };
    
    const createResponse = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookData)
    });
    
    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(errorData.error || 'Failed to create book');
    }
    
    // Get the created book data
    const createdBook = await createResponse.json();
    
    // Notify the parent component that a new book has been added
    onBookAdded(createdBook);
    
    // Reset form and close dialog
    setSelectedBook(null);
    setTitle("");
    setAuthor("");
    setEnglishFile(null);
    setSpanishFile(null);
    onOpenChange(false);
    
  } catch (error) {
    console.error("Error adding book:", error);
    alert(`Failed to add book: ${error.message}`);
  }
};
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary-light text-secondary rounded-full">
            <Plus className="mr-2 h-4 w-4" /> Add Book
        </Button>
        </DialogTrigger>

      <DialogContent className="w-[85vw] rounded-2xl">
        <Image 
          src="/images/background.png"
          alt="Create and Manage your Book Clubs | BookCrush"
          width={1622}
          height={2871}
          className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
        />
        {!selectedBook ? (
          <div>
          <DialogHeader>
            <DialogTitle className="mt-7">Add New Book</DialogTitle>
              <DialogDescription>
                Just start typing the title or any parts of the title and we'll help you find the rest.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="title"
                className="bg-bookWhite text-secondary"
                placeholder="type the book title here"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              {suggestions.length > 0 && (
                <div className="border rounded-xl p-2 max-h-60 overflow-y-auto bg-bookWhite shadow">
                    {(showAllSuggestions ? suggestions : suggestions.slice(0, 10)).map((suggestion) => (
                    <div
                        key={suggestion.key}
                        onClick={() => handleSelect(suggestion)}
                        className="cursor-pointer hover:bg-primary px-2 py-1 rounded-xl"
                    >
                        <span className="text-secondary font-medium">{suggestion.title}</span>
                        {suggestion.author_name && (
                        <span className="text-secondary font-serif text-xs italic ml-2">
                            by {suggestion.author_name[0]}
                        </span>
                        )}
                    </div>
                    ))}
                    {suggestions.length > 10 && !showAllSuggestions && (
                    <div className="px-4 py-2 text-center">
                        <button
                        onClick={() => setShowAllSuggestions(true)}
                        className="text-primary underline text-sm hover:text-primary-dark"
                        >
                        Show more results
                        </button>
                    </div>
                    )}
                </div>
              )}
            </div>
          </div>
          </div>
        ) : (
          <>
          {/* 🔙 Back Button */}
          <button
            onClick={() => setSelectedBook(null)}
            className="absolute left-4 top-4 flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
              Back
          </button>

          {/* Book detail content */}
          <div className="grid gap-4 pt-4 mx-auto mt-6">
            <div className="flex gap-4">
              <img src={selectedBook.cover_url} alt="cover" className="w-24 h-auto" />
              <div>
                <p className="font-semibold text-lg/5">{selectedBook.title}</p>
                <p className="text-muted-foreground text-base/4 pb-3">by {selectedBook.author}</p>
                {typeof selectedBook.pages === 'number' && (
                  <p className="inline-block text-bookWhite font-light text-sm bg-accent-variant/50 rounded-full px-2">
                    {selectedBook.pages} pages • {selectedBook.reading_time}
                  </p>
                )}

                {selectedBook.genres && selectedBook.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedBook.genres
                         // only letters, numbers, spaces, and commas
                        .slice(0, 3)
                        .map((genre) => (
                    <span
                      key={genre}
                      className="text-xs leading-[0.7] text-muted-foreground italic"
                    >
                      {genre}
                    </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-bookWhite/10 bg-cover rounded-xl p-4">
            <p className="text-bookWhite font-bold text-lg text-center pb-4">Upload the E-book<span className="text-sm font-light italic"> (.epub)</span></p>
            <div className="grid gap-2">
              <Label htmlFor="english" className="font-light">english version</Label>
              <Input
                id="english"
                type="file"
                lang="en"
                accept=".epub"
                onChange={e => setEnglishFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="spanish" className="font-light mt-3">spanish version</Label>
              <Input
                id="spanish"
                type="file"
                lang="en"
                accept=".epub"
                onChange={e => setSpanishFile(e.target.files?.[0] || null)}
              />
            </div>
            </div>
           {validationError && (
            <p className="text-red-500 text-sm mt-2">{validationError}</p>
          )}
          <DialogFooter className="justify-end">
            <Button onClick={handleAddBook} disabled={!selectedBook} className="rounded-full bg-accent px-6 mt-2">
                {isLoading ? "Adding book..." : "Add Book"}
            </Button>
          </DialogFooter>
          </div>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
};
