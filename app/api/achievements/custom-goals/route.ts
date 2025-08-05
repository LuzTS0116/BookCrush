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

export async function GET(request: NextRequest) {
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

    // Fetch user's custom goals (achievements with progress tracking for this user)
    const goals = await prisma.achievement.findMany({
      where: {
        name: { startsWith: 'Custom Goal:' },
        progress_tracking: {
          some: {
            user_id: userId
          }
        }
      },
      include: {
        user_achievements: {
          where: { user_id: userId },
          select: { earned_at: true }
        },
        progress_tracking: {
          where: { user_id: userId },
          select: {
            current_value: true,
            target_value: true,
            progress_data: true,
            last_updated: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Transform to expected format
    const transformedGoals = goals.map(goal => {
      const progress = goal.progress_tracking[0];
      const userAchievement = goal.user_achievements[0];
      const criteria = goal.criteria as { start_date?: string; end_date?: string; time_period?: string } | null;
      const progressData = progress?.progress_data as { start_date?: string; end_date?: string; time_period?: string } | null;
      
      return {
        id: goal.id,
        name: goal.name,
        description: goal.description,
        target_books: progress?.target_value || 0,
        time_period: criteria?.time_period || progressData?.time_period || '1_month',
        created_at: goal.created_at,
        start_date: criteria?.start_date || progressData?.start_date || goal.created_at,
        end_date: criteria?.end_date || progressData?.end_date,
        progress: {
          current_value: progress?.current_value || 0,
          target_value: progress?.target_value || 0,
          progress_percentage: progress?.target_value ? 
            Math.round((progress.current_value / progress.target_value) * 100) : 0
        },
        is_completed: !!userAchievement?.earned_at,
        earned_at: userAchievement?.earned_at
      };
    });

    return NextResponse.json(transformedGoals);
  } catch (error) {
    console.error('Error fetching custom goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const { target_books, time_period } = await request.json();

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

    // Check if user already has too many active goals (limit to 5)
    const existingGoalsCount = await prisma.achievementProgress.count({
      where: {
        user_id: userId,
        achievement: {
          name: { startsWith: 'Custom Goal:' },
          // Only count goals that haven't been completed yet
          user_achievements: {
            none: {
              user_id: userId
            }
          }
        }
      }
    });

    if (existingGoalsCount >= 5) {
      return NextResponse.json({ error: 'Maximum of 5 active goals allowed' }, { status: 400 });
    }

    // Create the custom achievement
    const timeLabels = {
      '1_month': '1 month',
      '3_months': '3 months', 
      '6_months': '6 months',
      '1_year': '1 year'
    };

    const goalName = `Custom Goal: ${target_books} books in ${timeLabels[time_period as keyof typeof timeLabels]}`;
    const goalDescription = `Read ${target_books} books within ${timeLabels[time_period as keyof typeof timeLabels]}`;

    // Calculate end date based on time period
    const now = new Date();
    const endDate = new Date();
    const periodDays = {
      '1_month': 30,
      '3_months': 90,
      '6_months': 180,
      '1_year': 365
    };
    endDate.setDate(now.getDate() + periodDays[time_period as keyof typeof periodDays]);

    const achievement = await prisma.achievement.create({
      data: {
        name: goalName,
        description: goalDescription,
        icon: '🎯',
        category: 'READING_MILESTONE',
        difficulty: 'GOLD',
        criteria: {
          type: 'custom_goal',
          target_books,
          time_period,
          start_date: now.toISOString(),
          end_date: endDate.toISOString()
        },
        points: Math.min(target_books * 5, 100), // 5 points per book, max 100
        is_active: true,
        is_hidden: false
      }
    });

    // Don't create UserAchievement record yet - only when goal is completed
    // await prisma.userAchievement.create({
    //   data: {
    //     user_id: userId,
    //     achievement_id: achievement.id,
    //     // earned_at will be set when goal is completed
    //   }
    // });

    // Create progress tracking record
    await prisma.achievementProgress.create({
      data: {
        user_id: userId,
        achievement_id: achievement.id,
        current_value: 0,
        target_value: target_books,
        progress_data: {
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          time_period
        }
      }
    });

    // Return the created goal in the expected format
    const newGoal = {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      target_books,
      time_period,
      created_at: achievement.created_at,
      progress: {
        current_value: 0,
        target_value: target_books,
        progress_percentage: 0
      },
      is_completed: false,
      earned_at: null
    };

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    console.error('Error creating custom goal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 