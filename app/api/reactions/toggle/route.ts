import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient } from '@prisma/client'
import {  ReactionTargetType, ReactionType  } from '@prisma/client';
import { checkRateLimit, logSecurityEvent } from '@/lib/security-utils';
import { prisma } from '@/lib/prisma';



export async function POST(req: NextRequest) {
  let user: any = null; // Declare user variable in broader scope
  
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    user = authUser; // Assign to broader scope variable

    // Rate limiting check (reactions are high-frequency, so more lenient)
    const rateLimitCheck = checkRateLimit(user.id, 'reactions');
    if (!rateLimitCheck.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', user.id, { 
        operation: 'reactions',
        endpoint: '/api/reactions/toggle' 
      }, req);
      return NextResponse.json({ error: rateLimitCheck.error }, { status: 429 });
    }

    const { targetId, targetType: targetTypeString, type: reactionTypeString } = await req.json();

    // Input validation
    if (!targetId || typeof targetId !== 'string') {
      return NextResponse.json({ error: "Valid targetId is required" }, { status: 400 });
    }

    if (!targetTypeString || typeof targetTypeString !== 'string') {
      return NextResponse.json({ error: "Valid targetType is required" }, { status: 400 });
    }

    if (!reactionTypeString || typeof reactionTypeString !== 'string') {
      return NextResponse.json({ error: "Valid reaction type is required" }, { status: 400 });
    }

    // Validate enum values
    const validTargetTypes = Object.values(ReactionTargetType);
    const validReactionTypes = Object.values(ReactionType);

    if (!validTargetTypes.includes(targetTypeString as ReactionTargetType)) {
      logSecurityEvent('INVALID_TARGET_TYPE', user.id, {
        targetType: targetTypeString,
        endpoint: '/api/reactions/toggle'
      }, req);
      return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
    }

    if (!validReactionTypes.includes(reactionTypeString as ReactionType)) {
      logSecurityEvent('INVALID_REACTION_TYPE', user.id, {
        reactionType: reactionTypeString,
        endpoint: '/api/reactions/toggle'
      }, req);
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    const targetType = targetTypeString as ReactionTargetType;
    const reactionType = reactionTypeString as ReactionType;

    // Verify target exists based on target type
    let targetExists = false;
    switch (targetType) {
      case ReactionTargetType.BOOK:
        const book = await prisma.book.findUnique({
          where: { id: targetId },
          select: { id: true }
        });
        targetExists = !!book;
        break;
      case ReactionTargetType.CLUB_DISCUSSION:
        const discussion = await prisma.clubDiscussion.findUnique({
          where: { id: targetId },
          select: { id: true }
        });
        targetExists = !!discussion;
        break;
      // Add other target types as needed
      default:
        targetExists = true; // For now, assume other types exist
    }

    if (!targetExists) {
      logSecurityEvent('INVALID_REACTION_TARGET', user.id, {
        targetId,
        targetType,
        endpoint: '/api/reactions/toggle'
      }, req);
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    // ATOMIC TRANSACTION for toggling reaction
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

      return { operation, reaction };
    });

    // Log successful reaction toggle (only for auditing, not every single reaction)
    if (Math.random() < 0.1) { // Log 10% of reactions for monitoring
      logSecurityEvent('REACTION_TOGGLED', user.id, {
        targetId,
        targetType,
        reactionType,
        operation: result.operation
      }, req);
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("Error toggling reaction:", error);
    
    // Log security event for failed reaction
    logSecurityEvent('REACTION_TOGGLE_FAILED', user?.id || 'unknown', {
      error: error.message,
      endpoint: '/api/reactions/toggle'
    }, req);
    
    return NextResponse.json({ error: error.message || "Failed to toggle reaction" }, { status: 500 });
  } finally {
    
  }
}