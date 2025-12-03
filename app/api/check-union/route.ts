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
    console.log('[check-union] Checking slug:', slug);
    console.log('[check-union] Database connection configured:', !!process.env.POSTGRES_URL);

    const [union] = await db
      .select({ id: unions.id, publishedAt: unions.publishedAt })
      .from(unions)
      .where(eq(unions.slug, slug))
      .limit(1);

    console.log('[check-union] Query result:', union ? 'found' : 'not found');

    // Check if union exists and is published
    if (!union || !union.publishedAt) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json({ exists: true }, { status: 200 });
  } catch (error) {
    console.error('[check-union] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      postgresUrlPrefix: process.env.POSTGRES_URL?.substring(0, 20) + '...',
    });
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 });
  }
}
