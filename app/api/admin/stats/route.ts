import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../../../../lib/auth-utils';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication and role
    await requireAdmin();

    // Get current date for monthly calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Parallel queries for better performance
    const [
      totalUsers,
      newUsersThisMonth,
      totalBooks,
      booksAddedThisMonth,
      totalClubs,
      activeClubs,
      newClubsThisMonth,
      totalActivities,
      activitiesToday,
      discussionsToday,
      totalFeedback,
      pendingFeedback,
      resolvedFeedback,
    ] = await Promise.all([
      // User statistics
      prisma.profile.count(),
      prisma.profile.count({
        where: {
          created_at: {
            gte: startOfMonth
          }
        }
      }),

      // Book statistics
      prisma.book.count(),
      prisma.book.count({
        where: {
          created_at: {
            gte: startOfMonth
          }
        }
      }),

      // Club statistics
      prisma.club.count(),
      prisma.club.count({
        where: {
          memberCount: {
            gt: 0
          }
        }
      }),
      prisma.club.count({
        where: {
          created_at: {
            gte: startOfMonth
          }
        }
      }),

      // Activity statistics
      prisma.activityLog.count(),
      prisma.activityLog.count({
        where: {
          created_at: {
            gte: startOfDay
          }
        }
      }),
      prisma.clubDiscussion.count({
        where: {
          created_at: {
            gte: startOfDay
          }
        }
      }),

      // Feedback statistics
      prisma.feedback.count(),
      prisma.feedback.count({
        where: {
          status: 'PENDING'
        }
      }),
      prisma.feedback.count({
        where: {
          status: 'RESOLVED'
        }
      }),
    ]);

    // Get most popular book (most added to shelves)
    const mostPopularBook = await prisma.userBook.groupBy({
      by: ['book_id'],
      _count: {
        book_id: true
      },
      orderBy: {
        _count: {
          book_id: 'desc'
        }
      },
      take: 1
    });

    let mostPopularBookTitle = 'N/A';
    if (mostPopularBook.length > 0) {
      const book = await prisma.book.findUnique({
        where: { id: mostPopularBook[0].book_id },
        select: { title: true }
      });
      mostPopularBookTitle = book?.title || 'N/A';
    }

    const stats = {
      users: {
        total: totalUsers,
        active: totalUsers, // For now, consider all users as active
        newThisMonth: newUsersThisMonth,
      },
      books: {
        total: totalBooks,
        addedThisMonth: booksAddedThisMonth,
        mostPopular: mostPopularBookTitle,
      },
      clubs: {
        total: totalClubs,
        active: activeClubs,
        newThisMonth: newClubsThisMonth,
      },
      activity: {
        totalActivities: totalActivities,
        todayActivities: activitiesToday,
        discussionsToday: discussionsToday,
      },
      feedback: {
        pending: pendingFeedback,
        resolved: resolvedFeedback,
        total: totalFeedback,
      },
    };

    return NextResponse.json(stats, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    
    // Handle authentication and authorization errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    return NextResponse.json({ error: error.message || 'Failed to fetch admin statistics' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 