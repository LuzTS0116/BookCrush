import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ClubActivityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Club Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@alex" />
              <AvatarFallback className="bg-secondary text-secondary-foreground">AL</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Alex Lee finished reading <span className="font-bold">The Song of Achilles</span>
              </p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@sarah" />
              <AvatarFallback className="bg-primary text-primary-foreground">SJ</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Sarah Johnson started reading <span className="font-bold">Cloud Cuckoo Land</span>
              </p>
              <p className="text-xs text-muted-foreground">Yesterday at 8:32 PM</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@mike" />
              <AvatarFallback className="bg-accent text-accent-foreground">MP</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Mike Peterson added <span className="font-bold">The Invisible Life of Addie LaRue</span> to their queue
              </p>
              <p className="text-xs text-muted-foreground">2 days ago</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@emma" />
              <AvatarFallback className="bg-secondary-light text-secondary-foreground">EW</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Emma Wilson commented on <span className="font-bold">The Midnight Library</span>
              </p>
              <p className="text-xs text-muted-foreground">3 days ago</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@david" />
              <AvatarFallback className="bg-primary text-primary-foreground">DK</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                David Kim suggested <span className="font-bold">Lessons in Chemistry</span> for Fiction Lovers club
              </p>
              <p className="text-xs text-muted-foreground">4 days ago</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@lisa" />
              <AvatarFallback className="bg-accent text-accent-foreground">LT</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Lisa Thompson created a new club: <span className="font-bold">Mystery Readers</span>
              </p>
              <p className="text-xs text-muted-foreground">1 week ago</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
