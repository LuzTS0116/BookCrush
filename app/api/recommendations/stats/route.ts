import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Check environment variables.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// GET /api/recommendations/stats - Get recommendation statistics
export async function GET(request: NextRequest) {
  if (!supabase) {
    console.error('[API recommendations/stats] Supabase client not initialized');
    return NextResponse.json({ error: "Supabase client not initialized. Check server configuration." }, { status: 500 });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API recommendations/stats] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error or no user:", userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    // Get unread count (PENDING status)
    const unreadCount = await prisma.bookRecommendation.count({
      where: {
        to_user_id: user.id,
        status: 'PENDING'
      }
    });

    // Get total received count
    const totalReceived = await prisma.bookRecommendation.count({
      where: {
        to_user_id: user.id
      }
    });

    // Get total sent count
    const totalSent = await prisma.bookRecommendation.count({
      where: {
        from_user_id: user.id
      }
    });

    return NextResponse.json({
      unreadCount,
      totalReceived,
      totalSent,
      hasUnread: unreadCount > 0
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching recommendation stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 