import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"
import { Button } from "./ui/button"

export function ActivityCard() {
  return (
    <div className="container mx-auto bg-secondary-light/25 py-4 px-4 mb-5 rounded-3xl">
        <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-transparent shadow-none p-0">
                <CardHeader className="p-0">
                  <CardTitle className="text-bookWhite pb-3 text-center text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-0">

                  <div className="space-y-2">

                    <div className="flex items-start gap-2 p-2 rounded-xl bg-accent/90">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@alex" />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">AL</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="text-sm text-secondary font-medium">
                          Alex Lee finished reading <span className="font-bold">The Song of Achilles</span><span className="text-xs text-secondary/50 font-serif font-medium"> 2 hours ago</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2 rounded-xl bg-accent/90">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@alex" />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">AL</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="text-sm text-secondary font-medium">
                          Alex Lee finished reading <span className="font-bold">The Song of Achilles</span><span className="text-xs text-secondary/50 font-serif font-medium"> 2 hours ago</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2 rounded-xl bg-accent/90">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@alex" />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">AL</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="text-sm text-secondary font-medium">
                          Alex Lee finished reading <span className="font-bold">The Song of Achilles</span><span className="text-xs text-secondary/50 font-serif font-medium"> 2 hours ago</span>
                        </p>
                      </div>
                    </div>

                  </div>

                  <div className="flex flex-row justify-end">
                    <Button variant="outline" className="rounded-full border-bookWhite mt-4 text-bookWhite">
                      Got to Activity 
                      <ArrowRight />
                    </Button>
                  </div>

                </CardContent>
              </Card>
            </div>
        </div>
    </div>
  )
}
