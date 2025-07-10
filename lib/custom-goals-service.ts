import { prisma } from '@/lib/prisma';

export class CustomGoalsService {
  /**
   * Update custom goal progress when a user finishes a book
   */
  static async updateCustomGoalProgress(userId: string) {
    try {
      console.log('[CustomGoalsService] Starting progress update for user:', userId);
      
      // Get all active custom goals for the user (those with progress tracking but not yet earned)
      const activeGoals = await prisma.achievement.findMany({
        where: {
          name: { startsWith: 'Custom Goal:' },
          progress_tracking: {
            some: {
              user_id: userId
            }
          },
          user_achievements: {
            none: {
              user_id: userId
            }
          }
        },
        include: {
          user_achievements: {
            where: { user_id: userId }
          },
          progress_tracking: {
            where: { user_id: userId }
          }
        }
      });

      console.log('[CustomGoalsService] Found active goals:', activeGoals.length);

      if (activeGoals.length === 0) {
        return; // No active goals to update
      }

      // Count books finished within each goal's time period
      for (const goal of activeGoals) {
        const progress = goal.progress_tracking[0];
        if (!progress) {
          console.log('[CustomGoalsService] No progress record found for goal:', goal.id);
          continue;
        }

        // Get the original target from the achievement criteria
        const criteria = goal.criteria as any;
        const originalTarget = criteria?.target_books;
        
        console.log('[CustomGoalsService] Processing goal:', goal.name);
        console.log('[CustomGoalsService] Original target from criteria:', originalTarget);
        console.log('[CustomGoalsService] Current target from progress:', progress.target_value);

        // Fix corrupted target_value if needed
        let correctTargetValue = progress.target_value;
        if (originalTarget && progress.target_value !== originalTarget) {
          console.log('[CustomGoalsService] 🔧 FIXING corrupted target_value:', progress.target_value, '→', originalTarget);
          correctTargetValue = originalTarget;
          
          // Update the progress record with correct target
          await prisma.achievementProgress.update({
            where: {
              user_id_achievement_id: {
                user_id: userId,
                achievement_id: goal.id
              }
            },
            data: {
              target_value: originalTarget
            }
          });
        }

        const progressData = progress.progress_data as any;
        console.log('[CustomGoalsService] Progress data:', progressData);

        // Validate and parse dates
        let startDate: Date;
        let endDate: Date;
        
        try {
          startDate = new Date(progressData?.start_date);
          endDate = new Date(progressData?.end_date);
          
          // Check if dates are valid
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error('[CustomGoalsService] Invalid dates in progress data:', {
              start_date: progressData?.start_date,
              end_date: progressData?.end_date
            });
            continue;
          }
        } catch (error) {
          console.error('[CustomGoalsService] Error parsing dates:', error);
          continue;
        }

        const now = new Date();
        console.log('[CustomGoalsService] Date range:', {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          now: now.toISOString()
        });

        // Check if goal is still active (not expired)
        if (now > endDate) {
          console.log('[CustomGoalsService] Goal expired, skipping:', goal.id);
          continue;
        }

        // Count books finished within the goal period
        const booksFinished = await prisma.userBook.count({
          where: {
            user_id: userId,
            status: 'finished',
            added_at: {
              gte: startDate,
              lte: now
            }
          }
        });

        console.log('[CustomGoalsService] Books finished in period:', booksFinished);

        // Calculate progress percentage using the correct target
        const newProgressPercentage = correctTargetValue > 0 
          ? Math.round((booksFinished / correctTargetValue) * 100)
          : 0;

        console.log('[CustomGoalsService] Updating progress:', {
          current: booksFinished,
          target: correctTargetValue,
          percentage: newProgressPercentage
        });

        // Update progress - ensure we preserve the correct target_value
        await prisma.achievementProgress.update({
          where: {
            user_id_achievement_id: {
              user_id: userId,
              achievement_id: goal.id
            }
          },
          data: {
            current_value: booksFinished,
            target_value: correctTargetValue, // Explicitly set to ensure it's correct
            last_updated: now,
            progress_data: {
              ...progressData,
              progress_percentage: newProgressPercentage,
              last_book_count: booksFinished
            }
          }
        });

        console.log('[CustomGoalsService] Progress updated successfully');

        // Check if goal is completed
        if (booksFinished >= correctTargetValue) {
          console.log('[CustomGoalsService] Goal completed! Creating achievement record');
          
          // Create UserAchievement record when goal is completed
          await prisma.userAchievement.create({
            data: {
              user_id: userId,
              achievement_id: goal.id,
              earned_at: now
            }
          });

          console.log('[CustomGoalsService] Achievement record created');
        }
      }
    } catch (error) {
      console.error('[CustomGoalsService] Error updating custom goal progress:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Clean up expired custom goals
   */
  static async cleanupExpiredGoals() {
    try {
      const now = new Date();
      
      // Find expired goals (those with progress tracking but not yet earned)
      const expiredGoals = await prisma.achievement.findMany({
        where: {
          name: { startsWith: 'Custom Goal:' },
          progress_tracking: {
            some: {}
          },
          user_achievements: {
            none: {}
          }
        },
        include: {
          progress_tracking: true
        }
      });

      for (const goal of expiredGoals) {
        for (const progress of goal.progress_tracking) {
          const progressData = progress.progress_data as any;
          const endDate = new Date(progressData?.end_date);
          
          if (now > endDate) {
            // Mark as expired (we could add an 'expired' status or just leave as is)
            // For now, we'll just log it
            console.log(`Custom goal ${goal.id} expired for user ${progress.user_id}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired goals:', error);
    }
  }
} 