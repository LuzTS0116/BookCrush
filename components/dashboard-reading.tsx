import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Calendar, BookMarked, ChevronRight, Plus } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function DashboardReading() {
  return (
    <div className="container pb-6 mx-auto">
        <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
                <Tabs defaultValue="reading" className="space-y-4">
                    <div className="flex justify-center">
                    <TabsList className="bg-secondary-light text-bookWhite rounded-full">
                        <TabsTrigger
                        value="reading"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full"
                        >
                        Currently Reading
                        </TabsTrigger>
                        <TabsTrigger
                        value="queue"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full"
                        >
                        Reading Queue
                        </TabsTrigger>
                    </TabsList>
                    </div>

                    <TabsContent value="reading" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="overflow-hidden bg-primary">
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

                        <Card className="overflow-hidden bg-primary">
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

                        <Card className="overflow-hidden bg-primary">
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
                        <Card className="overflow-hidden bg-primary">
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

                        <Card className="overflow-hidden bg-primary">
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

                        <Card className="overflow-hidden bg-primary">
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
            </div>
        </div>
    </div>
  )
}