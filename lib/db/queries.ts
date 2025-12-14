import { desc, and, eq, ne, isNull, gte, lte, or, sql } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, members, unions, users, dues, duesReceipts, duesCycles, grievances, grievanceComments, grievanceAttachments, grievanceCategories, GrievanceStatus } from './schema';
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

export async function getDuesCyclesForUnion(unionId: number) {
  return await db.query.duesCycles.findMany({
    where: eq(duesCycles.unionId, unionId),
    with: {
      createdBy: {
        columns: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [desc(duesCycles.createdAt)]
  });
}

// Grievance Tracking Queries

/**
 * Get all grievances for a union with member and assignment information
 */
export async function getGrievancesForUnion(unionId: number, filters?: {
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: number;
  memberId?: number;
  includeArchived?: boolean;
}) {
  let conditions = [eq(grievances.unionId, unionId)];

  // Exclude draft grievances by default (members' drafts should only be visible to them)
  if (!filters?.status) {
    conditions.push(ne(grievances.status, GrievanceStatus.DRAFT));
  } else if (filters.status) {
    conditions.push(eq(grievances.status, filters.status));
  }

  // Exclude archived grievances by default unless explicitly requested
  if (!filters?.includeArchived) {
    conditions.push(eq(grievances.isArchived, false));
  }

  if (filters?.priority) {
    conditions.push(eq(grievances.priority, filters.priority));
  }
  if (filters?.category) {
    conditions.push(eq(grievances.category, filters.category));
  }
  if (filters?.assignedTo) {
    conditions.push(eq(grievances.assignedTo, filters.assignedTo));
  }
  if (filters?.memberId) {
    conditions.push(eq(grievances.memberId, filters.memberId));
  }

  return await db.query.grievances.findMany({
    where: and(...conditions),
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
      assignedTo: {
        columns: {
          id: true,
          name: true,
          email: true
        }
      },
      createdBy: {
        columns: {
          id: true,
          name: true
        }
      },
      comments: {
        orderBy: [desc(grievanceComments.createdAt)],
        limit: 3
      },
      attachments: {
        orderBy: [desc(grievanceAttachments.createdAt)]
      }
    },
    orderBy: [desc(grievances.updatedAt)]
  });
}

/**
 * Get grievances for a specific member
 */
export async function getGrievancesForMember(memberId: number, filters?: {
  status?: string;
  priority?: string;
  category?: string;
}) {
  let conditions = [eq(grievances.memberId, memberId)];

  if (filters?.status) {
    conditions.push(eq(grievances.status, filters.status));
  }
  if (filters?.priority) {
    conditions.push(eq(grievances.priority, filters.priority));
  }
  if (filters?.category) {
    conditions.push(eq(grievances.category, filters.category));
  }

  return await db.query.grievances.findMany({
    where: and(...conditions),
    with: {
      assignedTo: {
        columns: {
          id: true,
          name: true
        }
      },
      comments: {
        where: eq(grievanceComments.isInternal, false), // Only show public comments to members
        orderBy: [desc(grievanceComments.createdAt)]
      },
      attachments: {
        orderBy: [desc(grievanceAttachments.createdAt)]
      }
    },
    orderBy: [desc(grievances.updatedAt)]
  });
}

/**
 * Get a single grievance by ID with all related data
 */
export async function getGrievanceById(grievanceId: number, includeInternal: boolean = false) {
  const grievance = await db.query.grievances.findFirst({
    where: eq(grievances.id, grievanceId),
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
      assignedTo: {
        columns: {
          id: true,
          name: true,
          email: true
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
      },
      comments: {
        where: includeInternal ? undefined : eq(grievanceComments.isInternal, false),
        with: {
          createdBy: {
            columns: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: [desc(grievanceComments.createdAt)]
      },
      attachments: {
        with: {
          uploadedBy: {
            columns: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [desc(grievanceAttachments.createdAt)]
      }
    }
  });

  return grievance;
}

/**
 * Get comments for a specific grievance
 */
export async function getGrievanceComments(grievanceId: number, includeInternal: boolean = false) {
  return await db.query.grievanceComments.findMany({
    where: includeInternal
      ? eq(grievanceComments.grievanceId, grievanceId)
      : and(eq(grievanceComments.grievanceId, grievanceId), eq(grievanceComments.isInternal, false)),
    with: {
      createdBy: {
        columns: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: [desc(grievanceComments.createdAt)]
  });
}

/**
 * Get attachments for a specific grievance
 */
export async function getGrievanceAttachments(grievanceId: number) {
  return await db.query.grievanceAttachments.findMany({
    where: eq(grievanceAttachments.grievanceId, grievanceId),
    with: {
      uploadedBy: {
        columns: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [desc(grievanceAttachments.createdAt)]
  });
}

/**
 * Get grievance categories for a union
 */
export async function getGrievanceCategories(unionId: number) {
  return await db.query.grievanceCategories.findMany({
    where: and(
      eq(grievanceCategories.unionId, unionId),
      eq(grievanceCategories.isActive, true)
    ),
    orderBy: [grievanceCategories.sortOrder, grievanceCategories.name]
  });
}

/**
 * Get grievance summary statistics for a union
 */
export async function getGrievanceSummaryForUnion(unionId: number) {
  // Exclude archived grievances and draft grievances from summary
  // Draft grievances are not counted since they haven't been submitted yet
  const allGrievances = await db
    .select()
    .from(grievances)
    .where(
      and(
        eq(grievances.unionId, unionId),
        ne(grievances.status, GrievanceStatus.DRAFT),
        eq(grievances.isArchived, false)
      )
    );

  const statusCounts = allGrievances.reduce((acc, g) => {
    acc[g.status] = (acc[g.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityCounts = allGrievances.reduce((acc, g) => {
    const priority = g.priority || 'medium';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: allGrievances.length,
    statusCounts,
    priorityCounts,
    draftCount: statusCounts['draft'] || 0,
    submittedCount: statusCounts['submitted'] || 0,
    assignedCount: statusCounts['assigned'] || 0,
    underReviewCount: statusCounts['under_review'] || 0,
    awaitingResponseCount: statusCounts['awaiting_response'] || 0,
    resolvedCount: statusCounts['resolved'] || 0,
    closedCount: statusCounts['closed'] || 0,
    urgentCount: priorityCounts['urgent'] || 0,
    highCount: priorityCounts['high'] || 0,
    mediumCount: priorityCounts['medium'] || 0,
    lowCount: priorityCounts['low'] || 0
  };
}

/**
 * Get grievances assigned to a specific user
 */
export async function getGrievancesAssignedToUser(userId: number) {
  return await db.query.grievances.findMany({
    where: eq(grievances.assignedTo, userId),
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
      comments: {
        orderBy: [desc(grievanceComments.createdAt)],
        limit: 3
      }
    },
    orderBy: [desc(grievances.updatedAt)]
  });
}

// Notification count functions
export async function getGrievanceNotificationCount(unionId: number, userId: number, isAdmin: boolean) {
  try {
    // Get the member
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, unionId),
        eq(members.userId, userId)
      ))
      .limit(1);

    if (!membership) {
      return 0;
    }

    if (isAdmin) {
      // For admins: count submitted/unassigned grievances
      const unassignedCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(grievances)
        .where(and(
          eq(grievances.unionId, unionId),
          or(
            eq(grievances.status, 'submitted'),
            and(
              eq(grievances.status, 'assigned'),
              isNull(grievances.assignedTo)
            )
          )
        ));

      return Number(unassignedCount[0]?.count || 0);
    } else {
      // For members: count their grievances with recent updates (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(grievances)
        .where(and(
          eq(grievances.unionId, unionId),
          eq(grievances.memberId, membership.id),
          gte(grievances.updatedAt, sevenDaysAgo),
          or(
            eq(grievances.status, 'assigned'),
            eq(grievances.status, 'under_review'),
            eq(grievances.status, 'awaiting_response')
          )
        ));

      return Number(recentCount[0]?.count || 0);
    }
  } catch (error) {
    console.error('Error getting grievance notification count:', error);
    return 0;
  }
}

export async function getStrikeNotificationCount(unionId: number, userId: number, isAdmin: boolean) {
  try {
    const { strikes } = await import('./schema');
    
    // Count active strikes for all users
    const activeCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(strikes)
      .where(and(
        eq(strikes.unionId, unionId),
        eq(strikes.status, 'active')
      ));

    return Number(activeCount[0]?.count || 0);
  } catch (error) {
    console.error('Error getting strike notification count:', error);
    return 0;
  }
}
