"use client";

import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export default function DashboardFeedback() {
    return (
        <div className="px-4 pb-6 pt-0 rounded-b-3xl bg-secondary-light space-y-2 shadow-sm">
            <div className="rounded-t-lg rounded-b-3xl pt-6 pb-4 px-4 bg-accent">
                <h2 className="text-bookBlack text-xl font-bold leading-none">Feedback</h2>
                <p className="font-serif font-medium text-secondary leading-none text-sm">
                    Let us know what you think about your app experience. Whether it's something you love,
                    something we can improve, or a feature you’d like to see — we’re all ears!
                </p>
                <Textarea placeholder="Share your thoughts..." className="mt-3 bg-bookWhite/80 rounded-b-xl placeholder:text-secondary/50 text-secondary font-medium font-serif text-sm resize-none border-none min-h-[100px]" />
                <div className="flex justify-end">
                    <Button variant="default" className="rounded-full bg-bookWhite hover:bg-bookWhite/80 mt-3 text-secondary">Submit Feedback</Button>
                </div>
            </div>
        </div>
    )
}