import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Profile, ActivityLog, ActivityType} from '@prisma/client' ;
import { getAvatarPublicUrlServer } from '@/lib/supabase-server-utils';
import { prisma } from '@/lib/prisma';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for activity API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;



// Helper function to enrich activities with necessary details for the frontend
async function enrichActivity(activity: ActivityLog & { user: Profile }): Promise<any> {
  // Format the avatar URL from storage key to public URL
  const avatarUrl = await getAvatarPublicUrlServer(activity.user.avatar_url);
  
  let enrichedActivity: any = {
    id: activity.id,
    type: activity.activity_type,
    timestamp: activity.created_at,
    user: {
      id: activity.user.id,
      display_name: activity.user.display_name,
      avatar_url: avatarUrl,
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
        select: { id: true, display_name: true, avatar_url: true }
      });
      
      if (relatedUser) {
        const relatedUserAvatarUrl = await getAvatarPublicUrlServer(relatedUser.avatar_url);
        enrichedActivity.relatedUser = {
          ...relatedUser,
          avatar_url: relatedUserAvatarUrl
        };
      }
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
  // console.log('[API activity GET] Request received');

  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

  try {
    // Bearer token authentication (consistent with other APIs)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // console.error('[API activity GET] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !authUser) {
      // console.error('[API activity GET] Auth error:', userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    // console.log('[API activity GET] User authenticated:', authUser.id);
    const currentUserId = authUser.id;

    // Parse pagination parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

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
      return NextResponse.json({ 
        activities: [], 
        pagination: { page, limit, total: 0, hasMore: false } 
      }, { status: 200 }); // No friends, so no activity feed
    }

    // 2. Fetch activities from these friends
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
      skip,
      take: limit,
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
      skip,
      take: limit,
    });

    //append requests_activities to activities if requests_activities is not empty
    if (requests_activities.length) {
      activities.push(...requests_activities);
    }

    // Sort combined activities by created_at desc
    const allActivities = activities.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Get total count for pagination (this is an approximation for combined queries)
    const totalFriendActivities = await prisma.activityLog.count({
      where: {
        user_id: { in: friendIds },
      },
    });

    const totalRequestActivities = await prisma.activityLog.count({
      where: {
        related_user_id: authUser.id,
        activity_type: ActivityType.SENT_FRIEND_REQUEST,
      },
    });

    const totalActivities = totalFriendActivities + totalRequestActivities;
    const hasMore = skip + allActivities.length < totalActivities;

    // 3. Enrich activities with more details needed for frontend display
    const enrichedActivities = await Promise.all(allActivities.map(activity => 
        enrichActivity(activity as ActivityLog & { user: Profile } ) // Cast because user is included
    ));

    return NextResponse.json({
      activities: enrichedActivities,
      pagination: {
        page,
        limit,
        total: totalActivities,
        hasMore
      }
    }, { status: 200 });

  } catch (error: any) {
    // console.error("Error fetching activity feed:", error);
    return NextResponse.json({ error: error.message || 'Failed to fetch activity feed' }, { status: 500 });
  }
} 