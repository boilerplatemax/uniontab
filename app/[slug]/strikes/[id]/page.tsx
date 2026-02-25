import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users, strikes, picketZones, picketShifts, picketAssignments, strikeAnnouncements, strikeIncidents, strikeResources } from '@/lib/db/schema';
import { eq, and, count, desc } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { StrikeDetailContent } from './strike-detail-content';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  return union;
}

async function getMembership(unionId: number, userId: number) {
  const [membership] = await db
    .select({
      user: users,
      member: members
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(and(eq(members.unionId, unionId), eq(members.userId, userId)))
    .limit(1);

  return membership;
}

async function getPendingMembersCount(unionId: number) {
  const [result] = await db
    .select({ value: count() })
    .from(members)
    .where(and(eq(members.unionId, unionId), eq(members.status, 'pending')));

  return Number(result.value);
}

async function getStrikeById(strikeId: number) {
  return await db.query.strikes.findFirst({
    where: eq(strikes.id, strikeId),
    with: {
      zones: {
        with: {
          shifts: {
            with: {
              assignments: {
                with: {
                  member: {
                    with: {
                      user: {
                        columns: { id: true, name: true, email: true }
                      }
                    }
                  }
                }
              }
            },
            orderBy: [picketShifts.date, picketShifts.startTime],
          }
        }
      },
      announcements: {
        orderBy: [desc(strikeAnnouncements.createdAt)],
        with: {
          createdBy: {
            columns: { id: true, name: true }
          }
        }
      },
      incidents: {
        orderBy: [desc(strikeIncidents.createdAt)],
        with: {
          member: {
            with: {
              user: {
                columns: { id: true, name: true }
              }
            }
          },
          zone: true,
          resolvedBy: {
            columns: { id: true, name: true }
          }
        }
      },
      resources: {
        orderBy: [strikeResources.sortOrder],
        with: {
          createdBy: {
            columns: { id: true, name: true }
          }
        }
      },
      createdBy: {
        columns: { id: true, name: true, email: true }
      },
    },
  });
}

async function handleSignOut() {
  'use server';
  (await cookies()).delete('session');
}

export default async function StrikeDetailPage({
  params
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const strikeId = parseInt(id);
  const user = await getUser();

  if (!user) {
    redirect(`/${slug}/sign-in`);
  }

  if (isNaN(strikeId)) {
    notFound();
  }

  const union = await getUnionBySlug(slug);
  if (!union) {
    notFound();
  }

  const membership = await getMembership(union.id, user.id);
  if (!membership || membership.member.status !== 'approved') {
    redirect(`/${slug}`);
  }

  const strike = await getStrikeById(strikeId);
  if (!strike || strike.unionId !== union.id) {
    notFound();
  }

  const isOwnerOrAdmin = membership.member.role === 'owner' || membership.member.role === 'admin';

  return (
    <StrikeDetailContent
        union={union}
        user={membership.user}
        role={membership.member.role}
        memberId={membership.member.id}
        strike={strike}
        isAdmin={isOwnerOrAdmin}
    />
  );
}
