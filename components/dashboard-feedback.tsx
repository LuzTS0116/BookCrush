"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function DashboardFeedback() {
    const [feedback, setFeedback] = useState("");
    const [feedbackType, setFeedbackType] = useState("GENERAL_FEEDBACK");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const feedbackTypes = [
        { value: "GENERAL_FEEDBACK", label: "General Feedback" },
        { value: "BUG_REPORT", label: "Bug Report" },
        { value: "FEATURE_REQUEST", label: "Feature Request" },
        { value: "COMPLAINT", label: "Complaint" },
        { value: "COMPLIMENT", label: "Compliment" },
    ];

    const handleSubmit = async () => {
        if (!feedback.trim()) {
            toast.error("Please enter your feedback before submitting.");
            return;
        }

        if (feedback.trim().length < 10) {
            toast.error("Feedback must be at least 10 characters long.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: feedback,
                    type: feedbackType,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit feedback');
            }

            // Success
            setIsSubmitted(true);
            setFeedback("");
            setFeedbackType("GENERAL_FEEDBACK");
            toast.success("Thank you! Your feedback has been submitted successfully.");

            // Reset submitted state after 3 seconds
            setTimeout(() => {
                setIsSubmitted(false);
            }, 3000);

        } catch (error: any) {
            console.error('Error submitting feedback:', error);
            toast.error(error.message || "Failed to submit feedback. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 pb-5 pt-0 rounded-b-3xl bg-secondary-light space-y-2 shadow-sm">
            <div className="rounded-t-lg rounded-b-2xl p-4 bg-accent">
                <h2 className="text-bookBlack text-xl font-bold leading-none mt-1">Feedback</h2>
                <p className="font-serif font-medium text-secondary leading-none text-sm mt-1">
                    Let us know what you think about your app experience. Whether it's something you love,
                    something we can improve, or a feature you'd like to see — we're all ears!
                </p>

                {isSubmitted ? (
                    <div className="mt-4 p-4 bg-accent-variant/15 rounded-xl flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-accent-variant/80" />
                        <div>
                            <p className="font-medium text-accent-variant">Feedback Submitted!</p>
                            <p className="text-sm text-accent-variant/80">Thank you for helping us improve the app.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mt-3 space-y-3">
                            <Select value={feedbackType} onValueChange={setFeedbackType}>
                                <SelectTrigger className="bg-bookWhite/80 border-none text-secondary font-medium">
                                    <SelectValue placeholder="Select feedback type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {feedbackTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Textarea 
                                placeholder="Share your thoughts..." 
                                className="bg-bookWhite/80 rounded-b-xl placeholder:text-secondary/50 text-secondary font-medium font-serif text-sm resize-none border-none min-h-[100px]"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                disabled={isSubmitting}
                                maxLength={2000}
                            />
                            
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-secondary/60 font-serif">
                                    {feedback.length}/2000 characters
                                </span>
                                <Button 
                                    variant="default" 
                                    className="rounded-full bg-bookWhite hover:bg-bookWhite/80 text-secondary"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !feedback.trim()}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Feedback"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}