import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unionContactInfo, unions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

    // Get contact info
    const [contactInfo] = await db
      .select()
      .from(unionContactInfo)
      .where(eq(unionContactInfo.unionId, unionId))
      .limit(1);

    return NextResponse.json({
      success: true,
      contactInfo: contactInfo || null,
    });
  } catch (error) {
    console.error('Error fetching contact info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
