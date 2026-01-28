import { db } from './drizzle';
import { users, unions, members, posts, unionExecutives, elections, electionQuestions, electionOptions } from './schema';
import { hashPassword } from '@/lib/auth/session';
import { eq, and } from 'drizzle-orm';

// 100 realistic mock users with Canadian names
const mockUsers = [
  // First batch - common Canadian names
  { firstName: 'James', lastName: 'MacDonald', email: 'james.macdonald.atu@gmail.com' },
  { firstName: 'Emily', lastName: 'Thompson', email: 'emily.thompson.atu@outlook.com' },
  { firstName: 'Michael', lastName: 'Chen', email: 'michael.chen.atu@yahoo.ca' },
  { firstName: 'Sarah', lastName: 'Martin', email: 'sarah.martin.atu@gmail.com' },
  { firstName: 'David', lastName: 'Wilson', email: 'david.wilson.atu@hotmail.com' },
  { firstName: 'Jessica', lastName: 'Brown', email: 'jessica.brown.atu@gmail.com' },
  { firstName: 'Christopher', lastName: 'Lee', email: 'christopher.lee.atu@outlook.com' },
  { firstName: 'Ashley', lastName: 'Taylor', email: 'ashley.taylor.atu@yahoo.ca' },
  { firstName: 'Matthew', lastName: 'Anderson', email: 'matthew.anderson.atu@gmail.com' },
  { firstName: 'Amanda', lastName: 'White', email: 'amanda.white.atu@hotmail.com' },
  // 11-20
  { firstName: 'Daniel', lastName: 'Harris', email: 'daniel.harris.atu@gmail.com' },
  { firstName: 'Jennifer', lastName: 'Clark', email: 'jennifer.clark.atu@outlook.com' },
  { firstName: 'Andrew', lastName: 'Lewis', email: 'andrew.lewis.atu@yahoo.ca' },
  { firstName: 'Stephanie', lastName: 'Robinson', email: 'stephanie.robinson.atu@gmail.com' },
  { firstName: 'Joshua', lastName: 'Walker', email: 'joshua.walker.atu@hotmail.com' },
  { firstName: 'Nicole', lastName: 'Hall', email: 'nicole.hall.atu@gmail.com' },
  { firstName: 'Ryan', lastName: 'Young', email: 'ryan.young.atu@outlook.com' },
  { firstName: 'Megan', lastName: 'King', email: 'megan.king.atu@yahoo.ca' },
  { firstName: 'Brandon', lastName: 'Wright', email: 'brandon.wright.atu@gmail.com' },
  { firstName: 'Lauren', lastName: 'Scott', email: 'lauren.scott.atu@hotmail.com' },
  // 21-30
  { firstName: 'Kevin', lastName: 'Green', email: 'kevin.green.atu@gmail.com' },
  { firstName: 'Rachel', lastName: 'Baker', email: 'rachel.baker.atu@outlook.com' },
  { firstName: 'Justin', lastName: 'Adams', email: 'justin.adams.atu@yahoo.ca' },
  { firstName: 'Samantha', lastName: 'Nelson', email: 'samantha.nelson.atu@gmail.com' },
  { firstName: 'Tyler', lastName: 'Mitchell', email: 'tyler.mitchell.atu@hotmail.com' },
  { firstName: 'Rebecca', lastName: 'Perez', email: 'rebecca.perez.atu@gmail.com' },
  { firstName: 'Patrick', lastName: 'Roberts', email: 'patrick.roberts.atu@outlook.com' },
  { firstName: 'Heather', lastName: 'Turner', email: 'heather.turner.atu@yahoo.ca' },
  { firstName: 'Brian', lastName: 'Phillips', email: 'brian.phillips.atu@gmail.com' },
  { firstName: 'Kimberly', lastName: 'Campbell', email: 'kimberly.campbell.atu@hotmail.com' },
  // 31-40
  { firstName: 'Jason', lastName: 'Parker', email: 'jason.parker.atu@gmail.com' },
  { firstName: 'Michelle', lastName: 'Evans', email: 'michelle.evans.atu@outlook.com' },
  { firstName: 'Eric', lastName: 'Edwards', email: 'eric.edwards.atu@yahoo.ca' },
  { firstName: 'Lisa', lastName: 'Collins', email: 'lisa.collins.atu@gmail.com' },
  { firstName: 'Jeffrey', lastName: 'Stewart', email: 'jeffrey.stewart.atu@hotmail.com' },
  { firstName: 'Angela', lastName: 'Sanchez', email: 'angela.sanchez.atu@gmail.com' },
  { firstName: 'Mark', lastName: 'Morris', email: 'mark.morris.atu@outlook.com' },
  { firstName: 'Christina', lastName: 'Rogers', email: 'christina.rogers.atu@yahoo.ca' },
  { firstName: 'Steven', lastName: 'Reed', email: 'steven.reed.atu@gmail.com' },
  { firstName: 'Melissa', lastName: 'Cook', email: 'melissa.cook.atu@hotmail.com' },
  // 41-50
  { firstName: 'Joseph', lastName: 'Morgan', email: 'joseph.morgan.atu@gmail.com' },
  { firstName: 'Laura', lastName: 'Bell', email: 'laura.bell.atu@outlook.com' },
  { firstName: 'Timothy', lastName: 'Murphy', email: 'timothy.murphy.atu@yahoo.ca' },
  { firstName: 'Amy', lastName: 'Bailey', email: 'amy.bailey.atu@gmail.com' },
  { firstName: 'Benjamin', lastName: 'Rivera', email: 'benjamin.rivera.atu@hotmail.com' },
  { firstName: 'Tiffany', lastName: 'Cooper', email: 'tiffany.cooper.atu@gmail.com' },
  { firstName: 'Jonathan', lastName: 'Richardson', email: 'jonathan.richardson.atu@outlook.com' },
  { firstName: 'Brittany', lastName: 'Cox', email: 'brittany.cox.atu@yahoo.ca' },
  { firstName: 'Nathan', lastName: 'Howard', email: 'nathan.howard.atu@gmail.com' },
  { firstName: 'Elizabeth', lastName: 'Ward', email: 'elizabeth.ward.atu@hotmail.com' },
  // 51-60
  { firstName: 'Adam', lastName: 'Torres', email: 'adam.torres.atu@gmail.com' },
  { firstName: 'Victoria', lastName: 'Peterson', email: 'victoria.peterson.atu@outlook.com' },
  { firstName: 'Aaron', lastName: 'Gray', email: 'aaron.gray.atu@yahoo.ca' },
  { firstName: 'Catherine', lastName: 'Ramirez', email: 'catherine.ramirez.atu@gmail.com' },
  { firstName: 'Sean', lastName: 'James', email: 'sean.james.atu@hotmail.com' },
  { firstName: 'Danielle', lastName: 'Watson', email: 'danielle.watson.atu@gmail.com' },
  { firstName: 'Kyle', lastName: 'Brooks', email: 'kyle.brooks.atu@outlook.com' },
  { firstName: 'Natalie', lastName: 'Kelly', email: 'natalie.kelly.atu@yahoo.ca' },
  { firstName: 'Derek', lastName: 'Sanders', email: 'derek.sanders.atu@gmail.com' },
  { firstName: 'Vanessa', lastName: 'Price', email: 'vanessa.price.atu@hotmail.com' },
  // 61-70
  { firstName: 'Gregory', lastName: 'Bennett', email: 'gregory.bennett.atu@gmail.com' },
  { firstName: 'Amber', lastName: 'Wood', email: 'amber.wood.atu@outlook.com' },
  { firstName: 'Scott', lastName: 'Barnes', email: 'scott.barnes.atu@yahoo.ca' },
  { firstName: 'Shannon', lastName: 'Ross', email: 'shannon.ross.atu@gmail.com' },
  { firstName: 'Travis', lastName: 'Henderson', email: 'travis.henderson.atu@hotmail.com' },
  { firstName: 'Kelly', lastName: 'Coleman', email: 'kelly.coleman.atu@gmail.com' },
  { firstName: 'Jeremy', lastName: 'Jenkins', email: 'jeremy.jenkins.atu@outlook.com' },
  { firstName: 'Erin', lastName: 'Perry', email: 'erin.perry.atu@yahoo.ca' },
  { firstName: 'Jesse', lastName: 'Powell', email: 'jesse.powell.atu@gmail.com' },
  { firstName: 'Courtney', lastName: 'Long', email: 'courtney.long.atu@hotmail.com' },
  // 71-80
  { firstName: 'Chad', lastName: 'Patterson', email: 'chad.patterson.atu@gmail.com' },
  { firstName: 'Crystal', lastName: 'Hughes', email: 'crystal.hughes.atu@outlook.com' },
  { firstName: 'Marcus', lastName: 'Flores', email: 'marcus.flores.atu@yahoo.ca' },
  { firstName: 'Monica', lastName: 'Washington', email: 'monica.washington.atu@gmail.com' },
  { firstName: 'Phillip', lastName: 'Butler', email: 'phillip.butler.atu@hotmail.com' },
  { firstName: 'Erica', lastName: 'Simmons', email: 'erica.simmons.atu@gmail.com' },
  { firstName: 'Corey', lastName: 'Foster', email: 'corey.foster.atu@outlook.com' },
  { firstName: 'Allison', lastName: 'Gonzales', email: 'allison.gonzales.atu@yahoo.ca' },
  { firstName: 'Shane', lastName: 'Bryant', email: 'shane.bryant.atu@gmail.com' },
  { firstName: 'Kristin', lastName: 'Alexander', email: 'kristin.alexander.atu@hotmail.com' },
  // 81-90
  { firstName: 'Dustin', lastName: 'Russell', email: 'dustin.russell.atu@gmail.com' },
  { firstName: 'Lindsey', lastName: 'Griffin', email: 'lindsey.griffin.atu@outlook.com' },
  { firstName: 'Brett', lastName: 'Diaz', email: 'brett.diaz.atu@yahoo.ca' },
  { firstName: 'Kayla', lastName: 'Hayes', email: 'kayla.hayes.atu@gmail.com' },
  { firstName: 'Randy', lastName: 'Myers', email: 'randy.myers.atu@hotmail.com' },
  { firstName: 'Diana', lastName: 'Ford', email: 'diana.ford.atu@gmail.com' },
  { firstName: 'Trevor', lastName: 'Hamilton', email: 'trevor.hamilton.atu@outlook.com' },
  { firstName: 'Cynthia', lastName: 'Graham', email: 'cynthia.graham.atu@yahoo.ca' },
  { firstName: 'Keith', lastName: 'Sullivan', email: 'keith.sullivan.atu@gmail.com' },
  { firstName: 'Veronica', lastName: 'Wallace', email: 'veronica.wallace.atu@hotmail.com' },
  // 91-100
  { firstName: 'Derrick', lastName: 'Woods', email: 'derrick.woods.atu@gmail.com' },
  { firstName: 'Brooke', lastName: 'Cole', email: 'brooke.cole.atu@outlook.com' },
  { firstName: 'Wesley', lastName: 'West', email: 'wesley.west.atu@yahoo.ca' },
  { firstName: 'Cassandra', lastName: 'Jordan', email: 'cassandra.jordan.atu@gmail.com' },
  { firstName: 'Mitchell', lastName: 'Owens', email: 'mitchell.owens.atu@hotmail.com' },
  { firstName: 'Jacqueline', lastName: 'Reynolds', email: 'jacqueline.reynolds.atu@gmail.com' },
  { firstName: 'Carl', lastName: 'Fisher', email: 'carl.fisher.atu@outlook.com' },
  { firstName: 'Patricia', lastName: 'Ellis', email: 'patricia.ellis.atu@yahoo.ca' },
  { firstName: 'Gabriel', lastName: 'Harrison', email: 'gabriel.harrison.atu@gmail.com' },
  { firstName: 'Olivia', lastName: 'Gibson', email: 'olivia.gibson.atu@hotmail.com' },
];

// Canadian cities and provinces
const canadianLocations = [
  { city: 'Toronto', province: 'Ontario', postalPrefix: 'M' },
  { city: 'Vancouver', province: 'British Columbia', postalPrefix: 'V' },
  { city: 'Montreal', province: 'Quebec', postalPrefix: 'H' },
  { city: 'Calgary', province: 'Alberta', postalPrefix: 'T' },
  { city: 'Edmonton', province: 'Alberta', postalPrefix: 'T' },
  { city: 'Ottawa', province: 'Ontario', postalPrefix: 'K' },
  { city: 'Winnipeg', province: 'Manitoba', postalPrefix: 'R' },
  { city: 'Mississauga', province: 'Ontario', postalPrefix: 'L' },
  { city: 'Brampton', province: 'Ontario', postalPrefix: 'L' },
  { city: 'Hamilton', province: 'Ontario', postalPrefix: 'L' },
];

// Transit job titles
const jobTitles = [
  'Bus Operator',
  'Streetcar Operator',
  'Subway Operator',
  'Light Rail Operator',
  'Transit Mechanic',
  'Vehicle Technician',
  'Transit Supervisor',
  'Dispatcher',
  'Station Collector',
  'Maintenance Worker',
  'Bus Driver',
  'Para-Transit Driver',
  'Community Bus Driver',
];

// Departments
const departments = [
  'Operations',
  'Maintenance',
  'Vehicle Services',
  'Customer Service',
  'Scheduling',
  'Training',
  'Safety',
];

// Shifts
const shifts = ['Day Shift', 'Night Shift', 'Split Shift', 'Rotating', 'Spare Board'];

// Generate realistic phone number
function generatePhone(areaCode: string): string {
  const exchange = Math.floor(Math.random() * 900) + 100;
  const subscriber = Math.floor(Math.random() * 9000) + 1000;
  return `+1 ${areaCode}-${exchange}-${subscriber}`;
}

// Generate postal code
function generatePostalCode(prefix: string): string {
  const letters = 'ABCEGHJKLMNPRSTVWXYZ';
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const n1 = Math.floor(Math.random() * 10);
  const n2 = Math.floor(Math.random() * 10);
  return `${prefix}${n1}${l1} ${n2}${l2}${Math.floor(Math.random() * 10)}`;
}

// Generate member ID
function generateMemberId(index: number): string {
  return `ATU1587-${String(index + 1001).padStart(5, '0')}`;
}

// Generate seniority number
function generateSeniorityNumber(index: number): string {
  return String(Math.floor(Math.random() * 5000) + 1);
}

// Generate random date within range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Area codes by province
const areaCodes: Record<string, string[]> = {
  'Ontario': ['416', '647', '437', '905', '289', '365', '613', '343', '519', '226'],
  'British Columbia': ['604', '778', '236', '250'],
  'Quebec': ['514', '438', '450', '579'],
  'Alberta': ['403', '587', '780', '825'],
  'Manitoba': ['204', '431'],
};

// News posts for ATU 1587
const newsPosts = [
  {
    title: 'Contract Negotiations Update - January 2026',
    content: `<p>Dear Members,</p>
<p>We are pleased to provide an update on the ongoing contract negotiations with the Transit Authority. Your bargaining committee has been meeting regularly with management over the past several weeks.</p>
<p><strong>Key points of discussion include:</strong></p>
<ul>
<li>Wage increases to keep pace with inflation</li>
<li>Improved health and dental benefits</li>
<li>Better scheduling flexibility</li>
<li>Enhanced safety protocols</li>
</ul>
<p>We remain committed to securing a fair contract that recognizes your hard work and dedication. The next negotiation session is scheduled for February 5th.</p>
<p>In solidarity,<br/>ATU 1587 Executive Board</p>`,
    isPrivate: false,
    isPinned: true,
  },
  {
    title: 'Safety Alert: Winter Driving Conditions',
    content: `<p>With winter weather upon us, we want to remind all members to exercise extra caution during their shifts.</p>
<p><strong>Safety Tips:</strong></p>
<ul>
<li>Perform thorough pre-trip inspections</li>
<li>Allow extra stopping distance</li>
<li>Report any dangerous road conditions immediately</li>
<li>Ensure defrosters and wipers are working properly</li>
</ul>
<p>If you encounter unsafe conditions, contact dispatch immediately. Your safety is our top priority.</p>`,
    isPrivate: false,
    isPinned: false,
  },
  {
    title: 'Retirement Celebration: Brother Mike Johnson',
    content: `<p>Please join us in celebrating Brother Mike Johnson's retirement after 35 years of dedicated service!</p>
<p><strong>Details:</strong></p>
<ul>
<li>Date: Saturday, February 15th, 2026</li>
<li>Time: 6:00 PM - 10:00 PM</li>
<li>Location: Riverside Community Hall</li>
</ul>
<p>Light refreshments will be served. RSVP to the union office by February 10th.</p>
<p>Congratulations, Mike!</p>`,
    isPrivate: false,
    isPinned: false,
  },
  {
    title: 'Grievance Committee Report - Q4 2025',
    content: `<p>The Grievance Committee is pleased to report on our activities for the fourth quarter of 2025.</p>
<p><strong>Summary:</strong></p>
<ul>
<li>Total grievances filed: 23</li>
<li>Grievances resolved favorably: 18</li>
<li>Grievances in arbitration: 3</li>
<li>Pending grievances: 2</li>
</ul>
<p>Notable wins include overturning two unjust terminations and securing back pay for overtime violations.</p>
<p>If you believe your rights have been violated, please contact your steward immediately.</p>`,
    isPrivate: true,
    isPinned: false,
  },
  {
    title: 'New Member Orientation - March 2026',
    content: `<p>Welcome to all our new members! We are hosting an orientation session to help you understand your union rights and benefits.</p>
<p><strong>When:</strong> Saturday, March 7th, 2026, 10:00 AM - 12:00 PM</p>
<p><strong>Where:</strong> Union Hall, Meeting Room A</p>
<p><strong>Topics Covered:</strong></p>
<ul>
<li>Your collective agreement rights</li>
<li>How to file a grievance</li>
<li>Union benefits and services</li>
<li>Getting involved in the union</li>
</ul>
<p>Light breakfast provided. Please RSVP to the union office.</p>`,
    isPrivate: false,
    isPinned: false,
  },
  {
    title: 'Annual General Meeting Notice',
    content: `<p>Notice is hereby given that the Annual General Meeting of ATU Local 1587 will be held:</p>
<p><strong>Date:</strong> Sunday, March 15th, 2026</p>
<p><strong>Time:</strong> 2:00 PM</p>
<p><strong>Location:</strong> Union Hall, Main Auditorium</p>
<p><strong>Agenda:</strong></p>
<ol>
<li>Call to Order</li>
<li>Reading and Adoption of Minutes</li>
<li>Financial Report</li>
<li>Executive Board Reports</li>
<li>Old Business</li>
<li>New Business</li>
<li>Good and Welfare</li>
<li>Adjournment</li>
</ol>
<p>All members in good standing are encouraged to attend.</p>`,
    isPrivate: false,
    isPinned: true,
  },
  {
    title: 'Member Assistance Program Reminder',
    content: `<p>We want to remind all members about our confidential Member Assistance Program (MAP).</p>
<p>If you or a family member is struggling with:</p>
<ul>
<li>Stress or anxiety</li>
<li>Depression</li>
<li>Substance abuse</li>
<li>Family issues</li>
<li>Financial concerns</li>
</ul>
<p>Free, confidential counseling services are available 24/7 at 1-800-555-0199.</p>
<p>Remember, seeking help is a sign of strength, not weakness.</p>`,
    isPrivate: true,
    isPinned: false,
  },
  {
    title: 'Solidarity Message: Supporting Transit Workers Nationwide',
    content: `<p>ATU Local 1587 stands in solidarity with our brothers and sisters at ATU Local 113 in Toronto who are currently in contract negotiations.</p>
<p>Transit workers across Canada deserve fair wages, safe working conditions, and respect for their essential work.</p>
<p>We encourage all members to show their support by:</p>
<ul>
<li>Sharing solidarity messages on social media</li>
<li>Attending support rallies when possible</li>
<li>Staying informed about their struggle</li>
</ul>
<p>An injury to one is an injury to all!</p>`,
    isPrivate: false,
    isPinned: false,
  },
];

// Union executives
const executivesData = [
  { name: 'Robert Williams', title: 'President', email: 'president@atu1587.org', phone: '+1 416-555-1001', sortOrder: 1 },
  { name: 'Maria Garcia', title: 'Vice President', email: 'vicepresident@atu1587.org', phone: '+1 416-555-1002', sortOrder: 2 },
  { name: 'Thomas Brown', title: 'Secretary-Treasurer', email: 'secretary@atu1587.org', phone: '+1 416-555-1003', sortOrder: 3 },
  { name: 'Linda Davis', title: 'Recording Secretary', email: 'recording@atu1587.org', phone: '+1 416-555-1004', sortOrder: 4 },
  { name: 'James Wilson', title: 'Chief Steward', email: 'chiefsteward@atu1587.org', phone: '+1 416-555-1005', sortOrder: 5 },
  { name: 'Patricia Martinez', title: 'Executive Board Member', email: 'board1@atu1587.org', phone: '+1 416-555-1006', sortOrder: 6 },
  { name: 'Michael Thompson', title: 'Executive Board Member', email: 'board2@atu1587.org', phone: '+1 416-555-1007', sortOrder: 7 },
  { name: 'Jennifer Anderson', title: 'Executive Board Member', email: 'board3@atu1587.org', phone: '+1 416-555-1008', sortOrder: 8 },
];

// Elections data
const electionsData = [
  {
    title: '2026 Executive Board Elections',
    description: 'Vote for your union leadership for the 2026-2028 term. All positions are elected for a two-year term.',
    slug: '2026-executive-board-elections',
    openTime: new Date('2026-03-01T09:00:00Z'),
    closeTime: new Date('2026-03-15T21:00:00Z'),
    status: 'draft',
    resultsVisibility: 'members',
    questions: [
      {
        questionText: 'President',
        questionType: 'multiple_choice',
        required: true,
        options: ['Robert Williams (Incumbent)', 'Daniel Johnson', 'Sandra Lee'],
      },
      {
        questionText: 'Vice President',
        questionType: 'multiple_choice',
        required: true,
        options: ['Maria Garcia (Incumbent)', 'Kevin O\'Brien', 'Angela Foster'],
      },
      {
        questionText: 'Secretary-Treasurer',
        questionType: 'multiple_choice',
        required: true,
        options: ['Thomas Brown (Incumbent)', 'Richard Chen', 'Michelle Wright'],
      },
      {
        questionText: 'Executive Board Members (Select 3)',
        questionType: 'multiple_answer',
        required: true,
        settings: { maxSelections: 3 },
        options: [
          'Patricia Martinez (Incumbent)',
          'Michael Thompson (Incumbent)',
          'Jennifer Anderson (Incumbent)',
          'David Kim',
          'Sarah Patel',
          'Marcus Johnson',
        ],
      },
    ],
  },
  {
    title: 'Strike Authorization Vote',
    description: 'Should the executive board be authorized to call a strike if a fair contract cannot be reached through negotiations?',
    slug: 'strike-authorization-2026',
    openTime: new Date('2026-02-15T09:00:00Z'),
    closeTime: new Date('2026-02-22T21:00:00Z'),
    status: 'draft',
    resultsVisibility: 'members',
    questions: [
      {
        questionText: 'Do you authorize the executive board to call a strike if necessary?',
        questionType: 'yes_no',
        required: true,
        options: ['Yes', 'No'],
      },
      {
        questionText: 'Please share any comments or concerns about potential strike action (optional)',
        questionType: 'text_long',
        required: false,
        options: [],
      },
    ],
  },
  {
    title: 'Bylaw Amendment Vote - Dues Increase',
    description: 'Proposed amendment to increase monthly dues by $5 to fund enhanced legal representation services.',
    slug: 'bylaw-amendment-dues-2026',
    openTime: new Date('2026-04-01T09:00:00Z'),
    closeTime: new Date('2026-04-15T21:00:00Z'),
    status: 'draft',
    resultsVisibility: 'members',
    questions: [
      {
        questionText: 'Do you approve the proposed $5 monthly dues increase?',
        questionType: 'yes_no',
        required: true,
        options: ['Yes', 'No'],
      },
    ],
  },
];

async function seedATU1587Data() {
  console.log('Starting ATU 1587 comprehensive seed...\n');

  // Hash a common password for all mock users
  const passwordHash = await hashPassword('MockUser123!');

  // Find the existing ATU 1587 union
  const union = await db.query.unions.findFirst({
    where: eq(unions.slug, 'atu1587'),
  });

  if (!union) {
    console.error('ERROR: ATU 1587 union (slug: atu1587) not found!');
    console.error('Please make sure the union exists before running this seed.');
    process.exit(1);
  }

  console.log(`Found union: ${union.name} (id: ${union.id}, slug: ${union.slug})\n`);

  // Get the admin/owner for createdBy references
  const [ownerMember] = await db
    .select()
    .from(members)
    .where(and(eq(members.unionId, union.id), eq(members.role, 'owner')))
    .limit(1);

  if (!ownerMember) {
    console.error('No owner found for this union. Please ensure the union has an owner.');
    process.exit(1);
  }

  const createdBy = ownerMember.userId;
  console.log(`Using owner user ID: ${createdBy} for createdBy references\n`);

  // ==================== SEED MEMBERS ====================
  console.log('=== Seeding Members ===');

  let membersCreated = 0;
  let membersSkipped = 0;

  // Distribution: 70% approved/active, 10% pending, 10% inactive, 5% retired, 5% rejected
  const statusDistribution = (index: number): { status: string; membershipStatus: string; votingStatus: string } => {
    if (index < 70) {
      // 70% approved/active
      return { status: 'approved', membershipStatus: 'active', votingStatus: 'eligible' };
    } else if (index < 80) {
      // 10% pending
      return { status: 'pending', membershipStatus: 'active', votingStatus: 'ineligible' };
    } else if (index < 90) {
      // 10% inactive
      return { status: 'approved', membershipStatus: 'inactive', votingStatus: 'ineligible' };
    } else if (index < 95) {
      // 5% retired
      return { status: 'approved', membershipStatus: 'retired', votingStatus: 'ineligible' };
    } else {
      // 5% rejected
      return { status: 'rejected', membershipStatus: 'inactive', votingStatus: 'ineligible' };
    }
  };

  for (let i = 0; i < mockUsers.length; i++) {
    const mockUser = mockUsers[i];

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, mockUser.email),
    });

    if (existingUser) {
      console.log(`  Skipping ${mockUser.email} - already exists`);
      membersSkipped++;
      continue;
    }

    // Random location
    const location = canadianLocations[Math.floor(Math.random() * canadianLocations.length)];
    const areaCodeList = areaCodes[location.province] || ['416'];
    const areaCode = areaCodeList[Math.floor(Math.random() * areaCodeList.length)];

    // Status distribution
    const { status, membershipStatus, votingStatus } = statusDistribution(i);

    // Random employment details
    const jobTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    const shift = shifts[Math.floor(Math.random() * shifts.length)];
    const employmentStatuses = ['full-time', 'full-time', 'full-time', 'part-time', 'casual'];
    const employmentStatus = employmentStatuses[Math.floor(Math.random() * employmentStatuses.length)];

    // Random dates
    const startDate = randomDate(new Date('2010-01-01'), new Date('2024-12-31'));
    const joinDate = randomDate(startDate, new Date('2025-12-31'));
    const dateOfBirth = randomDate(new Date('1960-01-01'), new Date('2000-01-01'));

    // Create the user
    const [user] = await db
      .insert(users)
      .values({
        name: `${mockUser.firstName} ${mockUser.lastName}`,
        email: mockUser.email,
        passwordHash: passwordHash,
        role: 'member',
        emailVerified: status === 'approved', // Only verified if approved
      })
      .returning();

    // Create the member record
    await db.insert(members).values({
      userId: user.id,
      unionId: union.id,
      role: 'member',
      status,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      personalEmail: mockUser.email,
      cellPhone: generatePhone(areaCode),
      city: location.city,
      province: location.province,
      postalCode: generatePostalCode(location.postalPrefix),
      dateOfBirth,
      employer: 'City Transit Authority',
      jobTitle,
      department,
      shift,
      employmentStatus,
      startDateWithEmployer: startDate,
      memberId: generateMemberId(i),
      membershipStatus,
      votingStatus,
      joinDate,
      seniorityNumber: generateSeniorityNumber(i),
      allowEmails: true,
      allowTextMessages: Math.random() > 0.2, // 80% opt-in
      allowPhoneCalls: Math.random() > 0.3, // 70% opt-in
      preferredLanguage: 'en',
      communicationPreference: ['email', 'email', 'email', 'text', 'phone'][Math.floor(Math.random() * 5)],
      isDelinquent: Math.random() < 0.05, // 5% delinquent
    });

    console.log(`  Created: ${mockUser.firstName} ${mockUser.lastName} (${status}/${membershipStatus})`);
    membersCreated++;
  }

  console.log(`\n  Members created: ${membersCreated}`);
  console.log(`  Members skipped: ${membersSkipped}\n`);

  // ==================== SEED NEWS POSTS ====================
  console.log('=== Seeding News Posts ===');

  let postsCreated = 0;

  for (const postData of newsPosts) {
    // Check if post with same title exists
    const existingPost = await db.query.posts.findFirst({
      where: and(eq(posts.unionId, union.id), eq(posts.title, postData.title)),
    });

    if (existingPost) {
      console.log(`  Skipping post: "${postData.title}" - already exists`);
      continue;
    }

    await db.insert(posts).values({
      unionId: union.id,
      title: postData.title,
      content: postData.content,
      isPrivate: postData.isPrivate,
      isPinned: postData.isPinned,
      authorType: 'union',
      createdBy,
    });

    console.log(`  Created post: "${postData.title}"`);
    postsCreated++;
  }

  console.log(`\n  Posts created: ${postsCreated}\n`);

  // ==================== SEED UNION EXECUTIVES ====================
  console.log('=== Seeding Union Executives ===');

  let executivesCreated = 0;

  for (const exec of executivesData) {
    // Check if executive with same name exists
    const existingExec = await db.query.unionExecutives.findFirst({
      where: and(eq(unionExecutives.unionId, union.id), eq(unionExecutives.name, exec.name)),
    });

    if (existingExec) {
      console.log(`  Skipping executive: "${exec.name}" - already exists`);
      continue;
    }

    await db.insert(unionExecutives).values({
      unionId: union.id,
      name: exec.name,
      title: exec.title,
      email: exec.email,
      phone: exec.phone,
      sortOrder: exec.sortOrder,
      createdBy,
    });

    console.log(`  Created executive: ${exec.name} - ${exec.title}`);
    executivesCreated++;
  }

  console.log(`\n  Executives created: ${executivesCreated}\n`);

  // ==================== SEED ELECTIONS ====================
  console.log('=== Seeding Elections ===');

  let electionsCreated = 0;

  for (const electionData of electionsData) {
    // Check if election with same slug exists
    const existingElection = await db.query.elections.findFirst({
      where: and(eq(elections.unionId, union.id), eq(elections.slug, electionData.slug)),
    });

    if (existingElection) {
      console.log(`  Skipping election: "${electionData.title}" - already exists`);
      continue;
    }

    // Create the election
    const [election] = await db
      .insert(elections)
      .values({
        unionId: union.id,
        title: electionData.title,
        description: electionData.description,
        slug: electionData.slug,
        openTime: electionData.openTime,
        closeTime: electionData.closeTime,
        status: electionData.status,
        resultsVisibility: electionData.resultsVisibility,
        timezone: 'America/Toronto',
        createdBy,
      })
      .returning();

    console.log(`  Created election: "${electionData.title}"`);

    // Create questions and options
    for (let qIndex = 0; qIndex < electionData.questions.length; qIndex++) {
      const questionData = electionData.questions[qIndex];

      const [question] = await db
        .insert(electionQuestions)
        .values({
          electionId: election.id,
          questionText: questionData.questionText,
          questionType: questionData.questionType,
          order: qIndex,
          required: questionData.required,
          settings: questionData.settings || null,
        })
        .returning();

      console.log(`    - Question: "${questionData.questionText}"`);

      // Create options for multiple choice/answer questions
      if (questionData.options && questionData.options.length > 0 &&
          ['multiple_choice', 'multiple_answer', 'yes_no'].includes(questionData.questionType)) {
        for (let oIndex = 0; oIndex < questionData.options.length; oIndex++) {
          await db.insert(electionOptions).values({
            questionId: question.id,
            optionText: questionData.options[oIndex],
            order: oIndex,
          });
        }
        console.log(`      Options: ${questionData.options.join(', ')}`);
      }
    }

    electionsCreated++;
  }

  console.log(`\n  Elections created: ${electionsCreated}\n`);

  // ==================== SUMMARY ====================
  console.log('===========================================');
  console.log('           SEED COMPLETE SUMMARY          ');
  console.log('===========================================');
  console.log(`Union: ${union.name} (slug: ${union.slug})`);
  console.log(`Members created: ${membersCreated}`);
  console.log(`Members skipped: ${membersSkipped}`);
  console.log(`News posts created: ${postsCreated}`);
  console.log(`Union executives created: ${executivesCreated}`);
  console.log(`Elections created: ${electionsCreated}`);
  console.log('===========================================');
  console.log('\nAll mock users have password: MockUser123!');
}

seedATU1587Data()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('\nSeed process finished. Exiting...');
    process.exit(0);
  });
