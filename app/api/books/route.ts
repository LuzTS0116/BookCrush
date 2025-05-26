// import { NextRequest, NextResponse } from 'next/server';
// import { fetchBookFromOL } from '@/lib/openLibrary';

// export async function GET(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const title  = searchParams.get('title');
//   const author = searchParams.get('author') ?? undefined;
  
//   if (!title) {
//     return NextResponse.json(
//       { error: 'Missing “title” query parameter' },
//       { status: 400 },
//     );
//   }

//   const book = await fetchBookFromOL(title, author);

//   if (!book) {
//     return NextResponse.json(
//       { error: 'Book not found' },
//       { status: 404 },
//     );
//   }

//   return NextResponse.json(book);  // 200 OK
// }

// app/api/books/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient } from '@/lib/generated/prisma'
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    const { 
      title, 
      author, 
      description, 
      reading_speed, // From dialog it's reading_speed not reading_time
      pages, 
      subjects, // From dialog it's subjects not genres
      coverUrl,
      storageKey, 
      originalName, 
      size,
      publishDate,
      rating
    } = body;
    
    // Convert subjects array to properly formatted genres string array
    const genres = subjects && Array.isArray(subjects) 
      ? subjects.slice(0, 5).map(s => s.trim()) // Take top 5 subjects 
      : [];
    
    // Create the book record with associated file
    const book = await prisma.book.create({
      data: {
        title,
        author,
        description: description || "",
        reading_time: reading_speed || "N/A",
        pages: pages || null,
        genres,
        cover_url: coverUrl || null,
        published_date: publishDate || null,
        rating: rating || null,
        added_by: user.id,
        file: storageKey ? { 
          create: { 
            storage_key: storageKey, 
            original_name: originalName, 
            mime_type: 'application/epub+zip', 
            size_bytes: size 
          } 
        } : undefined
      },
      include: { file: true }
    });
    
    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create book" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get all books 
    const books = await prisma.book.findMany({
      include: {
        file: true, // Include file information
      },
      orderBy: {
        created_at: 'desc', // Newest first
      },
    });
    
    // Get all books for the current user
    // const books = await prisma.book.findMany({
    //   where: {
    //     added_by: user.id,
    //   },
    //   include: {
    //     file: true, // Include file information
    //   },
    //   orderBy: {
    //     created_at: 'desc', // Newest first
    //   },
    // });
    
    return NextResponse.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}