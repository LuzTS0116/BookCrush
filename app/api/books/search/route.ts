import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json([])
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Search in books table using text search capabilities
    const { data: books, error } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author,
        cover_url,
        description,
        reading_time,
        pages
      `)
      .or(
        `title.ilike.%${query}%,` +
        `author.ilike.%${query}%`
      )
      .order('title')
      .limit(20)

    if (error) {
      console.error('Error searching books:', error)
      throw error
    }

    return NextResponse.json(books || [])

  } catch (error) {
    console.error('Error in book search:', error)
    return NextResponse.json(
      { error: 'Failed to search books' },
      { status: 500 }
    )
  }
} 