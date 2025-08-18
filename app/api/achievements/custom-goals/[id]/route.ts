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

    const { id } = await params;
    const { target_books, time_period } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    // Convert legacy time period format to new enum format
    const timePeriodMap: { [key: string]: string } = {
      '1_month': 'ONE_MONTH',
      '3_months': 'THREE_MONTHS',
      '6_months': 'SIX_MONTHS',
      '1_year': 'ONE_YEAR'
    };

    const mappedTimePeriod = timePeriodMap[time_period] || time_period;

    try {
      const updatedGoal = await CustomGoalsService.updateCustomGoal(
        id,
        user.id,
        target_books,
        mappedTimePeriod
      );

      return NextResponse.json(updatedGoal);
    } catch (error: any) {
      console.error('Error updating custom goal:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in custom goals PUT:', error);
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    try {
      await CustomGoalsService.deleteCustomGoal(id, user.id);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting custom goal:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in custom goals DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 