"use client";

import { useState, useEffect, useMemo } from "react"; // Added useEffect, useMemo
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, Smartphone, BookOpen, Headphones } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion, AnimatePresence } from "framer-motion"; // Retaining these if you plan to use animation
import { BookDetails, BookFile, UserBook, StatusDisplay, TabDisplay } from "@/types/book";

// Re-define these with consistent types matching Prisma enums
const statuses: StatusDisplay[] = [
  { label: "⏳ In Progress", value: "in_progress", color: "bg-accent-variant text-bookWhite" },
  { label: "💫 Almost Done", value: "almost_done", color: "bg-accent-variant text-bookWhite" },
  { label: "🔥 Finished", value: "finished", color: "bg-accent-variant text-bookWhite" },
];

const TABS: TabDisplay[] = [
  { label: "Currently Reading", value: "currently_reading" }, // Matches Prisma shelf_type
  { label: "Reading Queue", value: "queue" }, // Matches Prisma shelf_type
];

const readingOptions = [
  { label: "AudioBook", icon: Headphones },
  { label: "E-Reader", icon: Smartphone },
  { label: "Physical Book", icon: BookOpen },
];

// Helper to get status display info
const getStatusDisplay = (statusCode: UserBook['status']): StatusDisplay => {
  return statuses.find(s => s.value === statusCode) || statuses[0]; // Default to "In Progress" if not found
};

export default function DashboardReading() {
  // State to hold books for each shelf
  const [currentlyReadingBooks, setCurrentlyReadingBooks] = useState<UserBook[]>([]);
  const [queueBooks, setQueueBooks] = useState<UserBook[]>([]);
  
  // State for active tab (should match shelf_type enum values)
  const [activeTab, setActiveTab] = useState<UserBook['shelf']>("currently_reading"); 

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //Reading method State
  const [selectedOption, setSelectedOption] = useState(readingOptions[2]); // Default to E-Reader

  // Function to fetch books from the API
  const fetchBooks = async (shelf: UserBook['shelf']) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/shelf?shelf=${shelf}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch ${shelf} books`);
      }
      const data: UserBook[] = await response.json();
      
      if (shelf === "currently_reading") {
        setCurrentlyReadingBooks(data);
      } else if (shelf === "queue") {
        setQueueBooks(data);
      }
    } catch (err: any) {
      console.error(`Error fetching ${shelf} books:`, err);
      setError(err.message || `Could not load ${shelf} books.`);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect to fetch books when the component mounts or the activeTab changes
  useEffect(() => {
    fetchBooks(activeTab);
  }, [activeTab]); // Dependency array: re-run when activeTab changes

  // Function to handle status updates via API
  const handleStatusChange = async (
    bookId: string, 
    currentShelf: UserBook['shelf'], 
    newStatus: UserBook['status']
  ) => {
    try {
      // Optimistic UI update: immediately update the state
      const targetBooks = currentShelf === "currently_reading" ? currentlyReadingBooks : queueBooks;
      const setTargetBooks = currentShelf === "currently_reading" ? setCurrentlyReadingBooks : setQueueBooks;

      setTargetBooks(prevBooks =>
        prevBooks.map(userBook => 
          userBook.book_id === bookId 
            ? { ...userBook, status: newStatus } 
            : userBook
        )
      );

      // Call your API to update the book's status
      const response = await fetch('/api/shelf', {
        method: 'POST', // Use POST for update as per your API definition
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, shelf: currentShelf, status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update book status');
      }

      // If needed, you could re-fetch data or confirm the update here
      // For now, optimistic update is usually sufficient.

    } catch (err: any) {
      console.error("Error updating status:", err);
      alert(`Failed to update status: ${err.message}`); // Show error to user
      // Rollback UI update if API fails (optional, but good for robust apps)
      fetchBooks(currentShelf); // Re-fetch to sync state with DB
    }
  };

  // Determine which books to display based on the active tab
  const booksToDisplay = useMemo(() => {
    if (activeTab === "currently_reading") {
      return currentlyReadingBooks;
    } else if (activeTab === "queue") {
      return queueBooks;
    }
    return [];
  }, [activeTab, currentlyReadingBooks, queueBooks]); // Recompute when tab or book lists change

  // This `status` state is no longer needed at the top level, 
  // as each book will have its own status. Removed from original `useState`.
  // The `direction` and `prevTab` states for framer-motion are kept if you intend to implement it.
  const [prevTab, setPrevTab] = useState<UserBook['shelf']>("currently_reading"); 
  const direction =
    TABS.findIndex((t) => t.value === activeTab) > TABS.findIndex((t) => t.value === prevTab) ? 1 : -1;

  return (
    <div className="container pb-6 mx-auto px-4">
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Tabs component: controlled by activeTab state */}
          <Tabs 
            value={activeTab} 
            className="space-y-4" 
            onValueChange={(value: string) => {
                setPrevTab(activeTab); // Store previous tab for animation if needed
                setActiveTab(value as UserBook['shelf']);
            }}
          >
            <div className="flex justify-center">
              <TabsList className="bg-secondary-light text-primary rounded-full">
                {TABS.map((tabItem) => (
                  <TabsTrigger
                    key={tabItem.value}
                    value={tabItem.value}
                    className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                  >
                    {tabItem.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Content for "Currently Reading" Tab */}
            <TabsContent value="currently_reading" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">Loading books...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">Error: {error}</div>
              ) : currentlyReadingBooks.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  No books currently reading.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {currentlyReadingBooks.map((userBook) => {
                    const currentStatusDisplay = getStatusDisplay(userBook.status);
                    return (
                      <Card key={userBook.book_id} className="overflow-hidden bg-bookWhite py-3">
                        <div className="flex flex-row gap-4 px-4">
                          {/* Book Image */}
                          <div className="w-[100px] flex-shrink-0">
                            <img
                              src={userBook.book.cover_url || "/placeholder.svg"} // Use actual cover URL
                              alt={userBook.book.title || "Book cover"}
                              className="h-[150px] w-full shadow-md rounded object-cover" // Added object-cover
                            />
                          </div>
                          {/* Content */}
                          <div className="flex flex-col justify-between flex-1">
                            <CardHeader className="pb-2 px-0 pt-0">
                              <CardTitle>{userBook.book.title}</CardTitle>
                              <CardDescription>{userBook.book.author}</CardDescription>
                            </CardHeader>

                            <CardContent className="pb-0 px-0">
                              <div className="flex flex-wrap gap-1.5 mb-2 items-center">
                                {/* Added On */}
                                {userBook.added_at && (
                                  <span className="px-2 py-0.5 text-xs font-regular bg-primary-dark/50 text-secondary rounded-full">
                                    Started Reading: {new Date(userBook.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}

                                <div className="flex flex-wrap items-center bg-secondary/10 text-secondary rounded-full px-2 py-0.5">
                                  {/* Show the selected icon */}
                                  <selectedOption.icon className="w-4 h-4" />
                                  <DropdownMenu.Root>
                                    <DropdownMenu.Trigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs flex items-center rounded-full h-5 px-1 ml-1 gap-1 bg-transparent border-none shadow-sm hover:bg-muted"
                                      >
                                        <ChevronDown className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenu.Trigger>

                                    <DropdownMenu.Portal>
                                      <DropdownMenu.Content
                                        className="min-w-[145px] rounded-xl bg-secondary-light shadow-xl p-1 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                                        sideOffset={5}
                                      >
                                        {readingOptions.map((option) => (
                                          <DropdownMenu.Item
                                            key={option.label}
                                            onSelect={() => setSelectedOption(option)}
                                            className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-primary hover:text-secondary flex items-center gap-2"
                                          >
                                            <option.icon className="w-4 h-4" />
                                            {option.label}
                                          </DropdownMenu.Item>
                                        ))}
                                      </DropdownMenu.Content>
                                    </DropdownMenu.Portal>
                                  </DropdownMenu.Root>
                                </div>

                                <div className="flex justify-between">
                                {/* Current Status Badge */}
                                <span className={`px-2 py-0.5 text-xs font-regular rounded-full ${currentStatusDisplay.color}`}>
                                  {currentStatusDisplay.label}
                                </span>
                                <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs flex items-center rounded-full h-5 px-1 ml-2 gap-1 bg-bookWhite shadow-sm hover:bg-muted"
                                  >
                                    Update Status <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </DropdownMenu.Trigger>

                                <DropdownMenu.Portal>
                                  <DropdownMenu.Content
                                    className="min-w-[160px] rounded-2xl bg-secondary-light shadow-xl p-1 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                                    sideOffset={5}
                                  >
                                    {statuses.map((s) => (
                                      <DropdownMenu.Item
                                        key={s.value}
                                        onSelect={() => handleStatusChange(userBook.book_id, userBook.shelf, s.value)}
                                        className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                                      >
                                        {s.label}
                                      </DropdownMenu.Item>
                                    ))}
                                  </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                              </DropdownMenu.Root>
                              </div>

                                {/* Personal Note - (if you add this to UserBook model) */}
                                {/* <span className="px-2 py-0.5 text-xs font-regular bg-accent text-secondary rounded-full max-w-[180px] truncate">
                                  "Loved the intro so far!"
                                </span> */}
                              </div>
                            </CardContent>

                            <CardFooter className="pt-2 px-0">
                              
                            </CardFooter>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Content for "Reading Queue" Tab */}
            <TabsContent value="queue" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">Loading books...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">Error: {error}</div>
              ) : queueBooks.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  No books in reading queue.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {queueBooks.map((userBook) => {
                    const currentStatusDisplay = getStatusDisplay(userBook.status);
                    return (
                      <Card key={userBook.book_id} className="overflow-hidden bg-primary">
                        <div className="flex flex-row gap-4 p-4">
                          {/* Book Image */}
                          <div className="flex-shrink-0">
                            <img
                              src={userBook.book.coverUrl || "/placeholder.svg"}
                              alt={userBook.book.title || "Book cover"}
                              className="h-[135px] w-full shadow-md rounded object-cover"
                            />
                          </div>
                          {/* Content */}
                          <div className="flex flex-col justify-between flex-1">
                            <CardHeader className="pb-2 px-0 pt-0">
                              <CardTitle>{userBook.book.title}</CardTitle>
                              <CardDescription>{userBook.book.author}</CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2 px-0">
                              <div className="flex justify-between text-sm mb-1">
                                {/* Display current status here for queue books too */}
                                <span className={`px-2 py-0.5 text-xs font-regular rounded-full ${currentStatusDisplay.color}`}>
                                  {currentStatusDisplay.label}
                                </span>
                              </div>
                              {/* If you have a progress field on UserBook or personal note */}
                            </CardContent>
                            <CardFooter className="pt-0 pb-0 px-0">
                              <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs flex items-center rounded-full h-5 gap-1 bg-bookWhite shadow-sm hover:bg-muted"
                                  >
                                    Update Status <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </DropdownMenu.Trigger>

                                <DropdownMenu.Portal>
                                  <DropdownMenu.Content
                                    className="min-w-[160px] rounded-2xl bg-secondary-light shadow-xl p-1 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
                                    sideOffset={5}
                                  >
                                    {statuses.map((s) => (
                                      <DropdownMenu.Item
                                        key={s.value}
                                        onSelect={() => handleStatusChange(userBook.book_id, userBook.shelf, s.value)}
                                        className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-primary hover:text-secondary focus:bg-gray-100 focus:outline-none transition-colors"
                                      >
                                        {s.label}
                                      </DropdownMenu.Item>
                                    ))}
                                  </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                              </DropdownMenu.Root>
                            </CardFooter>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}