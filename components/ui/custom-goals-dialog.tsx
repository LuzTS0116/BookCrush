'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Target, BookOpen, Calendar, Trophy, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { AchievementCard } from './achievement-card';
import Image from "next/image";
import { useSession } from 'next-auth/react';

interface CustomGoal {
  id: string;
  name: string;
  description: string;
  target_books: number;
  time_period: string;
  created_at: string;
  progress: {
    current_value: number;
    target_value: number;
    progress_percentage: number;
  };
}

interface CustomGoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIME_PERIODS = [
  { value: '1_month', label: '1 Month', days: 30 },
  { value: '3_months', label: '3 Months', days: 90 },
  { value: '6_months', label: '6 Months', days: 180 },
  { value: '1_year', label: '1 Year', days: 365 },
];

export function CustomGoalsDialog({ open, onOpenChange }: CustomGoalsDialogProps) {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<CustomGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [targetBooks, setTargetBooks] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  // Fetch existing goals
  useEffect(() => {
    if (open) {
      fetchGoals();
    }
  }, [open]);

  const fetchGoals = async () => {
    if (!session?.supabaseAccessToken) {
      toast.error('Authentication required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/achievements/custom-goals', {
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }
      
      const data = await response.json();
      setGoals(data);
    } catch (err) {
      console.error('Error fetching goals:', err);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!session?.supabaseAccessToken) {
      toast.error('Authentication required');
      return;
    }

    if (!targetBooks || !timePeriod) {
      toast.error('Please fill in all fields');
      return;
    }

    const booksNumber = parseInt(targetBooks);
    if (isNaN(booksNumber) || booksNumber <= 0) {
      toast.error('Please enter a valid number of books');
      return;
    }

    if (booksNumber > 1000) {
      toast.error('Goal cannot exceed 1000 books');
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/achievements/custom-goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_books: booksNumber,
          time_period: timePeriod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create goal');
      }

      const newGoal = await response.json();
      setGoals(prev => [...prev, newGoal]);
      
      // Reset form
      setTargetBooks('');
      setTimePeriod('');
      setShowCreateForm(false);
      
      toast.success('Reading goal created successfully!');
    } catch (err: any) {
      console.error('Error creating goal:', err);
      toast.error(err.message || 'Failed to create goal');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!session?.supabaseAccessToken) {
      toast.error('Authentication required');
      return;
    }

    try {
      setIsDeleting(prev => ({ ...prev, [goalId]: true }));
      
      const response = await fetch(`/api/achievements/custom-goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      toast.success('Goal deleted successfully');
    } catch (err: any) {
      console.error('Error deleting goal:', err);
      toast.error('Failed to delete goal');
    } finally {
      setIsDeleting(prev => ({ ...prev, [goalId]: false }));
    }
  };

  const getTimePeriodLabel = (period: string) => {
    const timePeriod = TIME_PERIODS.find(tp => tp.value === period);
    return timePeriod ? timePeriod.label : period;
  };

  const handleClose = () => {
    setShowCreateForm(false);
    setTargetBooks('');
    setTimePeriod('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[500px] w-[95vw] max-h-[85vh] p-6 overflow-hidden">
        <DialogHeader className="relative z-20">
          <DialogTitle className="text-bookWhite flex items-center gap-2">
            <Target className="h-5 w-5" />
            Reading Goals
          </DialogTitle>
          <DialogDescription className="text-bookWhite/80 font-serif">
            Set and track your personal book reading goals
          </DialogDescription>
        </DialogHeader>
        
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/background.png"
            alt="Reading Goals | BookCrush"
            width={1622}
            height={2871}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        <div className="relative z-10 max-h-[60vh] overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-bookWhite" />
              <span className="ml-2 text-bookWhite">Loading goals...</span>
            </div>
          ) : (
            <>
              {/* Existing Goals */}
              {goals.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-bookWhite font-medium flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Current Goals
                  </h3>
                  {goals.map((goal) => (
                    <div key={goal.id} className="relative">
                      <AchievementCard
                        achievement={{
                          id: goal.id,
                          name: goal.name,
                          description: goal.description,
                          icon: '🎯',
                          category: 'READING_MILESTONE',
                          difficulty: 'GOLD',
                          points: 0,
                          current_value: goal.progress.current_value,
                          target_value: goal.progress.target_value,
                          progress_percentage: goal.progress.progress_percentage,
                        }}
                        isEarned={false}
                        showProgress={true}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteGoal(goal.id)}
                        disabled={isDeleting[goal.id]}
                        className="absolute top-2 right-2 h-6 w-6 p-0 bg-red-500/80 hover:bg-red-600 border-red-400 text-white"
                      >
                        {isDeleting[goal.id] ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Create New Goal */}
              {!showCreateForm ? (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full bg-accent/80 hover:bg-accent text-secondary flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create New Goal
                </Button>
              ) : (
                <div className="bg-bookWhite/10 backdrop-blur-sm rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-bookWhite font-medium flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Goal
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateForm(false)}
                      className="h-6 w-6 p-0 bg-transparent border-bookWhite/20 text-bookWhite hover:bg-bookWhite/10"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="target-books" className="text-bookWhite/90 text-sm">
                        Number of Books
                      </Label>
                      <Input
                        id="target-books"
                        type="number"
                        min="1"
                        max="1000"
                        value={targetBooks}
                        onChange={(e) => setTargetBooks(e.target.value)}
                        placeholder="e.g., 12"
                        className="bg-bookWhite/20 border-bookWhite/20 text-bookWhite placeholder:text-bookWhite/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="time-period" className="text-bookWhite/90 text-sm">
                        Time Period
                      </Label>
                      <Select value={timePeriod} onValueChange={setTimePeriod}>
                        <SelectTrigger className="bg-bookWhite/20 border-bookWhite/20 text-bookWhite">
                          <SelectValue placeholder="Select time period" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_PERIODS.map((period) => (
                            <SelectItem key={period.value} value={period.value}>
                              {period.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleCreateGoal}
                      disabled={creating}
                      className="w-full bg-accent hover:bg-accent-variant text-secondary"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Target className="mr-2 h-4 w-4" />
                          Create Goal
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {goals.length === 0 && !showCreateForm && (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-bookWhite/60 mx-auto mb-4" />
                  <h3 className="text-bookWhite font-medium mb-2">No Reading Goals Yet</h3>
                  <p className="text-bookWhite/70 text-sm mb-4">
                    Set a personal reading goal to track your progress and stay motivated!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 