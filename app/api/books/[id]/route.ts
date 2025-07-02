import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma';



export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
 ) {

    const {id} = await params; 
    if (!id) {
        return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
      }
  try {
    // Get session for user context
    const bookId = id;
    const session = await getServerSession(authOptions)
    let currentUser = null

    if (session?.user?.email) {
      currentUser = await prisma.profile.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })
    }
    
   

    // Fetch book details with related data
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        file: true, // Book files
        current_in_clubs: {
          include: {
            _count: {
              select: {
                memberships: {
                  where: { status: 'ACTIVE' }
                }
              }
            }
          }
        },
        UserBook: currentUser ? {
          where: { user_id: currentUser.id }
        } : false
      }
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Get clubs that are currently reading this book
    let currentClubs;
    let completedClubs;
    
    if (currentUser) {
      // Clubs currently reading this book (where user is a member)
      currentClubs = await prisma.club.findMany({
        where: {
          current_book_id: bookId,
          memberships: {
            some: {
              user_id: currentUser.id,
              status: 'ACTIVE' as const
            }
          }
        },
        include: {
          _count: {
            select: {
              memberships: {
                where: { status: 'ACTIVE' as const }
              }
            }
          },
          meetings: {
            where: {
              book_id: bookId,
              status: 'SCHEDULED'
            },
            orderBy: {
              meeting_date: 'asc'
            },
            take: 1
          }
        }
      })

      // Clubs that have completed reading this book (where user is a member)
      completedClubs = await prisma.club.findMany({
        where: {
          book_history: {
            some: {
              book_id: bookId,
              status: {
                in: ['COMPLETED', 'ABANDONED']
              }
            }
          },
          memberships: {
            some: {
              user_id: currentUser.id,
              status: 'ACTIVE' as const
            }
          }
        },
        include: {
          _count: {
            select: {
              memberships: {
                where: { status: 'ACTIVE' as const }
              }
            }
          },
          book_history: {
            where: {
              book_id: bookId,
              status: {
                in: ['COMPLETED', 'ABANDONED']
              }
            },
            orderBy: {
              finished_at: 'desc'
            },
            take: 1
          }
        }
      })
    } else {
      // Public clubs currently reading this book
      currentClubs = await prisma.club.findMany({
        where: {
          current_book_id: bookId,
          is_private: false
        },
        include: {
          _count: {
            select: {
              memberships: {
                where: { status: 'ACTIVE' as const }
              }
            }
          },
          meetings: {
            where: {
              book_id: bookId,
              status: 'SCHEDULED'
            },
            orderBy: {
              meeting_date: 'asc'
            },
            take: 1
          }
        }
      })

      // Public clubs that have completed reading this book
      completedClubs = await prisma.club.findMany({
        where: {
          book_history: {
            some: {
              book_id: bookId,
              status: {
                in: ['COMPLETED', 'ABANDONED']
              }
            }
          },
          is_private: false
        },
        include: {
          _count: {
            select: {
              memberships: {
                where: { status: 'ACTIVE' as const }
              }
            }
          },
          book_history: {
            where: {
              book_id: bookId,
              status: {
                in: ['COMPLETED', 'ABANDONED']
              }
            },
            orderBy: {
              finished_at: 'desc'
            },
            take: 1
          }
        }
      })
    }

    // Transform the data to match the expected format
    const bookData = {
      id: book.id,
      title: book.title,
      author: book.author || 'Unknown Author',
      cover: book.cover_url || '/placeholder.svg',
      published: book.published_date || 'Unknown',
      pages: book.pages || 0,
      genre: book.genres || [],
      isbn: book.rating?.toString() || '0',
      description: book.description || 'No description available.',
      reading_time: book.reading_time || '5h 25min',
      userProgress: 0, // You might want to calculate this based on UserBook status
      userBooks: book.UserBook || [],
      files: book.file || [],
      clubs: currentClubs.map((club: any) => ({
        id: club.id,
        name: club.name,
        members: club._count.memberships,
        meetingDate: club.meetings?.[0]?.meeting_date 
          ? new Date(club.meetings[0].meeting_date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })
          : 'TBD',
        status: 'currently_reading'
      })),
      clubHistory: completedClubs.map((club: any) => ({
        id: club.id,
        name: club.name,
        members: club._count.memberships,
        completedDate: club.book_history?.[0]?.finished_at 
          ? new Date(club.book_history[0].finished_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })
          : 'Unknown',
        status: club.book_history?.[0]?.status?.toLowerCase() || 'completed'
      }))
    }

    return NextResponse.json(bookData)

  } catch (error) {
    console.error('Error fetching book details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    
  }
} 