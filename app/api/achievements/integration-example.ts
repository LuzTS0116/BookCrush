// Integration Examples for Achievement System
// Show how to integrate achievement checking into existing API endpoints

import { achievementService } from './service';

/**
 * Example: Integrate into user-books API when user finishes a book
 * Add this to your existing user-books/route.ts
 */
export async function onBookStatusChange(userId: string, bookId: string, newStatus: string) {
  // Your existing book status update logic here...
  
  // After successful status update, check for achievements
  if (newStatus === 'finished') {
    // Check for achievements
    await achievementService.checkAndAwardAchievements(userId, 'book_finished');
  }
}

/**
 * Example: Integrate into club membership API when user joins a club
 * Add this to your existing clubs/join/route.ts
 */
export async function onClubJoin(userId: string, clubId: string) {
  // Your existing club join logic here...
  
  // After successful join, check for achievements
  await achievementService.checkAndAwardAchievements(userId, 'club_joined');
}

/**
 * Example: Integrate into book review API when user writes a review
 * Add this to your existing reviews/route.ts
 */
export async function onReviewCreated(userId: string, bookId: string, reviewId: string) {
  // Your existing review creation logic here...
  
  // After successful review creation, check for achievements
  await achievementService.checkAndAwardAchievements(userId, 'review_written');
}

/**
 * Example: Integrate into recommendations API when user sends a recommendation
 * Add this to your existing recommendations/route.ts
 */
export async function onRecommendationSent(userId: string, bookId: string, recipientId: string) {
  // Your existing recommendation logic here...
  
  // Check achievements for both sender and recipient
  await achievementService.checkAndAwardAchievements(userId, 'recommendation_sent');
  await achievementService.checkAndAwardAchievements(recipientId, 'recommendation_received');
}

/**
 * Example: Integrate into friend request API when users become friends
 * Add this to your existing friends/route.ts
 */
export async function onFriendshipEstablished(userId1: string, userId2: string) {
  // Your existing friendship logic here...
  
  // Check achievements for both users
  await achievementService.checkAndAwardAchievements(userId1, 'friend_added');
  await achievementService.checkAndAwardAchievements(userId2, 'friend_added');
}

/**
 * Example: Daily cron job to check streak maintenance
 * This could be run as a scheduled task
 */
export async function dailyStreakMaintenance() {
  // This would typically be run as a cron job or scheduled task
  // You might want to check all users' streaks and reset broken ones
  
  // For now, this is just an example of how you might structure it
  console.log('Running daily streak maintenance...');
  
  // You could query all users and update their streaks
  // or handle this through individual user actions
}

/**
 * Example: Integration with existing user activity tracking
 * If you already have activity logging, you can hook into that
 */
export async function onUserActivity(userId: string, activityType: string, metadata?: any) {
  // Your existing activity logging...
  
  // Map activity types to achievement triggers
  const achievementTriggers: Record<string, string> = {
    'FINISHED_READING_BOOK': 'book_finished',
    'JOINED_CLUB': 'club_joined', 
    'CREATED_CLUB': 'club_created',
    'POSTED_CLUB_DISCUSSION': 'discussion_posted',
    'SENT_FRIEND_REQUEST': 'friend_request_sent',
    'ACCEPTED_FRIEND_REQUEST': 'friend_request_accepted',
    'REVIEWED_BOOK': 'review_written',
    'SENT_BOOK_RECOMMENDATION': 'recommendation_sent'
  };
  
  const trigger = achievementTriggers[activityType];
  if (trigger) {
    await achievementService.checkAndAwardAchievements(userId, trigger);
  }
}

// Example of how to call this from your existing API endpoints:
/*

// In your existing user-books/route.ts:
export async function PUT(request: NextRequest) {
  // ... existing code ...
  
  // After successful book status update:
  if (newStatus === 'finished') {
    await onBookStatusChange(userId, bookId, newStatus);
  }
  
  // ... rest of your code ...
}

// In your existing clubs/join/route.ts:
export async function POST(request: NextRequest) {
  // ... existing code ...
  
  // After successful club join:
  await onClubJoin(userId, clubId);
  
  // ... rest of your code ...
}

*/ 