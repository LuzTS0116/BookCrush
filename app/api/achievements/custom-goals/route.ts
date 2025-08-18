import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CustomGoalsService } from '@/lib/custom-goals-service';

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

    const goals = await CustomGoalsService.getUserCustomGoals(user.id);
    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching custom goals:', error);
    return NextResponse.json({ error: 'Failed to fetch custom goals' }, { status: 500 });
  }
}

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

    const { target_books, time_period } = await request.json();

    // Convert legacy time period format to new enum format
    const timePeriodMap: { [key: string]: string } = {
      '1_month': 'ONE_MONTH',
      '3_months': 'THREE_MONTHS',
      '6_months': 'SIX_MONTHS',
      '1_year': 'ONE_YEAR'
    };

    const mappedTimePeriod = timePeriodMap[time_period] || time_period;

    try {
      const newGoal = await CustomGoalsService.createCustomGoal(
        user.id,
        target_books,
        mappedTimePeriod
      );

      return NextResponse.json(newGoal, { status: 201 });
    } catch (error: any) {
      console.error('Error creating custom goal:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in custom goals POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 