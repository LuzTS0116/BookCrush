import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for feedback API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function GET(req: NextRequest) {
  //console.log('[API my-feedback GET] Request received');

  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

  try {
    // Bearer token authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API my-feedback GET] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[API my-feedback GET] Auth error:', userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    //console.log('[API my-feedback GET] User authenticated:', user.id);

    // Get query parameters for pagination
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Fetch user's feedback with pagination
    const [feedback, totalCount] = await Promise.all([
      prisma.feedback.findMany({
        where: {
          user_id: user.id
        },
        orderBy: {
          created_at: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.feedback.count({
        where: {
          user_id: user.id
        }
      })
    ]);

    // DO NOT automatically mark as viewed on GET - this should only happen when explicitly requested

    const hasMore = offset + feedback.length < totalCount;

    //console.log('[API my-feedback GET] Returning feedback:', feedback.length);
    return NextResponse.json({
      feedback,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore
      }
    });

  } catch (err: any) {
    console.error("[API my-feedback GET] Error fetching feedback:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to mark feedback as read
export async function PATCH(req: NextRequest) {
  //console.log('[API my-feedback PATCH] Request received');

  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

  try {
    // Bearer token authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { feedbackId } = body;

    if (!feedbackId) {
      return NextResponse.json({ error: "Feedback ID is required" }, { status: 400 });
    }

    // Update the feedback to mark as notified
    const updatedFeedback = await prisma.feedback.updateMany({
      where: {
        id: feedbackId,
        user_id: user.id // Ensure user can only update their own feedback
      },
      data: {
        user_notified: true
      }
    });

    if (updatedFeedback.count === 0) {
      return NextResponse.json({ error: "Feedback not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("[API my-feedback PATCH] Error updating feedback:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update feedback" },
      { status: 500 }
    );
  }
} 