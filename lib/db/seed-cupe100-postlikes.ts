import { db } from './drizzle';
import { postLikes } from './schema';
import { sql } from 'drizzle-orm';

// Seed post likes for CUPE Local 100 demo
// Posts: 20–26 | Users: 224–274 | Starting postlike_id: 9
async function seedCUPE100PostLikes() {
  console.log('Seeding post likes for CUPE Local 100...\n');

  // Distribute likes across posts 20–26 using a varied, realistic spread.
  // Not every user likes every post — simulate organic engagement.
  const postUserPairs: { postId: number; userId: number }[] = [
    // Post 20 — pinned welcome post, high engagement
    { postId: 20, userId: 224 },
    { postId: 20, userId: 225 },
    { postId: 20, userId: 226 },
    { postId: 20, userId: 227 },
    { postId: 20, userId: 228 },
    { postId: 20, userId: 229 },
    { postId: 20, userId: 230 },
    { postId: 20, userId: 231 },
    { postId: 20, userId: 232 },
    { postId: 20, userId: 233 },
    { postId: 20, userId: 234 },
    { postId: 20, userId: 235 },

    // Post 21 — collective agreement ratification, very high engagement
    { postId: 21, userId: 224 },
    { postId: 21, userId: 225 },
    { postId: 21, userId: 226 },
    { postId: 21, userId: 227 },
    { postId: 21, userId: 228 },
    { postId: 21, userId: 229 },
    { postId: 21, userId: 230 },
    { postId: 21, userId: 231 },
    { postId: 21, userId: 232 },
    { postId: 21, userId: 233 },
    { postId: 21, userId: 234 },
    { postId: 21, userId: 235 },
    { postId: 21, userId: 236 },
    { postId: 21, userId: 237 },
    { postId: 21, userId: 238 },
    { postId: 21, userId: 239 },
    { postId: 21, userId: 240 },
    { postId: 21, userId: 241 },

    // Post 22 — PPE / safety alert, moderate engagement
    { postId: 22, userId: 224 },
    { postId: 22, userId: 226 },
    { postId: 22, userId: 228 },
    { postId: 22, userId: 230 },
    { postId: 22, userId: 232 },
    { postId: 22, userId: 234 },
    { postId: 22, userId: 236 },
    { postId: 22, userId: 238 },
    { postId: 22, userId: 240 },
    { postId: 22, userId: 242 },
    { postId: 22, userId: 244 },

    // Post 23 — AGM notice, moderate engagement
    { postId: 23, userId: 225 },
    { postId: 23, userId: 227 },
    { postId: 23, userId: 229 },
    { postId: 23, userId: 231 },
    { postId: 23, userId: 233 },
    { postId: 23, userId: 235 },
    { postId: 23, userId: 237 },
    { postId: 23, userId: 239 },
    { postId: 23, userId: 241 },
    { postId: 23, userId: 243 },

    // Post 24 — grievance win, high engagement
    { postId: 24, userId: 224 },
    { postId: 24, userId: 225 },
    { postId: 24, userId: 226 },
    { postId: 24, userId: 227 },
    { postId: 24, userId: 229 },
    { postId: 24, userId: 231 },
    { postId: 24, userId: 233 },
    { postId: 24, userId: 235 },
    { postId: 24, userId: 237 },
    { postId: 24, userId: 239 },
    { postId: 24, userId: 241 },
    { postId: 24, userId: 243 },
    { postId: 24, userId: 245 },
    { postId: 24, userId: 247 },

    // Post 25 — solidarity / social post, varied engagement
    { postId: 25, userId: 246 },
    { postId: 25, userId: 247 },
    { postId: 25, userId: 248 },
    { postId: 25, userId: 249 },
    { postId: 25, userId: 250 },
    { postId: 25, userId: 251 },
    { postId: 25, userId: 252 },
    { postId: 25, userId: 253 },
    { postId: 25, userId: 254 },
    { postId: 25, userId: 255 },
    { postId: 25, userId: 256 },
    { postId: 25, userId: 257 },
    { postId: 25, userId: 258 },

    // Post 26 — MAP / mental health support post, broad engagement
    { postId: 26, userId: 258 },
    { postId: 26, userId: 259 },
    { postId: 26, userId: 260 },
    { postId: 26, userId: 261 },
    { postId: 26, userId: 262 },
    { postId: 26, userId: 263 },
    { postId: 26, userId: 264 },
    { postId: 26, userId: 265 },
    { postId: 26, userId: 266 },
    { postId: 26, userId: 267 },
    { postId: 26, userId: 268 },
    { postId: 26, userId: 269 },
    { postId: 26, userId: 270 },
    { postId: 26, userId: 271 },
    { postId: 26, userId: 272 },
    { postId: 26, userId: 273 },
    { postId: 26, userId: 274 },
  ];

  // Advance the sequence so IDs start at 9
  await db.execute(sql`SELECT setval('post_likes_id_seq', 8, true)`);

  // Insert with ON CONFLICT DO NOTHING to safely re-run
  let inserted = 0;
  for (const pair of postUserPairs) {
    try {
      await db.execute(
        sql`INSERT INTO post_likes (post_id, user_id) VALUES (${pair.postId}, ${pair.userId}) ON CONFLICT DO NOTHING`
      );
      inserted++;
    } catch (err: any) {
      console.warn(`  Skipped (${pair.postId}, ${pair.userId}): ${err.message}`);
    }
  }

  console.log(`Successfully inserted ${inserted} post likes (out of ${postUserPairs.length} attempted)`);
  console.log('Likes by post:');
  const byPost: Record<number, number> = {};
  postUserPairs.forEach(({ postId }) => { byPost[postId] = (byPost[postId] ?? 0) + 1; });
  Object.entries(byPost).forEach(([postId, count]) => {
    console.log(`  Post ${postId}: ${count} likes`);
  });
}

seedCUPE100PostLikes()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('\nSeed process finished. Exiting...');
    process.exit(0);
  });
