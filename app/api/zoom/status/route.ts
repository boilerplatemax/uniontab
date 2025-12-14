import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { isZoomConfigured } from '@/lib/zoom/zoom-api';

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      configured: isZoomConfigured(),
    });
  } catch (error) {
    console.error('Error checking Zoom status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
