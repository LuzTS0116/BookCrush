import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req:NextRequest){
// const { display_name, about } = await req.json();
const cookieStore = await cookies()
const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }

const prisma = new PrismaClient()
const payload = await req.json()
  const {
    display_name,
    about,
    favorite_genres = [],
    kindle_email
  } = payload

// await prisma.profile.create({
// data: { id:user!.id, display_name, about }
// });

 // upsert avoids “duplicate key” if user hits the endpoint twice
  const profile = await prisma.profile.upsert({
    where: { id: user.id },
    update: { display_name, about, favorite_genres, kindle_email },
    create: { id: user.id, display_name, about, favorite_genres, kindle_email }
  })

return NextResponse.json(profile, { status:201 });
}