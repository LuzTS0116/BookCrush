import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Calendar, BookMarked, ChevronRight, Plus, Upload } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function DashboardPage() {
  return (
    <div className="container mx-auto pt-12 pb-8 px-4 mt-[-10px] bg-card/80 rounded-b-3xl">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hello, Lulu!</h1>
            <p className="text-muted-foreground font-serif">Good to see you again! Let's get reading.</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-bookWhite/40 hover:bg-primary-light text-bookWhite">
                  <Plus className="mr-2 h-4 w-4" /> Add Book
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Book</DialogTitle>
                  <DialogDescription>Enter the details of the book you want to add to your collection.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cover">Book Cover</Label>
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-40 w-32 bg-muted flex items-center justify-center rounded-md overflow-hidden">
                        <img
                          src="/placeholder.svg?height=160&width=120"
                          alt="Book cover preview"
                          className="max-h-full max-w-full"
                        />
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        <Upload className="mr-2 h-4 w-4" /> Upload Cover
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" placeholder="Enter book title" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="author">Author</Label>
                    <Input id="author" placeholder="Enter author name" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Select>
                      <SelectTrigger id="genre">
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fiction">Fiction</SelectItem>
                        <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                        <SelectItem value="sci-fi">Science Fiction</SelectItem>
                        <SelectItem value="fantasy">Fantasy</SelectItem>
                        <SelectItem value="mystery">Mystery</SelectItem>
                        <SelectItem value="romance">Romance</SelectItem>
                        <SelectItem value="biography">Biography</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pages">Number of Pages</Label>
                    <Input id="pages" type="number" placeholder="Enter number of pages" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="file">Upload Book File (PDF/EPUB)</Label>
                    <Input id="file" type="file" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-primary hover:bg-primary-light text-primary-foreground">
                    Add Book
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Top section: 2 columns */}
          <div className="grid gap-4 grid-cols-5">
            {/* Left Column */}
            <div className="flex flex-col gap-4 col-span-3">
              <Card className="flex-1 bg-accent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-3 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Recommendation</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-xl font-bold">Book Name Here</div>
                  <p className="text-xs text-bookBlack">here goes genre tag</p>
                </CardContent>
              </Card>
              <Card className="flex-1 bg-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-3 pb-2">
                  <CardTitle className="text-sm font-medium">Next Meeting</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-xl font-bold">3 days</div>
                  <p className="text-xs text-bookBlack">May 9, 7:00 PM</p>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <Card className="h-full flex flex-col col-span-2 justify-between bg-bookWhite">
              <CardContent className="flex-1 flex flex-col justify-center pt-4 px-3">
                <blockquote className="text-[16px]/4 text-center font-semibold text-bookBlack">
                  A reader lives a thousand lives before he dies
                </blockquote>
                <p className="text-xs mt-2 text-center text-bookBlack">George R.R. Martin</p>
              </CardContent>
            </Card>
          </div>

          {/* Bottom full-width card */}
          <Card className="bg-accent-variant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recently added book</CardTitle>
              <BookMarked className="h-4 w-4 text-bookBlack" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">The Midnight Library</div>
              <p className="text-xs text-bookBlack">by Matt Haig</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
