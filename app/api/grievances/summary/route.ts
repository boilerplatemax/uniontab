import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getGrievanceSummaryForUnion } from '@/lib/db/queries';

export async function GET(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unionId = searchParams.get('unionId');

    if (!unionId) {
      return NextResponse.json(
        { error: 'unionId is required' },
        { status: 400 }
      );
    }

    const summary = await getGrievanceSummaryForUnion(parseInt(unionId));

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error fetching grievance summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
