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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Read</CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reading Streak</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 days</div>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Meeting</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 days</div>
            <p className="text-xs text-muted-foreground">May 9, 7:00 PM</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Tabs defaultValue="reading" className="space-y-4">
          <TabsList className="bg-muted text-muted-foreground">
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
          <TabsContent value="reading" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="overflow-hidden">
                <div className="h-48 bg-secondary/20 flex items-center justify-center">
                  <img src="/placeholder.svg?height=200&width=150" alt="Book cover" className="h-40 w-auto shadow-md" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle>The Midnight Library</CardTitle>
                  <CardDescription>Matt Haig</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span className="font-medium">65%</span>
                  </div>
                  <Progress value={65} className="h-2 bg-muted" />
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="ghost" size="sm" className="text-primary w-full justify-between">
                    Continue Reading <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              <Card className="overflow-hidden">
                <div className="h-48 bg-primary/20 flex items-center justify-center">
                  <img src="/placeholder.svg?height=200&width=150" alt="Book cover" className="h-40 w-auto shadow-md" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle>Klara and the Sun</CardTitle>
                  <CardDescription>Kazuo Ishiguro</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span className="font-medium">23%</span>
                  </div>
                  <Progress value={23} className="h-2 bg-muted" />
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="ghost" size="sm" className="text-primary w-full justify-between">
                    Continue Reading <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              <Card className="overflow-hidden">
                <div className="h-48 bg-accent/20 flex items-center justify-center">
                  <img src="/placeholder.svg?height=200&width=150" alt="Book cover" className="h-40 w-auto shadow-md" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle>Project Hail Mary</CardTitle>
                  <CardDescription>Andy Weir</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span className="font-medium">8%</span>
                  </div>
                  <Progress value={8} className="h-2 bg-muted" />
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="ghost" size="sm" className="text-primary w-full justify-between">
                    Continue Reading <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="queue" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="overflow-hidden">
                <div className="h-48 bg-secondary/20 flex items-center justify-center">
                  <img src="/placeholder.svg?height=200&width=150" alt="Book cover" className="h-40 w-auto shadow-md" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle>Tomorrow, and Tomorrow, and Tomorrow</CardTitle>
                  <CardDescription>Gabrielle Zevin</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Fiction • 416 pages</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="ghost" size="sm" className="text-primary w-full justify-between">
                    Start Reading <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              <Card className="overflow-hidden">
                <div className="h-48 bg-primary/20 flex items-center justify-center">
                  <img src="/placeholder.svg?height=200&width=150" alt="Book cover" className="h-40 w-auto shadow-md" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle>Sea of Tranquility</CardTitle>
                  <CardDescription>Emily St. John Mandel</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Science Fiction • 272 pages</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="ghost" size="sm" className="text-primary w-full justify-between">
                    Start Reading <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              <Card className="overflow-hidden">
                <div className="h-48 bg-accent/20 flex items-center justify-center">
                  <img src="/placeholder.svg?height=200&width=150" alt="Book cover" className="h-40 w-auto shadow-md" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle>The Lincoln Highway</CardTitle>
                  <CardDescription>Amor Towles</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Historical Fiction • 592 pages</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="ghost" size="sm" className="text-primary w-full justify-between">
                    Start Reading <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <ClubActivityCard />
      </div>
    </div>
  )
}
