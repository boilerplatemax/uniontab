import { db } from './drizzle';
import { users, unions, members } from './schema';
import { eq, inArray } from 'drizzle-orm';

// The emails of mock users we created
const mockUserEmails = [
  'james.macdonald@gmail.com',
  'emily.thompson@outlook.com',
  'michael.chen@yahoo.ca',
  'sarah.martin@gmail.com',
  'david.wilson@hotmail.com',
  'jessica.brown@gmail.com',
  'christopher.lee@outlook.com',
  'ashley.taylor@yahoo.ca',
  'matthew.anderson@gmail.com',
  'amanda.white@hotmail.com',
  'daniel.harris@gmail.com',
  'jennifer.clark@outlook.com',
  'andrew.lewis@yahoo.ca',
  'stephanie.robinson@gmail.com',
  'joshua.walker@hotmail.com',
  'nicole.hall@gmail.com',
  'ryan.young@outlook.com',
  'megan.king@yahoo.ca',
  'brandon.wright@gmail.com',
  'lauren.scott@hotmail.com',
  'kevin.green@gmail.com',
  'rachel.baker@outlook.com',
  'justin.adams@yahoo.ca',
  'samantha.nelson@gmail.com',
  'tyler.mitchell@hotmail.com',
];

async function cleanupMockData() {
  console.log('Starting cleanup of mock data...\n');

  // 1. Delete the accidentally created union (id: 17, slug: atu-123)
  const deletedUnion = await db
    .delete(unions)
    .where(eq(unions.slug, 'atu-123'))
    .returning();

  if (deletedUnion.length > 0) {
    console.log(`Deleted union: ${deletedUnion[0].name} (id: ${deletedUnion[0].id})`);
    console.log('  (This also deleted any associated member records via cascade)');
  } else {
    console.log('Union with slug "atu-123" not found (already deleted or never created)');
  }

  // 2. Delete the mock users
  const deletedUsers = await db
    .delete(users)
    .where(inArray(users.email, mockUserEmails))
    .returning();

  console.log(`\nDeleted ${deletedUsers.length} mock users`);

  if (deletedUsers.length > 0) {
    console.log('Deleted users:');
    deletedUsers.forEach((u) => console.log(`  - ${u.name} (${u.email})`));
  }

  console.log('\n--- Cleanup Complete ---');
}

cleanupMockData()
  .catch((error) => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Cleanup finished. Exiting...');
    process.exit(0);
  });
