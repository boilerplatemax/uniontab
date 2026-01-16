import { db } from './drizzle';
import { events, members } from './schema';
import { eq, and } from 'drizzle-orm';

// Seed events for ATU 123 (union id: 6) for February 2026
async function seedATU123Events() {
  const unionId = 6;

  // Get the first admin/owner member to use as createdBy
  const [adminMember] = await db
    .select()
    .from(members)
    .where(
      and(
        eq(members.unionId, unionId),
        eq(members.role, 'owner')
      )
    )
    .limit(1);

  if (!adminMember) {
    console.error('No owner found for union id 6. Please ensure the union has an owner.');
    process.exit(1);
  }

  const createdBy = adminMember.userId;

  console.log(`Creating events for ATU 123 (union id: ${unionId}) with createdBy: ${createdBy}`);

  const eventsData = [
    // 1. Monthly General Membership Meeting - recurring monthly
    {
      unionId,
      title: 'February General Membership Meeting',
      description: 'Monthly meeting for all members to discuss union business, hear reports from the executive board, and vote on pending motions. Light refreshments will be served.',
      location: 'Union Hall - Main Auditorium, 1250 Transit Way',
      startDate: new Date('2026-02-05T00:00:00'),
      endDate: new Date('2026-02-05T00:00:00'),
      startTime: '18:00',
      endTime: '20:00',
      isAllDay: false,
      isPrivate: false,
      category: 'meeting',
      createdBy,
    },
    // 2. Executive Board Meeting - recurring monthly
    {
      unionId,
      title: 'Executive Board Meeting',
      description: 'Monthly executive board meeting to discuss strategic planning, budget review, and upcoming initiatives. Board members only.',
      location: 'Union Hall - Conference Room A',
      startDate: new Date('2026-02-03T00:00:00'),
      endDate: new Date('2026-02-03T00:00:00'),
      startTime: '17:00',
      endTime: '19:00',
      isAllDay: false,
      isPrivate: true,
      category: 'meeting',
      createdBy,
    },
    // 3. Black History Month Celebration
    {
      unionId,
      title: 'Black History Month Celebration',
      description: 'Join us in celebrating Black History Month with a special program featuring guest speakers, performances, and a potluck dinner. Bring a dish to share!',
      location: 'Community Center - 456 Unity Street',
      startDate: new Date('2026-02-14T00:00:00'),
      endDate: new Date('2026-02-14T00:00:00'),
      startTime: '12:00',
      endTime: '16:00',
      isAllDay: false,
      isPrivate: false,
      category: 'social',
      createdBy,
    },
    // 4. Valentine's Day Member Social
    {
      unionId,
      title: "Valentine's Day Social Mixer",
      description: "A fun evening for members and their families to mingle and enjoy refreshments. There will be games, music, and prizes. Kids welcome!",
      location: 'Riverside Banquet Hall',
      startDate: new Date('2026-02-14T00:00:00'),
      endDate: new Date('2026-02-14T00:00:00'),
      startTime: '18:30',
      endTime: '21:30',
      isAllDay: false,
      isPrivate: false,
      category: 'social',
      createdBy,
    },
    // 5. Presidents Day Holiday - Office Closed
    {
      unionId,
      title: "Presidents Day - Office Closed",
      description: 'The Union Hall and offices will be closed in observance of Presidents Day. Regular operations resume February 17th.',
      location: 'Union Hall',
      startDate: new Date('2026-02-16T00:00:00'),
      endDate: new Date('2026-02-16T00:00:00'),
      startTime: null,
      endTime: null,
      isAllDay: true,
      isPrivate: false,
      category: 'holiday',
      createdBy,
    },
    // 6. Steward Training Workshop - 2 day event
    {
      unionId,
      title: 'Steward Training Workshop',
      description: 'Comprehensive two-day training for new and experienced stewards. Topics include grievance handling, contract interpretation, member representation, and labor law updates. Lunch provided both days.',
      location: 'Union Hall - Training Center',
      startDate: new Date('2026-02-07T00:00:00'),
      endDate: new Date('2026-02-08T00:00:00'),
      startTime: '09:00',
      endTime: '16:00',
      isAllDay: false,
      isPrivate: true,
      category: 'training',
      createdBy,
    },
    // 7. Safety Committee Meeting - recurring
    {
      unionId,
      title: 'Safety Committee Meeting',
      description: 'Monthly safety committee meeting to review workplace incidents, discuss safety concerns, and plan safety initiatives.',
      location: 'Union Hall - Conference Room B',
      startDate: new Date('2026-02-10T00:00:00'),
      endDate: new Date('2026-02-10T00:00:00'),
      startTime: '14:00',
      endTime: '15:30',
      isAllDay: false,
      isPrivate: true,
      category: 'meeting',
      createdBy,
    },
    // 8. Contract Negotiation Town Hall
    {
      unionId,
      title: 'Contract Negotiation Town Hall',
      description: 'Important town hall meeting to discuss the upcoming contract negotiations. Your bargaining committee will present their strategy and gather member input on priorities.',
      location: 'Convention Center - Hall C',
      startDate: new Date('2026-02-12T00:00:00'),
      endDate: new Date('2026-02-12T00:00:00'),
      startTime: '18:00',
      endTime: '20:30',
      isAllDay: false,
      isPrivate: false,
      category: 'meeting',
      createdBy,
    },
    // 9. New Member Orientation
    {
      unionId,
      title: 'New Member Orientation',
      description: 'Welcome session for new members to learn about union history, membership benefits, and how to get involved. Meet your steward and fellow members.',
      location: 'Union Hall - Room 101',
      startDate: new Date('2026-02-18T00:00:00'),
      endDate: new Date('2026-02-18T00:00:00'),
      startTime: '17:30',
      endTime: '19:00',
      isAllDay: false,
      isPrivate: false,
      category: 'training',
      createdBy,
    },
    // 10. Women's Committee Meeting
    {
      unionId,
      title: "Women's Committee Meeting",
      description: "Monthly meeting of the Women's Committee to plan events, discuss workplace issues, and organize for Women's History Month in March.",
      location: 'Union Hall - Conference Room A',
      startDate: new Date('2026-02-19T00:00:00'),
      endDate: new Date('2026-02-19T00:00:00'),
      startTime: '12:00',
      endTime: '13:00',
      isAllDay: false,
      isPrivate: true,
      category: 'meeting',
      createdBy,
    },
    // 11. Financial Literacy Workshop
    {
      unionId,
      title: 'Financial Literacy Workshop',
      description: 'Free financial education workshop covering retirement planning, budgeting, debt management, and understanding your pension benefits. Open to members and their spouses.',
      location: 'Community Library - Meeting Room',
      startDate: new Date('2026-02-21T00:00:00'),
      endDate: new Date('2026-02-21T00:00:00'),
      startTime: '10:00',
      endTime: '12:00',
      isAllDay: false,
      isPrivate: false,
      category: 'training',
      createdBy,
    },
    // 12. Grievance Committee Review
    {
      unionId,
      title: 'Grievance Committee Review',
      description: 'Weekly grievance committee meeting to review pending cases, discuss strategies, and assign representatives.',
      location: 'Union Hall - Conference Room B',
      startDate: new Date('2026-02-24T00:00:00'),
      endDate: new Date('2026-02-24T00:00:00'),
      startTime: '15:00',
      endTime: '17:00',
      isAllDay: false,
      isPrivate: true,
      category: 'meeting',
      createdBy,
    },
    // 13. Community Service Day
    {
      unionId,
      title: 'Community Service Day - Food Bank Volunteer',
      description: 'Join fellow members for a morning of community service at the Regional Food Bank. Help sort and pack food for families in need. T-shirts provided!',
      location: 'Regional Food Bank - 789 Charity Lane',
      startDate: new Date('2026-02-22T00:00:00'),
      endDate: new Date('2026-02-22T00:00:00'),
      startTime: '08:00',
      endTime: '12:00',
      isAllDay: false,
      isPrivate: false,
      category: 'social',
      createdBy,
    },
    // 14. Political Action Committee Meeting
    {
      unionId,
      title: 'Political Action Committee Meeting',
      description: 'Monthly PAC meeting to discuss endorsements, legislative updates, and voter registration initiatives.',
      location: 'Union Hall - Conference Room A',
      startDate: new Date('2026-02-25T00:00:00'),
      endDate: new Date('2026-02-25T00:00:00'),
      startTime: '17:00',
      endTime: '18:30',
      isAllDay: false,
      isPrivate: true,
      category: 'meeting',
      createdBy,
    },
    // 15. End of Month Social - Game Night
    {
      unionId,
      title: 'Member Game Night',
      description: 'Casual game night for members to unwind and socialize. Board games, card games, and video games available. Snacks and beverages provided. Bring your own games to share!',
      location: 'Union Hall - Recreation Room',
      startDate: new Date('2026-02-27T00:00:00'),
      endDate: new Date('2026-02-27T00:00:00'),
      startTime: '19:00',
      endTime: '22:00',
      isAllDay: false,
      isPrivate: false,
      category: 'social',
      createdBy,
    },
  ];

  // Insert all events
  const insertedEvents = await db.insert(events).values(eventsData).returning();

  console.log(`Successfully created ${insertedEvents.length} events for ATU 123`);
  console.log('Events created:');
  insertedEvents.forEach((event, index) => {
    console.log(`  ${index + 1}. ${event.title} - ${event.startDate.toDateString()}`);
  });
}

seedATU123Events()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
