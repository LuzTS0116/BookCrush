// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
// import { cookies } from 'next/headers'
// import { NextResponse } from 'next/server'
// import { z } from 'zod'

// const setCurrentBookSchema = z.object({
//   bookId: z.string().uuid(),
// })

// // GET /api/clubs/[id]/current-book - Get club's current book
// export async function GET(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {

//     const cookieStore = await cookies();
//     const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

//     const { data: club, error } = await supabase
//       .from('clubs')
//       .select(`
//         current_book_id,
//         books:current_book_id (
//           id,
//           title,
//           author,
//           cover_url,
//           description,
//           reading_time,
//           pages
//         )
//       `)
//       .eq('id', params.id)
//       .single()

//     if (error) throw error

//     return NextResponse.json(club.books)
//   } catch (error) {
//     console.error('Error fetching current book:', error)
//     return NextResponse.json(
//       { error: 'Failed to fetch current book' },
//       { status: 500 }
//     )
//   }
// }

// // PUT /api/clubs/[id]/current-book - Set club's current book
// export async function PUT(
//     request: Request,
//     { params }: { params: Promise<{ id: string }> }
//  ) {

//     const {id} = await params;
//   try {
//     const cookieStore = await cookies();
//     const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
//     const body = await request.json()
//     const { bookId } = setCurrentBookSchema.parse(body)

//     // First check if user has permission (is owner or admin)
//     const { data: membership, error: membershipError } = await supabase
//       .from('club_memberships')
//       .select('role')
//       .eq('club_id', id)
//       .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
//       .single()

//     if (membershipError || !membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
        
//       return NextResponse.json(
//         { error: 'Unauthorized_Supabase ' + membership?.role },
//         { status: 403 }
//       )
//     }

//     // Update the current book
//     const { data: updatedClub, error: updateError } = await supabase
//       .from('clubs')
//       .update({ current_book_id: bookId })
//       .eq('id', id)
//       .select(`
//         current_book_id,
//         books:current_book_id (
//           id,
//           title,
//           author,
//           cover_url,
//           description,
//           reading_time,
//           pages
//         )
//       `)
//       .single()

//     if (updateError) throw updateError

//     // Also add to club_books history if not already there
//     const { error: historyError } = await supabase
//       .from('club_books')
//       .upsert(
//         {
//           club_id: id,
//           book_id: bookId,
//           status: 'IN_PROGRESS',
//         },
//         {
//           onConflict: 'club_id,book_id',
//           ignoreDuplicates: true,
//         }
//       )

//     if (historyError) throw historyError

//     return NextResponse.json(updatedClub.books)
//   } catch (error) {
//     console.error('Error setting current book:', error)
//     return NextResponse.json(
//       { error: 'Failed to set current book' },
//       { status: 500 }
//     )
//   }
// }

// // DELETE /api/clubs/[id]/current-book - Remove club's current book
// export async function DELETE(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {

//     const cookieStore = await cookies();
//     const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    

//     // First check if user has permission (is owner or admin)
//     const { data: membership, error: membershipError } = await supabase
//       .from('club_memberships')
//       .select('role')
//       .eq('club_id', params.id)
//       .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
//       .single()

//     if (membershipError || !membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
//       return NextResponse.json(
//         { error: 'Unauthorized' },
//         { status: 403 }
//       )
//     }

//     const { error } = await supabase
//       .from('clubs')
//       .update({ current_book_id: null })
//       .eq('id', params.id)

//     if (error) throw error

//     return NextResponse.json({ success: true })
//   } catch (error) {
//     console.error('Error removing current book:', error)
//     return NextResponse.json(
//       { error: 'Failed to remove current book' },
//       { status: 500 }
//     )
//   }
// } 

// /app/api/clubs/[id]/current-book/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient, ActivityType, ActivityTargetEntityType } from '@/lib/generated/prisma';
import { ClubRole, ClubMembershipStatus, club_book_status } from '@/lib/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

const setCurrentBookSchema = z.object({
  bookId: z.string().uuid(),
});

// GET /api/clubs/[id]/current-book - Get club's current book
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
 ) {
 
    
   
   try {
    
    const {id} = await params; 
    
    if (!id) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
    }

    // Fetch club using Prisma
    const club = await prisma.club.findUnique({
      where: { id },
      select: {
        current_book_id: true,
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // If club has a current book, fetch the book details
    if (club.current_book_id) {
      const book = await prisma.book.findUnique({
        where: { id: club.current_book_id },
      });
      return NextResponse.json(book);
    } else {
      return NextResponse.json(null);
    }
  } catch (error: any) {
    console.error('Error fetching current book:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch current book' },
      { status: 500 }
    );
  }
}

// PUT /api/clubs/[id]/current-book - Set club's current book
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
 ) {
 
    
   
   try {
    
    const {id} = await params; 
    
    if (!id) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
    }

    // Use cookies() directly with createRouteHandlerClient
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { bookId } = setCurrentBookSchema.parse(body);

    const clubForActivity = await prisma.club.findUnique({ 
        where: {id }, 
        select: { name: true } 
    });
    if (!clubForActivity) {
        // This case should ideally be caught earlier or handled, but as a fallback for activity logging:
        console.warn(`Club not found for activity logging: ${id}`);
        // Proceed with core logic but activity logging might be incomplete
    }

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
        { error: "You do not have permission to set the current book for this club" },
        { status: 403 }
      );
    }

    const bookToSet = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, title: true }
    });

    if (!bookToSet) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    await prisma.club.update({
      where: { id },
      data: { 
        current_book_id: bookId 
      },
    });

    const existingClubBook = await prisma.clubBook.findFirst({
      where: {
        club_id: id,
        book_id: bookId
      }
    });

    // Add to club_books history if not already there
    if (!existingClubBook) {
      await prisma.clubBook.create({
        data: {
          club_id: id,
          book_id: bookId,
          status: club_book_status.IN_PROGRESS
        }
      });
    }
    
    // --- Create ActivityLog Entries for CLUB_SELECTED_BOOK ---
    const activeMembers = await prisma.clubMembership.findMany({
        where: {
            club_id: id,
            status: ClubMembershipStatus.ACTIVE
        },
        select: { user_id: true }
    });

    const activityPromises = activeMembers.map(member => 
        prisma.activityLog.create({
            data: {
                user_id: member.user_id,
                activity_type: ActivityType.CLUB_SELECTED_BOOK,
                target_entity_type: ActivityTargetEntityType.CLUB,
                target_entity_id: id,
                details: {
                    club_id: id,
                    club_name: clubForActivity?.name || 'A club',
                    book_id: bookToSet.id,
                    book_title: bookToSet.title,
                    set_by_user_id: user.id
                }
            }
        })
    );
    await Promise.all(activityPromises);
    // --- End ActivityLog Entries ---

    return NextResponse.json(bookToSet);

  } catch (error: any) {
    console.error('Error setting current book:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set current book' },
      { status: 500 }
    );
  }
}

// DELETE /api/clubs/[id]/current-book - Remove club's current book
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
 ) {
 
    
   
   try {
    
    const {id} = await params; 
    
    if (!id) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
    }

    // Use cookies() directly with createRouteHandlerClient
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

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

    // Remove current book
    await prisma.club.update({
      where: { id },
      data: { 
        current_book_id: null 
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing current book:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove current book' },
      { status: 500 }
    );
  }
}