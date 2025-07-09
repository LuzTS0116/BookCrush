import { prisma } from '@/lib/prisma';

export class CustomGoalsService {
  /**
   * Update custom goal progress when a user finishes a book
   */
  static async updateCustomGoalProgress(userId: string) {
    try {
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

      if (activeGoals.length === 0) {
        return; // No active goals to update
      }

      // Count books finished within each goal's time period
      for (const goal of activeGoals) {
        const progress = goal.progress_tracking[0];
        if (!progress) continue;

        const progressData = progress.progress_data as any;
        const startDate = new Date(progressData?.start_date);
        const endDate = new Date(progressData?.end_date);
        const now = new Date();

        // Check if goal is still active (not expired)
        if (now > endDate) {
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

        // Update progress
        const newProgressPercentage = progress.target_value > 0 
          ? Math.round((booksFinished / progress.target_value) * 100)
          : 0;

        await prisma.achievementProgress.update({
          where: {
            user_id_achievement_id: {
              user_id: userId,
              achievement_id: goal.id
            }
          },
          data: {
            current_value: booksFinished,
            last_updated: now,
            progress_data: {
              ...progressData,
              progress_percentage: newProgressPercentage
            }
          }
        });

        // Check if goal is completed
        if (booksFinished >= progress.target_value) {
          // Create UserAchievement record when goal is completed
          await prisma.userAchievement.create({
            data: {
              user_id: userId,
              achievement_id: goal.id,
              earned_at: now
            }
          });
        }
      }
    } catch (error) {
      console.error('Error updating custom goal progress:', error);
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