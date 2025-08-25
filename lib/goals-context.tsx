"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { CustomGoalsService } from '@/lib/custom-goals-service';

interface CustomGoal {
  id: string;
  name: string;
  description: string;
  target_books: number;
  time_period: string;
  status: string;
  current_progress: number;
  created_at: string;
  start_date: string;
  end_date?: string;
  completed_at?: string;
  progress: {
    current_value: number;
    target_value: number;
    progress_percentage: number;
  };
  is_completed: boolean;
  earned_at?: string;
}

interface GoalsContextType {
  goals: CustomGoal[];
  isLoading: boolean;
  error: string | null;
  refreshGoals: () => Promise<void>;
  optimisticallyUpdateGoalProgress: (incrementBy?: number) => void;
  rollbackOptimisticUpdate: () => void;
  setGoalCompletedCallback: (callback: (goal: CustomGoal) => void) => void;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [goals, setGoals] = useState<CustomGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalGoals, setOriginalGoals] = useState<CustomGoal[]>([]); // For rollback
  const [goalCompletedCallback, setGoalCompletedCallback] = useState<((goal: CustomGoal) => void) | null>(null);

  // Add safety wrapper for the callback
  const safeGoalCompletedCallback = useCallback((goal: CustomGoal) => {
    //console.log('[GoalsContext] safeGoalCompletedCallback called with goal:', goal?.name);
    //console.log('[GoalsContext] Callback registered:', !!goalCompletedCallback);
    
    if (!goalCompletedCallback) {
      //console.log('[GoalsContext] ❌ No callback registered, skipping goal completion notification');
      return;
    }
    
    if (!goal || !goal.id) {
      //console.error('[GoalsContext] ❌ Attempted to call completion callback with invalid goal data:', goal);
      return;
    }
    
    //console.log('[GoalsContext] ✅ Safely calling goal completion callback for:', goal.name);
    //console.log('[GoalsContext] Goal being passed to callback:', JSON.stringify(goal, null, 2));
    goalCompletedCallback(goal);
  }, [goalCompletedCallback]);

  //console.log('[GoalsProvider] Provider mounted with session status:', status);
  //console.log('[GoalsProvider] Current goals count:', goals.length);

  const fetchGoals = async () => {
    if (status !== 'authenticated' || !session?.supabaseAccessToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/achievements/custom-goals', {
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch goals: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Get current active goals to compare for newly completed ones
      const currentActiveGoalIds = goals.map(g => g.id);
      
      // Check for newly completed goals (goals that were active but are now completed)
      const completedGoals = data.filter((goal: CustomGoal) => 
        goal.is_completed && currentActiveGoalIds.includes(goal.id)
      );
      
      //console.log('[GoalsContext] Found newly completed goals:', completedGoals.length);
      
      // Notify about newly completed goals
      completedGoals.forEach((goal: CustomGoal) => {
        safeGoalCompletedCallback(goal);
      });
      
      // Filter to only show active goals (not completed)
      const activeGoals = data.filter((goal: CustomGoal) => !goal.is_completed);
      setGoals(activeGoals);
      setOriginalGoals(activeGoals); // Store for potential rollback
    } catch (error) {
      console.error('Error fetching custom goals:', error);
      setError(error instanceof Error ? error.message : 'Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshGoals = async () => {
    await fetchGoals();
  };

  const optimisticallyUpdateGoalProgress = (incrementBy: number = 1) => {
    setOriginalGoals([...goals]); // Store current state for potential rollback
    
    setGoals(prevGoals => {
      const updatedGoals = prevGoals.map(goal => {
        const newCurrentValue = Math.min(
          goal.progress.current_value + incrementBy, 
          goal.progress.target_value
        );
        const newProgressPercentage = Math.round(
          (newCurrentValue / goal.progress.target_value) * 100
        );
        const isCompleted = newCurrentValue >= goal.progress.target_value;
        
        const updatedGoal = {
          ...goal,
          current_progress: newCurrentValue,
          progress: {
            ...goal.progress,
            current_value: newCurrentValue,
            progress_percentage: newProgressPercentage
          },
          is_completed: isCompleted,
          status: isCompleted ? 'COMPLETED' : goal.status,
          completed_at: isCompleted && !goal.is_completed ? new Date().toISOString() : goal.completed_at
        };
        
        // If goal is completed for the first time, trigger the callback immediately
        if (isCompleted && !goal.is_completed) {
          //console.log('[GoalsContext] Goal completed optimistically:', updatedGoal.name);
          // Trigger callback immediately for optimistic updates
          setTimeout(() => safeGoalCompletedCallback(updatedGoal), 50);
        }
        
        return updatedGoal;
      });
      
      // Filter out completed goals from the display list
      return updatedGoals.filter(goal => !goal.is_completed);
    });
  };

  const rollbackOptimisticUpdate = () => {
    //console.log('[GoalsContext] Rolling back optimistic update');
    //console.log('[GoalsContext] Reverting to original goals:', originalGoals);
    setGoals(originalGoals);
  };

  // Initial fetch
  useEffect(() => {
    fetchGoals();
  }, [status, session?.supabaseAccessToken]);

  // Wrapper function for setting the callback
  const setGoalCompletedCallbackWrapper = (callback: (goal: CustomGoal) => void) => {
    //console.log('[GoalsContext] Setting goal completion callback wrapper');
    setGoalCompletedCallback(() => callback);
  };

  const contextValue: GoalsContextType = {
    goals,
    isLoading,
    error,
    refreshGoals,
    optimisticallyUpdateGoalProgress,
    rollbackOptimisticUpdate,
    setGoalCompletedCallback: setGoalCompletedCallbackWrapper
  };

  return (
    <GoalsContext.Provider value={contextValue}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
} 