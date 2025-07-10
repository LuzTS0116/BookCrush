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
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Delete related records in the correct order
    await prisma.$transaction(async (tx) => {
      // Delete progress tracking records
      await tx.achievementProgress.deleteMany({
        where: {
          achievement_id: id,
          user_id: userId
        }
      });

      // Delete user achievement records
      await tx.userAchievement.deleteMany({
        where: {
          achievement_id: id,
          user_id: userId
        }
      });

      // Delete the achievement itself (only if it's a custom goal)
      await tx.achievement.delete({
        where: {
          id
        }
      });
    });

    return NextResponse.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom goal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 