"use client";

import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export default function DashboardFeedback() {
    return (
        <div className="px-4 py-5 rounded-3xl bg-secondary-light space-y-2 shadow-sm">
            <h2 className="text-xl leading-5 font-medium text-bookWhite">We’d love your feedback 💬</h2>
            <p className="text-sm font-serif text-bookWhite">
                Let us know what you think about your app experience. Whether it's something you love,
                something we can improve, or a feature you’d like to see — we’re all ears!
            </p>
            <Textarea placeholder="Share your thoughts..." className="resize-none border-none min-h-[100px]" />
            <div className="flex justify-end">
                <Button variant="default" className="rounded-full">Submit Feedback</Button>
            </div>
        </div>
    )
}