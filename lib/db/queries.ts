import { desc, and, eq, isNull, gte, lte } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, members, unions, users, dues, duesReceipts } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(unions)
    .where(eq(unions.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  unionId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(unions)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(unions.id, unionId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      unionId: members.unionId
    })
    .from(users)
    .leftJoin(members, eq(users.id, members.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.members.findFirst({
    where: eq(members.userId, user.id),
    with: {
      union: {
        with: {
          members: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.union || null;
}

export async function getUserMembership() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const [membership] = await db
    .select({
      member: members,
      union: unions
    })
    .from(members)
    .innerJoin(unions, eq(members.unionId, unions.id))
    .where(eq(members.userId, user.id))
    .limit(1);

  return membership || null;
}

export async function isUserOwner(): Promise<boolean> {
  const membership = await getUserMembership();
  return membership?.member.role === 'owner';
}

// Dues Tracking Queries

/**
 * Get all dues for a union with member information
 */
export async function getDuesForUnion(unionId: number) {
  return await db.query.dues.findMany({
    where: eq(dues.unionId, unionId),
    with: {
      member: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      createdBy: {
        columns: {
          id: true,
          name: true
        }
      },
      updatedBy: {
        columns: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [desc(dues.dueDate)]
  });
}

/**
 * Get dues for a specific member
 */
export async function getDuesForMember(memberId: number) {
  return await db.query.dues.findMany({
    where: eq(dues.memberId, memberId),
    orderBy: [desc(dues.dueDate)]
  });
}

/**
 * Get delinquent members for a union
 */
export async function getDelinquentMembers(unionId: number) {
  return await db.query.members.findMany({
    where: and(
      eq(members.unionId, unionId),
      eq(members.isDelinquent, true)
    ),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

/**
 * Get a single dues record by ID
 */
export async function getDuesById(duesId: number) {
  return await db.query.dues.findFirst({
    where: eq(dues.id, duesId),
    with: {
      member: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  });
}

/**
 * Get payment history (receipts) for a member
 */
export async function getPaymentHistoryForMember(memberId: number) {
  return await db.query.duesReceipts.findMany({
    where: eq(duesReceipts.memberId, memberId),
    with: {
      dues: true,
      generatedBy: {
        columns: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [desc(duesReceipts.generatedAt)]
  });
}

/**
 * Get receipts for a specific dues record
 */
export async function getReceiptsForDues(duesId: number) {
  return await db.query.duesReceipts.findMany({
    where: eq(duesReceipts.duesId, duesId),
    orderBy: [desc(duesReceipts.generatedAt)]
  });
}

/**
 * Get dues summary statistics for a union
 */
export async function getDuesSummaryForUnion(unionId: number) {
  const allDues = await db
    .select()
    .from(dues)
    .where(eq(dues.unionId, unionId));

  const totalDues = allDues.reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = allDues.reduce((sum, d) => sum + d.paidAmount, 0);
  const totalUnpaid = allDues.filter(d => d.paymentStatus === 'unpaid').reduce((sum, d) => sum + d.amount, 0);
  const totalOverdue = allDues.filter(d => d.paymentStatus === 'unpaid' && new Date(d.dueDate) < new Date()).reduce((sum, d) => sum + d.amount, 0);

  return {
    totalDues,
    totalPaid,
    totalUnpaid,
    totalOverdue,
    paidCount: allDues.filter(d => d.paymentStatus === 'paid').length,
    unpaidCount: allDues.filter(d => d.paymentStatus === 'unpaid').length,
    partialCount: allDues.filter(d => d.paymentStatus === 'partial').length,
    overdueCount: allDues.filter(d => d.paymentStatus === 'unpaid' && new Date(d.dueDate) < new Date()).length
  };
}

export async function getMemberDues(memberId: number) {
  return await db.query.dues.findMany({
    where: eq(dues.memberId, memberId),
    orderBy: [desc(dues.dueDate)]
  });
}

export async function getMemberDuesWithReceipts(memberId: number) {
  const memberDues = await db.query.dues.findMany({
    where: eq(dues.memberId, memberId),
    orderBy: [desc(dues.dueDate)]
  });

  // Get receipts for each dues record
  const duesWithReceipts = await Promise.all(
    memberDues.map(async (duesRecord) => {
      const receipts = await db.query.duesReceipts.findMany({
        where: eq(duesReceipts.duesId, duesRecord.id),
        orderBy: [desc(duesReceipts.generatedAt)]
      });
      return {
        ...duesRecord,
        receipts
      };
    })
  );

  return duesWithReceipts;
}
