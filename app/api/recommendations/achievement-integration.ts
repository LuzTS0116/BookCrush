import { achievementService } from '../achievements/service';

/**
 * Call this function after a user successfully sends a recommendation
 * Add this to your recommendations/route.ts in the POST method
 */
export async function checkRecommendationAchievements(fromUserId: string, toUserId: string, bookId: string) {
  try {
    console.log(`User ${fromUserId} sent recommendation to ${toUserId} for book ${bookId}, checking achievements...`);
    
    // Check for recommendation achievements for the sender
    await achievementService.checkAndAwardAchievements(fromUserId, 'recommendation_sent');
    
    console.log(`Achievement check completed for user ${fromUserId}`);
  } catch (error) {
    console.error('Error checking achievements after recommendation sent:', error);
    // Don't fail the main operation if achievement checking fails
  }
}

/**
 * Integration example for your existing recommendations/route.ts POST method
 * Add this import at the top: import { checkRecommendationAchievements } from './achievement-integration';
 * 
 * Then add this after your recommendation creation (after the transaction):
 * 
 * // Check for achievements after sending recommendation
 * await checkRecommendationAchievements(user.id, toUserId, bookId);
 */ 