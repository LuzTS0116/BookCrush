import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Initialize Supabase clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables for presign API");
}

// Client for user authentication (anon key)
const supabaseAuth = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Client for storage operations (service role key)
const supabaseStorage = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export async function POST(req: NextRequest) {
  if (!supabaseAuth || !supabaseStorage) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

  try {
    // Bearer token authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify user authentication with anon client
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      console.error('[Profile presign] Auth error:', userError);
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
    
    // Create the signed upload URL using service role client
    const { data, error } = await supabaseStorage
      .storage
      .from('profiles')
      .createSignedUploadUrl(uniqueFilename);
    
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