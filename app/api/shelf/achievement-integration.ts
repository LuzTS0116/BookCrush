import { achievementService } from '../achievements/service';

/**
 * Call this function after a user's book status changes to "finished"
 * Add this to your shelf/route.ts in the POST method
 */
export async function checkBookCompletionAchievements(userId: string, bookId: string, newStatus: string) {
  // Only check achievements when a book is marked as finished
  if (newStatus === 'finished') {
    try {
      console.log(`User ${userId} finished book ${bookId}, checking achievements...`);
      
      // Check for reading milestone achievements
      await achievementService.checkAndAwardAchievements(userId, 'book_finished');
      
      console.log(`Achievement check completed for user ${userId}`);
    } catch (error) {
      console.error('Error checking achievements after book completion:', error);
      // Don't fail the main operation if achievement checking fails
    }
  }
}

/**
 * Integration example for your existing shelf/route.ts POST method
 * Add this import at the top: import { checkBookCompletionAchievements } from './achievement-integration';
 * 
 * Then add this after your activity log creation (around line 150-160):
 * 
 * // Check for achievements after status change
 * if (statusType === status_type.finished) {
 *   await checkBookCompletionAchievements(user.id, bookId, statusType);
 * }
 */ 