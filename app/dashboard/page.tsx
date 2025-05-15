import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Calendar, BookMarked, ChevronRight, Plus } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { ClubActivityCard } from "@/components/club-activity-card"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hello, Lulu!</h1>
          <p className="text-muted-foreground font-serif">Good to see you again! Let's get reading.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-primary hover:bg-primary-light text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Add Book
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Top section: 2 columns */}
        <div className="grid gap-4 grid-cols-2">
          {/* Left Column */}
          <div className="flex flex-col gap-4">
            <Card className="flex-1 bg-accent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recommended for you</CardTitle>
                <BookMarked className="h-4 w-4 text-bookBlack" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-bookBlack">+2 from last month</p>
              </CardContent>
            </Card>
            <Card className="flex-1 bg-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Meeting</CardTitle>
                <Calendar className="h-4 w-4 text-bookBlack" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3 days</div>
                <p className="text-xs text-bookBlack">May 9, 7:00 PM</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <Card className="h-full flex flex-col justify-between bg-bookWhite">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quote of the Day</CardTitle>
              <BookOpen className="h-4 w-4 text-bookBlack" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              <blockquote className="text-lg italic font-semibold text-bookBlack">
                "A reader lives a thousand lives before he dies..."
              </blockquote>
              <p className="text-xs mt-4 text-right text-bookBlack">— George R.R. Martin</p>
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
      

      <div className="grid gap-6 md:grid-cols-2">
        <Tabs defaultValue="reading" className="space-y-4">
          <div className="flex justify-center">
            <TabsList className="bg-bookWhite text-secondary">
              <TabsTrigger
                value="reading"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Currently Reading
              </TabsTrigger>
              <TabsTrigger
                value="queue"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Reading Queue
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="reading" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="overflow-hidden bg-secondary-light">
                <div className="flex flex-row gap-4 p-4">
                  {/* Book Image */}
                  <div className="flex-shrink-0">
                    <img
                      src="/placeholder.svg?height=135&width=110"
                      alt="Book cover"
                      className="h-[135px] w-auto shadow-md rounded"
                    />
                  </div>
                  {/* Content */}
                  <div className="flex flex-col justify-between flex-1">
                    <CardHeader className="pb-2 px-0 pt-0">
                      <CardTitle>The Midnight Library</CardTitle>
                      <CardDescription>Matt Haig</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2 px-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span className="font-medium">65%</span>
                      </div>
                      <Progress value={65} className="h-2 bg-muted" />
                    </CardContent>
                    <CardFooter className="pt-0 pb-0 px-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary w-full justify-between"
                      >
                        Update Progress <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </div>
                </div>
              </Card>

              <Card className="overflow-hidden bg-secondary-light">
                <div className="flex flex-row gap-4 p-4">
                  {/* Book Image */}
                  <div className="flex-shrink-0">
                    <img
                      src="/placeholder.svg?height=135&width=110"
                      alt="Book cover"
                      className="h-[135px] w-auto shadow-md rounded"
                    />
                  </div>
                  {/* Content */}
                  <div className="flex flex-col justify-between flex-1">
                    <CardHeader className="pb-2 px-0 pt-0">
                      <CardTitle>The Midnight Library</CardTitle>
                      <CardDescription>Matt Haig</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2 px-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span className="font-medium">65%</span>
                      </div>
                      <Progress value={65} className="h-2 bg-muted" />
                    </CardContent>
                    <CardFooter className="pt-0 pb-0 px-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary w-full justify-between"
                      >
                        Update Progress <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </div>
                </div>
              </Card>

              <Card className="overflow-hidden bg-secondary-light">
                <div className="flex flex-row gap-4 p-4">
                  {/* Book Image */}
                  <div className="flex-shrink-0">
                    <img
                      src="/placeholder.svg?height=135&width=110"
                      alt="Book cover"
                      className="h-[135px] w-auto shadow-md rounded"
                    />
                  </div>
                  {/* Content */}
                  <div className="flex flex-col justify-between flex-1">
                    <CardHeader className="pb-2 px-0 pt-0">
                      <CardTitle>The Midnight Library</CardTitle>
                      <CardDescription>Matt Haig</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2 px-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span className="font-medium">65%</span>
                      </div>
                      <Progress value={65} className="h-2 bg-muted" />
                    </CardContent>
                    <CardFooter className="pt-0 pb-0 px-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary w-full justify-between"
                      >
                        Update Progress <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </div>
                </div>
              </Card>

            </div>
          </TabsContent>

          <TabsContent value="queue" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="overflow-hidden bg-secondary-light">
                <div className="flex flex-row gap-4 p-4">
                  {/* Book Image */}
                  <div className="flex-shrink-0">
                    <img
                      src="/placeholder.svg?height=135&width=110"
                      alt="Book cover"
                      className="h-[135px] w-auto shadow-md rounded"
                    />
                  </div>
                  {/* Content */}
                  <div className="flex flex-col justify-between flex-1">
                    <CardHeader className="pb-2 px-0 pt-0">
                      <CardTitle>The Sunset Library</CardTitle>
                      <CardDescription>Matt Haig</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2 px-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span className="font-medium">65%</span>
                      </div>
                      <Progress value={65} className="h-2 bg-muted" />
                    </CardContent>
                    <CardFooter className="pt-0 pb-0 px-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary w-full justify-between"
                      >
                        Update Progress <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </div>
                </div>
              </Card>

              <Card className="overflow-hidden bg-secondary-light">
                <div className="flex flex-row gap-4 p-4">
                  {/* Book Image */}
                  <div className="flex-shrink-0">
                    <img
                      src="/placeholder.svg?height=135&width=110"
                      alt="Book cover"
                      className="h-[135px] w-auto shadow-md rounded"
                    />
                  </div>
                  {/* Content */}
                  <div className="flex flex-col justify-between flex-1">
                    <CardHeader className="pb-2 px-0 pt-0">
                      <CardTitle>The Sunset Library</CardTitle>
                      <CardDescription>Matt Haig</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2 px-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span className="font-medium">65%</span>
                      </div>
                      <Progress value={65} className="h-2 bg-muted" />
                    </CardContent>
                    <CardFooter className="pt-0 pb-0 px-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary w-full justify-between"
                      >
                        Update Progress <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </div>
                </div>
              </Card>

              <Card className="overflow-hidden bg-secondary-light">
                <div className="flex flex-row gap-4 p-4">
                  {/* Book Image */}
                  <div className="flex-shrink-0">
                    <img
                      src="/placeholder.svg?height=135&width=110"
                      alt="Book cover"
                      className="h-[135px] w-auto shadow-md rounded"
                    />
                  </div>
                  {/* Content */}
                  <div className="flex flex-col justify-between flex-1">
                    <CardHeader className="pb-2 px-0 pt-0">
                      <CardTitle>The Sunset Library</CardTitle>
                      <CardDescription>Matt Haig</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2 px-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span className="font-medium">65%</span>
                      </div>
                      <Progress value={65} className="h-2 bg-muted" />
                    </CardContent>
                    <CardFooter className="pt-0 pb-0 px-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary w-full justify-between"
                      >
                        Update Progress <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <ClubActivityCard />
      </div>
    </div>
  )
}
