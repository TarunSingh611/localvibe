// Verifies the MongoDB connection and creates all indexes. Usage: npm run db:setup
// The app also creates indexes on first request; running this up front avoids a slow first load.
import { existsSync, readFileSync } from 'node:fs';
import { MongoClient } from 'mongodb';

for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set. Add it to .env.local (see env.example).');
  process.exit(1);
}

const DAY = 60 * 60 * 24;
const INDEXES = {
  users: [[{ email: 1 }, { unique: true }], [{ username: 1 }, { unique: true }]],
  posts: [[{ location: '2dsphere' }], [{ status: 1, createdAt: -1 }], [{ authorId: 1, createdAt: -1 }], [{ type: 1, status: 1, createdAt: -1 }]],
  comments: [[{ postId: 1, createdAt: 1 }]],
  likes: [[{ postId: 1, userId: 1 }, { unique: true }], [{ userId: 1 }]],
  listings: [[{ location: '2dsphere' }], [{ status: 1, createdAt: -1 }], [{ sellerId: 1, createdAt: -1 }]],
  favorites: [[{ listingId: 1, userId: 1 }, { unique: true }], [{ userId: 1, createdAt: -1 }]],
  conversations: [[{ participants: 1, updatedAt: -1 }]],
  messages: [[{ conversationId: 1, createdAt: -1 }]],
  notifications: [[{ userId: 1, createdAt: -1 }], [{ createdAt: 1 }, { expireAfterSeconds: 90 * DAY }]],
  reports: [[{ status: 1, createdAt: -1 }], [{ targetId: 1, status: 1 }]],
  emergencyContacts: [[{ location: '2dsphere' }], [{ status: 1, 'place.countryCode': 1 }]],
  passwordResets: [[{ tokenHash: 1 }, { unique: true }], [{ expiresAt: 1 }, { expireAfterSeconds: 0 }]],
  rateLimits: [[{ expiresAt: 1 }, { expireAfterSeconds: 0 }]],
};

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'localvibe');
  await db.command({ ping: 1 });
  console.log(`Connected to database "${db.databaseName}"`);
  for (const [collection, indexes] of Object.entries(INDEXES)) {
    for (const [keys, options = {}] of indexes) {
      await db.collection(collection).createIndex(keys, options);
    }
    console.log(`  ✓ ${collection} (${indexes.length} indexes)`);
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (adminEmails.length) {
    const result = await db.collection('users').updateMany({ email: { $in: adminEmails } }, { $set: { role: 'admin' } });
    console.log(`  ✓ admin role ensured for ${result.matchedCount} existing account(s)`);
  }
  console.log('Database is ready.');
} catch (error) {
  console.error('Database setup failed:', error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
