import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '../../../../../lib/auth-utils';
import { prisma } from '@/lib/prisma';



export async function GET(
  req: Request,
    { params }: { params: Promise<{ id: string }> }
 ) {

    const {id} = await params;
  try {
    // Check admin authentication and role
    await requireAdmin();

    const user = await prisma.profile.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            userBooks: true,
            memberships: true,
            friendshipsAsUser1: true,
            friendshipsAsUser2: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching user:', error);
    
    // Handle authentication and authorization errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    return NextResponse.json({ error: error.message || 'Failed to fetch user' }, { status: 500 });
  } finally {
    
  }
}

export async function PUT(
  req: Request,
    { params }: { params: Promise<{ id: string }> }
 ) {

    const {id} = await params;
  try {
    // Check admin authentication and role
    await requireAdmin();

    const body = await req.json();
    const { display_name, full_name, email, about } = body;

    // Validate required fields
    if (!display_name?.trim()) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    const updatedUser = await prisma.profile.update({
      where: { id: id },
      data: {
        display_name: display_name.trim(),
        full_name: full_name?.trim() || null,
        email: email?.trim() || null,
        about: about?.trim() || null,
      },
      include: {
        _count: {
          select: {
            userBooks: true,
            memberships: true,
            friendshipsAsUser1: true,
            friendshipsAsUser2: true,
          },
        },
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error: any) {
    console.error('Error updating user:', error);
    
    // Handle authentication and authorization errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  } finally {
    
  }
}

export async function DELETE(
  req: Request,
    { params }: { params: Promise<{ id: string }> }
 ) {

    const {id} = await params;
  try {
    // Check admin authentication and role
    const adminUser = await requireAdmin();
    
    // Prevent admin from deleting themselves
    if (adminUser.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.profile.findUnique({
      where: { id: id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user (this will cascade delete related records due to schema constraints)
    await prisma.profile.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    // Handle authentication and authorization errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  } finally {
    
  }
} 