const STORAGE_KEY = 'bookcrush_goal_congrats_shown';

/**
 * Check if congratulations was already shown for a specific goal
 */
export const hasShownCongratulations = (goalId: string): boolean => {
  if (typeof window === 'undefined') return false; // Server-side check
  
  try {
    const shownGoals = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return shownGoals.includes(goalId);
  } catch {
    return false;
  }
};

/**
 * Mark congratulations as shown for a specific goal
 */
export const markCongratulationsShown = (goalId: string): void => {
  if (typeof window === 'undefined') return; // Server-side check
  
  try {
    const shownGoals = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!shownGoals.includes(goalId)) {
      shownGoals.push(goalId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shownGoals));
    }
  } catch (error) {
    console.error('Error marking congratulations as shown:', error);
  }
};

/**
 * Get all goal IDs that have shown congratulations
 */
export const getShownCongratulations = (): string[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

/**
 * Clear all congratulations tracking (useful for testing or reset)
 * This allows users to see congratulations dialogs again for all completed goals
 */
export const clearCongratulationsHistory = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing congratulations history:', error);
  }
};

/**
 * Remove a specific goal from congratulations history (useful if goal is deleted)
 */
export const removeCongratulationsForGoal = (goalId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const shownGoals = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const updatedGoals = shownGoals.filter((id: string) => id !== goalId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGoals));
  } catch (error) {
    console.error('Error removing congratulations for goal:', error);
  }
}; 