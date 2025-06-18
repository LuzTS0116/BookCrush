import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../../../../../lib/auth-utils';

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication and role
    await requireAdmin();

    const body = await req.json();
    const { status, admin_notes } = body;

    // Validate status
    const validStatuses = ['PENDING', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id: params.id },
      data: {
        status: status,
        admin_notes: admin_notes || null,
      },
      include: {
        user: {
          select: {
            display_name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedFeedback, { status: 200 });

  } catch (error: any) {
    console.error('Error updating feedback:', error);
    
    // Handle authentication and authorization errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    return NextResponse.json({ error: error.message || 'Failed to update feedback' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication and role
    await requireAdmin();

    const feedback = await prisma.feedback.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            display_name: true,
            email: true,
          },
        },
      },
    });

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

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