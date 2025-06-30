import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for books API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API books files POST] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: authError?.message || "Authentication required" },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    const { 
      bookId, 
      storageKey, 
      originalName, 
      size, 
      mimeType = 'application/epub+zip',
      language = 'english' // Default to english if not specified
    } = body;
    
    if (!bookId || !storageKey) {
      return NextResponse.json(
        { error: "Book ID and storage key are required" },
        { status: 400 }
      );
    }
    
    // Validate language if provided
    if (language && !['english', 'spanish'].includes(language.toLowerCase())) {
      return NextResponse.json(
        { error: "Language must be 'english' or 'spanish'" },
        { status: 400 }
      );
    }
    
    // Verify the book exists and user has access
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    });
    
    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }
    
    // Create a new BookFile entry with language
    const bookFile = await prisma.bookFile.create({
      data: {
        book_id: bookId,
        storage_key: storageKey,
        original_name: originalName || `${language}.epub`,
        mime_type: mimeType,
        size_bytes: size || 0,
        language: language.toLowerCase(), // Store normalized language
      }
    });
    
    return NextResponse.json({
      success: true,
      file: bookFile
    }, { status: 201 });
    
  } catch (error: any) {
    console.error("Error associating file with book:", error);
    return NextResponse.json(
      { error: error.message || "Failed to associate file with book" },
      { status: 500 }
    );
  } finally {
    
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API books files GET] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: authError?.message || "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get the book ID from the query parameters
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId');
    
    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      );
    }
    
    // Get all files for the specified book
    const files = await prisma.bookFile.findMany({
      where: {
        book_id: bookId
      }
    });
    
    return NextResponse.json(files);
    
  } catch (error: any) {
    console.error("Error fetching book files:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch book files" },
      { status: 500 }
    );
  } finally {
    
  }
} 