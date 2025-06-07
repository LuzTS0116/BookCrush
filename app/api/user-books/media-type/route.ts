import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client', book_media_type ;

const prisma = new PrismaClient();

// Helper function to parse media type
const parseMediaType = (mediaTypeString: string): book_media_type => {
  const normalizedType = mediaTypeString.toLowerCase().replace(/[-\s]/g, '_');
  
  switch (normalizedType) {
    case 'e_reader':
    case 'ereader':
    case 'digital':
      return book_media_type.e_reader;
    case 'audio_book':
    case 'audiobook':
    case 'audio':
      return book_media_type.audio_book;
    case 'physical_book':
    case 'physical':
    case 'paper':
      return book_media_type.physical_book;
    default:
      throw new Error(`Invalid media type: ${mediaTypeString}. Valid options: e_reader, audio_book, physical_book`);
  }
};

export async function PATCH(req: NextRequest) {
  try {
    // 1. Authenticate User
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { bookId, shelf, mediaType } = await req.json();

    // 2. Validate Input
    if (!bookId || !shelf || !mediaType) {
      return NextResponse.json({ 
        error: "bookId, shelf, and mediaType are required" 
      }, { status: 400 });
    }

    let parsedMediaType: book_media_type;
    try {
      parsedMediaType = parseMediaType(mediaType);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    // 3. Update the UserBook media type
    const userBook = await prisma.userBook.update({
      where: {
        user_id_book_id_shelf: {
          user_id: user.id,
          book_id: bookId,
          shelf: shelf,
        },
      },
      data: {
        media_type: parsedMediaType,
      },
      include: {
        book: true,
      },
    });

    return NextResponse.json({
      message: "Media type updated successfully",
      userBook
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error updating media type:", error);
    
    // Handle Prisma record not found error
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Book not found on this shelf for the current user" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to update media type" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 