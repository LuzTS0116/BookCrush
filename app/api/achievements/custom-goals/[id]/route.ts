import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for custom goals API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

  try {
    // Bearer token authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    const userId = user.id;
    const { id } = await params;
    const { target_books, time_period } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    // Validate input
    if (!target_books || !time_period) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (target_books < 1 || target_books > 1000) {
      return NextResponse.json({ error: 'Target books must be between 1 and 1000' }, { status: 400 });
    }

    const validPeriods = ['1_month', '3_months', '6_months', '1_year'];
    if (!validPeriods.includes(time_period)) {
      return NextResponse.json({ error: 'Invalid time period' }, { status: 400 });
    }

    // Check if the goal exists and belongs to the user
    const achievement = await prisma.achievement.findFirst({
      where: {
        id,
        name: { startsWith: 'Custom Goal:' },
        progress_tracking: {
          some: {
            user_id: userId
          }
        }
      },
      include: {
        user_achievements: {
          where: { user_id: userId }
        },
        progress_tracking: {
          where: { user_id: userId }
        }
      }
    });

    if (!achievement) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 });
    }

    // Don't allow editing if goal is already completed
    if (achievement.user_achievements.length > 0) {
      return NextResponse.json({ error: 'Cannot edit completed goals' }, { status: 400 });
    }

    // Update the achievement and progress tracking
    const timeLabels = {
      '1_month': '1 month',
      '3_months': '3 months', 
      '6_months': '6 months',
      '1_year': '1 year'
    };

    const goalName = `Custom Goal: ${target_books} books in ${timeLabels[time_period as keyof typeof timeLabels]}`;
    const goalDescription = `Read ${target_books} books within ${timeLabels[time_period as keyof typeof timeLabels]}`;

    // Calculate new end date from today (extending the deadline)
    const now = new Date();
    const newEndDate = new Date();
    const periodDays = {
      '1_month': 30,
      '3_months': 90,
      '6_months': 180,
      '1_year': 365
    };
    newEndDate.setDate(now.getDate() + periodDays[time_period as keyof typeof periodDays]);

    // Get original start date from criteria or progress_data
    const criteria = achievement.criteria as { start_date?: string } | null;
    const progressData = achievement.progress_tracking[0]?.progress_data as { start_date?: string } | null;
    const originalStartDate = criteria?.start_date || 
                             progressData?.start_date ||
                             now.toISOString();

    // Update achievement
    await prisma.achievement.update({
      where: { id },
      data: {
        name: goalName,
        description: goalDescription,
        criteria: {
          type: 'custom_goal',
          target_books,
          time_period,
          start_date: originalStartDate, // Keep original start date
          end_date: newEndDate.toISOString()
        },
        points: Math.min(target_books * 5, 100)
      }
    });

    // Update progress tracking
    await prisma.achievementProgress.update({
      where: {
        user_id_achievement_id: {
          user_id: userId,
          achievement_id: id
        }
      },
      data: {
        target_value: target_books,
        progress_data: {
          start_date: originalStartDate,
          end_date: newEndDate.toISOString(),
          time_period
        }
      }
    });

    // Return updated goal in expected format
    const progress = achievement.progress_tracking[0];
    const updatedGoal = {
      id: achievement.id,
      name: goalName,
      description: goalDescription,
      target_books,
      time_period,
      progress: {
        current_value: progress?.current_value || 0,
        target_value: target_books,
        progress_percentage: target_books ? 
          Math.round(((progress?.current_value || 0) / target_books) * 100) : 0
      },
      is_completed: false,
      earned_at: null
    };

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error updating custom goal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

  try {
    // Bearer token authentication (consistent with books API)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    const userId = user.id;
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    // Check if the goal exists and belongs to the user (check progress tracking since user achievements only exist when completed)
    const achievement = await prisma.achievement.findFirst({
      where: {
        id,
        name: { startsWith: 'Custom Goal:' },
        progress_tracking: {
          some: {
            user_id: userId
          }
        }
      },
      include: {
        user_achievements: {
          where: { user_id: userId }
        },
        progress_tracking: {
          where: { user_id: userId }
        }
      }
    });

    if (!achievement) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 });
    }

    // Delete progress tracking first (foreign key constraint)
    await prisma.achievementProgress.delete({
      where: {
        user_id_achievement_id: {
          user_id: userId,
          achievement_id: id
        }
      }
    });

    // Delete user achievement if it exists (completed goals)
    if (achievement.user_achievements.length > 0) {
      await prisma.userAchievement.delete({
        where: {
          user_id_achievement_id: {
            user_id: userId,
            achievement_id: id
          }
        }
      });
    }

    // Delete the achievement itself
    await prisma.achievement.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom goal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 