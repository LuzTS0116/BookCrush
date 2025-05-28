import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { useParams } from 'next/navigation'
import { PrismaClient } from '@/lib/generated/prisma';
import { ClubRole } from '@/lib/generated/prisma';

const prisma = new PrismaClient();
// Schema for adding a book to club history
const addBookSchema = z.object({
  bookId: z.string().uuid(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'ABANDONED']).default('IN_PROGRESS'),
})

// Schema for updating a book's status
const updateBookSchema = z.object({
  clubBookId: z.string().uuid(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'ABANDONED']),
  //make finishedAt nullable or datetime
  finishedAt: z.union([z.string().nullable(), z.string().datetime()]).optional(),
  
})

// GET /api/clubs/[id]/books - Get club's book history
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  //react.use in params.id
  const { id } = await params
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: books, error } = await supabase
      .from('club_books')
      .select(`
        id,
        book_id,
        started_at,
        finished_at,
        status,
        books:book_id (
          id,
          title,
          author,
          cover_url,
          description
        )
      `)
      .eq('club_id', id)
      .order('started_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(books || [])
  } catch (error) {
    console.error('Error fetching club books:', error)
    return NextResponse.json(
      { error: 'Failed to fetch club books' },
      { status: 500 }
    )
  }
}

// POST /api/clubs/[id]/books - Add a book to club history
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  //react.use in params.id
  const { id } = await params
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Parse body
    const body = await request.json()
    const { bookId, status } = addBookSchema.parse(body)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // First check if user has permission (is owner or admin)
    const { data: membership, error: membershipError } = await supabase
      .from('club_memberships')
      .select('role')
      .eq('club_id', id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('club_books')
      .insert({
        club_id: id,
        book_id: bookId,
        status,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error adding club book:', error)
    return NextResponse.json(
      { error: 'Failed to add book to club' },
      { status: 500 }
    )
  }
}

// PATCH /api/clubs/[id]/books - Update a book's status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  //react.use in params.id
  const { id } = await params
 
  try {

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Parse body
    const body = await request.json()
    const { clubBookId, status, finishedAt } = updateBookSchema.parse(body)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has permission using Prisma
    const membership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: user.id,
          club_id: id,
        },
      },
      select: {
        role: true,
      },
    });

    if (!membership || !(membership.role === ClubRole.OWNER || membership.role === ClubRole.ADMIN)) {
      return NextResponse.json(
        { error: "You do not have permission to remove the current book for this club" },
        { status: 403 }
      );
    }

    //do a swtich depending on status and perform supabase update accordingly
    switch (status) {
      case 'COMPLETED':
        await prisma.clubBook.update({
          where: {
            id: clubBookId,
            club_id: id,  // Extra safety check
          },
          data: {
            status: 'COMPLETED',
            finished_at: finishedAt || new Date(),
          },
        })
        break
    
      case 'ABANDONED':
        await prisma.clubBook.update({
          where: {
            id: clubBookId,
            club_id: id,  // Extra safety check
          },
          data: {
            status: 'ABANDONED',
          },
        })
        break
    
      case 'IN_PROGRESS':
        await prisma.clubBook.update({
          where: {
            id: clubBookId,
            club_id: id,  // Extra safety check
          },
          data: {
            status: 'IN_PROGRESS',
          },
        })
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating club book:', error)
    return NextResponse.json(
      { error: 'Failed to update book status' },
      { status: 500 }
    )
  }
} 