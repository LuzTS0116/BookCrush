import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient, Profile, ActivityLog, ActivityType} from '@prisma/client' ;

const prisma = new PrismaClient();

// Helper function to enrich activities with necessary details for the frontend
async function enrichActivity(activity: ActivityLog & { user: Profile }): Promise<any> {
  let enrichedActivity: any = {
    id: activity.id,
    type: activity.activity_type,
    timestamp: activity.created_at,
    user: {
      id: activity.user.id,
      display_name: activity.user.display_name,
      // avatar_url: (activity.user as any).avatar_url || null, // If you have avatar_url
    },
    details: activity.details, // Raw details JSON
    // Add more specific structured data based on activity_type
    target_entity_type: activity.target_entity_type,
    target_entity_id: activity.target_entity_id,
    target_entity_secondary_id: activity.target_entity_secondary_id,
  };

  // Example of fetching more specific data based on type
  if (activity.activity_type === 'ADDED_BOOK_TO_SHELF' || activity.activity_type === 'CHANGED_BOOK_STATUS') {
    if (activity.target_entity_id) { // book_id
      const book = await prisma.book.findUnique({
        where: { id: activity.target_entity_id },
        select: { title: true, cover_url: true, author: true, id: true }
      });
      enrichedActivity.book = book;
      // For CHANGED_BOOK_STATUS, target_entity_secondary_id is the new status (status_type enum)
      // For ADDED_BOOK_TO_SHELF, target_entity_secondary_id is the shelf (shelf_type enum)
      enrichedActivity.shelfOrStatus = activity.target_entity_secondary_id;
    }
  } else if (activity.activity_type === 'CREATED_CLUB') {
    if (activity.target_entity_id) { // club_id
      const club = await prisma.club.findUnique({
        where: { id: activity.target_entity_id },
        select: { name: true, id: true }
      });
      enrichedActivity.club = club;
    }
  } else if ( activity.activity_type === 'ACCEPTED_FRIEND_REQUEST' || activity.activity_type === 'SENT_FRIEND_REQUEST') {
    if (activity.related_user_id) {
      const relatedUser = await prisma.profile.findUnique({
        where: { id: activity.related_user_id },
        select: { id: true, display_name: true }
      });
      enrichedActivity.relatedUser = relatedUser;
    }
  }else if ( activity.activity_type === 'ADDED_BOOK_TO_LIBRARY' ) {
    if (activity.target_entity_id) {
      const book = await prisma.book.findUnique({
        where: { id: activity.target_entity_id },
        select: { title: true, cover_url: true, author: true }
      });
      enrichedActivity.book = book;
    }
  }
  
  // Add more enrichment logic for other ActivityTypes...

  return enrichedActivity;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentUserId = authUser.id;

    // 1. Get current user's friends
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId1: currentUserId },
          { userId2: currentUserId },
        ],
      },
      select: {
        userId1: true,
        userId2: true,
      },
    });

    const friendIds = friendships.map(f => f.userId1 === currentUserId ? f.userId2 : f.userId1);

    if (friendIds.length === 0) {
      return NextResponse.json([], { status: 200 }); // No friends, so no activity feed
    }

    // 2. Fetch activities from these friends
    // TODO: Implement pagination (e.g., using URL search params for page/limit or cursor)
    const activities = await prisma.activityLog.findMany({
      where: {
        user_id: { in: friendIds },
        // Optional: Add filters here, e.g., exclude certain activity types if needed
      },
      include: {
        user: true, // Includes the profile of the user who performed the activity
        // related_user: true, // Optionally include if universally needed, or fetch in enrichActivity
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 20, // Example: limit to 20 activities for now
    });

    //Fetch activities where the current user is the related_user
    const requests_activities = await prisma.activityLog.findMany({
      where: {
        related_user_id:  authUser.id,
        activity_type: ActivityType.SENT_FRIEND_REQUEST
        
        // Optional: Add filters here, e.g., exclude certain activity types if needed
      },
      include: {
        user: true, // Includes the profile of the user who performed the activity
        // related_user: true, // Optionally include if universally needed, or fetch in enrichActivity
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 20, // Example: limit to 20 activities for now
    });

    //append requests_activities to activities if requests_activities is not empty
    if (requests_activities.length) {
      activities.push(...requests_activities);
    }

    // 3. Enrich activities with more details needed for frontend display
    const enrichedActivities = await Promise.all(activities.map(activity => 
        enrichActivity(activity as ActivityLog & { user: Profile } ) // Cast because user is included
    ));

    return NextResponse.json(enrichedActivities, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching activity feed:", error);
    return NextResponse.json({ error: error.message || 'Failed to fetch activity feed' }, { status: 500 });
  }
} 