import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../../../../lib/auth-utils';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication and role
    await requireAdmin();

    const books = await prisma.book.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        cover_url: true,
        description: true,
        reading_time: true,
        pages: true,
        genres: true,
        published_date: true,
        rating: true,
        created_at: true,
        creator: {
          select: {
            display_name: true,
          },
        },
        _count: {
          select: {
            UserBook: true,
            reviews: true,
            club_meetings: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(books, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching books:', error);
    
    // Handle authentication and authorization errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    return NextResponse.json({ error: error.message || 'Failed to fetch books' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check admin authentication and role
    const adminUser = await requireAdmin();

    const body = await req.json();
    const { 
      title, 
      author, 
      cover_url, 
      description, 
      reading_time, 
      pages, 
      genres, 
      published_date, 
      rating 
    } = body;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const newBook = await prisma.book.create({
      data: {
        title: title.trim(),
        author: author?.trim() || null,
        cover_url: cover_url?.trim() || null,
        description: description?.trim() || null,
        reading_time: reading_time?.trim() || null,
        pages: pages || null,
        genres: genres || [],
        published_date: published_date?.trim() || null,
        rating: rating || null,
        added_by: adminUser.id, // Set the creator as the admin user
      },
      include: {
        creator: {
          select: {
            display_name: true,
          },
        },
        _count: {
          select: {
            UserBook: true,
            reviews: true,
            club_meetings: true,
          },
        },
      },
    });

    return NextResponse.json(newBook, { status: 201 });

  } catch (error: any) {
    console.error('Error creating book:', error);
    
    // Handle authentication and authorization errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    return NextResponse.json({ error: error.message || 'Failed to create book' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 