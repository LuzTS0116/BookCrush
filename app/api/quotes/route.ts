import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';



export async function GET() {
  const cookieStore = await cookies();
  const quoteCookie = cookieStore.get('daily-quote');
  try {

    if (quoteCookie) {
    return NextResponse.json(JSON.parse(quoteCookie.value));
  }

    const response = await fetch('https://zenquotes.io/api/random');
    const data = await response.json();
 

    if (!data || !data[0]) {
      throw new Error('Failed to fetch quote');
    }

    const { q: quote, a: author } = data[0];
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

    /*  build the response object first */
    const res = NextResponse.json({ quote, author });

    /*  mutate its cookie jar */
    res.cookies.set({
      name:  'daily-quote',
      value: JSON.stringify({ quote, author }),
      httpOnly: true,
      path: '/',
      expires,
    });

    /* return the same response */
    return res;

  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
} 