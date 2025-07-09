import { NextRequest, NextResponse } from 'next/server';
import { achievementService } from './service';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET /api/achievements - Get user's achievements
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const achievements = await achievementService.getUserAchievements(session.user.id);
    
    return NextResponse.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/achievements/check - Manually trigger achievement check
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { activity_type } = await request.json();
    
    // Check and award achievements
    await achievementService.checkAndAwardAchievements(session.user.id, activity_type);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error checking achievements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

 