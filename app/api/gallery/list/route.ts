import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { files, members, unions } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    // Fetch the union by slug
    const [union] = await db
      .select({ id: unions.id })
      .from(unions)
      .where(eq(unions.slug, slug))
      .limit(1);

    if (!union) {
      return NextResponse.json({ error: 'Union not found' }, { status: 404 });
    }

    // Fetch gallery images ordered by sortOrder
    const galleryFiles = await db
      .select({
        id: files.id,
        url: files.fileUrl,
        name: files.name,
        type: files.fileType,
        size: files.fileSize,
        sortOrder: files.sortOrder,
        createdAt: files.createdAt,
      })
      .from(files)
      .where(
        and(
          eq(files.unionId, union.id),
          eq(files.category, 'gallery')
        )
      )
      .orderBy(asc(files.sortOrder), asc(files.createdAt));

    return NextResponse.json({ files: galleryFiles });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
