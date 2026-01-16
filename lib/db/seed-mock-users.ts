import { db } from './drizzle';
import { users, unions, members } from './schema';
import { hashPassword } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

// 25 realistic Canadian mock users
const mockUsers = [
  { firstName: 'James', lastName: 'MacDonald', email: 'james.macdonald@gmail.com', phone: '+1 416-555-0101' },
  { firstName: 'Emily', lastName: 'Thompson', email: 'emily.thompson@outlook.com', phone: '+1 604-555-0102' },
  { firstName: 'Michael', lastName: 'Chen', email: 'michael.chen@yahoo.ca', phone: '+1 905-555-0103' },
  { firstName: 'Sarah', lastName: 'Martin', email: 'sarah.martin@gmail.com', phone: '+1 403-555-0104' },
  { firstName: 'David', lastName: 'Wilson', email: 'david.wilson@hotmail.com', phone: '+1 514-555-0105' },
  { firstName: 'Jessica', lastName: 'Brown', email: 'jessica.brown@gmail.com', phone: '+1 780-555-0106' },
  { firstName: 'Christopher', lastName: 'Lee', email: 'christopher.lee@outlook.com', phone: '+1 647-555-0107' },
  { firstName: 'Ashley', lastName: 'Taylor', email: 'ashley.taylor@yahoo.ca', phone: '+1 250-555-0108' },
  { firstName: 'Matthew', lastName: 'Anderson', email: 'matthew.anderson@gmail.com', phone: '+1 306-555-0109' },
  { firstName: 'Amanda', lastName: 'White', email: 'amanda.white@hotmail.com', phone: '+1 204-555-0110' },
  { firstName: 'Daniel', lastName: 'Harris', email: 'daniel.harris@gmail.com', phone: '+1 613-555-0111' },
  { firstName: 'Jennifer', lastName: 'Clark', email: 'jennifer.clark@outlook.com', phone: '+1 519-555-0112' },
  { firstName: 'Andrew', lastName: 'Lewis', email: 'andrew.lewis@yahoo.ca', phone: '+1 902-555-0113' },
  { firstName: 'Stephanie', lastName: 'Robinson', email: 'stephanie.robinson@gmail.com', phone: '+1 506-555-0114' },
  { firstName: 'Joshua', lastName: 'Walker', email: 'joshua.walker@hotmail.com', phone: '+1 709-555-0115' },
  { firstName: 'Nicole', lastName: 'Hall', email: 'nicole.hall@gmail.com', phone: '+1 867-555-0116' },
  { firstName: 'Ryan', lastName: 'Young', email: 'ryan.young@outlook.com', phone: '+1 418-555-0117' },
  { firstName: 'Megan', lastName: 'King', email: 'megan.king@yahoo.ca', phone: '+1 450-555-0118' },
  { firstName: 'Brandon', lastName: 'Wright', email: 'brandon.wright@gmail.com', phone: '+1 819-555-0119' },
  { firstName: 'Lauren', lastName: 'Scott', email: 'lauren.scott@hotmail.com', phone: '+1 289-555-0120' },
  { firstName: 'Kevin', lastName: 'Green', email: 'kevin.green@gmail.com', phone: '+1 587-555-0121' },
  { firstName: 'Rachel', lastName: 'Baker', email: 'rachel.baker@outlook.com', phone: '+1 236-555-0122' },
  { firstName: 'Justin', lastName: 'Adams', email: 'justin.adams@yahoo.ca', phone: '+1 343-555-0123' },
  { firstName: 'Samantha', lastName: 'Nelson', email: 'samantha.nelson@gmail.com', phone: '+1 365-555-0124' },
  { firstName: 'Tyler', lastName: 'Mitchell', email: 'tyler.mitchell@hotmail.com', phone: '+1 431-555-0125' },
];

async function seedMockUsers() {
  console.log('Starting mock users seed...');

  // Hash a common password for all mock users (they can reset it later)
  const passwordHash = await hashPassword('MockUser123!');

  // Find or create the ATU 123 union
  let union = await db.query.unions.findFirst({
    where: eq(unions.slug, 'atu-123'),
  });

  if (!union) {
    console.log('ATU 123 union not found, creating it...');
    const [newUnion] = await db
      .insert(unions)
      .values({
        name: 'ATU Local 123',
        slug: 'atu-123',
        localNumber: '123',
        description: 'Amalgamated Transit Union Local 123',
        theme: 'default',
        themeColor: '#2563eb',
      })
      .returning();
    union = newUnion;
    console.log('Created ATU Local 123 union');
  } else {
    console.log('Found existing ATU 123 union');
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (const mockUser of mockUsers) {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, mockUser.email),
    });

    if (existingUser) {
      console.log(`Skipping ${mockUser.email} - already exists`);
      skippedCount++;
      continue;
    }

    // Create the user
    const [user] = await db
      .insert(users)
      .values({
        name: `${mockUser.firstName} ${mockUser.lastName}`,
        email: mockUser.email,
        passwordHash: passwordHash,
        role: 'member',
        emailVerified: true, // Mark as verified - no email confirmation needed
      })
      .returning();

    // Create the member record linking user to union
    await db.insert(members).values({
      userId: user.id,
      unionId: union.id,
      role: 'member',
      status: 'approved', // Already approved - no approval needed
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      cellPhone: mockUser.phone,
      personalEmail: mockUser.email,
      allowEmails: true,
      allowTextMessages: true,
      allowPhoneCalls: true,
      membershipStatus: 'active',
      votingStatus: 'eligible',
      preferredLanguage: 'en',
    });

    console.log(`Created user: ${mockUser.firstName} ${mockUser.lastName} (${mockUser.email})`);
    createdCount++;
  }

  console.log('\n--- Seed Complete ---');
  console.log(`Created: ${createdCount} users`);
  console.log(`Skipped: ${skippedCount} users (already existed)`);
  console.log(`Union: ${union.name} (slug: ${union.slug})`);
  console.log('\nAll mock users have password: MockUser123!');
}

seedMockUsers()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
