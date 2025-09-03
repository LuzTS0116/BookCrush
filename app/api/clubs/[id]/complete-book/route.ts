import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ClubRole, club_book_status } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// Schema for completing the current book
const completeBookSchema = z.object({
  status: z.nativeEnum(club_book_status).default(club_book_status.COMPLETED),
  rating: z.number().int().min(1).max(5).optional(),
  discussionNotes: z.string().min(1),
})

// POST /api/clubs/[id]/complete-book - Complete or abandon the current book and move it to history
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const supabase = await createClient()
    
    // Parse body
    const body = await request.json()
    const { status, rating, discussionNotes } = completeBookSchema.parse(body)
    
    // Validate that rating is provided for COMPLETED books
    if (status === club_book_status.COMPLETED && !rating) {
      return NextResponse.json(
        { error: 'Rating is required when completing a book' },
        { status: 400 }
      )
    }

    console.log('Processing book with status:', status, 'and discussionNotes:', discussionNotes.substring(0, 50) + '...')

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has permission (is owner or admin)
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
    })

    if (!membership || !(membership.role === ClubRole.OWNER || membership.role === ClubRole.ADMIN)) {
      return NextResponse.json(
        { error: 'You do not have permission to complete books for this club' },
        { status: 403 }
      )
    }

    // Get the club with current book
    const club = await prisma.club.findUnique({
      where: { id },
      select: {
        current_book_id: true,
      },
    })

    if (!club || !club.current_book_id) {
      return NextResponse.json(
        { error: 'No current book set for this club' },
        { status: 400 }
      )
    }

    // Start a transaction to:
    // 1. Create or update the ClubBook entry as COMPLETED
    // 2. Clear the current_book_id from the club
    const result = await prisma.$transaction(async (tx) => {
      // Check if there's already a ClubBook entry for this book
      const existingClubBook = await tx.clubBook.findFirst({
        where: {
          club_id: id,
          book_id: club.current_book_id!,
        },
      })

      let clubBook
      if (existingClubBook) {
        // Update existing entry
        console.log('Updating existing ClubBook with ID:', existingClubBook.id)
        
        const updateData = {
          status,
          finished_at: new Date(),
          discussion_notes: discussionNotes,
          ...(status === club_book_status.COMPLETED && rating ? { rating } : {})
        }
        
        console.log('Update data:', updateData)
        
        clubBook = await tx.clubBook.update({
          where: {
            id: existingClubBook.id,
          },
          data: updateData,
        })
        
        console.log('Updated ClubBook:', clubBook)
      } else {
        // Create new entry
        console.log('Creating new ClubBook entry')
        
        const createData = {
          club_id: id,
          book_id: club.current_book_id!,
          status,
          started_at: new Date(), // Assume started when it was set as current
          finished_at: new Date(),
          discussion_notes: discussionNotes,
          ...(status === club_book_status.COMPLETED && rating ? { rating } : {})
        }
        
        console.log('Create data:', createData)
        
        clubBook = await tx.clubBook.create({
          data: createData,
        })
        
        console.log('Created ClubBook:', clubBook)
      }

      // Clear the current book from the club
      await tx.club.update({
        where: { id },
        data: {
          current_book_id: null,
        },
      })

      return clubBook
    })

    console.log('Final result:', result)

    return NextResponse.json({ 
      success: true,
      clubBook: result,
      message: status === club_book_status.COMPLETED 
        ? 'Book completed successfully and moved to history'
        : 'Book marked as not completed and moved to history'
    })

  } catch (error) {
    console.error('Error completing book:', error)
    return NextResponse.json(
      { error: 'Failed to complete book' },
      { status: 500 }
    )
  }
} 