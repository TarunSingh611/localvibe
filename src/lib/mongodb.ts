import { MongoClient, Db, ObjectId } from 'mongodb';

const globalForMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoIndexesPromise?: Promise<void>;
};

function getClientPromise(): Promise<MongoClient> {
  if (!globalForMongo._mongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('Missing environment variable: "MONGODB_URI"');
    }
    const client = new MongoClient(uri, { maxPoolSize: 10 });
    globalForMongo._mongoClientPromise = client.connect();
  }
  return globalForMongo._mongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getClientPromise();
  const db = client.db(process.env.MONGODB_DB || 'localvibe');
  if (!globalForMongo._mongoIndexesPromise) {
    globalForMongo._mongoIndexesPromise = ensureIndexes(db).catch((error) => {
      globalForMongo._mongoIndexesPromise = undefined;
      console.error('Failed to create MongoDB indexes:', error);
    });
  }
  return db;
}

export function toObjectId(id: string): ObjectId | null {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id ? new ObjectId(id) : null;
}

export async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('users').createIndex({ username: 1 }, { unique: true }),

    db.collection('posts').createIndex({ location: '2dsphere' }),
    db.collection('posts').createIndex({ status: 1, createdAt: -1 }),
    db.collection('posts').createIndex({ authorId: 1, createdAt: -1 }),
    db.collection('posts').createIndex({ type: 1, status: 1, createdAt: -1 }),

    db.collection('comments').createIndex({ postId: 1, createdAt: 1 }),
    db.collection('likes').createIndex({ postId: 1, userId: 1 }, { unique: true }),
    db.collection('likes').createIndex({ userId: 1 }),

    db.collection('listings').createIndex({ location: '2dsphere' }),
    db.collection('listings').createIndex({ status: 1, createdAt: -1 }),
    db.collection('listings').createIndex({ sellerId: 1, createdAt: -1 }),
    db.collection('favorites').createIndex({ listingId: 1, userId: 1 }, { unique: true }),
    db.collection('favorites').createIndex({ userId: 1, createdAt: -1 }),

    db.collection('conversations').createIndex({ participants: 1, updatedAt: -1 }),
    db.collection('messages').createIndex({ conversationId: 1, createdAt: -1 }),

    db.collection('notifications').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('notifications').createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 60 * 60 * 24 * 90 }
    ),

    db.collection('reports').createIndex({ status: 1, createdAt: -1 }),
    db.collection('reports').createIndex({ targetId: 1, status: 1 }),
    db.collection('emergencyContacts').createIndex({ location: '2dsphere' }),
    db.collection('emergencyContacts').createIndex({ status: 1, 'place.countryCode': 1 }),

    db.collection('passwordResets').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('passwordResets').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('rateLimits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]).then(() => undefined);
}
