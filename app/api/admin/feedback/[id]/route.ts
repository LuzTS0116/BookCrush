import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '../../../../../lib/auth-utils';
import { prisma } from '@/lib/prisma';



export async function PUT(
  req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
 ) {

    const {id} = await params;
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

    // Prepare update data
    const updateData: any = {
      status: status,
      admin_notes: admin_notes || null,
      user_notified: false, // Reset notification status when admin updates
    };

    // Set admin_replied_at timestamp if admin_notes is provided
    if (admin_notes && admin_notes.trim()) {
      updateData.admin_replied_at = new Date();
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id: id },
      data: updateData,
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
    
  }
}

export async function GET(
  req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
 ) {

    const {id} = await params;
  try {
    // Check admin authentication and role
    await requireAdmin();

    const feedback = await prisma.feedback.findUnique({
      where: { id: id },
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
    
  }
} 