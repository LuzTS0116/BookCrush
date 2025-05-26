import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const body = await req.json();
    const { filename, contentType } = body;
    
    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client with cookies
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Validate user authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Generate a unique filename with UUID
    const uniqueFilename = `epubs/${randomUUID()}-${filename}`;
    
    // Create the signed upload URL
    const { data, error } = await supabase
      .storage
      .from('books')
      .createSignedUploadUrl(
        uniqueFilename,
        {
          expiresIn: 60 // 1 minute expiry
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
      // Include content type if needed by the client
      contentType: contentType || 'application/octet-stream'
    });
    
  } catch (error) {
    console.error("Presigned URL error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}