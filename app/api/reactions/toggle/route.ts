import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient } from '@/lib/generated/prisma'
import { ReactionTargetType, ReactionType } from '@/lib/generated/prisma';


const prisma = new PrismaClient()
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { targetId, targetType: targetTypeString, type: reactionTypeString } = await req.json();

    if (!targetId || !targetTypeString || !reactionTypeString) {
      return NextResponse.json({ error: "targetId, targetType, and type are required" }, { status: 400 });
    }

    let targetType: ReactionTargetType;
    let reactionType: ReactionType;

    try {
      // Assuming you have helper functions or a direct mapping for string to enum
      targetType = targetTypeString as ReactionTargetType;
      reactionType = reactionTypeString as ReactionType;
      // You might want more robust validation here, e.g., using a switch or a map
    } catch (e) {
      return NextResponse.json({ error: "Invalid targetType or reactionType" }, { status: 400 });
    }

    // --- ATOMIC TRANSACTION for toggling reaction ---
    const result = await prisma.$transaction(async (tx) => {
      const existingReaction = await tx.reaction.findUnique({
        where: {
          user_id_target_type_target_id_type: { // Composite unique key
            user_id: user.id,
            target_type: targetType,
            target_id: targetId,
            type: reactionType,
          },
        },
      });

      let operation: 'created' | 'deleted';
      let reaction;

      if (existingReaction) {
        // If reaction exists, delete it
        await tx.reaction.delete({
          where: {
            user_id_target_type_target_id_type: {
              user_id: user.id,
              target_type: targetType,
              target_id: targetId,
              type: reactionType,
            },
          },
        });
        operation = 'deleted';
        reaction = null; // No reaction object after deletion
      } else {
        // If reaction doesn't exist, create it
        reaction = await tx.reaction.create({
          data: {
            user_id: user.id,
            target_type: targetType,
            target_id: targetId,
            type: reactionType,
          },
        });
        operation = 'created';
      }

      // Optional: Update aggregate counts (eventual consistency)
      // This part would typically be handled by a database trigger or a separate background job
      // to avoid making the user's request wait for aggregate updates.
      // Example (pseudo-code if doing it here for simplicity, but not recommended for high-traffic):
      // if (targetType === ReactionTargetType.BOOK) {
      //   await tx.book.update({
      //     where: { id: targetId },
      //     data: { likesCount: operation === 'created' ? { increment: 1 } : { decrement: 1 } },
      //   });
      // }

      return { operation, reaction };
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("Error toggling reaction:", error);
    return NextResponse.json({ error: error.message || "Failed to toggle reaction" }, { status: 500 });
  }
}