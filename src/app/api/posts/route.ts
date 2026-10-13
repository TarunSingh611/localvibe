import { ObjectId } from 'mongodb';
import { after } from 'next/server';
import { route, ok, parseBody, badRequest } from '@/lib/api';
import { getCurrentUser, requireUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { createPostSchema } from '@/lib/validation';
import { postsCollection, queryPosts, hydratePosts } from '@/lib/posts';
import { geoPoint, withinRadius } from '@/lib/geo';
import { usersCollection } from '@/lib/users';
import { notifyMany, truncate } from '@/lib/notifications';
import { toObjectId } from '@/lib/mongodb';
import { sendEmail, appUrl } from '@/lib/email';
import { escapeHtml } from '@/lib/utils';
import { POST_TYPES, type PostDoc, type PostType } from '@/types';

export const dynamic = 'force-dynamic';

/** Keeps a single alert well inside Resend's free quota of 100 emails per day. */
const MAX_ALERT_EMAILS = 20;

function numberParam(value: string | null): number | undefined {
  if (value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const viewer = await getCurrentUser();
  const type = searchParams.get('type');

  const result = await queryPosts({
    viewerId: viewer?._id,
    lat: numberParam(searchParams.get('lat')),
    lng: numberParam(searchParams.get('lng')),
    radiusKm: numberParam(searchParams.get('radiusKm')),
    type: type && (POST_TYPES as readonly string[]).includes(type) ? (type as PostType) : undefined,
    q: searchParams.get('q')?.trim() || undefined,
    sort: searchParams.get('sort') === 'top' ? 'top' : 'latest',
    activeEmergenciesOnly: searchParams.get('active') === '1',
    authorId: toObjectId(searchParams.get('author') ?? '') ?? undefined,
    cursor: searchParams.get('cursor'),
    limit: numberParam(searchParams.get('limit')),
  });

  return ok(result);
});

export const POST = route(async (request) => {
  const user = await requireUser();
  await rateLimit({ key: `post:${user._id}`, limit: 15, windowSeconds: 3600 });
  const input = await parseBody(request, createPostSchema);

  if (input.type === 'emergency') {
    await rateLimit({ key: `emergency:${user._id}`, limit: 3, windowSeconds: 86400 });
  }
  if (input.type === 'event' && input.event && input.event.startsAt.getTime() < Date.now() - 3600_000) {
    throw badRequest('Event start time must be in the future');
  }

  const now = new Date();
  const post: PostDoc = {
    _id: new ObjectId(),
    authorId: user._id,
    type: input.type,
    text: input.text,
    images: input.images,
    tags: [...new Set(input.tags)],
    location: geoPoint(input.location.latitude, input.location.longitude),
    place: input.location.place,
    event: input.type === 'event' ? input.event : undefined,
    emergency: input.type === 'emergency' ? input.emergency : undefined,
    likeCount: 0,
    commentCount: 0,
    reportCount: 0,
    status: 'active',
    expiresAt: input.type === 'emergency' ? new Date(now.getTime() + 48 * 3600 * 1000) : undefined,
    createdAt: now,
    updatedAt: now,
  };

  const posts = await postsCollection();
  await posts.insertOne(post);

  if (post.type === 'emergency' && post.emergency && ['high', 'critical'].includes(post.emergency.severity)) {
    const users = await usersCollection();
    const nearby = await users
      .find(
        {
          _id: { $ne: user._id },
          banned: { $ne: true },
          location: withinRadius(input.location.latitude, input.location.longitude, 10),
        },
        { projection: { _id: 1, email: 1, preferences: 1 } }
      )
      .limit(1000)
      .toArray();
    if (post.emergency.severity === 'critical') {
      const recipients = nearby.filter((u) => u.preferences?.emailNotifications).slice(0, MAX_ALERT_EMAILS);
      const place = escapeHtml(post.place.label);
      after(() =>
        Promise.allSettled(
          recipients.map((u) =>
            sendEmail({
              to: u.email,
              subject: `Critical alert near ${post.place.label}`,
              heading: `Critical alert near ${place}`,
              body: `${escapeHtml(truncate(post.text, 300))}<br><br>If you are in danger, call your local emergency number first.`,
              cta: { label: 'View alert', url: `${appUrl()}/posts/${post._id}` },
            })
          )
        )
      );
    }
    await notifyMany(
      nearby.map((u) => ({
        userId: u._id,
        type: 'emergency' as const,
        actorId: user._id,
        text: `Emergency near ${post.place.label}: ${truncate(post.text, 80)}`,
        link: `/posts/${post._id}`,
      }))
    );
  }

  const [dto] = await hydratePosts([post], user._id, input.location);
  return ok(dto, { status: 201 });
});
