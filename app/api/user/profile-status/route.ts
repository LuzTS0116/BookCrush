import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // Assuming this is your configured admin client

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
  }

  const accessToken = authHeader.split(' ')[1];

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized: Invalid token format' }, { status: 401 });
  }

  try {
    // Validate the token and get the user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      console.error('[API /profile-status] Error getting user from token:', userError?.message);
      return NextResponse.json({ error: userError?.message || 'Invalid token' }, { status: 401 });
    }

    // Check if a profile exists for this user
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle(); // Use maybeSingle to return null if not found, instead of erroring

    if (profileError) {
      console.error('[API /profile-status] Error fetching profile:', profileError.message);
      return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 });
    }
    console.log('Profile check API response:', { hasProfile: !!profile });
    return NextResponse.json({ hasProfile: !!profile });

  } catch (error: any) {
    console.error('[API /profile-status] Unexpected error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 