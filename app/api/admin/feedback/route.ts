import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../../../../lib/auth-utils';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication and role
    await requireAdmin();

    const feedback = await prisma.feedback.findMany({
      select: {
        id: true,
        type: true,
        content: true,
        status: true,
        admin_notes: true,
        created_at: true,
        updated_at: true,
        user: {
          select: {
            display_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(feedback, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching feedback:', error);
    
    // Handle authentication and authorization errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    return NextResponse.json({ error: error.message || 'Failed to fetch feedback' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 