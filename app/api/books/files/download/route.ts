import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get the file ID from the query parameters
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');
    
    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }
    
    // Get the file details from the database
    const bookFile = await prisma.bookFile.findUnique({
      where: { id: fileId },
      include: {
        book: {
          select: {
            title: true
          }
        }
      }
    });
    
    if (!bookFile) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
    
    // Create a signed URL for downloading the file
    const { data, error } = await supabase
      .storage
      .from('books')
      .createSignedUrl(bookFile.storage_key, 60 * 5); // 5 minutes expiry
    
    if (error || !data?.signedUrl) {
      console.error("Supabase storage error:", error);
      return NextResponse.json(
        { error: error?.message || "Failed to create download URL" },
        { status: 500 }
      );
    }
    
    // Redirect to the signed URL for download
    return NextResponse.redirect(data.signedUrl);
    
  } catch (error: any) {
    console.error("Error downloading book file:", error);
    return NextResponse.json(
      { error: error.message || "Failed to download file" },
      { status: 500 }
    );
  }
} 