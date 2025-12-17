import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unionExecutives, unions } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { unionId } = await request.json();

    if (!unionId) {
      return NextResponse.json(
        { error: 'Union ID is required' },
        { status: 400 }
      );
    }

    // Verify union exists
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, unionId))
      .limit(1);

    if (!union) {
      return NextResponse.json(
        { error: 'Union not found' },
        { status: 404 }
      );
    }

    // Get executives ordered by sortOrder
    const executives = await db
      .select()
      .from(unionExecutives)
      .where(eq(unionExecutives.unionId, unionId))
      .orderBy(asc(unionExecutives.sortOrder), asc(unionExecutives.createdAt));

    return NextResponse.json({
      success: true,
      executives,
    });
  } catch (error) {
    console.error('Error fetching executives:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
