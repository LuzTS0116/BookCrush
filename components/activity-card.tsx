"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"
import { Button } from "./ui/button"
import { ActivityFeed } from "./activity-feed"
import { useRouter } from "next/navigation"

export function ActivityCard() {
  const router = useRouter();

  const handleGoToActivity = () => {
    router.push('/friends'); // Navigate to the friends page where the full activity is shown
  };

  return (
    <div className="container mx-auto bg-secondary-light pt-5 pb-3 px-4 rounded-t-3xl">
        <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-[url('/images/recent_bg2.png')] bg-cover h-auto rounded-t-2xl shadow-none p-4 rounded-b-lg">
                <CardHeader className="p-0">
                  <CardTitle className="text-bookBlack text-xl font-bold leading-none mt-1">Recent Activity</CardTitle>
                  <CardDescription className="font-serif font-medium text-secondary">Your friends have been busy—take a look!</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="mt-4">
                    <ActivityFeed 
                      compact={true} 
                      maxItems={3}
                      onViewMore={handleGoToActivity}
                    />
                  </div>

                  <div className="flex flex-row justify-end">
                    <Button 
                      variant="outline" 
                      className="rounded-full border-none bg-bookWhite mt-4 text-secondary"
                      onClick={handleGoToActivity}
                    >
                      Go to Activity 
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
