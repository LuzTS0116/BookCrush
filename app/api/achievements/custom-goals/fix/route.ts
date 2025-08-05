import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CustomGoalsService } from '@/lib/custom-goals-service';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for achievements API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function POST(request: NextRequest) {
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

    // Run the fix for this user
    await CustomGoalsService.fixCorruptedRecords(userId);

    return NextResponse.json({ 
      success: true, 
      message: 'Corrupted custom goal records have been fixed',
      userId: userId
    });

  } catch (error) {
    console.error('Error fixing corrupted custom goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 