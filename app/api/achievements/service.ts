import { PrismaClient } from '@prisma/client';
import { AchievementCriteria } from '../../../prisma/seed-achievements';

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
      
      case 'recommendations_sent':
        return await this.checkRecommendationsSentCriteria(userId, criteria);
      
      // FUTURE IMPLEMENTATIONS - COMMENTED OUT FOR LATER
      
      // case 'genre_diversity':
      //   return await this.checkGenreDiversityCriteria(userId, criteria);
      
      // case 'club_participation':
      //   return await this.checkClubParticipationCriteria(userId, criteria);
      
      // case 'reviews_written':
      //   return await this.checkReviewsWrittenCriteria(userId, criteria);
      
      // case 'social_activity':
      //   return await this.checkSocialActivityCriteria(userId, criteria);
      
      // case 'special_event':
      //   return await this.checkSpecialEventCriteria(userId, criteria);
      
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

  // FUTURE IMPLEMENTATIONS - COMMENTED OUT FOR LATER
  
  /**
   * Check genre diversity criteria (Future Implementation)
   */
  /*
  private async checkGenreDiversityCriteria(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    const { threshold } = criteria;
    
    // Get distinct genres from user's finished books
    const userBooks = await prisma.userBook.findMany({
      where: {
        user_id: userId,
        status: 'finished'
      },
      include: {
        book: {
          select: {
            genre: true
          }
        }
      }
    });
    
    const uniqueGenres = new Set(userBooks.map(ub => ub.book.genre).filter(Boolean));
    
    return uniqueGenres.size >= (threshold || 0);
  }
  */

  /**
   * Check club participation criteria (Future Implementation)
   */
  /*
  private async checkClubParticipationCriteria(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    const { threshold, conditions } = criteria;
    
    if (!conditions?.club_actions) return false;
    
    let count = 0;
    
    for (const action of conditions.club_actions) {
      switch (action) {
        case 'join':
          count += await prisma.clubMember.count({
            where: { user_id: userId }
          });
          break;
        case 'start_discussion':
          // Assume you have a ClubDiscussion model
          // count += await prisma.clubDiscussion.count({
          //   where: { created_by: userId }
          // });
          break;
        case 'monthly_activity':
          // Calculate months of activity
          const firstActivity = await prisma.clubMember.findFirst({
            where: { user_id: userId },
            orderBy: { joined_at: 'asc' }
          });
          if (firstActivity) {
            const now = new Date();
            const monthsActive = Math.floor((now.getTime() - firstActivity.joined_at.getTime()) / (1000 * 60 * 60 * 24 * 30));
            count = Math.max(count, monthsActive);
          }
          break;
      }
    }
    
    return count >= (threshold || 0);
  }
  */

  /**
   * Check reviews written criteria (Future Implementation)
   */
  /*
  private async checkReviewsWrittenCriteria(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    const { threshold, conditions } = criteria;
    
    let whereClause: any = {
      user_id: userId
    };
    
    // Add rating filter if specified
    if (conditions?.review_rating === 'positive') {
      whereClause.rating = {
        gte: 4 // Assuming 4-5 stars is positive
      };
    }
    
    const reviewCount = await prisma.review.count({
      where: whereClause
    });
    
    return reviewCount >= (threshold || 0);
  }
  */

  /**
   * Check social activity criteria (Future Implementation)
   */
  /*
  private async checkSocialActivityCriteria(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    const { threshold, conditions } = criteria;
    
    if (!conditions?.activity_types) return false;
    
    let totalActivities = 0;
    
    for (const activityType of conditions.activity_types) {
      switch (activityType) {
        case 'like':
          // Assume you have a Likes model
          // totalActivities += await prisma.like.count({
          //   where: { user_id: userId }
          // });
          break;
        case 'comment':
          // Assume you have a Comments model
          // totalActivities += await prisma.comment.count({
          //   where: { user_id: userId }
          // });
          break;
        case 'share':
          // Assume you have a Shares model
          // totalActivities += await prisma.share.count({
          //   where: { user_id: userId }
          // });
          break;
        case 'follow':
          // Assume you have a Follows model
          // totalActivities += await prisma.follow.count({
          //   where: { follower_id: userId }
          // });
          break;
        case 'recommend':
          totalActivities += await prisma.bookRecommendation.count({
            where: { from_user_id: userId }
          });
          break;
      }
    }
    
    return totalActivities >= (threshold || 0);
  }
  */

  /**
   * Check special event criteria (Future Implementation)
   */
  /*
  private async checkSpecialEventCriteria(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    const { threshold, conditions } = criteria;
    
    if (!conditions?.event_type) return false;
    
    // Assume you have a UserEvents or EventParticipation model
    let count = 0;
    
    switch (conditions.event_type) {
      case 'reading_challenge':
        // count = await prisma.eventParticipation.count({
        //   where: { 
        //     user_id: userId, 
        //     event_type: 'reading_challenge' 
        //   }
        // });
        break;
      case 'challenge_completion':
        // count = await prisma.eventParticipation.count({
        //   where: { 
        //     user_id: userId, 
        //     event_type: 'reading_challenge',
        //     completed: true
        //   }
        // });
        break;
      case 'any_event':
        // count = await prisma.eventParticipation.count({
        //   where: { user_id: userId }
        // });
        break;
    }
    
    return count >= (threshold || 0);
  }
  */

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
      
      case 'recommendations_sent':
        current = await prisma.bookRecommendation.count({
          where: { from_user_id: userId }
        });
        break;
      
      // FUTURE IMPLEMENTATIONS - COMMENTED OUT FOR LATER
      
      // case 'genre_diversity':
      //   const userBooks = await prisma.userBook.findMany({
      //     where: { user_id: userId, status: 'finished' },
      //     include: { book: { select: { genre: true } } }
      //   });
      //   const uniqueGenres = new Set(userBooks.map(ub => ub.book.genre).filter(Boolean));
      //   current = uniqueGenres.size;
      //   break;
      
      // case 'club_participation':
      //   current = await prisma.clubMember.count({
      //     where: { user_id: userId }
      //   });
      //   break;
      
      // case 'reviews_written':
      //   current = await prisma.review.count({
      //     where: { user_id: userId }
      //   });
      //   break;
      
      // case 'social_activity':
      //   // Calculate total social activities
      //   current = await prisma.bookRecommendation.count({
      //     where: { from_user_id: userId }
      //   });
      //   // Add other social activities when implemented
      //   break;
      
      // case 'special_event':
      //   // current = await prisma.eventParticipation.count({
      //   //   where: { user_id: userId }
      //   // });
      //   break;
      
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
      earned: earned.map((ua: any) => ({
        ...ua.achievement,
        earned_at: ua.earned_at,
        progress_data: ua.progress_data
      })),
      in_progress: progress.map((ap: any) => ({
        ...ap.achievement,
        current_value: ap.current_value,
        target_value: ap.target_value,
        progress_percentage: Math.round((ap.current_value / ap.target_value) * 100)
      }))
    };
  }
}

export const achievementService = new AchievementService(); 