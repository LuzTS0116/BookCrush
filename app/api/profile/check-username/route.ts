import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    // Input validation
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { available: false, error: 'Username is required' },
        { status: 400 }
      )
    }

    const trimmedUsername = username.trim()

    // Basic format validation
    if (trimmedUsername.length < 3) {
      return NextResponse.json(
        { available: false, error: 'Username must be at least 3 characters long' },
        { status: 400 }
      )
    }

    if (trimmedUsername.length > 30) {
      return NextResponse.json(
        { available: false, error: 'Username must be less than 30 characters' },
        { status: 400 }
      )
    }

    // Format validation - only letters, numbers, dots, hyphens, underscores
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
      return NextResponse.json(
        { available: false, error: 'Username can only contain letters, numbers, dots, hyphens, and underscores' },
        { status: 400 }
      )
    }

    // Check if username exists in database
    const existingProfile = await prisma.profile.findUnique({
      where: { display_name: trimmedUsername },
      select: { id: true } // Only select id for efficiency
    })

    const available = !existingProfile

    return NextResponse.json({
      available,
      username: trimmedUsername,
      message: available 
        ? 'Username is available' 
        : 'Username is already taken'
    })

  } catch (error) {
    console.error('Username check error:', error)
    return NextResponse.json(
      { available: false, error: 'Failed to check username availability' },
      { status: 500 }
    )
  }
} 