import { NextRequest, NextResponse } from 'next/server';
import { cookies as nextCookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    

    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friendId')?.trim();

    

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
    }
    if (!UUID_RE.test(friendId)) {
      return NextResponse.json({ error: 'Invalid friend ID' }, { status: 400 });
    }

    // const authHeader = request.headers.get('authorization');
    // if (!authHeader?.startsWith('Bearer ')) {
    //   return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    // }
    // const supabaseAccessToken = authHeader.slice('Bearer '.length);

    // const supabase = createServerClientWithToken(supabaseAccessToken);

    // // Optional but keeps a clear 401 path
    // const { data: { user }, error: userError } = await supabase.auth.getUser();
    // if (userError || !user) {
    //   return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    // }

    // Call the RPC (expects: mutual_friend_ids(target uuid) returns table(friend_id uuid))
    const { data, error } = await supabase.rpc('mutual_friend_ids', { target: friendId });
    if (error) {
      console.error('RPC mutual_friend_ids error:', error);
      return NextResponse.json({ error: 'Failed to fetch mutual friends' }, { status: 500 });
    }

    // Type assertion to handle the data structure
    const mutualFriends = Array.isArray(data) ? data.map((row: any) => row.friend_id) : [];

    return NextResponse.json({
      count: mutualFriends.length,
      mutualFriends,
    });
  } catch (error) {
    console.error('Error in mutual friends API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

