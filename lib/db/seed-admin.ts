import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { db } from './drizzle';
import { users } from './schema';
import { hashPassword } from '@/lib/auth/password';
import { eq, isNull } from 'drizzle-orm';

const rl = readline.createInterface({ input, output });

async function prompt(question: string): Promise<string> {
  const answer = await rl.question(question);
  return answer.trim();
}

async function promptPassword(question: string): Promise<string> {
  // Note: This doesn't hide password input in terminal, but provides a basic implementation
  // For production, consider using a library like 'read' for hidden password input
  const password = await rl.question(question);
  return password.trim();
}

async function listUsers() {
  console.log('\n=== Current Users ===');
  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    emailVerified: users.emailVerified,
    createdAt: users.createdAt,
  }).from(users).where(isNull(users.deletedAt));

  if (allUsers.length === 0) {
    console.log('No users found.');
  } else {
    allUsers.forEach(user => {
      console.log(`\nID: ${user.id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
      console.log(`Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('---');
    });
  }
  console.log('');
}

async function addUser() {
  console.log('\n=== Add New User ===');

  const email = await prompt('Email: ');
  if (!email || !email.includes('@')) {
    console.log('Invalid email address.');
    return;
  }

  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser.length > 0) {
    console.log(`User with email ${email} already exists.`);
    return;
  }

  const name = await prompt('Name: ');
  if (!name) {
    console.log('Name is required.');
    return;
  }

  const password = await promptPassword('Password: ');
  if (!password || password.length < 6) {
    console.log('Password must be at least 6 characters.');
    return;
  }

  console.log('\nSelect role:');
  console.log('1. webmaster (full system admin)');
  console.log('2. owner (union owner)');
  console.log('3. admin (union admin)');
  console.log('4. member (regular member)');

  const roleChoice = await prompt('Enter role number (1-4): ');

  let role: string;
  switch (roleChoice) {
    case '1':
      role = 'webmaster';
      break;
    case '2':
      role = 'owner';
      break;
    case '3':
      role = 'admin';
      break;
    case '4':
      role = 'member';
      break;
    default:
      console.log('Invalid role selection.');
      return;
  }

  const emailVerifiedChoice = await prompt('Mark email as verified? (y/n): ');
  const emailVerified = emailVerifiedChoice.toLowerCase() === 'y';

  try {
    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        role,
        emailVerified,
      })
      .returning();

    console.log(`\n✓ User created successfully!`);
    console.log(`ID: ${newUser.id}`);
    console.log(`Name: ${newUser.name}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Role: ${newUser.role}`);
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

async function removeUser() {
  console.log('\n=== Remove User ===');

  await listUsers();

  const identifier = await prompt('Enter user ID or email to remove: ');
  if (!identifier) {
    console.log('User ID or email is required.');
    return;
  }

  // Find user by ID or email
  let userToRemove;
  if (/^\d+$/.test(identifier)) {
    // It's a number, search by ID
    const userId = parseInt(identifier);
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    userToRemove = result[0];
  } else {
    // Search by email
    const result = await db.select().from(users).where(eq(users.email, identifier)).limit(1);
    userToRemove = result[0];
  }

  if (!userToRemove) {
    console.log('User not found.');
    return;
  }

  console.log(`\nFound user:`);
  console.log(`ID: ${userToRemove.id}`);
  console.log(`Name: ${userToRemove.name}`);
  console.log(`Email: ${userToRemove.email}`);
  console.log(`Role: ${userToRemove.role}`);

  const confirm = await prompt('\nAre you sure you want to remove this user? (yes/no): ');
  if (confirm.toLowerCase() !== 'yes') {
    console.log('Removal cancelled.');
    return;
  }

  try {
    // Soft delete by setting deletedAt timestamp
    await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, userToRemove.id));

    console.log(`\n✓ User removed successfully (soft deleted).`);
  } catch (error) {
    console.error('Error removing user:', error);
  }
}

async function showMenu() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     Admin User Management Tool        ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('\n1. Add new user');
  console.log('2. Remove user');
  console.log('3. List all users');
  console.log('4. Exit');
  console.log('');

  const choice = await prompt('Select an option (1-4): ');

  switch (choice) {
    case '1':
      await addUser();
      return true;
    case '2':
      await removeUser();
      return true;
    case '3':
      await listUsers();
      return true;
    case '4':
      console.log('\nGoodbye!');
      return false;
    default:
      console.log('\nInvalid option. Please try again.');
      return true;
  }
}

async function main() {
  console.log('\n🔧 Starting Admin User Management Tool...\n');

  let continueRunning = true;
  while (continueRunning) {
    continueRunning = await showMenu();
  }

  rl.close();
  process.exit(0);
}

main()
  .catch((error) => {
    console.error('Error:', error);
    rl.close();
    process.exit(1);
  });
