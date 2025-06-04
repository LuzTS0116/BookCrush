import { PrismaClient } from '@/lib/generated/prisma'

/**
 * Check if two users are friends
 * @param prisma - Prisma client instance
 * @param userId1 - First user ID
 * @param userId2 - Second user ID
 * @returns Promise<boolean> - true if users are friends, false otherwise
 */
export async function areUsersFriends(
  prisma: PrismaClient, 
  userId1: string, 
  userId2: string
): Promise<boolean> {
  if (userId1 === userId2) {
    return true // Users can always access their own content
  }

  try {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          {
            userId1: userId1,
            userId2: userId2
          },
          {
            userId1: userId2,
            userId2: userId1
          }
        ]
      }
    })

    return !!friendship
  } catch (error) {
    console.error('Error checking friendship status:', error)
    return false
  }
}

/**
 * Get friend IDs for a user
 * @param prisma - Prisma client instance
 * @param userId - User ID to get friends for
 * @returns Promise<string[]> - Array of friend user IDs
 */
export async function getUserFriendIds(
  prisma: PrismaClient,
  userId: string
): Promise<string[]> {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId1: userId },
          { userId2: userId }
        ]
      },
      select: {
        userId1: true,
        userId2: true
      }
    })

    const friendIds = friendships.map(friendship => 
      friendship.userId1 === userId ? friendship.userId2 : friendship.userId1
    )

    return friendIds
  } catch (error) {
    console.error('Error getting user friends:', error)
    return []
  }
}

/**
 * Check if a user can view another user's profile
 * This includes friendship check and any other access rules
 * @param prisma - Prisma client instance
 * @param viewerId - ID of user trying to view the profile
 * @param profileId - ID of profile being viewed
 * @returns Promise<boolean> - true if access is allowed
 */
export async function canViewProfile(
  prisma: PrismaClient,
  viewerId: string,
  profileId: string
): Promise<boolean> {
  // Users can always view their own profile
  if (viewerId === profileId) {
    return true
  }

  // Check if users are friends
  return areUsersFriends(prisma, viewerId, profileId)
}

/**
 * Get public profile data (fields that are safe to show to friends)
 * @param prisma - Prisma client instance
 * @param profileId - ID of profile to fetch
 * @returns Promise<object | null> - Profile data or null if not found
 */
export async function getPublicProfileData(
  prisma: PrismaClient,
  profileId: string
) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        display_name: true,
        nickname: true,
        about: true,
        avatar_url: true,
        favorite_genres: true,
        userBooks: true,
        //created_at: true,
        // Exclude sensitive information
        // email: false,
        // kindle_email: false,
        // updated_at: false
      }
    })

    return profile
  } catch (error) {
    console.error('Error fetching public profile data:', error)
    return null
  }
} 