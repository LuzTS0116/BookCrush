import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://zenquotes.io/api/random');
    const data = await response.json();
    
    if (!data || !data[0]) {
      throw new Error('Failed to fetch quote');
    }

    return NextResponse.json({
      quote: data[0].q,
      author: data[0].a
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
} 