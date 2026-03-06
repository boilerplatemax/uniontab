import { db } from './drizzle';
import {
  users, unions, members, posts, unionExecutives,
  elections, electionQuestions, electionOptions,
  grievances, navigationItems,
} from './schema';
import { hashPassword } from '@/lib/auth/session';
import { eq, and, sql } from 'drizzle-orm';

const DEMO_UNION_ID = 26;
const DEMO_SLUG = 'cupe100';
const DEMO_ADMIN_EMAIL = 'demo@cupe100.ca';
const DEMO_ADMIN_PASSWORD = 'Demo2024!';

// 50 realistic mock members for CUPE 100 (municipal workers)
const mockMembers = [
  { firstName: 'Marie', lastName: 'Tremblay', email: 'marie.tremblay.cupe@gmail.com' },
  { firstName: 'Jean-François', lastName: 'Gagnon', email: 'jf.gagnon.cupe@outlook.com' },
  { firstName: 'Aisha', lastName: 'Okafor', email: 'aisha.okafor.cupe@gmail.com' },
  { firstName: 'Kevin', lastName: 'Lapointe', email: 'kevin.lapointe.cupe@hotmail.com' },
  { firstName: 'Sandra', lastName: 'Beauchamp', email: 'sandra.beauchamp.cupe@gmail.com' },
  { firstName: 'Marcus', lastName: 'Leblanc', email: 'marcus.leblanc.cupe@yahoo.ca' },
  { firstName: 'Fatima', lastName: 'Hassan', email: 'fatima.hassan.cupe@gmail.com' },
  { firstName: 'Luc', lastName: 'Côté', email: 'luc.cote.cupe@outlook.com' },
  { firstName: 'Diane', lastName: 'Pelletier', email: 'diane.pelletier.cupe@gmail.com' },
  { firstName: 'Omar', lastName: 'Diallo', email: 'omar.diallo.cupe@hotmail.com' },
  { firstName: 'Sylvie', lastName: 'Bergeron', email: 'sylvie.bergeron.cupe@gmail.com' },
  { firstName: 'Antoine', lastName: 'Roy', email: 'antoine.roy.cupe@outlook.com' },
  { firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma.cupe@gmail.com' },
  { firstName: 'Patrick', lastName: 'Bouchard', email: 'patrick.bouchard.cupe@yahoo.ca' },
  { firstName: 'Nadia', lastName: 'Fontaine', email: 'nadia.fontaine.cupe@gmail.com' },
  { firstName: 'Éric', lastName: 'Fortin', email: 'eric.fortin.cupe@hotmail.com' },
  { firstName: 'Carole', lastName: 'Girard', email: 'carole.girard.cupe@gmail.com' },
  { firstName: 'Benoit', lastName: 'Mercier', email: 'benoit.mercier.cupe@outlook.com' },
  { firstName: 'Yolanda', lastName: 'Nguyen', email: 'yolanda.nguyen.cupe@gmail.com' },
  { firstName: 'Claude', lastName: 'Morin', email: 'claude.morin.cupe@yahoo.ca' },
  { firstName: 'Linda', lastName: 'Côté', email: 'linda.cote.cupe@gmail.com' },
  { firstName: 'François', lastName: 'Dubois', email: 'francois.dubois.cupe@hotmail.com' },
  { firstName: 'Amara', lastName: 'Diop', email: 'amara.diop.cupe@gmail.com' },
  { firstName: 'Josée', lastName: 'Champagne', email: 'josee.champagne.cupe@outlook.com' },
  { firstName: 'Michel', lastName: 'Laroche', email: 'michel.laroche.cupe@gmail.com' },
  { firstName: 'Isabelle', lastName: 'Blais', email: 'isabelle.blais.cupe@yahoo.ca' },
  { firstName: 'Thierry', lastName: 'Nadeau', email: 'thierry.nadeau.cupe@gmail.com' },
  { firstName: 'Manon', lastName: 'Hébert', email: 'manon.hebert.cupe@hotmail.com' },
  { firstName: 'David', lastName: 'Gauthier', email: 'david.gauthier.cupe@gmail.com' },
  { firstName: 'Christine', lastName: 'Lévesque', email: 'christine.levesque.cupe@outlook.com' },
  { firstName: 'Robert', lastName: 'Simard', email: 'robert.simard.cupe@gmail.com' },
  { firstName: 'Hélène', lastName: 'Bélanger', email: 'helene.belanger.cupe@yahoo.ca' },
  { firstName: 'Steve', lastName: 'Chartrand', email: 'steve.chartrand.cupe@gmail.com' },
  { firstName: 'Michèle', lastName: 'Paquette', email: 'michele.paquette.cupe@hotmail.com' },
  { firstName: 'Jacques', lastName: 'Vaillancourt', email: 'jacques.vaillancourt.cupe@gmail.com' },
  { firstName: 'Nathalie', lastName: 'St-Pierre', email: 'nathalie.stpierre.cupe@outlook.com' },
  { firstName: 'Alain', lastName: 'Arsenault', email: 'alain.arsenault.cupe@gmail.com' },
  { firstName: 'Geneviève', lastName: 'Brisson', email: 'genevieve.brisson.cupe@yahoo.ca' },
  { firstName: 'Pierre', lastName: 'Coulombe', email: 'pierre.coulombe.cupe@gmail.com' },
  { firstName: 'Louise', lastName: 'Desrochers', email: 'louise.desrochers.cupe@hotmail.com' },
  { firstName: 'Martin', lastName: 'Ouellet', email: 'martin.ouellet.cupe@gmail.com' },
  { firstName: 'Annie', lastName: 'Thibodeau', email: 'annie.thibodeau.cupe@outlook.com' },
  { firstName: 'Daniel', lastName: 'Leclerc', email: 'daniel.leclerc.cupe@gmail.com' },
  { firstName: 'Sophie', lastName: 'Marchand', email: 'sophie.marchand.cupe@yahoo.ca' },
  { firstName: 'Mathieu', lastName: 'Paradis', email: 'mathieu.paradis.cupe@gmail.com' },
  { firstName: 'Julie', lastName: 'Caron', email: 'julie.caron.cupe@hotmail.com' },
  { firstName: 'Stéphane', lastName: 'Denis', email: 'stephane.denis.cupe@gmail.com' },
  { firstName: 'Véronique', lastName: 'Archambault', email: 'veronique.archambault.cupe@outlook.com' },
  { firstName: 'Marc', lastName: 'Beausoleil', email: 'marc.beausoleil.cupe@gmail.com' },
  { firstName: 'Chantal', lastName: 'Grenier', email: 'chantal.grenier.cupe@yahoo.ca' },
];

// Municipal job titles for CUPE 100
const jobTitles = [
  'Parks & Recreation Worker',
  'Water Treatment Operator',
  'Municipal Clerk',
  'By-law Enforcement Officer',
  'Road Maintenance Worker',
  'Solid Waste Collector',
  'Building Inspector',
  'Library Technician',
  'Transit Driver',
  'Recreation Coordinator',
  'Permits & Licensing Officer',
  'Urban Planner',
  'Snow Removal Operator',
  'Community Centre Supervisor',
  'Fleet Maintenance Technician',
];

const departments = [
  'Public Works',
  'Parks & Recreation',
  'Water Services',
  'Waste Management',
  'Community Services',
  'Planning & Development',
  'Library Services',
  'By-law Services',
  'Fleet Services',
  'Transit Operations',
];

const newsPosts = [
  {
    title: 'Welcome to CUPE Local 100 — Member Portal',
    content: `<p>Dear Members,</p>
<p>We are excited to welcome you to the new CUPE Local 100 online member portal. This platform has been designed to keep you informed, connected, and engaged with your union.</p>
<p><strong>What you can do here:</strong></p>
<ul>
<li>Read the latest news and updates from your executive</li>
<li>View and register for upcoming events and meetings</li>
<li>Access important documents and collective agreement</li>
<li>Participate in union elections and votes</li>
<li>Submit and track grievances</li>
<li>Update your contact information</li>
</ul>
<p>We encourage all members to take advantage of these tools. Together, we are stronger.</p>
<p>In solidarity,<br/>CUPE Local 100 Executive</p>`,
    isPrivate: false,
    isPinned: true,
  },
  {
    title: 'Collective Agreement Ratified — Key Wins for Members',
    content: `<p>We are proud to announce that members voted overwhelmingly (87%) to ratify our new three-year collective agreement.</p>
<p><strong>Key gains in this agreement include:</strong></p>
<ul>
<li>3.5% wage increase in Year 1, 3.0% in Year 2, and 2.75% in Year 3</li>
<li>Improved dental benefits — coverage increased to 90%</li>
<li>Two additional personal days per year</li>
<li>Stronger just-cause language protecting against arbitrary discipline</li>
<li>Enhanced bereavement leave provisions</li>
<li>New mental health benefit: up to $1,000/year for counselling services</li>
</ul>
<p>This agreement is a direct result of your solidarity and the hard work of our bargaining committee. Thank you to all members who participated in our strike mandate vote and information meetings.</p>
<p>Full text of the new collective agreement is available in the Files section.</p>`,
    isPrivate: false,
    isPinned: true,
  },
  {
    title: 'Health & Safety Alert: Updated PPE Requirements',
    content: `<p>Effective immediately, updated Personal Protective Equipment (PPE) requirements are in effect for outdoor workers.</p>
<p><strong>Changes include:</strong></p>
<ul>
<li>High-visibility vests are now mandatory for all road and parks workers, regardless of time of day</li>
<li>Steel-toed footwear required for all public works positions</li>
<li>Updated heat stress protocols for summer months</li>
<li>New cold weather PPE standards for winter operations</li>
</ul>
<p>If your supervisor asks you to work without proper PPE, you have the right to refuse unsafe work under the Occupational Health and Safety Act. Contact your steward immediately if this occurs.</p>
<p>PPE is available from your department supervisor. If you are not receiving proper equipment, contact the union office.</p>`,
    isPrivate: false,
    isPinned: false,
  },
  {
    title: 'Annual General Meeting — Notice & Agenda',
    content: `<p>Notice is hereby given that the Annual General Meeting of CUPE Local 100 will be held:</p>
<p><strong>Date:</strong> Saturday, April 12th, 2026<br/>
<strong>Time:</strong> 10:00 AM – 1:00 PM<br/>
<strong>Location:</strong> City Hall, Council Chambers, 110 Laurier Avenue</p>
<p><strong>Agenda:</strong></p>
<ol>
<li>Call to order and Land Acknowledgement</li>
<li>Approval of agenda</li>
<li>Reading and adoption of minutes from last AGM</li>
<li>Financial report and auditors' statement</li>
<li>Executive committee reports</li>
<li>Bargaining update</li>
<li>Resolutions and by-law amendments</li>
<li>Elections for vacant positions</li>
<li>New business</li>
<li>Adjournment</li>
</ol>
<p>All members in good standing are encouraged to attend. Lunch will be provided.</p>
<p>To bring a resolution, please submit it in writing to the union office no later than April 5th.</p>`,
    isPrivate: false,
    isPinned: false,
  },
  {
    title: 'Grievance Update: Overtime Distribution Policy Win',
    content: `<p>We are pleased to report a significant victory in our grievance against the City regarding improper overtime distribution in the Public Works department.</p>
<p><strong>Background:</strong><br/>
Multiple members filed grievances in January after supervisors repeatedly bypassed the seniority-based overtime list and assigned overtime arbitrarily.</p>
<p><strong>Outcome:</strong><br/>
After a Step 3 grievance hearing, the City has agreed to:</p>
<ul>
<li>Compensate affected members for lost overtime opportunities</li>
<li>Retrain all Public Works supervisors on the overtime provisions in Article 18</li>
<li>Implement a transparent posted overtime sign-up system</li>
</ul>
<p>This win reinforces the importance of every member knowing their rights under the collective agreement. If you believe your rights have been violated, contact your steward right away — don't wait.</p>`,
    isPrivate: true,
    isPinned: false,
  },
  {
    title: 'CUPE National Solidarity — Supporting Striking CUPE 79 Members',
    content: `<p>CUPE Local 100 stands in full solidarity with our sisters, brothers, and siblings at CUPE Local 79 (City of Toronto).</p>
<p>Municipal workers across Canada are fighting for fair wages and decent working conditions. Their struggle is our struggle.</p>
<p><strong>How you can show support:</strong></p>
<ul>
<li>Attend solidarity pickets when possible (see Events for details)</li>
<li>Share CUPE messaging on social media using #FightForFairWages</li>
<li>Donate to the CUPE Strike Fund at cupe.ca/strike-fund</li>
<li>Attend our solidarity meeting on March 20th at the Union Hall</li>
</ul>
<p>Remember: An injury to one is an injury to all!</p>`,
    isPrivate: false,
    isPinned: false,
  },
  {
    title: 'Member Assistance Program — You Are Not Alone',
    content: `<p>Your union cares about the whole you — not just your working life.</p>
<p>The CUPE Member Assistance Program (MAP) offers free, confidential support for members and their immediate family members facing:</p>
<ul>
<li>Mental health challenges</li>
<li>Stress, burnout, or anxiety</li>
<li>Financial difficulties</li>
<li>Substance use concerns</li>
<li>Relationship and family issues</li>
</ul>
<p><strong>Accessible 24/7:</strong> Call 1-800-555-0100 or visit map.cupe.ca</p>
<p>All services are completely confidential. Your employer will never be notified that you used this program.</p>
<p>Reaching out takes strength. We're here for you.</p>`,
    isPrivate: false,
    isPinned: false,
  },
];

// Union executives for CUPE 100
const executivesData = [
  { name: 'Sandra Beauchamp', title: 'President', email: 'president@cupe100.ca', phone: '+1 613-555-2001', sortOrder: 1 },
  { name: 'Marcus Leblanc', title: 'Vice-President', email: 'vicepresident@cupe100.ca', phone: '+1 613-555-2002', sortOrder: 2 },
  { name: 'Diane Pelletier', title: 'Secretary-Treasurer', email: 'secretary@cupe100.ca', phone: '+1 613-555-2003', sortOrder: 3 },
  { name: 'Antoine Roy', title: 'Recording Secretary', email: 'recording@cupe100.ca', phone: '+1 613-555-2004', sortOrder: 4 },
  { name: 'Fatima Hassan', title: 'Chief Steward', email: 'chiefsteward@cupe100.ca', phone: '+1 613-555-2005', sortOrder: 5 },
  { name: 'Luc Côté', title: 'Trustee', email: 'trustee1@cupe100.ca', phone: '+1 613-555-2006', sortOrder: 6 },
  { name: 'Priya Sharma', title: 'Trustee', email: 'trustee2@cupe100.ca', phone: '+1 613-555-2007', sortOrder: 7 },
  { name: 'Robert Simard', title: 'Sergeant-at-Arms', email: 'saa@cupe100.ca', phone: '+1 613-555-2008', sortOrder: 8 },
];

// Elections for CUPE 100
const electionsData = [
  {
    title: '2026 Executive Elections',
    description: 'Vote for your CUPE Local 100 leadership for the 2026–2028 term. Polls are open to all members in good standing.',
    slug: '2026-executive-elections',
    openTime: new Date('2026-04-01T08:00:00Z'),
    closeTime: new Date('2026-04-14T20:00:00Z'),
    status: 'draft' as const,
    resultsVisibility: 'members',
    questions: [
      {
        questionText: 'President',
        questionType: 'multiple_choice',
        required: true,
        options: ['Sandra Beauchamp (Incumbent)', 'Michel Laroche', 'Alain Arsenault'],
      },
      {
        questionText: 'Vice-President',
        questionType: 'multiple_choice',
        required: true,
        options: ['Marcus Leblanc (Incumbent)', 'Nathalie St-Pierre', 'Steve Chartrand'],
      },
      {
        questionText: 'Secretary-Treasurer',
        questionType: 'multiple_choice',
        required: true,
        options: ['Diane Pelletier (Incumbent)', 'Pierre Coulombe', 'Geneviève Brisson'],
      },
    ],
  },
  {
    title: 'Ratification Vote — Proposed Collective Agreement',
    description: 'Vote to ratify or reject the proposed collective agreement with the City.',
    slug: 'ratification-2026',
    openTime: new Date('2026-02-20T08:00:00Z'),
    closeTime: new Date('2026-02-25T20:00:00Z'),
    status: 'draft' as const,
    resultsVisibility: 'members',
    questions: [
      {
        questionText: 'Do you vote to RATIFY the proposed collective agreement with the City?',
        questionType: 'yes_no',
        required: true,
        options: ['Yes — I ratify the agreement', 'No — I reject the agreement'],
      },
      {
        questionText: 'Comments (optional)',
        questionType: 'text_long',
        required: false,
        options: [],
      },
    ],
  },
];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePhone(): string {
  const areaCodes = ['613', '343', '819', '873'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const exchange = Math.floor(Math.random() * 900) + 100;
  const subscriber = Math.floor(Math.random() * 9000) + 1000;
  return `+1 ${areaCode}-${exchange}-${subscriber}`;
}

function generateMemberId(index: number): string {
  return `CUPE100-${String(index + 1001).padStart(5, '0')}`;
}

async function seedCUPE100Demo() {
  console.log('Starting CUPE Local 100 demo seed...\n');

  // ==================== CREATE/VERIFY UNION ====================
  console.log('=== Setting up CUPE Local 100 union ===');

  // Check if union with this slug already exists
  const existingUnion = await db.query.unions.findFirst({
    where: eq(unions.slug, DEMO_SLUG),
  });

  let union: typeof unions.$inferSelect;

  if (existingUnion) {
    console.log(`Union already exists with id: ${existingUnion.id}`);
    // Update it to ensure isDemo is set and it's published
    const [updated] = await db
      .update(unions)
      .set({
        isDemo: true,
        publishedAt: existingUnion.publishedAt ?? new Date(),
        themeColor: '#CC0000',
      })
      .where(eq(unions.slug, DEMO_SLUG))
      .returning();
    union = updated;
    console.log(`Updated union (id: ${union.id})\n`);
  } else {
    // Try to insert with id=26 using OVERRIDING SYSTEM VALUE
    try {
      const [created] = await db.execute(sql`
        INSERT INTO unions (
          id, name, slug, local_number, public_name, theme_color,
          about, email, phone, address, theme,
          published_at, is_demo, require_email_verification,
          created_at, updated_at
        ) OVERRIDING SYSTEM VALUE VALUES (
          ${DEMO_UNION_ID},
          ${'CUPE'},
          ${DEMO_SLUG},
          ${'100'},
          ${'CUPE Local 100'},
          ${'#CC0000'},
          ${'CUPE Local 100 represents over 400 municipal workers employed by the City, including parks and recreation staff, public works employees, water treatment operators, library workers, transit drivers, and many more. We are proud to advocate for fair wages, safe workplaces, and dignity for all municipal workers.'},
          ${'info@cupe100.ca'},
          ${'+1 613-555-2000'},
          ${'100 Civic Square, Ottawa, ON K1A 0G1'},
          ${'default'},
          ${new Date().toISOString()},
          ${true},
          ${false},
          ${new Date().toISOString()},
          ${new Date().toISOString()}
        ) RETURNING *
      `) as any;

      // Update the sequence to avoid conflicts on future inserts
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
          localNumber: '100',
          publicName: 'CUPE Local 100',
          themeColor: '#CC0000',
          about: 'CUPE Local 100 represents over 400 municipal workers employed by the City, including parks and recreation staff, public works employees, water treatment operators, library workers, transit drivers, and many more. We are proud to advocate for fair wages, safe workplaces, and dignity for all municipal workers.',
          email: 'info@cupe100.ca',
          phone: '+1 613-555-2000',
          address: '100 Civic Square, Ottawa, ON K1A 0G1',
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

  // ==================== CREATE DEMO ADMIN USER ====================
  console.log('=== Creating demo admin user ===');

  let demoAdminUser: typeof users.$inferSelect;
  let demoAdminMember: typeof members.$inferSelect;

  const existingDemoUser = await db.query.users.findFirst({
    where: eq(users.email, DEMO_ADMIN_EMAIL),
  });

  if (existingDemoUser) {
    console.log(`Demo admin user already exists (id: ${existingDemoUser.id})`);
    demoAdminUser = existingDemoUser;
  } else {
    const passwordHash = await hashPassword(DEMO_ADMIN_PASSWORD);
    const [created] = await db
      .insert(users)
      .values({
        name: 'Demo Admin',
        email: DEMO_ADMIN_EMAIL,
        passwordHash,
        role: 'member',
        emailVerified: true,
      })
      .returning();
    demoAdminUser = created;
    console.log(`Created demo admin user (id: ${demoAdminUser.id})`);
  }

  // Ensure demo admin is an owner so they can see all features, but mutations are blocked by middleware
  const existingMembership = await db.query.members.findFirst({
    where: and(eq(members.userId, demoAdminUser.id), eq(members.unionId, union.id)),
  });

  if (existingMembership) {
    console.log(`Demo admin membership already exists`);
    demoAdminMember = existingMembership;
    // Ensure they're an owner (for full view access) with approved status
    if (existingMembership.role !== 'owner' || existingMembership.status !== 'approved') {
      await db.update(members).set({ role: 'owner', status: 'approved' }).where(eq(members.id, existingMembership.id));
    }
  } else {
    const [created] = await db
      .insert(members)
      .values({
        userId: demoAdminUser.id,
        unionId: union.id,
        role: 'owner',
        status: 'approved',
        firstName: 'Demo',
        lastName: 'Admin',
        memberId: 'CUPE100-DEMO',
        membershipStatus: 'active',
        votingStatus: 'eligible',
      })
      .returning();
    demoAdminMember = created;
    console.log(`Created demo admin membership`);
  }
  console.log(`Demo login: ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}\n`);

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
    if (index < 35) return { status: 'approved', membershipStatus: 'active', votingStatus: 'eligible' };
    if (index < 40) return { status: 'pending', membershipStatus: 'active', votingStatus: 'ineligible' };
    if (index < 45) return { status: 'approved', membershipStatus: 'inactive', votingStatus: 'ineligible' };
    if (index < 48) return { status: 'approved', membershipStatus: 'retired', votingStatus: 'ineligible' };
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
    const department = departments[Math.floor(Math.random() * departments.length)];
    const startDate = randomDate(new Date('2005-01-01'), new Date('2023-12-31'));
    const joinDate = randomDate(startDate, new Date('2025-01-01'));
    const dateOfBirth = randomDate(new Date('1965-01-01'), new Date('2000-01-01'));

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
      city: 'Ottawa',
      province: 'Ontario',
      employer: 'City of Ottawa',
      jobTitle,
      department,
      employmentStatus: ['full-time', 'full-time', 'full-time', 'part-time'][Math.floor(Math.random() * 4)],
      startDateWithEmployer: startDate,
      memberId: generateMemberId(i),
      membershipStatus,
      votingStatus,
      joinDate,
      dateOfBirth,
      allowEmails: true,
      allowTextMessages: Math.random() > 0.2,
      preferredLanguage: ['en', 'en', 'fr'][Math.floor(Math.random() * 3)],
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
      authorType: 'union',
      createdBy: demoAdminUser.id,
    });
    postsCreated++;
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
      createdBy: demoAdminUser.id,
    } as any);
    execsCreated++;
  }
  console.log(`Executives created: ${execsCreated}\n`);

  // ==================== SEED ELECTIONS ====================
  console.log('=== Seeding elections ===');
  let electionsCreated = 0;

  for (const electionData of electionsData) {
    const existing = await db.query.elections.findFirst({
      where: and(eq(elections.unionId, union.id), eq(elections.slug, electionData.slug)),
    });
    if (existing) { console.log(`  Skipping: "${electionData.title}"`); continue; }

    const [election] = await db.insert(elections).values({
      unionId: union.id,
      title: electionData.title,
      description: electionData.description,
      slug: electionData.slug,
      openTime: electionData.openTime,
      closeTime: electionData.closeTime,
      status: electionData.status,
      resultsVisibility: electionData.resultsVisibility,
      createdBy: demoAdminUser.id,
    } as any).returning();

    for (const q of electionData.questions) {
      const [question] = await db.insert(electionQuestions).values({
        electionId: election.id,
        questionText: q.questionText,
        questionType: q.questionType,
        required: q.required,
        settings: (q as any).settings ?? null,
        order: electionData.questions.indexOf(q),
      } as any).returning();

      for (let i = 0; i < q.options.length; i++) {
        await db.insert(electionOptions).values({
          questionId: question.id,
          optionText: q.options[i],
          order: i,
        } as any);
      }
    }

    electionsCreated++;
    console.log(`  Created: "${electionData.title}"`);
  }
  console.log(`Elections created: ${electionsCreated}\n`);

  // ==================== SEED GRIEVANCES ====================
  console.log('=== Seeding sample grievances ===');

  const approvedMembers = await db.query.members.findMany({
    where: and(eq(members.unionId, union.id), eq(members.status, 'approved')),
    limit: 5,
  });

  const grievanceSamples = [
    {
      title: 'Improper overtime assignment — bypassing seniority list',
      description: 'Management assigned overtime to junior employee while senior employees who had requested it were passed over. Violates Article 18.3 of the collective agreement.',
      articleViolated: 'Article 18.3 — Overtime Distribution',
      status: 'open',
      priority: 'high',
      department: 'Public Works',
    },
    {
      title: 'Denial of bereavement leave for non-immediate family',
      description: 'Member was denied bereavement leave for the passing of their aunt who was their primary caregiver. The collective agreement provides discretionary leave in these circumstances.',
      articleViolated: 'Article 22.4 — Bereavement Leave',
      status: 'in_progress',
      priority: 'medium',
      department: 'Parks & Recreation',
    },
    {
      title: 'Mandatory overtime — insufficient notice',
      description: 'Supervisor required members to work overtime with less than 24 hours notice on a non-emergency basis, violating the notice provisions in the agreement.',
      articleViolated: 'Article 18.5 — Overtime Notice',
      status: 'resolved',
      priority: 'medium',
      department: 'Water Services',
    },
    {
      title: 'Discipline without union representation',
      description: 'Member received a written reprimand during a meeting without being advised of their right to union representation (Weingarten rights).',
      articleViolated: 'Article 9.1 — Right to Representation',
      status: 'open',
      priority: 'high',
      department: 'By-law Services',
    },
  ];

  let grievancesCreated = 0;
  for (let i = 0; i < grievanceSamples.length; i++) {
    const g = grievanceSamples[i];
    const existing = await db.query.grievances.findFirst({
      where: and(eq(grievances.unionId, union.id), eq(grievances.title, g.title)),
    });
    if (existing) { console.log(`  Skipping: "${g.title}"`); continue; }

    const filerMember = approvedMembers[i % approvedMembers.length];
    if (!filerMember) continue;

    // Map sample statuses to valid DB values
    const statusMap: Record<string, string> = {
      open: 'submitted',
      in_progress: 'under_review',
      resolved: 'resolved',
    };

    await db.insert(grievances).values({
      unionId: union.id,
      memberId: filerMember.id,
      title: g.title,
      description: `${g.description}

Article: ${g.articleViolated}
Department: ${g.department}`,
      status: (statusMap[g.status] ?? 'submitted') as any,
      priority: g.priority as any,
      assignedTo: demoAdminUser.id,
      createdBy: filerMember.userId,
    } as any);
    grievancesCreated++;
    console.log(`  Created: "${g.title}"`);
  }
  console.log(`Grievances created: ${grievancesCreated}\n`);

  console.log('=== CUPE Local 100 demo seed complete! ===\n');
  console.log(`Union: CUPE Local 100 (slug: ${DEMO_SLUG}, id: ${union.id})`);
  console.log(`Demo login URL: /cupe100`);
  console.log(`Demo admin: ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}`);
  console.log(`isDemo: ${union.isDemo}`);
}

seedCUPE100Demo()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
