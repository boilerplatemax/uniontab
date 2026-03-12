import { db } from './drizzle';
import {
  users, unions, members, posts, unionExecutives,
  events, files, fileCategories, navigationItems,
  unionContactInfo,
} from './schema';
import { hashPassword } from '@/lib/auth/session';
import { eq, and, sql } from 'drizzle-orm';

const DEMO_UNION_ID = 29;
const DEMO_SLUG = 'cupe411';
const DEMO_OWNER_EMAIL = 'unionoffice@cupe411.ca';
const DEMO_PASSWORD = 'UnionDemo1!';

// Five divisions of Chilliwack SD33
const divisions = ['Assistants', 'Clerical', 'Custodial', 'Maintenance', 'Transportation'];

// Job titles by division
const jobTitlesByDivision: Record<string, string[]> = {
  Assistants: [
    'Education Assistant',
    'Special Needs Education Assistant',
    'Indigenous Education Support Worker',
    'Speech/Language Assistant',
    'Early Childhood Educator',
    'Journey Person Cook',
    'Childcare Worker',
  ],
  Clerical: [
    'Administrative Secretary',
    'Accounting Clerk',
    'Library Assistant',
    'Records Clerk',
    'Office Manager',
    'Payroll Clerk',
    'Receptionist',
  ],
  Custodial: [
    'Custodian Level 1',
    'Custodian Level 2',
    'Custodian Level 3',
    'Head Custodian',
  ],
  Maintenance: [
    'Maintenance Worker',
    'Carpenter',
    'Electrician',
    'Plumber',
    'Grounds Keeper',
    'Technology Technician',
    'Painter',
  ],
  Transportation: [
    'Bus Driver',
    'School Bus Mechanic',
    'Fleet Custodian',
    'Transportation Clerk',
  ],
};

const chilliwackSchools = [
  'Chilliwack Secondary School',
  'G.W. Graham Middle School',
  'Sardis Secondary School',
  'École Vedder Middle School',
  'Betty Huff Elementary',
  'Gwynne Vaughan Elementary',
  'Promontory Heights Elementary',
  'Rosedale Elementary',
  'Sardis Elementary',
  'Strathcona Elementary',
  'A.D. Rundle Middle School',
  'École Mountainview Elementary',
  'SD33 District Office',
  'Chilliwack Learning Centre',
  'Heritage Park Middle School',
];

const mockMembers = [
  { firstName: 'April', lastName: 'Mancinelli', email: 'april.mancinelli.cupe411@gmail.com', division: 'Assistants' },
  { firstName: 'Jeff', lastName: 'Kasper', email: 'jeff.kasper.cupe411@gmail.com', division: 'Maintenance' },
  { firstName: 'Dale', lastName: 'Obirek', email: 'dale.obirek.cupe411@gmail.com', division: 'Custodial' },
  { firstName: 'Debbie', lastName: 'Street', email: 'debbie.street.cupe411@gmail.com', division: 'Clerical' },
  { firstName: 'Sharon', lastName: 'Jackson', email: 'sharon.jackson.cupe411@gmail.com', division: 'Clerical' },
  { firstName: 'Kari', lastName: 'Miller', email: 'kari.miller.cupe411@gmail.com', division: 'Assistants' },
  { firstName: 'Agnieszka', lastName: 'Malecki', email: 'agnieszka.malecki.cupe411@gmail.com', division: 'Assistants' },
  { firstName: 'Tammy', lastName: 'Lambert', email: 'tammy.lambert.cupe411@gmail.com', division: 'Assistants' },
  { firstName: 'Jocelyn', lastName: 'Holden', email: 'jocelyn.holden.cupe411@gmail.com', division: 'Clerical' },
  { firstName: 'Kate', lastName: 'Brown', email: 'kate.brown.cupe411@gmail.com', division: 'Clerical' },
  { firstName: 'Sandra', lastName: 'Nguyen', email: 'sandra.nguyen.cupe411@gmail.com', division: 'Transportation' },
  { firstName: 'Michael', lastName: 'Tran', email: 'michael.tran.cupe411@gmail.com', division: 'Transportation' },
  { firstName: 'Patricia', lastName: 'Sandhu', email: 'patricia.sandhu.cupe411@gmail.com', division: 'Assistants' },
  { firstName: 'Robert', lastName: 'Friesen', email: 'robert.friesen.cupe411@gmail.com', division: 'Custodial' },
  { firstName: 'Linda', lastName: 'Dhaliwal', email: 'linda.dhaliwal.cupe411@gmail.com', division: 'Clerical' },
  { firstName: 'William', lastName: 'Park', email: 'william.park.cupe411@gmail.com', division: 'Maintenance' },
  { firstName: 'Barbara', lastName: 'Chen', email: 'barbara.chen.cupe411@gmail.com', division: 'Assistants' },
  { firstName: 'Richard', lastName: 'Johal', email: 'richard.johal.cupe411@gmail.com', division: 'Transportation' },
  { firstName: 'Mary', lastName: 'Gustafson', email: 'mary.gustafson.cupe411@gmail.com', division: 'Assistants' },
  { firstName: 'Thomas', lastName: 'Kim', email: 'thomas.kim.cupe411@gmail.com', division: 'Custodial' },
  { firstName: 'Deborah', lastName: 'Mitchell', email: 'deborah.mitchell.cupe411@gmail.com', division: 'Clerical' },
  { firstName: 'Christopher', lastName: 'Patel', email: 'christopher.patel.cupe411@gmail.com', division: 'Maintenance' },
  { firstName: 'Sandra', lastName: 'Wilson', email: 'sandra.wilson.cupe411@gmail.com', division: 'Assistants' },
  { firstName: 'Paul', lastName: 'Williams', email: 'paul.williams.cupe411@gmail.com', division: 'Custodial' },
  { firstName: 'Jessica', lastName: 'Brown', email: 'jessica.brown.cupe411@gmail.com', division: 'Assistants' },
  { firstName: 'Kenneth', lastName: 'Taylor', email: 'kenneth.taylor.cupe411@gmail.com', division: 'Transportation' },
  { firstName: 'Cynthia', lastName: 'Anderson', email: 'cynthia.anderson.cupe411@gmail.com', division: 'Clerical' },
  { firstName: 'George', lastName: 'Thomas', email: 'george.thomas.cupe411@gmail.com', division: 'Maintenance' },
  { firstName: 'Amy', lastName: 'Jackson', email: 'amy.jackson.cupe411@gmail.com', division: 'Assistants' },
  { firstName: 'Mark', lastName: 'White', email: 'mark.white.cupe411@gmail.com', division: 'Custodial' },
  { firstName: 'Dorothy', lastName: 'Harris', email: 'dorothy.harris.cupe411@gmail.com', division: 'Clerical' },
  { firstName: 'Donald', lastName: 'Martin', email: 'donald.martin.cupe411@gmail.com', division: 'Transportation' },
  { firstName: 'Michelle', lastName: 'Garcia', email: 'michelle.garcia.cupe411@gmail.com', division: 'Assistants' },
  { firstName: 'Steven', lastName: 'Martinez', email: 'steven.martinez.cupe411@gmail.com', division: 'Maintenance' },
  { firstName: 'Carol', lastName: 'Robinson', email: 'carol.robinson.cupe411@gmail.com', division: 'Clerical' },
];

const newsPosts = [
  {
    title: 'Welcome to CUPE Local 411 — Member Portal',
    content: `<p>Dear Members,</p>
<p>Welcome to the CUPE Local 411 online member portal — your hub for news, resources, and updates from your union.</p>
<p>CUPE Local 411 represents close to <strong>1,100 members</strong> working across five divisions in Chilliwack School District #33:</p>
<ul>
<li><strong>Assistants</strong> — Education Assistants, Special Needs EAs, Indigenous Education Support Workers, Speech/Language Assistants, Early Childhood Educators, and Cooks</li>
<li><strong>Clerical</strong> — Administrative Secretaries, Accounting Clerks, Library Assistants, and other office staff</li>
<li><strong>Custodial</strong> — Custodians across all levels</li>
<li><strong>Maintenance</strong> — Carpenters, Electricians, Plumbers, Groundskeepers, and Technology Technicians</li>
<li><strong>Transportation</strong> — Bus Drivers, School Bus Mechanics, and Fleet Custodians</li>
</ul>
<p>Our local operates with local autonomy through its own bylaws and our negotiated Collective Agreement with SD33. Everything we do in this local is meant to never conflict with CUPE National's Constitution.</p>
<p>This portal is your resource for staying informed and engaged. Together, we are stronger.</p>
<p>In solidarity,<br/>CUPE Local 411 Executive</p>`,
    isPrivate: false,
    isPinned: true,
    imageUrl: null,
  },
  {
    title: 'General Membership Meeting Agenda — March 12, 2026',
    content: `<p>Dear Members,</p>
<p>Our next General Membership Meeting is scheduled for <strong>Thursday, March 12, 2026 via Zoom</strong>. Registration is required to attend.</p>
<p><strong>Register here:</strong> <a href="https://411.cupe.ca">411.cupe.ca</a></p>
<p><strong>Meeting Agenda:</strong></p>
<ol>
<li>Call to order and Land Acknowledgement</li>
<li>Roll call of officers</li>
<li>Adoption of agenda</li>
<li>Reading and adoption of previous meeting minutes</li>
<li>Correspondence</li>
<li>Financial report</li>
<li>Executive reports (President, Vice Presidents, Treasurer, Secretary)</li>
<li>Steward reports by division</li>
<li>Health & Safety Committee report</li>
<li>Bargaining update</li>
<li>New business</li>
<li>Good and welfare</li>
<li>Adjournment</li>
</ol>
<p><strong>Convention Draw:</strong> Members who have attended at least 3 of 5 meetings from May to March are eligible for a draw for an opportunity to attend the <strong>CUPE BC Convention (April 29–May 2, Victoria)</strong>.</p>
<p>We look forward to seeing you there!</p>`,
    isPrivate: false,
    isPinned: true,
    imageUrl: null,
  },
  {
    title: 'Honouring and Supporting the Tumbler Ridge School Community',
    content: `<p>CUPE Local 411 stands in solidarity with the school community of Tumbler Ridge during this incredibly difficult time.</p>
<p>Our hearts go out to all the students, families, and education workers who have been affected. School support workers — education assistants, custodians, bus drivers, and clerical staff — are the heart of school communities, and we know how deeply our members feel the weight of supporting children and families through hardship.</p>
<p>If you are struggling emotionally or need support, please know that your union and your colleagues are here for you. Resources are available through:</p>
<ul>
<li><strong>Employee and Family Assistance Plan (EFAP)</strong> — available to all members, free and confidential</li>
<li>Your steward or the union office: <a href="mailto:unionoffice@cupe411.ca">unionoffice@cupe411.ca</a> | 604-392-1411</li>
<li>Crisis Line BC: 1-800-784-2433 (1-800-SUICIDE)</li>
</ul>
<p>In moments like these, we are reminded why public services and the people who provide them matter so deeply.</p>
<p>In solidarity and with care,<br/>CUPE Local 411 Executive</p>`,
    isPrivate: false,
    isPinned: false,
    imageUrl: null,
  },
  {
    title: 'Collective Agreement 2022–2025 Now Available',
    content: `<p>The CUPE Local 411 Collective Agreement covering July 1, 2022 to June 30, 2025 is now available for download in the Files section of this portal.</p>
<p>This three-year agreement was negotiated with Chilliwack School District #33 and includes key provisions for all five divisions: Assistants, Clerical, Custodial, Maintenance, and Transportation.</p>
<p><strong>Key improvements in this agreement include:</strong></p>
<ul>
<li>Wage increases across the agreement term</li>
<li>Updated annual vacation language (see Bargaining 2022 Summary for details)</li>
<li>Enhanced health and safety provisions</li>
<li>Improved seniority and job posting provisions</li>
<li>Strengthened language for Education Assistants working with complex needs students</li>
</ul>
<p><strong>Note:</strong> Italicized language in the agreement indicates new language introduced (or housekeeping updates) from this round of bargaining.</p>
<p>Contact your division steward or the union office if you have questions about how the agreement applies to your work: <strong>unionoffice@cupe411.ca</strong> or <strong>604-392-1411</strong>.</p>`,
    isPrivate: false,
    isPinned: false,
    imageUrl: null,
  },
  {
    title: 'Health & Safety: Your Rights in the Workplace',
    content: `<p>Every CUPE 411 member has fundamental health and safety rights under the BC Workers Compensation Act and our Collective Agreement.</p>
<p><strong>Your three core rights are:</strong></p>
<ol>
<li><strong>Right to Know</strong> — You have the right to know about workplace hazards, including any WHMIS-regulated materials you work with.</li>
<li><strong>Right to Participate</strong> — You have the right to participate in the Joint Health & Safety Committee process and to raise safety concerns without fear of reprisal.</li>
<li><strong>Right to Refuse</strong> — If you have reasonable grounds to believe a task is unsafe, you have the right to refuse that work. Contact your steward immediately if you need to exercise this right.</li>
</ol>
<p><strong>Specific hazards to be aware of in your role:</strong></p>
<ul>
<li>EAs/Assistants: Workplace violence, ergonomic risks, communicable disease protocols</li>
<li>Custodians: Chemical handling (WHMIS), slip/trip hazards, lifting protocols</li>
<li>Maintenance: Electrical safety, fall protection, tool use protocols</li>
<li>Transportation: Driver fatigue, vehicle safety inspections, student management protocols</li>
<li>Clerical: Ergonomic workstations, repetitive strain prevention</li>
</ul>
<p>For Health & Safety concerns, contact Chief Shop Steward Kari Miller at <a href="mailto:chiefshopsteward@cupe411.ca">chiefshopsteward@cupe411.ca</a> or the union office.</p>`,
    isPrivate: false,
    isPinned: false,
    imageUrl: null,
  },
  {
    title: 'Bursary & Scholarship Program — Annual Applications Open',
    content: `<p>CUPE Local 411 is proud to offer bursaries and scholarships to members and their dependents pursuing post-secondary education.</p>
<p>Our bursary program is one of the ways we invest in our members and their families — because education matters, and unions make it possible.</p>
<p><strong>Who can apply?</strong></p>
<ul>
<li>Members of CUPE Local 411 in good standing</li>
<li>Children and dependents of members in good standing</li>
<li>Applicants must be enrolled or accepted in a recognized post-secondary institution</li>
</ul>
<p><strong>How to apply:</strong></p>
<p>Download the application form from the Files section, complete it, and submit to the union office with required documentation before the deadline.</p>
<p><strong>Union Office:</strong><br/>
113-8472 Harvard Place, Chilliwack, BC V2P 7Z5<br/>
Phone: 604-392-1411<br/>
Email: <a href="mailto:unionoffice@cupe411.ca">unionoffice@cupe411.ca</a></p>`,
    isPrivate: false,
    isPinned: false,
    imageUrl: null,
  },
  {
    title: 'Employee and Family Assistance Plan (EFAP) — Confidential Support Available',
    content: `<p>Did you know that CUPE Local 411 members have access to a confidential Employee and Family Assistance Plan (EFAP)?</p>
<p>The EFAP provides free, professional support for you and your immediate family members, including:</p>
<ul>
<li>Mental health counselling</li>
<li>Stress and burnout support</li>
<li>Financial counselling</li>
<li>Substance use support</li>
<li>Family and relationship counselling</li>
<li>Legal consultation</li>
<li>Nutrition and wellness coaching</li>
</ul>
<p>All services are <strong>completely confidential</strong> — your employer will never be informed that you have accessed the program.</p>
<p>This benefit is part of your negotiated package. Don't leave it on the table. Accessing support is a sign of strength.</p>
<p>Contact the union office for EFAP access details or see the EFAP resource in the Files section.</p>`,
    isPrivate: false,
    isPinned: false,
    imageUrl: null,
  },
];

const executivesData = [
  { name: 'April Mancinelli', title: 'President', email: 'president@cupe411.ca', phone: '604-392-1411', sortOrder: 1 },
  { name: 'Jeff Kasper', title: '1st Vice-President', email: 'vicepresident@cupe411.ca', phone: '604-392-1411', sortOrder: 2 },
  { name: 'Dale Obirek', title: '2nd Vice-President', email: '2ndvicepresident@cupe411.ca', phone: '604-392-1411', sortOrder: 3 },
  { name: 'Debbie Street', title: 'Treasurer', email: 'treasurer@cupe411.ca', phone: '604-392-1411', sortOrder: 4 },
  { name: 'Sharon Jackson', title: 'Secretary', email: 'secretary@cupe411.ca', phone: '604-392-1411', sortOrder: 5 },
  { name: 'Kari Miller', title: 'Chief Shop Steward', email: 'chiefshopsteward@cupe411.ca', phone: '604-392-1411', sortOrder: 6 },
  { name: 'Agnieszka (Aggie) Malecki', title: 'Shop Steward — Assistants (1)', email: 'assistantsshopsteward1@cupe411.ca', phone: '604-392-1411', sortOrder: 7 },
  { name: 'Tammy Lambert', title: 'Shop Steward — Assistants (2)', email: 'assistantsshopsteward2@cupe411.ca', phone: '604-392-1411', sortOrder: 8 },
  { name: 'Kate Brown', title: 'Shop Steward — Clerical (1)', email: 'clericalshopsteward1@cupe411.ca', phone: '604-392-1411', sortOrder: 9 },
  { name: 'Jocelyn Holden', title: 'Shop Steward — Clerical (2)', email: 'clericalshopsteward2@cupe411.ca', phone: '604-392-1411', sortOrder: 10 },
];

const eventsData = [
  {
    title: 'General Membership Meeting — January 2026 (via Zoom)',
    description: 'Monthly general membership meeting via Zoom. Registration required — visit 411.cupe.ca to register. Agenda includes executive reports, steward updates, financial report, and new business.',
    location: 'Zoom (register at 411.cupe.ca)',
    startDate: new Date('2026-01-15T00:00:00'),
    endDate: new Date('2026-01-15T00:00:00'),
    startTime: '19:00',
    endTime: '20:30',
    isAllDay: false,
    isPrivate: false,
    category: 'meeting',
  },
  {
    title: 'Executive Meeting — January',
    description: 'Monthly executive committee meeting. Review of current grievances, financial update, division steward reports.',
    location: 'Union Office — 113-8472 Harvard Place, Chilliwack',
    startDate: new Date('2026-01-08T00:00:00'),
    endDate: new Date('2026-01-08T00:00:00'),
    startTime: '17:30',
    endTime: '19:30',
    isAllDay: false,
    isPrivate: true,
    category: 'meeting',
  },
  {
    title: 'Joint Health & Safety Committee Meeting — January',
    description: 'Monthly JHSC meeting with SD33 management representatives. Review incident reports, discuss outstanding safety items, and plan worksite inspections.',
    location: 'SD33 District Office — 8430 Cessna Drive, Chilliwack',
    startDate: new Date('2026-01-22T00:00:00'),
    endDate: new Date('2026-01-22T00:00:00'),
    startTime: '09:00',
    endTime: '11:00',
    isAllDay: false,
    isPrivate: true,
    category: 'meeting',
  },
  {
    title: 'General Membership Meeting — February 2026 (via Zoom)',
    description: 'Monthly general membership meeting via Zoom. Registration required. Agenda includes bargaining update, division reports, and member Q&A.',
    location: 'Zoom (register at 411.cupe.ca)',
    startDate: new Date('2026-02-12T00:00:00'),
    endDate: new Date('2026-02-12T00:00:00'),
    startTime: '19:00',
    endTime: '20:30',
    isAllDay: false,
    isPrivate: false,
    category: 'meeting',
  },
  {
    title: 'Family Day — Office Closed',
    description: 'CUPE Local 411 union office is closed in observance of Family Day (BC statutory holiday).',
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
    title: 'General Membership Meeting — March 12, 2026 (via Zoom)',
    description: 'Monthly general membership meeting via Zoom. Registration required. Members who attend at least 3 of 5 meetings (May–March) are eligible for the CUPE BC Convention draw.',
    location: 'Zoom (register at 411.cupe.ca)',
    startDate: new Date('2026-03-12T00:00:00'),
    endDate: new Date('2026-03-12T00:00:00'),
    startTime: '19:00',
    endTime: '20:30',
    isAllDay: false,
    isPrivate: false,
    category: 'meeting',
  },
  {
    title: 'EA Professional Development Day',
    description: 'Professional development training for Education Assistants and other Assistants division members. Topics include de-escalation strategies, supporting students with complex needs, and self-care for support workers.',
    location: 'G.W. Graham Middle School — Gymnasium',
    startDate: new Date('2026-03-20T00:00:00'),
    endDate: new Date('2026-03-20T00:00:00'),
    startTime: '08:30',
    endTime: '15:00',
    isAllDay: false,
    isPrivate: false,
    category: 'training',
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
    title: 'CUPE BC Convention 2026 — Victoria',
    description: 'CUPE BC Annual Convention, April 29–May 2 in Victoria. Members drawn from our attendance incentive are eligible to attend as delegates. Contact the union office for details.',
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
    title: 'General Membership Meeting — April 2026 (via Zoom)',
    description: 'Monthly general membership meeting via Zoom. Registration required. Annual financial review, election of officers for vacant positions, and member feedback.',
    location: 'Zoom (register at 411.cupe.ca)',
    startDate: new Date('2026-04-09T00:00:00'),
    endDate: new Date('2026-04-09T00:00:00'),
    startTime: '19:00',
    endTime: '20:30',
    isAllDay: false,
    isPrivate: false,
    category: 'meeting',
  },
  {
    title: 'Victoria Day — Office Closed',
    description: 'Union office closed in observance of Victoria Day statutory holiday.',
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
    title: 'General Membership Meeting — May 2026 (via Zoom)',
    description: 'Year-end general membership meeting via Zoom. Registration required. End of year financial review, bursary award announcements, and planning for next year.',
    location: 'Zoom (register at 411.cupe.ca)',
    startDate: new Date('2026-05-14T00:00:00'),
    endDate: new Date('2026-05-14T00:00:00'),
    startTime: '19:00',
    endTime: '20:30',
    isAllDay: false,
    isPrivate: false,
    category: 'meeting',
  },
  {
    title: 'Custodial Division — Summer Worksite Training',
    description: 'Annual summer training day for Custodial division members. Topics: updated WHMIS procedures, new cleaning protocols, equipment safety, and summer deep-clean schedule coordination.',
    location: 'Chilliwack Secondary School — Staff Room',
    startDate: new Date('2026-07-08T00:00:00'),
    endDate: new Date('2026-07-08T00:00:00'),
    startTime: '08:00',
    endTime: '14:00',
    isAllDay: false,
    isPrivate: true,
    category: 'training',
  },
  {
    title: 'Transportation Division — Bus Driver Recertification',
    description: 'Annual bus driver recertification day for Transportation division members. Class 2 licence requirements review, student safety protocols, and emergency procedures refresher.',
    location: 'SD33 Transportation Depot, Chilliwack',
    startDate: new Date('2026-08-19T00:00:00'),
    endDate: new Date('2026-08-19T00:00:00'),
    startTime: '07:30',
    endTime: '15:00',
    isAllDay: false,
    isPrivate: true,
    category: 'training',
  },
];

const filesData = [
  {
    name: 'CUPE Local 411 Collective Agreement 2022–2025',
    fileUrl: 'https://411.cupe.ca/wp-content/blogs.dir/273/cupe-sd-33-collective-agreement-jul-1-2022-to-jun-30-2025-signed.pdf',
    fileType: 'application/pdf',
    isPrivate: false,
    category: 'Collective Agreement',
  },
  {
    name: 'Collective Agreement 2019–2022 (Previous)',
    fileUrl: 'https://411.cupe.ca/wp-content/blogs.dir/273/2021/04/CUPE-Local-411-Collective-Agreement-July-1-2019-June-30-2022-FINAL.pdf',
    fileType: 'application/pdf',
    isPrivate: false,
    category: 'Collective Agreement',
  },
  {
    name: '2022 Bargaining — Annual Vacation Information',
    fileUrl: 'https://411.cupe.ca/wp-content/blogs.dir/273/2023/08/2022-Bargaining-Annual-Vacation-Information.pdf',
    fileType: 'application/pdf',
    isPrivate: false,
    category: 'Collective Agreement',
  },
  {
    name: 'Annual Vacation Carryover Calculator (2022–2023)',
    fileUrl: 'https://411.cupe.ca/wp-content/blogs.dir/273/2023/08/Annual-Vacation-Carryover-Calculator-for-2022-2023-1.xlsx',
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    isPrivate: false,
    category: 'Collective Agreement',
  },
  {
    name: 'CUPE Local 411 Bylaws',
    fileUrl: 'https://411.cupe.ca/bylaws/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Governance',
  },
  {
    name: 'Bursary & Scholarship Application',
    fileUrl: 'https://411.cupe.ca/bursary-scholarships/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Member Benefits',
  },
  {
    name: 'Employee and Family Assistance Plan (EFAP)',
    fileUrl: 'https://411.cupe.ca/employee-and-family-assistance-plan/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Member Benefits',
  },
  {
    name: 'Health Benefits Information',
    fileUrl: 'https://411.cupe.ca/health-benefits/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Member Benefits',
  },
  {
    name: 'BC Pension Plan (SD33 Members)',
    fileUrl: 'https://411.cupe.ca/pensions/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Member Benefits',
  },
  {
    name: 'Health and Wellness Fund',
    fileUrl: 'https://411.cupe.ca/health-and-wellness-fund/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Member Benefits',
  },
  {
    name: 'Health & Safety Resources',
    fileUrl: 'https://411.cupe.ca/health-and-safety/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Health & Safety',
  },
  {
    name: 'Joint Job Evaluation Committee (JJEC) Information',
    fileUrl: 'https://411.cupe.ca/joint-job-evaluation-committee/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Governance',
  },
  {
    name: 'Negotiated Funds Information',
    fileUrl: 'https://411.cupe.ca/negotiated-funds/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Governance',
  },
  {
    name: 'Member-to-Member Conflict Resolution Process',
    fileUrl: 'https://411.cupe.ca/member-to-member-conflict-resolution/',
    fileType: 'text/html',
    isPrivate: false,
    category: 'Governance',
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
    name: 'Chilliwack School District 33',
    fileUrl: 'https://www.sd33.bc.ca/',
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
  return `CUPE411-${String(index + 1001).padStart(5, '0')}`;
}

async function seedCUPE411Demo() {
  console.log('Starting CUPE Local 411 demo seed...\n');

  // ==================== CREATE/VERIFY UNION ====================
  console.log('=== Setting up CUPE Local 411 union ===');

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
        themeColor: '#C8102E',
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
          ${'411'},
          ${'CUPE Local 411'},
          ${'#C8102E'},
          ${'CUPE Local 411 represents close to 1,100 members in the K-12 Sector within Chilliwack School District #33. Our members work across five divisions: Assistants (Education Assistants, Special Needs EAs, Indigenous Education Support Workers, Speech/Language Assistants, Early Childhood Educators, and Cooks), Clerical (Administrative Secretaries, Accounting Clerks, and Library Assistants), Custodial, Maintenance (Carpenters, Electricians, Plumbers, Groundskeepers, and Technology Technicians), and Transportation (Bus Drivers, Mechanics, and Fleet Custodians). Our local operates with local autonomy through its own bylaws and our negotiated Collective Agreement. We are committed to fair wages, safe workplaces, and the dignity of all our members.'},
          ${'unionoffice@cupe411.ca'},
          ${'604-392-1411'},
          ${'113-8472 Harvard Place, Chilliwack, BC V2P 7Z5'},
          ${'https://411.cupe.ca/'},
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
          localNumber: '411',
          publicName: 'CUPE Local 411',
          themeColor: '#C8102E',
          about: 'CUPE Local 411 represents close to 1,100 members in the K-12 Sector within Chilliwack School District #33. Our members work across five divisions: Assistants (Education Assistants, Special Needs EAs, Indigenous Education Support Workers, Speech/Language Assistants, Early Childhood Educators, and Cooks), Clerical (Administrative Secretaries, Accounting Clerks, and Library Assistants), Custodial, Maintenance (Carpenters, Electricians, Plumbers, Groundskeepers, and Technology Technicians), and Transportation (Bus Drivers, Mechanics, and Fleet Custodians). Our local operates with local autonomy through its own bylaws and our negotiated Collective Agreement. We are committed to fair wages, safe workplaces, and the dignity of all our members.',
          email: 'unionoffice@cupe411.ca',
          phone: '604-392-1411',
          address: '113-8472 Harvard Place, Chilliwack, BC V2P 7Z5',
          website: 'https://411.cupe.ca/',
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

  // ==================== CREATE OWNER USER (President April Mancinelli) ====================
  console.log('=== Creating owner user (President April Mancinelli) ===');

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
        name: 'April Mancinelli',
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
      firstName: 'April',
      lastName: 'Mancinelli',
      memberId: 'CUPE411-PRES',
      membershipStatus: 'active',
      votingStatus: 'eligible',
      jobTitle: 'President',
      employer: 'School District No. 33 (Chilliwack)',
      worksite: 'SD33 District Office',
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
      contactEmail: 'unionoffice@cupe411.ca',
      contactPhone: '604-392-1411',
      contactAddress: '113-8472 Harvard Place, Chilliwack, BC V2P 7Z5',
      officeHours: 'Monday–Wednesday: 8:00 a.m. to 4:00 p.m. | Thursday: Closed (or by appointment) | Friday: 8:00 a.m. to 4:00 p.m. | Office hours may vary depending on meetings, events, and statutory holidays.',
      contactFormEnabled: true,
      contactFormEmail: 'unionoffice@cupe411.ca',
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
    if (index < 26) return { status: 'approved', membershipStatus: 'active', votingStatus: 'eligible' };
    if (index < 30) return { status: 'pending', membershipStatus: 'active', votingStatus: 'ineligible' };
    if (index < 33) return { status: 'approved', membershipStatus: 'inactive', votingStatus: 'ineligible' };
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
    const divisionTitles = jobTitlesByDivision[m.division] || jobTitlesByDivision['Assistants'];
    const jobTitle = divisionTitles[Math.floor(Math.random() * divisionTitles.length)];
    const worksite = chilliwackSchools[Math.floor(Math.random() * chilliwackSchools.length)];
    const startDate = randomDate(new Date('2005-01-01'), new Date('2024-06-30'));
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
      city: 'Chilliwack',
      province: 'BC',
      employer: 'School District No. 33 (Chilliwack)',
      jobTitle,
      worksite,
      department: m.division,
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

  console.log('=== CUPE Local 411 demo seed complete! ===\n');
  console.log(`Union: CUPE Local 411 (slug: ${DEMO_SLUG}, id: ${union.id})`);
  console.log(`Login URL: /${DEMO_SLUG}`);
  console.log(`Owner login: ${DEMO_OWNER_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`isDemo: ${union.isDemo}`);
}

seedCUPE411Demo()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
