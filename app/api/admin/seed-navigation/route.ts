import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unions, navigationItems } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { seedDefaultNavigation } from '@/lib/db/seed-navigation';

export async function POST() {
  try {
    const user = await getUser();
    if (!user || user.role !== 'webmaster') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all unions that don't have any navigation items
    const allUnions = await db.select({ id: unions.id }).from(unions);

    const unionsWithNav = await db
      .select({ unionId: navigationItems.unionId })
      .from(navigationItems)
      .groupBy(navigationItems.unionId);

    const unionsWithNavSet = new Set(unionsWithNav.map((u) => u.unionId));
    const unionsToSeed = allUnions.filter((u) => !unionsWithNavSet.has(u.id));

    let seeded = 0;
    let failed = 0;

    for (const union of unionsToSeed) {
      try {
        await seedDefaultNavigation(union.id);
        seeded++;
      } catch (error) {
        console.error(`Failed to seed navigation for union ${union.id}:`, error);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      total: allUnions.length,
      alreadySeeded: allUnions.length - unionsToSeed.length,
      seeded,
      failed,
    });
  } catch (error) {
    console.error('Error seeding navigation:', error);
    return NextResponse.json(
      { error: 'Failed to seed navigation' },
      { status: 500 }
    );
  }
}
