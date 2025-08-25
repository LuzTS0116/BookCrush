// import { NextRequest, NextResponse } from 'next/server';
// import { createClient } from '@supabase/supabase-js';

// export async function GET(request: NextRequest) {
//   try {
//     // Get the friend ID from query parameters
//     const { searchParams } = new URL(request.url);
//     const friendId = searchParams.get('friendId');

//     if (!friendId) {
//       return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
//     }

//     // Get authorization header
//     const authHeader = request.headers.get('authorization');
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
//     }

//     const supabaseAccessToken = authHeader.replace('Bearer ', '');

//     // Initialize Supabase client with the user's access token
//     const supabase = createClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//       {
//         global: {
//           headers: {
//             Authorization: `Bearer ${supabaseAccessToken}`,
//           },
//         },
//       }
//     );

//     // Get current user
//     const { data: { user }, error: userError } = await supabase.auth.getUser();
//     if (userError || !user) {
//       return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
//     }

//     // Get all friends of the current user
//     const { data: currentUserFriends, error: currentUserError } = await supabase
//       .from('friendships')
//       .select(`
//         userId1,
//         userId2
//       `)
//       .or(`userId1.eq.${user.id},userId2.eq.${user.id}`);

//     if (currentUserError) {
//       console.error('Error fetching current user friends:', currentUserError);
//       return NextResponse.json({ error: 'Failed to fetch current user friends' }, { status: 500 });
//     }

//     // Get all friends of the target friend
//     const { data: targetUserFriends, error: targetUserError } = await supabase
//       .from('friendships')
//       .select(`
//         userId1,
//         userId2
//       `)
//       .or(`userId1.eq.${friendId},userId2.eq.${friendId}`);

//     if (targetUserError) {
//       console.error('Error fetching target user friends:', targetUserError);
//       return NextResponse.json({ error: 'Failed to fetch target user friends' }, { status: 500 });
//     }

//     // Extract friend IDs for current user (excluding the target friend)
//     const currentUserFriendIds = new Set(
//       currentUserFriends
//         .map(friendship => friendship.userId1 === user.id ? friendship.userId2 : friendship.userId1)
//         .filter(id => id !== friendId)
//     );

//     // Extract friend IDs for target user (excluding current user)
//     const targetUserFriendIds = new Set(
//       targetUserFriends
//         .map(friendship => friendship.userId1 === friendId ? friendship.userId2 : friendship.userId1)
//         .filter(id => id !== user.id)
//     );

//     // Find mutual friends (intersection of both sets)
//     const mutualFriendIds = [...currentUserFriendIds].filter(id => targetUserFriendIds.has(id));

//     // Return count (you can also return the actual mutual friends data if needed)
//     return NextResponse.json({
//       count: mutualFriendIds.length,
//       mutualFriends: mutualFriendIds // Optional: return IDs for further processing
//     });

//   } catch (error) {
//     console.error('Error in mutual friends API:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// } 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
try {
const { searchParams } = new URL(request.url);
const friendId = searchParams.get('friendId')?.trim();


if (!friendId) {
  return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
}
if (!UUID_RE.test(friendId)) {
  return NextResponse.json({ error: 'Invalid friend ID' }, { status: 400 });
}

const authHeader = request.headers.get('authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
}
const supabaseAccessToken = authHeader.slice('Bearer '.length);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: { headers: { Authorization: `Bearer ${supabaseAccessToken}` } },
    auth: { persistSession: false },
  }
);

// Optional but keeps a clear 401 path
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) {
  return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
}

// Call the RPC (expects: mutual_friend_ids(target uuid) returns table(friend_id uuid))
const { data, error } = await supabase.rpc('mutual_friend_ids', { target: friendId });
if (error) {
  console.error('RPC mutual_friend_ids error:', error);
  return NextResponse.json({ error: 'Failed to fetch mutual friends' }, { status: 500 });
}

const mutualFriends = (data ?? []).map((row: { friend_id: string }) => row.friend_id);

return NextResponse.json({
  count: mutualFriends.length,
  mutualFriends,
});
} catch (error) {
console.error('Error in mutual friends API:', error);
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
}