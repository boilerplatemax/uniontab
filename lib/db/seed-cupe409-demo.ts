import { db } from './drizzle';
import {
  users, unions, members, posts, unionExecutives,
  events, files, fileCategories, navigationItems,
  unionContactInfo,
} from './schema';
import { hashPassword } from '@/lib/auth/session';
import { eq, and, sql } from 'drizzle-orm';

const DEMO_UNION_ID = 27;
const DEMO_SLUG = 'cupe409';
const DEMO_OWNER_EMAIL = 'info@cupe409.ca';
const DEMO_PASSWORD = 'UnionDemo1!';

// School support staff job titles for SD40
const jobTitles = [
  'Education Assistant',
  'Child and Youth Care Worker',
  'Indigenous Support Worker',
  'Custodian',
  'Clerical Worker',
  'IT Technician',
  'Crossing Guard',
  'Noon Hour Supervisor',
  'Library Support Worker',
  'Accounting Clerk',
  'Utility Worker',
  'Skilled Trades Worker',
  'Food Services Worker',
  'Administrative Secretary',
  'Student Support Worker',
];

const schools = [
  'Lord Kelvin Elementary',
  'Glenbrook Middle School',
  'Queensborough Middle School',
  'New Westminster Secondary School',
  'École Qayqayt Elementary',
  'Herbert Spencer Elementary',
  'Howay Elementary',
  'Massey Theatre',
  'Richard McBride Elementary',
  'Sapperton Elementary',
  'Twelfth Avenue Elementary',
  'District Office SD40',
];

const mockMembers = [
  { firstName: 'Karen', lastName: 'Mitchell', email: 'karen.mitchell.cupe@gmail.com' },
  { firstName: 'David', lastName: 'Tran', email: 'david.tran.cupe@outlook.com' },
  { firstName: 'Susan', lastName: 'Ramirez', email: 'susan.ramirez.cupe@gmail.com' },
  { firstName: 'James', lastName: 'Dhaliwal', email: 'james.dhaliwal.cupe@hotmail.com' },
  { firstName: 'Angela', lastName: 'Wong', email: 'angela.wong.cupe@gmail.com' },
  { firstName: 'Michael', lastName: 'Friesen', email: 'michael.friesen.cupe@outlook.com' },
  { firstName: 'Patricia', lastName: 'Sharma', email: 'patricia.sharma.cupe@gmail.com' },
  { firstName: 'Robert', lastName: 'Sandhu', email: 'robert.sandhu.cupe@yahoo.ca' },
  { firstName: 'Linda', lastName: 'Park', email: 'linda.park.cupe@gmail.com' },
  { firstName: 'William', lastName: 'Nguyen', email: 'william.nguyen.cupe@hotmail.com' },
  { firstName: 'Barbara', lastName: 'Chen', email: 'barbara.chen.cupe@gmail.com' },
  { firstName: 'Richard', lastName: 'Johal', email: 'richard.johal.cupe@outlook.com' },
  { firstName: 'Mary', lastName: 'Gustafson', email: 'mary.gustafson.cupe@gmail.com' },
  { firstName: 'Thomas', lastName: 'Kim', email: 'thomas.kim.cupe@yahoo.ca' },
  { firstName: 'Deborah', lastName: 'Leblanc', email: 'deborah.leblanc.cupe@gmail.com' },
  { firstName: 'Christopher', lastName: 'Patel', email: 'christopher.patel.cupe@hotmail.com' },
  { firstName: 'Sandra', lastName: 'Johnson', email: 'sandra.johnson.cupe@gmail.com' },
  { firstName: 'Paul', lastName: 'Williams', email: 'paul.williams.cupe@outlook.com' },
  { firstName: 'Jessica', lastName: 'Brown', email: 'jessica.brown.cupe@gmail.com' },
  { firstName: 'Kenneth', lastName: 'Taylor', email: 'kenneth.taylor.cupe@yahoo.ca' },
  { firstName: 'Cynthia', lastName: 'Anderson', email: 'cynthia.anderson.cupe@gmail.com' },
  { firstName: 'George', lastName: 'Thomas', email: 'george.thomas.cupe@hotmail.com' },
  { firstName: 'Amy', lastName: 'Jackson', email: 'amy.jackson.cupe@gmail.com' },
  { firstName: 'Mark', lastName: 'White', email: 'mark.white.cupe@outlook.com' },
  { firstName: 'Dorothy', lastName: 'Harris', email: 'dorothy.harris.cupe@gmail.com' },
  { firstName: 'Donald', lastName: 'Martin', email: 'donald.martin.cupe@yahoo.ca' },
  { firstName: 'Michelle', lastName: 'Garcia', email: 'michelle.garcia.cupe@gmail.com' },
  { firstName: 'Steven', lastName: 'Martinez', email: 'steven.martinez.cupe@hotmail.com' },
  { firstName: 'Carol', lastName: 'Robinson', email: 'carol.robinson.cupe@gmail.com' },
  { firstName: 'Edward', lastName: 'Clark', email: 'edward.clark.cupe@outlook.com' },
];

const newsPosts = [
  {
    title: 'Welcome to CUPE Local 409 — Member Portal',
    content: `<p>Dear Members,</p>
<p>Welcome to the CUPE Local 409 online member portal — your digital hub for staying connected, informed, and engaged with your union.</p>
<p>CUPE Local 409 is proud to represent over 500 support staff members working across New Westminster School District 40. Our members are the backbone of public education — from Education Assistants and Child and Youth Care Workers to Custodians, IT Technicians, and Noon Hour Supervisors.</p>
<p><strong>What you can do here:</strong></p>
<ul>
<li>Read the latest news and updates from your executive</li>
<li>View upcoming events and general meetings</li>
<li>Access important documents including our Collective Agreement</li>
<li>Connect with your site representative</li>
<li>Submit and track workplace concerns</li>
</ul>
<p>As Partners in Public Education, we recognize that our work influences every aspect of a student's educational experience. Together, we are stronger.</p>
<p>In solidarity,<br/>CUPE Local 409 Executive</p>`,
    isPrivate: false,
    isPinned: true,
    imageUrl: null,
  },
  {
    title: 'Collective Agreement 2022–2025: What You Need to Know',
    content: `<p>The CUPE Local 409 Collective Agreement covering 2022 to 2025 has been signed and is now available for all members to download in the Files section.</p>
<p><strong>Key provisions in our agreement include:</strong></p>
<ul>
<li>Wage increases across the agreement term</li>
<li>Enhanced health and dental benefits</li>
<li>Improved job security language</li>
<li>Strengthened seniority provisions for layoff and recall</li>
<li>Paid professional development days</li>
<li>Improved provisions for Education Assistants working with complex needs students</li>
</ul>
<p>We encourage all members to read the agreement carefully. Knowledge of your rights is your best protection. If you have questions about any provision, contact your Site Representative or the union office at info@cupe409.ca.</p>
<p>A printed copy is available at the union office: Unit 218 – 800 McBride Blvd., New Westminster.</p>`,
    isPrivate: false,
    isPinned: true,
    imageUrl: null,
  },
  {
    title: 'Truth and Reconciliation — Our Commitment as a Union',
    content: `<p>CUPE Local 409 acknowledges that we work and live on the traditional, unceded territories of the Qayqayt First Nation (meaning "Resting Place, River Peoples") and the Coast Salish and Musqueam peoples.</p>
<p>As a union committed to Social Justice, Trust, Respect, Self-Awareness, and Self-Reflection, we recognize our obligation to advance truth and reconciliation in our workplaces and communities.</p>
<p><strong>What this means for our members:</strong></p>
<ul>
<li>Supporting Indigenous Support Workers in our schools</li>
<li>Advocating for culturally safe and responsive educational environments</li>
<li>Ensuring our union activities reflect an awareness of colonization and its ongoing impacts</li>
<li>Participating in National Day for Truth and Reconciliation events</li>
</ul>
<p>Our Indigenous Support Workers play a vital role in our school communities. We are proud to advocate for their working conditions and the important work they do.</p>
<p>For resources on truth and reconciliation in the workplace, visit the CUPE BC website at cupe.bc.ca.</p>`,
    isPrivate: false,
    isPinned: false,
    imageUrl: null,
  },
  {
    title: 'Health & Safety: Your Right to a Safe Workplace',
    content: `<p>Every CUPE 409 member has the right to a safe and healthy workplace. As school support workers, you may encounter specific hazards — from workplace violence and threats to ergonomic risks and exposure to communicable diseases.</p>
<p><strong>Know your rights:</strong></p>
<ul>
<li><strong>Right to Know:</strong> You have the right to know about hazards in your workplace</li>
<li><strong>Right to Participate:</strong> You have the right to participate in identifying and resolving health and safety issues</li>
<li><strong>Right to Refuse:</strong> You have the right to refuse work you reasonably believe is unsafe</li>
</ul>
<p><strong>If you experience a workplace health and safety issue:</strong></p>
<ol>
<li>Report it to your supervisor immediately</li>
<li>Contact your site representative</li>
<li>Document the hazard in writing</li>
<li>Contact the union office if the issue is not resolved: info@cupe409.ca</li>
</ol>
<p>Health and Safety education and training courses are available through CUPE BC and our partner organizations. Contact the union office for upcoming training opportunities.</p>`,
    isPrivate: false,
    isPinned: false,
    imageUrl: null,
  },
  {
    title: 'Bursary Program — Applications Now Open',
    content: `<p>CUPE Local 409 is pleased to offer bursaries to support members and their dependents pursuing post-secondary education.</p>
<p>The CUPE Local 409 Bursary Program reflects our belief in lifelong learning and our commitment to the well-being of our members and their families.</p>
<p><strong>Eligibility:</strong></p>
<ul>
<li>Members in good standing with CUPE Local 409</li>
<li>Dependents of members in good standing</li>
<li>Applicants must be enrolled or accepted in a recognized post-secondary institution</li>
</ul>
<p><strong>How to Apply:</strong></p>
<p>Download the bursary application form from the Files section of this portal, complete it, and submit it to the union office with required supporting documents by the application deadline.</p>
<p>For questions, email info@cupe409.ca or call 778-791-0462.</p>`,
    isPrivate: false,
    isPinned: false,
    imageUrl: null,
  },
  {
    title: 'General Membership Meeting — March 2026',
    content: `<p>Notice is hereby given that a General Membership Meeting of CUPE Local 409 will be held:</p>
<p><strong>Date:</strong> Wednesday, March 18, 2026<br/>
<strong>Time:</strong> 4:30 PM – 6:30 PM<br/>
<strong>Location:</strong> New Westminster Secondary School — Library</p>
<p><strong>Agenda:</strong></p>
<ol>
<li>Call to order and Land Acknowledgement</li>
<li>Approval of agenda</li>
<li>Reading and adoption of previous minutes</li>
<li>Financial report</li>
<li>Executive committee reports</li>
<li>Grievance update (members only)</li>
<li>Health & Safety update</li>
<li>New business</li>
<li>Good and welfare</li>
<li>Adjournment</li>
</ol>
<p>All members in good standing are encouraged to attend. Light refreshments will be provided.</p>
<p>If you cannot attend in person and would like to arrange an accommodation, please contact info@cupe409.ca in advance.</p>`,
    isPrivate: false,
    isPinned: false,
    imageUrl: null,
  },
];

const executivesData = [
  { name: 'CUPE Local 409 President', title: 'President', email: 'info@cupe409.ca', phone: '778-791-0462', sortOrder: 1 },
  { name: 'CUPE Local 409 Vice-President', title: 'Vice-President', email: 'info@cupe409.ca', phone: '778-791-0462', sortOrder: 2 },
  { name: 'CUPE Local 409 Secretary-Treasurer', title: 'Secretary-Treasurer', email: 'info@cupe409.ca', phone: '778-791-0462', sortOrder: 3 },
  { name: 'CUPE Local 409 Recording Secretary', title: 'Recording Secretary', email: 'info@cupe409.ca', phone: '778-791-0462', sortOrder: 4 },
  { name: 'CUPE Local 409 Chief Steward', title: 'Chief Steward', email: 'CUPE-409grievancereps@outlook.com', phone: '778-791-0462', sortOrder: 5 },
  { name: 'CUPE Local 409 Sergeant-at-Arms', title: 'Sergeant-at-Arms', email: 'info@cupe409.ca', phone: '778-791-0462', sortOrder: 6 },
  { name: 'CUPE Local 409 Trustee', title: 'Trustee', email: 'info@cupe409.ca', phone: '778-791-0462', sortOrder: 7 },
];

const eventsData = [
  {
    title: 'General Membership Meeting — January 2026',
    description: 'Monthly general membership meeting. Hear reports from the executive, review upcoming negotiations, and discuss member priorities.',
    location: 'New Westminster Secondary School — Library',
    startDate: new Date('2026-01-21T00:00:00'),
    endDate: new Date('2026-01-21T00:00:00'),
    startTime: '16:30',
    endTime: '18:30',
    isAllDay: false,
    isPrivate: false,
    category: 'meeting',
  },
  {
    title: 'Executive Committee Meeting — January',
    description: 'Monthly executive committee meeting to review union business, finances, and member concerns.',
    location: 'Union Office — Unit 218, 800 McBride Blvd',
    startDate: new Date('2026-01-14T00:00:00'),
    endDate: new Date('2026-01-14T00:00:00'),
    startTime: '17:00',
    endTime: '19:00',
    isAllDay: false,
    isPrivate: true,
    category: 'meeting',
  },
  {
    title: 'Steward Training — Know Your Collective Agreement',
    description: 'Training session for site representatives and stewards on the key provisions of the CUPE 409 Collective Agreement 2022-2025. Topics: seniority, overtime, discipline procedures, and grievance timelines. Lunch provided.',
    location: 'CUPE Metro Office — Vancouver',
    startDate: new Date('2026-01-31T00:00:00'),
    endDate: new Date('2026-01-31T00:00:00'),
    startTime: '09:00',
    endTime: '15:00',
    isAllDay: false,
    isPrivate: true,
    category: 'training',
  },
  {
    title: 'General Membership Meeting — February 2026',
    description: 'Monthly general membership meeting. Financial report, executive updates, collective agreement review, and new business.',
    location: 'Glenbrook Middle School — Gymnasium',
    startDate: new Date('2026-02-18T00:00:00'),
    endDate: new Date('2026-02-18T00:00:00'),
    startTime: '16:30',
    endTime: '18:30',
    isAllDay: false,
    isPrivate: false,
    category: 'meeting',
  },
  {
    title: 'Family Day — Office Closed',
    description: 'CUPE Local 409 union office is closed in observance of Family Day.',
    location: '',
    startDate: new Date('2026-02-16T00:00:00'),
    endDate: new Date('2026-02-16T00:00:00'),
    startTime: '',
    endTime: '',
    isAllDay: true,
    isPrivate: false,
    category: 'holiday',
  },
  {
    title: 'General Membership Meeting — March 2026',
    description: 'Monthly general membership meeting. Hear updates on grievances, health & safety, and member assistance programs.',
    location: 'New Westminster Secondary School — Library',
    startDate: new Date('2026-03-18T00:00:00'),
    endDate: new Date('2026-03-18T00:00:00'),
    startTime: '16:30',
    endTime: '18:30',
    isAllDay: false,
    isPrivate: false,
    category: 'meeting',
  },
  {
    title: 'Health & Safety Committee Meeting',
    description: 'Joint Health & Safety Committee meeting with SD40 management. Review workplace incident reports, discuss outstanding safety concerns, and plan spring inspections.',
    location: 'SD40 District Office — Board Room',
    startDate: new Date('2026-03-05T00:00:00'),
    endDate: new Date('2026-03-05T00:00:00'),
    startTime: '15:30',
    endTime: '17:00',
    isAllDay: false,
    isPrivate: true,
    category: 'meeting',
  },
  {
    title: 'Good Friday — Office Closed',
    description: 'Union office closed for Good Friday statutory holiday.',
    location: '',
    startDate: new Date('2026-04-03T00:00:00'),
    endDate: new Date('2026-04-03T00:00:00'),
    startTime: '',
    endTime: '',
    isAllDay: true,
    isPrivate: false,
    category: 'holiday',
  },
  {
    title: 'General Membership Meeting — April 2026',
    description: 'Monthly general membership meeting including Annual General Meeting business: financial statements, executive reports, and election of officers for vacant positions.',
    location: 'New Westminster Secondary School — Library',
    startDate: new Date('2026-04-15T00:00:00'),
    endDate: new Date('2026-04-15T00:00:00'),
    startTime: '16:30',
    endTime: '19:00',
    isAllDay: false,
    isPrivate: false,
    category: 'meeting',
  },
  {
    title: 'CUPE BC Convention — Observer Seats Available',
    description: 'CUPE BC Annual Convention. Observer seats available for members interested in attending. Contact the union office to register. CUPE BC represents 100,000+ municipal, health, education, and social service workers across BC.',
    location: 'Victoria, BC',
    startDate: new Date('2026-04-29T00:00:00'),
    endDate: new Date('2026-05-02T00:00:00'),
    startTime: '09:00',
    endTime: '17:00',
    isAllDay: false,
    isPrivate: false,
    category: 'training',
  },
  {
    title: 'General Membership Meeting — May 2026',
    description: 'Monthly general membership meeting. End-of-year update, bursary announcements, and planning for next school year.',
    location: 'Glenbrook Middle School — Gymnasium',
    startDate: new Date('2026-05-20T00:00:00'),
    endDate: new Date('2026-05-20T00:00:00'),
    startTime: '16:30',
    endTime: '18:30',
    isAllDay: false,
    isPrivate: false,
    category: 'meeting',
  },
  {
    title: 'Victoria Day — Office Closed',
    description: 'Union office closed in observance of Victoria Day.',
    location: '',
    startDate: new Date('2026-05-18T00:00:00'),
    endDate: new Date('2026-05-18T00:00:00'),
    startTime: '',
    endTime: '',
    isAllDay: true,
    isPrivate: false,
    category: 'holiday',
  },
  {
    title: 'End-of-Year Member Appreciation BBQ',
    description: 'Annual end-of-year member appreciation event! Join fellow CUPE 409 members and their families for food, fun, and community. A great way to close out the school year together.',
    location: 'Moody Park — New Westminster',
    startDate: new Date('2026-06-13T00:00:00'),
    endDate: new Date('2026-06-13T00:00:00'),
    startTime: '12:00',
    endTime: '16:00',
    isAllDay: false,
    isPrivate: false,
    category: 'social',
  },
];

const filesData = [
  {
    name: 'CUPE Local 409 Collective Agreement 2022–2025',
    fileUrl: 'https://409.cupe.ca/wp-content/blogs.dir/417/2024/05/40-CUPE-L-409-Collective-Agreement-2022-2025-FINAL-signed.pdf',
    fileType: 'application/pdf',
    isPrivate: false,
    category: 'Collective Agreement',
  },
  {
    name: 'CUPE Local 409 Equality Statement',
    fileUrl: 'https://409.cupe.ca/equality-statement/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Policies',
  },
  {
    name: 'Bursary Application Form',
    fileUrl: 'https://409.cupe.ca/bursary-information/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Member Benefits',
  },
  {
    name: 'Health & Safety Resources',
    fileUrl: 'https://409.cupe.ca/health-and-safety/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Health & Safety',
  },
  {
    name: 'CUPE National — Member Resources',
    fileUrl: 'https://cupe.ca/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'CUPE Resources',
  },
  {
    name: 'CUPE BC — Member Resources',
    fileUrl: 'https://www.cupe.bc.ca/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'CUPE Resources',
  },
  {
    name: 'CUPE Metro (Vancouver District Council)',
    fileUrl: 'https://metro.cupe.ca/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'CUPE Resources',
  },
  {
    name: 'K-12 Presidents Council',
    fileUrl: 'http://bcschools.cupe.ca',
    fileType: 'text/html',
    isPrivate: false,
    category: 'CUPE Resources',
  },
  {
    name: 'BC Federation of Labour',
    fileUrl: 'http://www.bcfed.ca',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Labour Resources',
  },
  {
    name: 'New Westminster District & Labour Council',
    fileUrl: 'http://www.nwdlc.ca',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Labour Resources',
  },
  {
    name: 'New Westminster School District 40',
    fileUrl: 'http://newwestschools.ca/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Employer',
  },
];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePhone(): string {
  const areaCodes = ['604', '778', '236'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const exchange = Math.floor(Math.random() * 900) + 100;
  const subscriber = Math.floor(Math.random() * 9000) + 1000;
  return `+1 ${areaCode}-${exchange}-${subscriber}`;
}

function generateMemberId(index: number): string {
  return `CUPE409-${String(index + 1001).padStart(5, '0')}`;
}

async function seedCUPE409Demo() {
  console.log('Starting CUPE Local 409 demo seed...\n');

  // ==================== CREATE/VERIFY UNION ====================
  console.log('=== Setting up CUPE Local 409 union ===');

  const existingUnion = await db.query.unions.findFirst({
    where: eq(unions.slug, DEMO_SLUG),
  });

  let union: typeof unions.$inferSelect;

  if (existingUnion) {
    console.log(`Union already exists with id: ${existingUnion.id}`);
    const [updated] = await db
      .update(unions)
      .set({
        isDemo: true,
        publishedAt: existingUnion.publishedAt ?? new Date(),
        themeColor: '#004B8D',
      })
      .where(eq(unions.slug, DEMO_SLUG))
      .returning();
    union = updated;
    console.log(`Updated union (id: ${union.id})\n`);
  } else {
    try {
      const [created] = await db.execute(sql`
        INSERT INTO unions (
          id, name, slug, local_number, public_name, theme_color,
          about, email, phone, address, website, theme,
          published_at, is_demo, require_email_verification,
          created_at, updated_at
        ) OVERRIDING SYSTEM VALUE VALUES (
          ${DEMO_UNION_ID},
          ${'CUPE'},
          ${DEMO_SLUG},
          ${'409'},
          ${'CUPE Local 409'},
          ${'#004B8D'},
          ${'CUPE Local 409 represents over 500 support staff members working in New Westminster School District 40 — Partners in Public Education. Our members include Education Assistants, Child and Youth Care Workers, Indigenous Support Workers, Custodians, Clerical Workers, IT Technicians, Crossing Guards, Noon Hour Supervisors, Library Support Workers, and many more. We are committed to quality public education, safe workplaces, and fair working conditions for all our members. Our union acknowledges the traditional, unceded territories of the Qayqayt First Nation and the Coast Salish and Musqueam peoples.'},
          ${'info@cupe409.ca'},
          ${'778-791-0462'},
          ${'Unit 218 – 800 McBride Blvd., New Westminster, BC V3L 2B8'},
          ${'https://409.cupe.ca/'},
          ${'default'},
          ${new Date().toISOString()},
          ${true},
          ${false},
          ${new Date().toISOString()},
          ${new Date().toISOString()}
        ) RETURNING *
      `) as any;

      await db.execute(sql`SELECT setval('unions_id_seq', GREATEST((SELECT MAX(id) FROM unions), ${DEMO_UNION_ID}))`);

      union = created;
      console.log(`Created union with id: ${union.id}\n`);
    } catch (err: any) {
      console.log(`Could not insert with id=${DEMO_UNION_ID} (${err.message}), inserting with auto id...`);
      const [created] = await db
        .insert(unions)
        .values({
          name: 'CUPE',
          slug: DEMO_SLUG,
          localNumber: '409',
          publicName: 'CUPE Local 409',
          themeColor: '#004B8D',
          about: 'CUPE Local 409 represents over 500 support staff members working in New Westminster School District 40 — Partners in Public Education. Our members include Education Assistants, Child and Youth Care Workers, Indigenous Support Workers, Custodians, Clerical Workers, IT Technicians, Crossing Guards, Noon Hour Supervisors, Library Support Workers, and many more. We are committed to quality public education, safe workplaces, and fair working conditions for all our members. Our union acknowledges the traditional, unceded territories of the Qayqayt First Nation and the Coast Salish and Musqueam peoples.',
          email: 'info@cupe409.ca',
          phone: '778-791-0462',
          address: 'Unit 218 – 800 McBride Blvd., New Westminster, BC V3L 2B8',
          website: 'https://409.cupe.ca/',
          theme: 'default',
          publishedAt: new Date(),
          isDemo: true,
          requireEmailVerification: false,
        })
        .returning();
      union = created;
      console.log(`Created union with id: ${union.id}\n`);
    }
  }

  // ==================== CREATE OWNER USER ====================
  console.log('=== Creating owner user ===');

  let ownerUser: typeof users.$inferSelect;

  const existingOwner = await db.query.users.findFirst({
    where: eq(users.email, DEMO_OWNER_EMAIL),
  });

  if (existingOwner) {
    console.log(`Owner user already exists (id: ${existingOwner.id})`);
    ownerUser = existingOwner;
  } else {
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    const [created] = await db
      .insert(users)
      .values({
        name: 'CUPE 409 Admin',
        email: DEMO_OWNER_EMAIL,
        passwordHash,
        role: 'member',
        emailVerified: true,
      })
      .returning();
    ownerUser = created;
    console.log(`Created owner user (id: ${ownerUser.id})`);
  }

  const existingMembership = await db.query.members.findFirst({
    where: and(eq(members.userId, ownerUser.id), eq(members.unionId, union.id)),
  });

  if (existingMembership) {
    console.log(`Owner membership already exists`);
    if (existingMembership.role !== 'owner' || existingMembership.status !== 'approved') {
      await db.update(members).set({ role: 'owner', status: 'approved' }).where(eq(members.id, existingMembership.id));
    }
  } else {
    await db.insert(members).values({
      userId: ownerUser.id,
      unionId: union.id,
      role: 'owner',
      status: 'approved',
      firstName: 'CUPE 409',
      lastName: 'Admin',
      memberId: 'CUPE409-ADMIN',
      membershipStatus: 'active',
      votingStatus: 'eligible',
    } as any);
    console.log(`Created owner membership`);
  }
  console.log(`Login: ${DEMO_OWNER_EMAIL} / ${DEMO_PASSWORD}\n`);

  // ==================== SEED CONTACT INFO ====================
  console.log('=== Seeding contact info ===');
  const existingContact = await db.query.unionContactInfo.findFirst({
    where: eq(unionContactInfo.unionId, union.id),
  });
  if (!existingContact) {
    await db.insert(unionContactInfo).values({
      unionId: union.id,
      contactEmail: 'info@cupe409.ca',
      contactPhone: '778-791-0462',
      contactAddress: 'Unit 218 – 800 McBride Blvd., New Westminster, BC V3L 2B8',
      officeHours: 'Please call ahead to confirm hours.',
      contactFormEnabled: true,
      contactFormEmail: 'info@cupe409.ca',
    } as any);
    console.log('Contact info seeded');
  } else {
    console.log('Contact info already exists, skipping');
  }
  console.log();

  // ==================== SEED DEFAULT NAVIGATION ====================
  console.log('=== Seeding default navigation ===');
  const existingNav = await db.query.navigationItems.findFirst({
    where: eq(navigationItems.unionId, union.id),
  });

  if (!existingNav) {
    const defaultNavItems = [
      { label: 'News', builtInRoute: 'news', linkType: 'built_in_route', sortOrder: 1, visibility: 'public', isEnabled: true, isMandatory: false },
      { label: 'About', builtInRoute: 'about', linkType: 'built_in_route', sortOrder: 2, visibility: 'public', isEnabled: true, isMandatory: false },
      { label: 'Events', builtInRoute: 'events', linkType: 'built_in_route', sortOrder: 3, visibility: 'public', isEnabled: true, isMandatory: false },
      { label: 'Files', builtInRoute: 'files', linkType: 'built_in_route', sortOrder: 4, visibility: 'public', isEnabled: true, isMandatory: false },
      { label: 'Contact', builtInRoute: 'contact', linkType: 'built_in_route', sortOrder: 5, visibility: 'public', isEnabled: true, isMandatory: false },
    ];
    for (const item of defaultNavItems) {
      await db.insert(navigationItems).values({ unionId: union.id, ...item } as any);
    }
    console.log('Default navigation seeded');
  } else {
    console.log('Navigation already exists, skipping');
  }
  console.log();

  // ==================== SEED MEMBERS ====================
  console.log('=== Seeding mock members ===');

  const passwordHash = await hashPassword('MockUser123!');
  let membersCreated = 0;
  let membersSkipped = 0;

  const statusDistribution = (index: number) => {
    if (index < 22) return { status: 'approved', membershipStatus: 'active', votingStatus: 'eligible' };
    if (index < 26) return { status: 'pending', membershipStatus: 'active', votingStatus: 'ineligible' };
    if (index < 29) return { status: 'approved', membershipStatus: 'inactive', votingStatus: 'ineligible' };
    return { status: 'rejected', membershipStatus: 'inactive', votingStatus: 'ineligible' };
  };

  for (let i = 0; i < mockMembers.length; i++) {
    const m = mockMembers[i];
    const existing = await db.query.users.findFirst({ where: eq(users.email, m.email) });
    if (existing) {
      membersSkipped++;
      continue;
    }

    const { status, membershipStatus, votingStatus } = statusDistribution(i);
    const jobTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
    const worksite = schools[Math.floor(Math.random() * schools.length)];
    const startDate = randomDate(new Date('2008-01-01'), new Date('2024-06-30'));
    const joinDate = randomDate(startDate, new Date('2025-01-01'));
    const dateOfBirth = randomDate(new Date('1968-01-01'), new Date('2002-01-01'));

    const [user] = await db.insert(users).values({
      name: `${m.firstName} ${m.lastName}`,
      email: m.email,
      passwordHash,
      role: 'member',
      emailVerified: status === 'approved',
    }).returning();

    await db.insert(members).values({
      userId: user.id,
      unionId: union.id,
      role: 'member',
      status,
      firstName: m.firstName,
      lastName: m.lastName,
      personalEmail: m.email,
      cellPhone: generatePhone(),
      city: 'New Westminster',
      province: 'BC',
      employer: 'School District No. 40 (New Westminster)',
      jobTitle,
      worksite,
      employmentStatus: ['full-time', 'full-time', 'part-time', 'casual'][Math.floor(Math.random() * 4)],
      startDateWithEmployer: startDate,
      memberId: generateMemberId(i),
      membershipStatus,
      votingStatus,
      joinDate,
      dateOfBirth,
      allowEmails: true,
      allowTextMessages: Math.random() > 0.3,
      preferredLanguage: 'en',
    } as any);

    membersCreated++;
  }
  console.log(`Members created: ${membersCreated}, skipped: ${membersSkipped}\n`);

  // ==================== SEED NEWS POSTS ====================
  console.log('=== Seeding news posts ===');
  let postsCreated = 0;

  for (const postData of newsPosts) {
    const existing = await db.query.posts.findFirst({
      where: and(eq(posts.unionId, union.id), eq(posts.title, postData.title)),
    });
    if (existing) { console.log(`  Skipping: "${postData.title}"`); continue; }

    await db.insert(posts).values({
      unionId: union.id,
      title: postData.title,
      content: postData.content,
      isPrivate: postData.isPrivate,
      isPinned: postData.isPinned,
      imageUrl: postData.imageUrl,
      authorType: 'union',
      createdBy: ownerUser.id,
    } as any);
    postsCreated++;
    console.log(`  Created: "${postData.title}"`);
  }
  console.log(`Posts created: ${postsCreated}\n`);

  // ==================== SEED UNION EXECUTIVES ====================
  console.log('=== Seeding union executives ===');
  let execsCreated = 0;

  for (const exec of executivesData) {
    const existing = await db.query.unionExecutives.findFirst({
      where: and(eq(unionExecutives.unionId, union.id), eq(unionExecutives.name, exec.name)),
    });
    if (existing) { console.log(`  Skipping: "${exec.name}"`); continue; }

    await db.insert(unionExecutives).values({
      unionId: union.id,
      name: exec.name,
      title: exec.title,
      email: exec.email,
      phone: exec.phone,
      sortOrder: exec.sortOrder,
      createdBy: ownerUser.id,
    } as any);
    execsCreated++;
    console.log(`  Created: "${exec.name}" — ${exec.title}`);
  }
  console.log(`Executives created: ${execsCreated}\n`);

  // ==================== SEED EVENTS ====================
  console.log('=== Seeding events ===');
  let eventsCreated = 0;

  for (const eventData of eventsData) {
    const existing = await db.query.events.findFirst({
      where: and(eq(events.unionId, union.id), eq(events.title, eventData.title)),
    });
    if (existing) { console.log(`  Skipping: "${eventData.title}"`); continue; }

    await db.insert(events).values({
      unionId: union.id,
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      startTime: eventData.startTime || null,
      endTime: eventData.endTime || null,
      isAllDay: eventData.isAllDay,
      isPrivate: eventData.isPrivate,
      category: eventData.category,
      createdBy: ownerUser.id,
    } as any);
    eventsCreated++;
    console.log(`  Created: "${eventData.title}"`);
  }
  console.log(`Events created: ${eventsCreated}\n`);

  // ==================== SEED FILE CATEGORIES & FILES ====================
  console.log('=== Seeding file categories and files ===');

  const uniqueCategories = [...new Set(filesData.map(f => f.category))];
  const categoryMap: Record<string, number> = {};

  for (const catName of uniqueCategories) {
    const existing = await db.query.fileCategories.findFirst({
      where: and(eq(fileCategories.unionId, union.id), eq(fileCategories.name, catName)),
    });
    if (existing) {
      categoryMap[catName] = existing.id;
    } else {
      const [cat] = await db.insert(fileCategories).values({
        unionId: union.id,
        name: catName,
        sortOrder: uniqueCategories.indexOf(catName),
      }).returning();
      categoryMap[catName] = cat.id;
      console.log(`  Created category: "${catName}"`);
    }
  }

  let filesCreated = 0;
  for (let i = 0; i < filesData.length; i++) {
    const f = filesData[i];
    const existing = await db.query.files.findFirst({
      where: and(eq(files.unionId, union.id), eq(files.name, f.name)),
    });
    if (existing) { console.log(`  Skipping file: "${f.name}"`); continue; }

    await db.insert(files).values({
      unionId: union.id,
      name: f.name,
      originalName: f.name,
      fileUrl: f.fileUrl,
      fileType: f.fileType,
      fileSize: 0,
      isPrivate: f.isPrivate,
      category: f.category,
      sortOrder: i,
      createdBy: ownerUser.id,
    } as any);
    filesCreated++;
    console.log(`  Created file: "${f.name}"`);
  }
  console.log(`Files created: ${filesCreated}\n`);

  console.log('=== CUPE Local 409 demo seed complete! ===\n');
  console.log(`Union: CUPE Local 409 (slug: ${DEMO_SLUG}, id: ${union.id})`);
  console.log(`Login URL: /${DEMO_SLUG}`);
  console.log(`Owner login: ${DEMO_OWNER_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`isDemo: ${union.isDemo}`);
}

seedCUPE409Demo()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
