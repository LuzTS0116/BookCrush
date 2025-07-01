import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';


// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for books API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function POST(req: NextRequest) {

  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

  try {
    // Bearer token authentication (consistent with other APIs)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API books POST] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[API books POST] Auth error:', userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    // Get the request body
    const body = await req.json();
    const { filename, contentType } = body;
    
    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }
    
    // Validate content type for images
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (contentType && !allowedTypes.includes(contentType.toLowerCase())) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 }
      );
    }
    
   
    
    // Generate a unique filename with UUID and user ID
    const fileExtension = filename.split('.').pop();
    const uniqueFilename = `profile-pictures/${user.id}/${randomUUID()}.${fileExtension}`;
    
    // Create the signed upload URL
    const { data, error } = await supabase
      .storage
      .from('profiles')
      .createSignedUploadUrl(
        uniqueFilename,
        {
          expiresIn: 300 // 5 minutes expiry for profile pictures
        }
      );
    
    if (error) {
      console.error("Supabase storage error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create upload URL" },
        { status: 500 }
      );
    }
    
    // Return the signed URL and path
    return NextResponse.json({
      signedUrl: data.signedUrl,
      path: data.path,
      contentType: contentType || 'image/jpeg'
    });
    
  } catch (error) {
    console.error("Profile picture presigned URL error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 