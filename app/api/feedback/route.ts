import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { checkRateLimit, validateContent, sanitizeContent, logSecurityEvent } from '@/lib/security-utils';

const prisma = new PrismaClient();

// Feedback type enum (matching schema)
const FEEDBACK_TYPES = {
  BUG_REPORT: 'BUG_REPORT',
  FEATURE_REQUEST: 'FEATURE_REQUEST',
  GENERAL_FEEDBACK: 'GENERAL_FEEDBACK',
  COMPLAINT: 'COMPLAINT',
  COMPLIMENT: 'COMPLIMENT'
} as const;

type FeedbackType = typeof FEEDBACK_TYPES[keyof typeof FEEDBACK_TYPES];

// POST /api/feedback - Submit feedback
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Rate limiting check
    const rateLimitCheck = checkRateLimit(userId, 'feedback');
    if (!rateLimitCheck.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', userId, {
        operation: 'feedback',
        endpoint: '/api/feedback'
      }, request);
      return NextResponse.json({ error: rateLimitCheck.error }, { status: 429 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }

    const { content, type = 'GENERAL_FEEDBACK' } = body;

    // Validate content
    const contentValidation = validateContent(content, {
      minLength: 10,
      maxLength: 2000,
      fieldName: 'Feedback'
    });
    
    if (!contentValidation.isValid) {
      logSecurityEvent('INVALID_FEEDBACK_CONTENT', userId, {
        error: contentValidation.error,
        endpoint: '/api/feedback'
      }, request);
      return NextResponse.json({ error: contentValidation.error }, { status: 400 });
    }

    // Validate feedback type
    if (type && !Object.values(FEEDBACK_TYPES).includes(type as FeedbackType)) {
      logSecurityEvent('INVALID_FEEDBACK_TYPE', userId, {
        type,
        endpoint: '/api/feedback'
      }, request);
      return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 });
    }

    // Sanitize content
    const sanitizedContent = sanitizeContent(content);

    // Create feedback record
    const feedback = await prisma.feedback.create({
      data: {
        user_id: userId,
        content: sanitizedContent,
        type: type as FeedbackType,
      },
      include: {
        user: {
          select: {
            display_name: true,
            email: true,
          }
        }
      }
    });

    // Log feedback submission for admin monitoring
    logSecurityEvent('FEEDBACK_SUBMITTED', userId, {
      feedbackId: feedback.id,
      type: feedback.type,
      contentLength: feedback.content.length
    }, request);

    return NextResponse.json({ 
      message: 'Feedback submitted successfully',
      id: feedback.id 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    
    // Log security event for failed feedback submission
    logSecurityEvent('FEEDBACK_SUBMISSION_FAILED', 'unknown', {
      error: error.message,
      endpoint: '/api/feedback'
    }, request);
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/feedback - Get user's feedback history (optional)
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's feedback history
    const feedbackHistory = await prisma.feedback.findMany({
      where: {
        user_id: userId
      },
      select: {
        id: true,
        type: true,
        content: true,
        status: true,
        created_at: true,
        // Don't include admin_notes for privacy
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 20 // Limit to last 20 submissions
    });

    return NextResponse.json(feedbackHistory, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching feedback history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 