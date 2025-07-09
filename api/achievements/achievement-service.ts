import { PrismaClient } from '@prisma/client';
import { AchievementCriteria } from '../../prisma/seed-achievements';

const prisma = new PrismaClient();

export class AchievementService {
  
  /**
   * Main function to check and award achievements for a user
   * Call this after any user activity that might trigger achievements
   */
  async checkAndAwardAchievements(userId: string, activityType?: string) {
    try {
      // Get all active achievements that the user hasn't earned yet
      const unearned = await prisma.achievement.findMany({
        where: {
          is_active: true,
          user_achievements: {
            none: {
              user_id: userId
            }
          }
        }
      });

      // Check each achievement
      for (const achievement of unearned) {
        const criteria = achievement.criteria as AchievementCriteria;
        const shouldAward = await this.checkAchievementCriteria(userId, criteria);
        
        if (shouldAward) {
          await this.awardAchievement(userId, achievement.id);
        }
      }
      
      // Update achievement progress for tracking
      await this.updateAchievementProgress(userId);
      
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  /**
   * Check if a user meets the criteria for a specific achievement
   */
  private async checkAchievementCriteria(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    switch (criteria.type) {
      case 'books_read':
        return await this.checkBooksReadCriteria(userId, criteria);
      
      case 'reading_streak':
        return await this.checkReadingStreakCriteria(userId, criteria);
      
      case 'genre_diversity':
        return await this.checkGenreDiversityCriteria(userId, criteria);
      
      case 'social_activity':
        return await this.checkSocialActivityCriteria(userId, criteria);
      
      case 'club_participation':
        return await this.checkClubParticipationCriteria(userId, criteria);
      
      case 'speed_reading':
        return await this.checkSpeedReadingCriteria(userId, criteria);
      
      case 'reviews_written':
        return await this.checkReviewsWrittenCriteria(userId, criteria);
      
      case 'recommendations_sent':
        return await this.checkRecommendationsSentCriteria(userId, criteria);
      
      case 'special_event':
        return await this.checkSpecialEventCriteria(userId, criteria);
      
      default:
        return false;
    }
  }

  /**
   * Check books read criteria
   */
  private async checkBooksReadCriteria(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    const { threshold, timeframe } = criteria;
    
    let whereClause: any = {
      user_id: userId,
      status: 'finished'
    };

    // Add timeframe filter if specified
    if (timeframe && timeframe !== 'all_time') {
      const now = new Date();
      let startDate: Date;
      
      switch (timeframe) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      whereClause.added_at = {
        gte: startDate
      };
    }

    const count = await prisma.userBook.count({
      where: whereClause
    });

    return count >= (threshold || 0);
  }

  /**
   * Check reading streak criteria
   */
  private async checkReadingStreakCriteria(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    const { threshold } = criteria;
    
    const userStreak = await prisma.readingStreak.findFirst({
      where: {
        user_id: userId,
        streak_type: 'DAILY_READING'
      }
    });

    return userStreak ? userStreak.current_streak >= (threshold || 0) : false;
  }

  /**
   * Check genre diversity criteria
   */
  private async checkGenreDiversityCriteria(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    const { threshold } = criteria;
    
    // Get all unique genres from user's finished books
    const userBooks = await prisma.userBook.findMany({
      where: {
        user_id: userId,
        status: 'finished'
      },
      include: {
        book: {
          select: {
            genres: true
          }
        }
      }
    });

    const uniqueGenres = new Set<string>();
    userBooks.forEach(userBook => {
      userBook.book.genres.forEach(genre => uniqueGenres.add(genre));
    });

    return uniqueGenres.size >= (threshold || 0);
  }

  /**
   * Check social activity criteria
   */
  private async checkSocialActivityCriteria(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    const { threshold, conditions } = criteria;
    
    if (conditions?.activity_types?.includes('friend_request_accepted')) {
      const friendCount = await prisma.friendship.count({
        where: {
          OR: [
            { userId1: userId },
            { userId2: userId }
          ]
        }
      });
      
      return friendCount >= (threshold || 0);
    }
    
    return false;
  }

  /**
   * Check club participation criteria
   */
  private async checkClubParticipationCriteria(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    const { threshold, conditions } = criteria;
    
    if (conditions?.club_actions?.includes('join_club')) {
      const membershipCount = await prisma.clubMembership.count({
        where: {
          user_id: userId,
          status: 'ACTIVE'
        }
      });
      
      return membershipCount >= (threshold || 0);
    }
    
    if (conditions?.club_actions?.includes('create_club')) {
      const clubCount = await prisma.club.count({
        where: {
          owner_id: userId
        }
      });
      
      return clubCount >= (threshold || 0);
    }
    
    if (conditions?.club_actions?.includes('start_discussion')) {
      const discussionCount = await prisma.clubDiscussion.count({
        where: {
          user_id: userId
        }
      });
      
      return discussionCount >= (threshold || 0);
    }
    
    return false;
  }

  /**
   * Check speed reading criteria
   */
  private async checkSpeedReadingCriteria(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    const { threshold, conditions } = criteria;
    const maxDays = conditions?.completion_time_days || 1;
    
    // Check activity log for books finished within the time limit
    const fastReads = await prisma.activityLog.count({
      where: {
        user_id: userId,
        activity_type: 'FINISHED_READING_BOOK',
        // This would require custom logic to track reading start/end times
        // For now, we'll use a simplified approach
        created_at: {
          gte: new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    return fastReads >= (threshold || 0);
  }

  /**
   * Check reviews written criteria
   */
  private async checkReviewsWrittenCriteria(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    const { threshold } = criteria;
    
    const reviewCount = await prisma.bookReview.count({
      where: {
        user_id: userId
      }
    });
    
    return reviewCount >= (threshold || 0);
  }

  /**
   * Check recommendations sent criteria
   */
  private async checkRecommendationsSentCriteria(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    const { threshold } = criteria;
    
    const recommendationCount = await prisma.bookRecommendation.count({
      where: {
        from_user_id: userId
      }
    });
    
    return recommendationCount >= (threshold || 0);
  }

  /**
   * Check special event criteria
   */
  private async checkSpecialEventCriteria(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    const { conditions } = criteria;
    
    if (conditions?.activity_types?.includes('first_book_january')) {
      const firstBookInJanuary = await prisma.userBook.findFirst({
        where: {
          user_id: userId,
          added_at: {
            gte: new Date(new Date().getFullYear(), 0, 1), // January 1st
            lt: new Date(new Date().getFullYear(), 1, 1)   // February 1st
          }
        },
        orderBy: {
          added_at: 'asc'
        }
      });
      
      return !!firstBookInJanuary;
    }
    
    return false;
  }

  /**
   * Award an achievement to a user
   */
  private async awardAchievement(userId: string, achievementId: string) {
    try {
      const achievement = await prisma.achievement.findUnique({
        where: { id: achievementId }
      });

      if (!achievement) return;

      await prisma.userAchievement.create({
        data: {
          user_id: userId,
          achievement_id: achievementId,
          progress_data: {
            earned_at: new Date().toISOString(),
            achievement_name: achievement.name,
            points_earned: achievement.points
          }
        }
      });

      // Create activity log entry
      await prisma.activityLog.create({
        data: {
          user_id: userId,
          activity_type: 'FINISHED_READING_BOOK', // You might want to add a new type for achievements
          details: {
            achievement_id: achievementId,
            achievement_name: achievement.name,
            points: achievement.points
          }
        }
      });

      console.log(`Achievement "${achievement.name}" awarded to user ${userId}`);
      
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  }

  /**
   * Update achievement progress for tracking
   */
  private async updateAchievementProgress(userId: string) {
    const achievements = await prisma.achievement.findMany({
      where: {
        is_active: true,
        user_achievements: {
          none: {
            user_id: userId
          }
        }
      }
    });

    for (const achievement of achievements) {
      const criteria = achievement.criteria as AchievementCriteria;
      const progress = await this.calculateProgress(userId, criteria);
      
      await prisma.achievementProgress.upsert({
        where: {
          user_id_achievement_id: {
            user_id: userId,
            achievement_id: achievement.id
          }
        },
        update: {
          current_value: progress.current,
          target_value: progress.target,
          last_updated: new Date()
        },
        create: {
          user_id: userId,
          achievement_id: achievement.id,
          current_value: progress.current,
          target_value: progress.target
        }
      });
    }
  }

  /**
   * Calculate current progress for an achievement
   */
  private async calculateProgress(userId: string, criteria: AchievementCriteria): Promise<{ current: number; target: number }> {
    const target = criteria.threshold || 1;
    let current = 0;

    switch (criteria.type) {
      case 'books_read':
        current = await prisma.userBook.count({
          where: { user_id: userId, status: 'finished' }
        });
        break;
      
      case 'reading_streak':
        const streak = await prisma.readingStreak.findFirst({
          where: { user_id: userId, streak_type: 'DAILY_READING' }
        });
        current = streak?.current_streak || 0;
        break;
      
      case 'reviews_written':
        current = await prisma.bookReview.count({
          where: { user_id: userId }
        });
        break;
      
      // Add more progress calculations as needed
      default:
        current = 0;
    }

    return { current, target };
  }

  /**
   * Get user's achievements with progress
   */
  async getUserAchievements(userId: string) {
    const earned = await prisma.userAchievement.findMany({
      where: { user_id: userId },
      include: {
        achievement: true
      },
      orderBy: {
        earned_at: 'desc'
      }
    });

    const progress = await prisma.achievementProgress.findMany({
      where: { user_id: userId },
      include: {
        achievement: true
      }
    });

    return {
      earned: earned.map(ua => ({
        ...ua.achievement,
        earned_at: ua.earned_at,
        progress_data: ua.progress_data
      })),
      in_progress: progress.map(ap => ({
        ...ap.achievement,
        current_value: ap.current_value,
        target_value: ap.target_value,
        progress_percentage: Math.round((ap.current_value / ap.target_value) * 100)
      }))
    };
  }

  /**
   * Update reading streak for a user
   */
  async updateReadingStreak(userId: string) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Check if user has any reading activity today
    const hasActivityToday = await prisma.dailyReadingActivity.findFirst({
      where: {
        user_id: userId,
        activity_date: new Date(todayStr)
      }
    });

    if (!hasActivityToday) {
      // Create today's activity record
      await prisma.dailyReadingActivity.create({
        data: {
          user_id: userId,
          activity_date: new Date(todayStr),
          activities: ['book_status_change']
        }
      });
    }

    // Update streak
    const streak = await prisma.readingStreak.findFirst({
      where: {
        user_id: userId,
        streak_type: 'DAILY_READING'
      }
    });

    if (streak) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastActivityDate = new Date(streak.last_activity_date);
      
      if (lastActivityDate.toDateString() === yesterday.toDateString()) {
        // Continue streak
        await prisma.readingStreak.update({
          where: { id: streak.id },
          data: {
            current_streak: streak.current_streak + 1,
            longest_streak: Math.max(streak.longest_streak, streak.current_streak + 1),
            last_activity_date: new Date(todayStr)
          }
        });
      } else if (lastActivityDate.toDateString() !== today.toDateString()) {
        // Break streak
        await prisma.readingStreak.update({
          where: { id: streak.id },
          data: {
            current_streak: 1,
            last_activity_date: new Date(todayStr)
          }
        });
      }
    } else {
      // Create new streak
      await prisma.readingStreak.create({
        data: {
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: new Date(todayStr),
          streak_type: 'DAILY_READING'
        }
      });
    }
  }
}

export const achievementService = new AchievementService(); 