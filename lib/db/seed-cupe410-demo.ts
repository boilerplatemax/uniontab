import { db } from './drizzle';
import {
  users, unions, members, posts, unionExecutives,
  events, files, fileCategories, navigationItems,
  unionContactInfo,
} from './schema';
import { hashPassword } from '@/lib/auth/session';
import { eq, and, sql } from 'drizzle-orm';

const DEMO_UNION_ID = 28;
const DEMO_SLUG = 'cupe410';
const DEMO_OWNER_EMAIL = 'cupe410pres@gmail.com';
const DEMO_PASSWORD = 'UnionDemo1!';

// Job titles for Greater Victoria Public Library & Art Gallery of Greater Victoria
const jobTitlesGVPL = [
  'Library Assistant',
  'Library Technician',
  'Circulation Clerk',
  'Children\'s Programs Assistant',
  'Digital Services Assistant',
  'Reference Assistant',
  'Branch Assistant',
  'Information Services Technician',
  'Outreach Assistant',
  'Youth Services Assistant',
  'Collection Services Technician',
];

const jobTitlesAGGV = [
  'Gallery Attendant',
  'Visitor Services Associate',
  'Shop Assistant',
  'Education Programs Assistant',
  'Collections Assistant',
  'Events Coordinator Assistant',
  'Communications Assistant',
  'Administrative Assistant',
];

const gvplBranches = [
  'Greater Victoria Public Library — Central Branch',
  'Greater Victoria Public Library — Bruce Hutchison Branch',
  'Greater Victoria Public Library — Central Saanich Branch',
  'Greater Victoria Public Library — Emily Carr Branch',
  'Greater Victoria Public Library — Esquimalt Branch',
  'Greater Victoria Public Library — Juan de Fuca Branch',
  'Greater Victoria Public Library — Langford Branch',
  'Greater Victoria Public Library — Nellie McClung Branch',
  'Greater Victoria Public Library — Oak Bay Branch',
  'Greater Victoria Public Library — Saanich Centennial Branch',
  'Greater Victoria Public Library — sxʷeŋxʷəŋ təŋəxʷ James Bay Branch',
  'Art Gallery of Greater Victoria',
];

const mockMembers = [
  { firstName: 'Rebecca', lastName: 'Baugniet', email: 'rebecca.baugniet.cupe410@gmail.com' },
  { firstName: 'Caitlin', lastName: 'Ottenbreit', email: 'caitlin.ottenbreit.cupe410@gmail.com' },
  { firstName: 'Ali', lastName: 'Kahn', email: 'ali.kahn.cupe410@gmail.com' },
  { firstName: 'Kyla', lastName: 'Butler', email: 'kyla.butler.cupe410@gmail.com' },
  { firstName: 'Vicki', lastName: 'Sundher', email: 'vicki.sundher.cupe410@gmail.com' },
  { firstName: 'Ava', lastName: 'Ready', email: 'ava.ready.cupe410@gmail.com' },
  { firstName: 'Tracy', lastName: 'Kendrick', email: 'tracy.kendrick.cupe410@gmail.com' },
  { firstName: 'Aaron', lastName: 'Thom', email: 'aaron.thom.cupe410@gmail.com' },
  { firstName: 'Jessica', lastName: 'Johnson', email: 'jessica.johnson.cupe410@gmail.com' },
  { firstName: 'Lisa', lastName: 'Beauchemin', email: 'lisa.beauchemin.cupe410@gmail.com' },
  { firstName: 'Christy', lastName: 'Borthistle', email: 'christy.borthistle.cupe410@gmail.com' },
  { firstName: 'Nathan', lastName: 'Pagan', email: 'nathan.pagan.cupe410@gmail.com' },
  { firstName: 'Wendy', lastName: 'London', email: 'wendy.london.cupe410@gmail.com' },
  { firstName: 'Melina', lastName: 'Edwards', email: 'melina.edwards.cupe410@gmail.com' },
  { firstName: 'Robyn', lastName: 'Little', email: 'robyn.little.cupe410@gmail.com' },
  { firstName: 'Sally', lastName: 'Winters', email: 'sally.winters.cupe410@gmail.com' },
  { firstName: 'Salma', lastName: 'Naili', email: 'salma.naili.cupe410@gmail.com' },
  { firstName: 'Roya', lastName: 'Azizi', email: 'roya.azizi.cupe410@gmail.com' },
  { firstName: 'Stephanie', lastName: 'Marston', email: 'stephanie.marston.cupe410@gmail.com' },
  { firstName: 'Megan', lastName: 'Clark', email: 'megan.clark.cupe410@gmail.com' },
  { firstName: 'James', lastName: 'Patterson', email: 'james.patterson.cupe410@gmail.com' },
  { firstName: 'Emily', lastName: 'Nguyen', email: 'emily.nguyen.cupe410@gmail.com' },
  { firstName: 'Daniel', lastName: 'Okafor', email: 'daniel.okafor.cupe410@gmail.com' },
  { firstName: 'Sofia', lastName: 'Martinez', email: 'sofia.martinez.cupe410@gmail.com' },
  { firstName: 'Liam', lastName: 'Morrison', email: 'liam.morrison.cupe410@gmail.com' },
  { firstName: 'Claire', lastName: 'Dubois', email: 'claire.dubois.cupe410@gmail.com' },
  { firstName: 'Owen', lastName: 'Findlay', email: 'owen.findlay.cupe410@gmail.com' },
  { firstName: 'Nadia', lastName: 'Petrov', email: 'nadia.petrov.cupe410@gmail.com' },
  { firstName: 'Marcus', lastName: 'Singh', email: 'marcus.singh.cupe410@gmail.com' },
  { firstName: 'Joanna', lastName: 'Walsh', email: 'joanna.walsh.cupe410@gmail.com' },
];

const newsPosts = [
  {
    title: 'Welcome to CUPE Local 410 — Member Portal',
    content: `<p>Dear Members,</p>
<p>Welcome to the CUPE Local 410 online member portal. This is your digital home for news, resources, and updates from your union executive.</p>
<p>CUPE Local 410 proudly represents workers at two of Greater Victoria's most beloved public institutions: the <strong>Greater Victoria Public Library (GVPL)</strong> and the <strong>Art Gallery of Greater Victoria (AGGV)</strong>. Our members provide vital services to the community — from helping patrons find information and access programs, to welcoming visitors and supporting the gallery's world-class exhibitions.</p>
<p><strong>Here you can:</strong></p>
<ul>
<li>Stay up to date with news from your executive</li>
<li>Access your collective agreements and key documents</li>
<li>View upcoming events and general membership meetings</li>
<li>Connect with your steward for workplace support</li>
</ul>
<p>Union solidarity is based on the principle that union members are equal and deserve mutual respect. We are committed to building a workplace free from discrimination in all its forms.</p>
<p>In solidarity,<br/>CUPE Local 410 Executive</p>`,
    isPrivate: false,
    isPinned: true,
    imageUrl: null,
  },
  {
    title: 'CUPE 410 Walks and Fundraises for the Coldest Night of the Year',
    content: `<p>On February 26th, CUPE Local 410 members laced up their boots and walked to support <strong>Our Place</strong>, a local organization that provides vital services to people experiencing homelessness and poverty in Greater Victoria.</p>
<p>Our team raised an incredible <strong>$1,670</strong> — well above our goal — including a $500 donation approved at our January General Meeting.</p>
<p>A huge thank you to <strong>Kate Wood</strong> for organizing our participation, getting us registered, getting our toques, and being an awesome team organizer. And thank you to all members and family members who joined us on the walk!</p>
<p>The Coldest Night of the Year is an annual national fundraising walk that takes place every February in communities across Canada. By walking in the cold, we raise awareness and funds for people who face homelessness every night.</p>
<p>We're proud to give back to the community we serve. Look for our participation again next year!</p>`,
    isPrivate: false,
    isPinned: false,
    imageUrl: null,
  },
  {
    title: 'Supporting Our Friends at VIRL — Solidarity on the Picket Line',
    content: `<p>On Tuesday, March 15th, CUPE Local 410 members joined BCGEU librarians on the picket line at the <strong>Sidney/North Saanich branch of the Vancouver Island Regional Library (VIRL)</strong>.</p>
<p>Library workers deserve fair wages and decent working conditions. When our sister unions fight for their rights, we stand with them. That's what union solidarity means.</p>
<p>We encourage all members to follow developments in the BCGEU's labour action with VIRL:</p>
<ul>
<li>Follow BCGEU on social media: <strong>#respectVIRLlibrarians</strong> on Twitter and Instagram</li>
<li>Visit the BCGEU website for updates on the dispute</li>
<li>Watch for future opportunities to show support — we will coordinate additional solidarity actions as needed</li>
</ul>
<p>An injury to one is an injury to all. Thank you to every member who showed up.</p>`,
    isPrivate: false,
    isPinned: false,
    imageUrl: null,
  },
  {
    title: 'Collective Agreements Updated — GVPL 2022–2024 & AGGV 2023–2026',
    content: `<p>Updated collective agreements are now available for all CUPE Local 410 members in the Files section of this portal.</p>
<p><strong>GVPL Agreement (January 1, 2022 – December 31, 2024):</strong><br/>
The signed collective agreement covering Greater Victoria Public Library employees is now available for download.</p>
<p><strong>AGGV Agreement (2023–2026):</strong><br/>
The signed collective agreement covering Art Gallery of Greater Victoria employees is also available for download.</p>
<p>We encourage all members to read their applicable agreement carefully. Key areas to review include:</p>
<ul>
<li>Wages and pay scales for your classification</li>
<li>Benefit entitlements</li>
<li>Seniority, layoff, and recall provisions</li>
<li>Overtime and scheduling rules</li>
<li>Grievance and arbitration procedures</li>
</ul>
<p>If you have questions about your collective agreement, contact your steward or the president at cupe410pres@gmail.com.</p>`,
    isPrivate: false,
    isPinned: false,
    imageUrl: null,
  },
  {
    title: 'General Membership Meeting — Upcoming Dates',
    content: `<p>CUPE Local 410 holds regular General Membership Meetings throughout the year. All members in good standing are encouraged to attend.</p>
<p>Meetings are an important opportunity to:</p>
<ul>
<li>Hear reports from your executive and stewards</li>
<li>Vote on resolutions and financial matters</li>
<li>Raise workplace concerns</li>
<li>Connect with your fellow members</li>
</ul>
<p>Meeting dates and locations will be announced via email and posted on this portal. Watch for upcoming meeting notices.</p>
<p>If you have a workplace issue that cannot wait for a general meeting, please contact your steward directly. Steward contact information is available in the Files section.</p>
<p>In solidarity,<br/>CUPE Local 410 Executive</p>`,
    isPrivate: false,
    isPinned: false,
    imageUrl: null,
  },
  {
    title: 'Equality Statement — Our Commitment to All Members',
    content: `<p>CUPE Local 410 is committed to building a union where every member is treated with dignity and respect.</p>
<p>Our union is dedicated to the principle that <strong>union solidarity is based on the principle that union members are equal and deserve mutual respect and cooperation</strong>.</p>
<p>Discriminatory speech or conduct which is racist, sexist, transphobic, or homophobic hurts and thereby divides us. We will not tolerate harassment or discrimination on the basis of:</p>
<ul>
<li>Race, colour, or national/ethnic origin</li>
<li>Sex, gender identity, or sexual orientation</li>
<li>Age or disability</li>
<li>Religion, language, or class</li>
</ul>
<p>If you experience or witness discrimination or harassment in your workplace or in union activities, please contact the president or your steward. All complaints will be taken seriously and handled with care and confidentiality.</p>
<p>We also recognize that we work on the traditional territories of the Lekwungen and WSÁNEĆ peoples, and we are committed to ongoing learning and action on reconciliation.</p>`,
    isPrivate: false,
    isPinned: false,
    imageUrl: null,
  },
];

const executivesData = [
  { name: 'Rebecca Baugniet', title: 'President', email: 'cupe410pres@gmail.com', phone: '', sortOrder: 1 },
  { name: 'Caitlin Ottenbreit', title: 'Unit Vice-President — GVPL', email: 'cupe410vp@gmail.com', phone: '', sortOrder: 2 },
  { name: 'M. Ali Kahn', title: 'Unit Vice-President — AGGV', email: 'cupe410aggvvp@gmail.com', phone: '', sortOrder: 3 },
  { name: 'Kyla Butler', title: 'Recording Secretary', email: 'cupe410recording@gmail.com', phone: '', sortOrder: 4 },
  { name: 'Vicki Sundher', title: 'Secretary-Treasurer', email: 'cupe410treasurer@gmail.com', phone: '', sortOrder: 5 },
  { name: 'Ava Ready', title: 'Communications Officer', email: 'cupe410comms@gmail.com', phone: '', sortOrder: 6 },
  { name: 'Vacant', title: 'Indigenous Officer', email: '', phone: '', sortOrder: 7 },
  { name: 'Tracy Kendrick', title: 'Steward — Central Branch', email: '', phone: '', sortOrder: 8 },
  { name: 'Aaron Thom', title: 'Steward — Central Branch / Trustee', email: '', phone: '', sortOrder: 9 },
  { name: 'Jessica Johnson', title: 'Steward — Emily Carr Branch', email: '', phone: '', sortOrder: 10 },
  { name: 'Lisa Beauchemin', title: 'Steward — Esquimalt Branch', email: '', phone: '', sortOrder: 11 },
  { name: 'Christy Borthistle', title: 'Steward — Juan de Fuca/CaTS', email: '', phone: '', sortOrder: 12 },
  { name: 'Nathan Pagan', title: 'Steward — Langford Branch', email: '', phone: '', sortOrder: 13 },
  { name: 'Wendy London', title: 'Steward — Nellie McClung Branch', email: '', phone: '', sortOrder: 14 },
  { name: 'Melina Edwards', title: 'Steward — Oak Bay Branch', email: '', phone: '', sortOrder: 15 },
  { name: 'Robyn Little', title: 'Steward — Saanich Centennial Branch', email: '', phone: '', sortOrder: 16 },
  { name: 'Sally Winters', title: 'Steward — sxʷeŋxʷəŋ təŋəxʷ James Bay Branch', email: '', phone: '', sortOrder: 17 },
  { name: 'Salma Naili', title: 'Steward — Art Gallery of Greater Victoria', email: '', phone: '', sortOrder: 18 },
  { name: 'Roya Azizi', title: 'Steward — Art Gallery of Greater Victoria', email: '', phone: '', sortOrder: 19 },
  { name: 'Aaron Thom', title: 'Trustee (2025–2028)', email: '', phone: '', sortOrder: 20 },
  { name: 'Stephanie Marston', title: 'Trustee (2024–2027)', email: '', phone: '', sortOrder: 21 },
  { name: 'Megan Clark', title: 'Trustee (2023–2026)', email: '', phone: '', sortOrder: 22 },
];

// Deduplicate by name for exec insert
const uniqueExecutives = executivesData.filter((exec, index, self) =>
  index === self.findIndex((e) => e.name === exec.name && e.title === exec.title)
);

const eventsData = [
  {
    title: 'General Membership Meeting — January 2026',
    description: 'Quarterly general membership meeting. Hear reports from your executive and stewards. All members in good standing are encouraged to attend.',
    location: 'Greater Victoria Public Library — Central Branch, Board Room',
    startDate: new Date('2026-01-20T00:00:00'),
    endDate: new Date('2026-01-20T00:00:00'),
    startTime: '17:30',
    endTime: '19:30',
    isAllDay: false,
    isPrivate: false,
    category: 'meeting',
  },
  {
    title: 'Executive Committee Meeting — January',
    description: 'Monthly executive committee meeting to review financial reports, steward updates, and outstanding grievance matters.',
    location: 'Video call (link provided to executives)',
    startDate: new Date('2026-01-07T00:00:00'),
    endDate: new Date('2026-01-07T00:00:00'),
    startTime: '18:00',
    endTime: '20:00',
    isAllDay: false,
    isPrivate: true,
    category: 'meeting',
  },
  {
    title: 'Steward Training — Handling Member Complaints',
    description: 'Training workshop for all GVPL and AGGV stewards. Topics include: first contact with a member in distress, documenting complaints, and navigating the grievance procedure.',
    location: 'CUPE BC Regional Office — Victoria',
    startDate: new Date('2026-01-24T00:00:00'),
    endDate: new Date('2026-01-24T00:00:00'),
    startTime: '09:00',
    endTime: '15:00',
    isAllDay: false,
    isPrivate: true,
    category: 'training',
  },
  {
    title: 'General Membership Meeting — March 2026',
    description: 'Spring general membership meeting. Financial statements presentation, collective agreement updates, and member priorities for the year.',
    location: 'Greater Victoria Public Library — Central Branch, Board Room',
    startDate: new Date('2026-03-17T00:00:00'),
    endDate: new Date('2026-03-17T00:00:00'),
    startTime: '17:30',
    endTime: '19:30',
    isAllDay: false,
    isPrivate: false,
    category: 'meeting',
  },
  {
    title: 'Good Friday — Public Holiday',
    description: 'Statutory holiday — GVPL and AGGV may be closed. Check with your branch for holiday scheduling.',
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
    title: 'General Membership Meeting — May 2026',
    description: 'Spring general membership meeting. Trustee election, bylaw review, and steward reports.',
    location: 'Art Gallery of Greater Victoria — Boardroom',
    startDate: new Date('2026-05-19T00:00:00'),
    endDate: new Date('2026-05-19T00:00:00'),
    startTime: '17:30',
    endTime: '19:30',
    isAllDay: false,
    isPrivate: false,
    category: 'meeting',
  },
  {
    title: 'Victoria Day — Public Holiday',
    description: 'Statutory holiday — GVPL branches and AGGV may be closed. Check with your branch for scheduling.',
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
    title: 'CUPE BC Convention 2026',
    description: 'CUPE BC Annual Convention in Victoria. Observer seats may be available for members. Contact the president for details. This year\'s convention is an excellent opportunity to connect with CUPE members from across BC.',
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
    title: 'General Membership Meeting — September 2026',
    description: 'Fall general membership meeting. Back-to-work updates, bargaining planning, and member wellness.',
    location: 'Greater Victoria Public Library — Central Branch, Board Room',
    startDate: new Date('2026-09-15T00:00:00'),
    endDate: new Date('2026-09-15T00:00:00'),
    startTime: '17:30',
    endTime: '19:30',
    isAllDay: false,
    isPrivate: false,
    category: 'meeting',
  },
  {
    title: 'General Membership Meeting — November 2026',
    description: 'Fall/winter general membership meeting. Executive elections for vacant positions, year-end financial preview.',
    location: 'Greater Victoria Public Library — Central Branch, Board Room',
    startDate: new Date('2026-11-17T00:00:00'),
    endDate: new Date('2026-11-17T00:00:00'),
    startTime: '17:30',
    endTime: '19:30',
    isAllDay: false,
    isPrivate: false,
    category: 'meeting',
  },
];

const filesData = [
  {
    name: 'GVPL Collective Agreement 2022–2024',
    fileUrl: 'https://cupe410.ca/wp-content/uploads/sites/249/2023/03/GVPL-CUPE-Local-410-Collective-Agreement-January-1-2022-December-31-2024-Fully-Signed.pdf',
    fileType: 'application/pdf',
    isPrivate: false,
    category: 'Collective Agreements',
  },
  {
    name: 'AGGV Collective Agreement 2023–2026',
    fileUrl: 'https://cupe410.ca/wp-content/uploads/sites/249/2025/02/Collective-Agreement-Cupe-Local-410-Art-Gallery-of-Greater-Victoria-2023-2026-Signed.pdf',
    fileType: 'application/pdf',
    isPrivate: false,
    category: 'Collective Agreements',
  },
  {
    name: 'CUPE Local 410 Bylaws (2023)',
    fileUrl: 'https://cupe410.ca/wp-content/uploads/sites/249/2024/03/L-410-2023-Bylaws-FINAL.pdf',
    fileType: 'application/pdf',
    isPrivate: false,
    category: 'Governance',
  },
  {
    name: 'Pacific Blue Cross — Benefits Portal',
    fileUrl: 'https://pac.bluecross.ca/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Benefits',
  },
  {
    name: 'BC Municipal Pension Plan (MPP)',
    fileUrl: 'https://mpp.pensionsbc.ca/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Pension',
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
    name: 'CUPE Education — Courses and Training',
    fileUrl: 'https://cupe.ca/education',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Education',
  },
  {
    name: 'Member Savings & Discounts Program',
    fileUrl: 'https://cupe.ca/member-savings-program',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Member Benefits',
  },
  {
    name: 'Greater Victoria Public Library',
    fileUrl: 'https://gvpl.ca/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Employer',
  },
  {
    name: 'Art Gallery of Greater Victoria',
    fileUrl: 'https://aggv.ca/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Employer',
  },
];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePhone(): string {
  const areaCodes = ['250', '778', '236'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const exchange = Math.floor(Math.random() * 900) + 100;
  const subscriber = Math.floor(Math.random() * 9000) + 1000;
  return `+1 ${areaCode}-${exchange}-${subscriber}`;
}

function generateMemberId(index: number): string {
  return `CUPE410-${String(index + 1001).padStart(5, '0')}`;
}

async function seedCUPE410Demo() {
  console.log('Starting CUPE Local 410 demo seed...\n');

  // ==================== CREATE/VERIFY UNION ====================
  console.log('=== Setting up CUPE Local 410 union ===');

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
        themeColor: '#1A4F8A',
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
          ${'410'},
          ${'CUPE Local 410'},
          ${'#1A4F8A'},
          ${'CUPE Local 410 represents workers at the Greater Victoria Public Library (GVPL) and the Art Gallery of Greater Victoria (AGGV). Our members provide essential cultural and information services to the communities of Greater Victoria. We are committed to fair wages, safe and healthy workplaces, and respecting the dignity of every worker. We acknowledge that we work on the traditional territories of the Lekwungen and WSÁNEĆ peoples. Union solidarity is based on equality and mutual respect — we stand together against discrimination in all its forms.'},
          ${'cupe410pres@gmail.com'},
          ${''},
          ${'Greater Victoria, BC'},
          ${'https://cupe410.ca/'},
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
          localNumber: '410',
          publicName: 'CUPE Local 410',
          themeColor: '#1A4F8A',
          about: 'CUPE Local 410 represents workers at the Greater Victoria Public Library (GVPL) and the Art Gallery of Greater Victoria (AGGV). Our members provide essential cultural and information services to the communities of Greater Victoria. We are committed to fair wages, safe and healthy workplaces, and respecting the dignity of every worker. We acknowledge that we work on the traditional territories of the Lekwungen and WSÁNEĆ peoples. Union solidarity is based on equality and mutual respect — we stand together against discrimination in all its forms.',
          email: 'cupe410pres@gmail.com',
          phone: '',
          address: 'Greater Victoria, BC',
          website: 'https://cupe410.ca/',
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
  console.log('=== Creating owner user (President Rebecca Baugniet) ===');

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
        name: 'Rebecca Baugniet',
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
      firstName: 'Rebecca',
      lastName: 'Baugniet',
      memberId: 'CUPE410-PRES',
      membershipStatus: 'active',
      votingStatus: 'eligible',
      jobTitle: 'President',
      employer: 'Greater Victoria Public Library',
      worksite: 'Greater Victoria Public Library — Central Branch',
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
      contactEmail: 'cupe410pres@gmail.com',
      contactPhone: '',
      contactAddress: 'Greater Victoria, BC',
      officeHours: 'Contact the executive via email. Check the website for meeting dates.',
      contactFormEnabled: true,
      contactFormEmail: 'cupe410pres@gmail.com',
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

  const allTitles = [...jobTitlesGVPL, ...jobTitlesAGGV];

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
    const isAGGV = i >= 16 && i <= 19; // Salma, Roya, Stephanie, Megan
    const jobTitle = isAGGV
      ? jobTitlesAGGV[Math.floor(Math.random() * jobTitlesAGGV.length)]
      : jobTitlesGVPL[Math.floor(Math.random() * jobTitlesGVPL.length)];
    const worksite = isAGGV
      ? 'Art Gallery of Greater Victoria'
      : gvplBranches[Math.floor(Math.random() * (gvplBranches.length - 1))];
    const employer = isAGGV ? 'Art Gallery of Greater Victoria' : 'Greater Victoria Public Library';
    const startDate = randomDate(new Date('2010-01-01'), new Date('2024-06-30'));
    const joinDate = randomDate(startDate, new Date('2025-01-01'));
    const dateOfBirth = randomDate(new Date('1970-01-01'), new Date('2002-01-01'));

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
      city: 'Victoria',
      province: 'BC',
      employer,
      jobTitle,
      worksite,
      employmentStatus: ['full-time', 'full-time', 'part-time'][Math.floor(Math.random() * 3)],
      startDateWithEmployer: startDate,
      memberId: generateMemberId(i),
      membershipStatus,
      votingStatus,
      joinDate,
      dateOfBirth,
      allowEmails: true,
      allowTextMessages: Math.random() > 0.4,
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

  for (const exec of uniqueExecutives) {
    const existing = await db.query.unionExecutives.findFirst({
      where: and(eq(unionExecutives.unionId, union.id), eq(unionExecutives.name, exec.name)),
    });
    if (existing) { console.log(`  Skipping: "${exec.name}"`); continue; }

    await db.insert(unionExecutives).values({
      unionId: union.id,
      name: exec.name,
      title: exec.title,
      email: exec.email || null,
      phone: exec.phone || null,
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

  console.log('=== CUPE Local 410 demo seed complete! ===\n');
  console.log(`Union: CUPE Local 410 (slug: ${DEMO_SLUG}, id: ${union.id})`);
  console.log(`Login URL: /${DEMO_SLUG}`);
  console.log(`Owner login: ${DEMO_OWNER_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`isDemo: ${union.isDemo}`);
}

seedCUPE410Demo()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
