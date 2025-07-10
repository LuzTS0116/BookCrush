'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Target, BookOpen, Calendar, Trophy, Plus, X, EllipsisVertical } from "lucide-react";
import { toast } from "sonner";
import { AchievementCard } from './achievement-card';
import Image from "next/image";
import { useSession } from 'next-auth/react';
import { Separator } from '@radix-ui/react-dropdown-menu';
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

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

  // Confirmation dialog state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    goalId: string | null;
    goalName: string | null;
  }>({
    isOpen: false,
    goalId: null,
    goalName: null
  });

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
      console.log("goals data: ", data);
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

  const showDeleteConfirmation = (goalId: string, goalName: string) => {
    setDeleteConfirmation({
      isOpen: true,
      goalId,
      goalName
    });
  };

  const cancelDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      goalId: null,
      goalName: null
    });
  };

  const handleDeleteGoal = async () => {
    if (!session?.supabaseAccessToken || !deleteConfirmation.goalId) {
      toast.error('Authentication required');
      return;
    }

    try {
      setIsDeleting(prev => ({ ...prev, [deleteConfirmation.goalId!]: true }));
      
      const response = await fetch(`/api/achievements/custom-goals/${deleteConfirmation.goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      setGoals(prev => prev.filter(goal => goal.id !== deleteConfirmation.goalId));
      toast.success('Goal deleted successfully');
      cancelDeleteConfirmation();
    } catch (err: any) {
      console.error('Error deleting goal:', err);
      toast.error('Failed to delete goal');
    } finally {
      setIsDeleting(prev => ({ ...prev, [deleteConfirmation.goalId!]: false }));
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
      <DialogContent className="max-w-[500px] w-[85vw] max-h-[80vh] px-4 py-5 overflow-hidden">
        <DialogHeader className="relative z-20">
          <DialogTitle className="text-bookWhite pt-3">
            Reading Goals
          </DialogTitle>
          <DialogDescription className="text-bookWhite/80 font-serif">
            Set and track your personal book reading goals
          </DialogDescription>
        </DialogHeader>
        
        {/* Background Image */}
        <div className="absolute inset-0 z-[-1]">
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
                  {goals.map((goal) => (
                    <div key={goal.id} className="relative">
                      <div className="[&_.achievement-icon]:text-3xl">
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
                      </div>
                      
                      {/* 3-dots dropdown menu - positioned in top-right */}
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 text-xs flex items-center px-1 py-1 rounded-full h-6 w-6 bg-transparent border border-none hover:bg-bookWhite z-10"
                            disabled={isDeleting[goal.id]}
                          >
                            {isDeleting[goal.id] ? (
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            ) : (
                              <EllipsisVertical className="h-3 w-3 text-secondary/60" />
                            )}
                          </Button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Content
                          className="w-auto min-w-[120px] rounded-xl bg-bookWhite shadow-xl p-1 border border-gray-200 z-[100]"
                          sideOffset={5}
                          align="end"
                        >
                          <DropdownMenu.Item
                            onSelect={() => showDeleteConfirmation(goal.id, goal.name)}
                            className="px-3 py-2 text-xs text-center bg-red-700/90 text-bookWhite rounded-md cursor-pointer hover:bg-red-600 focus:bg-red-600 focus:outline-none transition-colors"
                            disabled={isDeleting[goal.id]}
                          >
                            Delete Goal
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
                    </div>
                  ))}
                </div>
              )}

              {/* Create New Goal */}
              {!showCreateForm ? (
                <div className='flex justify-center'>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="rounded-full bg-accent/80 hover:bg-accent text-secondary flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Goal
                  </Button>
                </div>
              ) : (
                <div className="bg-bookWhite/10 backdrop-blur-sm rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-bookWhite font-medium flex items-center">
                      Create New Goal
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateForm(false)}
                      className="h-8 w-8 p-0 bg-transparent border-bookWhite/20 text-bookWhite hover:bg-bookWhite/10 rounded-full flex items-center justify-center shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
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

                    <div className='flex justify-end'>
                      <Button
                        onClick={handleCreateGoal}
                        disabled={creating}
                        className="rounded-full bg-accent hover:bg-accent-variant text-secondary mt-2 border-none"
                      >
                        {creating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            Create Goal
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {goals.length === 0 && !showCreateForm && (
                <div className="text-center py-4">
                  <BookOpen className="h-12 w-12 text-bookWhite/40 mx-auto mb-1" />
                  <h3 className="text-bookWhite/60 font-medium mb-1">No Reading Goals Yet</h3>
                  <p className="text-bookWhite/45 font-serif text-sm leading-4 mb-4">
                    Set a personal reading goal to track your progress and stay motivated!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmation.isOpen} onOpenChange={cancelDeleteConfirmation}>
        <DialogContent className="w-[70vw] max-w-[300px] p-0">
          <DialogHeader className='px-2 pt-9'>
            <DialogTitle>Delete Reading Goal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the {deleteConfirmation.goalName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='px-2 pb-4 flex justify-center'>
            <Button
              variant="outline"
              onClick={cancelDeleteConfirmation}
              disabled={isDeleting[deleteConfirmation.goalId || '']}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGoal}
              disabled={isDeleting[deleteConfirmation.goalId || '']}
            >
              {isDeleting[deleteConfirmation.goalId || ''] ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Goal'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
} 