// /app/api/clubs/create/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient, ActivityType, ActivityTargetEntityType } from '@prisma/client' 
import {  ClubRole, ClubMembershipStatus  } from '@prisma/client'; // Import enums
import { checkRateLimit, sanitizeInput, logSecurityEvent } from '@/lib/security-utils';

const prisma = new PrismaClient()

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

    // Rate limiting check
    const rateLimitCheck = checkRateLimit(user.id, 'club_creation');
    if (!rateLimitCheck.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', user.id, { 
        operation: 'club_creation',
        endpoint: '/api/clubs/create' 
      }, req);
      return NextResponse.json({ error: rateLimitCheck.error }, { status: 429 });
    }

    const { name, description, isPrivate } = await req.json();

    // Validate and sanitize club name
    const nameValidation = sanitizeInput.clubName(name);
    if (!nameValidation.isValid) {
      logSecurityEvent('INVALID_INPUT', user.id, {
        field: 'club_name',
        error: nameValidation.error,
        endpoint: '/api/clubs/create'
      }, req);
      return NextResponse.json({ error: nameValidation.error }, { status: 400 });
    }

    // Validate and sanitize description if provided
    let sanitizedDescription = null;
    if (description && typeof description === 'string' && description.trim() !== '') {
      const descValidation = sanitizeInput.description(description);
      if (!descValidation.isValid) {
        logSecurityEvent('INVALID_INPUT', user.id, {
          field: 'club_description',
          error: descValidation.error,
          endpoint: '/api/clubs/create'
        }, req);
        return NextResponse.json({ error: descValidation.error }, { status: 400 });
      }
      sanitizedDescription = descValidation.sanitized;
    }

    // Validate isPrivate parameter
    if (isPrivate !== undefined && typeof isPrivate !== 'boolean') {
      return NextResponse.json({ error: "isPrivate must be a boolean value" }, { status: 400 });
    }

    // Check if user already owns too many clubs (prevent spam)
    const existingClubsCount = await prisma.club.count({
      where: { owner_id: user.id }
    });

    const MAX_CLUBS_PER_USER = 10; // Configurable limit
    if (existingClubsCount >= MAX_CLUBS_PER_USER) {
      logSecurityEvent('CLUB_LIMIT_EXCEEDED', user.id, {
        currentCount: existingClubsCount,
        limit: MAX_CLUBS_PER_USER,
        endpoint: '/api/clubs/create'
      }, req);
      return NextResponse.json({ 
        error: `You can only create up to ${MAX_CLUBS_PER_USER} clubs` 
      }, { status: 403 });
    }

    // ATOMIC TRANSACTION for creating Club and Owner's ClubMembership
    const newClubWithMembership = await prisma.$transaction(async (tx) => {
      // 1. Create the new Club
      const newClub = await tx.club.create({
        data: {
          name: nameValidation.sanitized,
          description: sanitizedDescription,
          owner_id: user.id,
          is_private: isPrivate === true,
          memberCount: 1, // Initialize with 1 member (the owner)
        },
      });

      // 2. Create the ClubMembership for the owner
      await tx.clubMembership.create({
        data: {
          user_id: user.id,
          club_id: newClub.id,
          role: ClubRole.OWNER,
          status: ClubMembershipStatus.ACTIVE,
        },
      });

      // Create ActivityLog Entry for CREATED_CLUB
      await tx.activityLog.create({
        data: {
          user_id: user.id,
          activity_type: ActivityType.CREATED_CLUB,
          target_entity_type: ActivityTargetEntityType.CLUB,
          target_entity_id: newClub.id,
          details: {
            club_name: newClub.name,
            club_description: newClub.description,
            is_private: newClub.is_private
          }
        }
      });

      return newClub; // Return the newly created club
    });

    // Log successful club creation
    logSecurityEvent('CLUB_CREATED', user.id, {
      clubId: newClubWithMembership.id,
      clubName: newClubWithMembership.name,
      isPrivate: newClubWithMembership.is_private
    }, req);

    return NextResponse.json(newClubWithMembership, { status: 201 });

  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      // Handle unique constraint error for club name
      logSecurityEvent('DUPLICATE_CLUB_NAME', user?.id || 'unknown', {
        endpoint: '/api/clubs/create'
      }, req);
      return NextResponse.json({ error: "A club with this name already exists. Please choose a different name." }, { status: 409 });
    }
    
    console.error("Error creating club:", error);
    
    // Log security event for failed club creation
    logSecurityEvent('CLUB_CREATION_FAILED', user?.id || 'unknown', {
      error: error.message,
      endpoint: '/api/clubs/create'
    }, req);
    
    return NextResponse.json({ error: error.message || "Failed to create club" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}