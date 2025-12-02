import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  try {
    const [union] = await db
      .select({ id: unions.id, publishedAt: unions.publishedAt })
      .from(unions)
      .where(eq(unions.slug, slug))
      .limit(1);

    // Check if union exists and is published
    if (!union || !union.publishedAt) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json({ exists: true }, { status: 200 });
  } catch (error) {
    console.error('Error checking union:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
