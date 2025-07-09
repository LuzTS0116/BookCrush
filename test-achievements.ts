import { PrismaClient } from '@prisma/client';
import { achievementService } from './app/api/achievements/service';

const prisma = new PrismaClient();

async function testAchievements() {
  console.log('🧪 Testing Achievement System...\n');

  // Test user ID (replace with actual user ID)
  const testUserId = 'test-user-123';
  
  try {
    // Test 1: Check initial state
    console.log('1. Checking initial achievements...');
    const initialAchievements = await achievementService.getUserAchievements(testUserId);
    console.log(`   Earned: ${initialAchievements.earned.length}`);
    console.log(`   In Progress: ${initialAchievements.in_progress.length}`);
    
    // Test 2: Add some test data to trigger achievements
    console.log('\n2. Adding test data...');
    
    // Add a finished book to trigger reading milestone achievements
    await prisma.userBook.create({
      data: {
        user_id: testUserId,
        book_id: 'test-book-1',
        status: 'finished',
        added_at: new Date()
      }
    });
    
    // Add a recommendation to trigger recommendation achievements
    await prisma.bookRecommendation.create({
      data: {
        from_user_id: testUserId,
        to_user_id: 'test-user-2',
        book_id: 'test-book-1',
        message: 'Test recommendation',
        sent_at: new Date()
      }
    });
    
    // Test 3: Check and award achievements
    console.log('\n3. Checking achievements...');
    await achievementService.checkAndAwardAchievements(testUserId);
    
    // Test 4: Verify achievements were awarded
    console.log('\n4. Verifying results...');
    const finalAchievements = await achievementService.getUserAchievements(testUserId);
    console.log(`   Earned: ${finalAchievements.earned.length}`);
    console.log(`   In Progress: ${finalAchievements.in_progress.length}`);
    
    // Display earned achievements
    if (finalAchievements.earned.length > 0) {
      console.log('\n   🏆 Earned Achievements:');
      finalAchievements.earned.forEach(achievement => {
        console.log(`   - ${achievement.name}: ${achievement.description} (${achievement.points} points)`);
      });
    }
    
    // Display progress
    if (finalAchievements.in_progress.length > 0) {
      console.log('\n   📊 In Progress:');
      finalAchievements.in_progress.forEach(achievement => {
        console.log(`   - ${achievement.name}: ${achievement.current_value}/${achievement.target_value} (${achievement.progress_percentage}%)`);
      });
    }
    
    // Test 5: Clean up test data
    console.log('\n5. Cleaning up test data...');
    await prisma.userBook.deleteMany({
      where: { user_id: testUserId }
    });
    await prisma.bookRecommendation.deleteMany({
      where: { from_user_id: testUserId }
    });
    await prisma.userAchievement.deleteMany({
      where: { user_id: testUserId }
    });
    await prisma.achievementProgress.deleteMany({
      where: { user_id: testUserId }
    });
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// FUTURE IMPLEMENTATIONS - COMMENTED OUT TEST CASES

/*
// Test genre diversity achievements
async function testGenreAchievements() {
  console.log('🧪 Testing Genre Diversity Achievements...');
  
  const testUserId = 'test-user-genre';
  
  try {
    // Add books from different genres
    const genres = ['Fiction', 'Non-Fiction', 'Sci-Fi', 'Romance', 'Mystery'];
    
    for (let i = 0; i < genres.length; i++) {
      await prisma.userBook.create({
        data: {
          user_id: testUserId,
          book_id: `test-book-${i}`,
          status: 'finished',
          added_at: new Date(),
          book: {
            connect: {
              id: `test-book-${i}`
            }
          }
        }
      });
    }
    
    await achievementService.checkAndAwardAchievements(testUserId);
    
    const achievements = await achievementService.getUserAchievements(testUserId);
    console.log('Genre achievements earned:', achievements.earned.filter(a => a.category === 'GENRE_EXPLORER'));
    
    // Cleanup
    await prisma.userBook.deleteMany({ where: { user_id: testUserId } });
    await prisma.userAchievement.deleteMany({ where: { user_id: testUserId } });
    await prisma.achievementProgress.deleteMany({ where: { user_id: testUserId } });
    
  } catch (error) {
    console.error('Genre test failed:', error);
  }
}
*/

/*
// Test club participation achievements
async function testClubAchievements() {
  console.log('🧪 Testing Club Participation Achievements...');
  
  const testUserId = 'test-user-club';
  
  try {
    // Add club membership
    await prisma.clubMember.create({
      data: {
        user_id: testUserId,
        club_id: 'test-club-1',
        joined_at: new Date()
      }
    });
    
    await achievementService.checkAndAwardAchievements(testUserId);
    
    const achievements = await achievementService.getUserAchievements(testUserId);
    console.log('Club achievements earned:', achievements.earned.filter(a => a.category === 'CLUB_MEMBER'));
    
    // Cleanup
    await prisma.clubMember.deleteMany({ where: { user_id: testUserId } });
    await prisma.userAchievement.deleteMany({ where: { user_id: testUserId } });
    await prisma.achievementProgress.deleteMany({ where: { user_id: testUserId } });
    
  } catch (error) {
    console.error('Club test failed:', error);
  }
}
*/

/*
// Test review achievements
async function testReviewAchievements() {
  console.log('🧪 Testing Review Achievements...');
  
  const testUserId = 'test-user-review';
  
  try {
    // Add reviews
    for (let i = 0; i < 5; i++) {
      await prisma.review.create({
        data: {
          user_id: testUserId,
          book_id: `test-book-${i}`,
          rating: 4,
          comment: `Test review ${i}`,
          created_at: new Date()
        }
      });
    }
    
    await achievementService.checkAndAwardAchievements(testUserId);
    
    const achievements = await achievementService.getUserAchievements(testUserId);
    console.log('Review achievements earned:', achievements.earned.filter(a => a.category === 'REVIEWER'));
    
    // Cleanup
    await prisma.review.deleteMany({ where: { user_id: testUserId } });
    await prisma.userAchievement.deleteMany({ where: { user_id: testUserId } });
    await prisma.achievementProgress.deleteMany({ where: { user_id: testUserId } });
    
  } catch (error) {
    console.error('Review test failed:', error);
  }
}
*/

/*
// Test social activity achievements
async function testSocialAchievements() {
  console.log('🧪 Testing Social Activity Achievements...');
  
  const testUserId = 'test-user-social';
  
  try {
    // Add various social activities
    // Note: These would require the actual social activity models to be implemented
    
    // Add recommendations (this is already implemented)
    for (let i = 0; i < 10; i++) {
      await prisma.bookRecommendation.create({
        data: {
          from_user_id: testUserId,
          to_user_id: `test-user-${i}`,
          book_id: `test-book-${i}`,
          message: `Test recommendation ${i}`,
          sent_at: new Date()
        }
      });
    }
    
    await achievementService.checkAndAwardAchievements(testUserId);
    
    const achievements = await achievementService.getUserAchievements(testUserId);
    console.log('Social achievements earned:', achievements.earned.filter(a => a.category === 'SOCIAL_BUTTERFLY'));
    
    // Cleanup
    await prisma.bookRecommendation.deleteMany({ where: { from_user_id: testUserId } });
    await prisma.userAchievement.deleteMany({ where: { user_id: testUserId } });
    await prisma.achievementProgress.deleteMany({ where: { user_id: testUserId } });
    
  } catch (error) {
    console.error('Social test failed:', error);
  }
}
*/

/*
// Test special event achievements
async function testSpecialEventAchievements() {
  console.log('🧪 Testing Special Event Achievements...');
  
  const testUserId = 'test-user-event';
  
  try {
    // Add event participation
    // Note: This would require EventParticipation model to be implemented
    
    await achievementService.checkAndAwardAchievements(testUserId);
    
    const achievements = await achievementService.getUserAchievements(testUserId);
    console.log('Event achievements earned:', achievements.earned.filter(a => a.category === 'SPECIAL_EVENT'));
    
    // Cleanup
    await prisma.userAchievement.deleteMany({ where: { user_id: testUserId } });
    await prisma.achievementProgress.deleteMany({ where: { user_id: testUserId } });
    
  } catch (error) {
    console.error('Event test failed:', error);
  }
}
*/

// Run the test
testAchievements();

// Uncomment to run future implementation tests
// testGenreAchievements();
// testClubAchievements();
// testReviewAchievements();
// testSocialAchievements();
// testSpecialEventAchievements(); 