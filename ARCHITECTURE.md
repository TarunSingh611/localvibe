# Architecture

LocalVibe is a single Next.js 16 App Router application. Pages and JSON API routes live together and deploy to Vercel as serverless functions, backed by MongoDB Atlas.

```
src/
  app/                 Pages (server components that wrap *Client.tsx components) and API routes
    api/               JSON endpoints, each wrapped in route() from lib/api.ts
  components/          UI by feature: layout, posts, marketplace, map, location, shared, ui
  hooks/               useCounts (unread polling), usePaginated, useRequireAuth
  lib/                 Server and shared logic (see below)
  store/useStore.ts    Zustand: persisted location + radius, UI state
  types/index.ts       Constants, DB document types and API DTOs
scripts/setup-db.mjs   Connection check + index creation
```

## Server libraries (`src/lib`)

| File | Responsibility |
| --- | --- |
| `mongodb.ts` | Lazy cached client, `getDatabase()`, `toObjectId()`, `ensureIndexes()` (runs once per instance) |
| `auth.ts`, `session.ts` | NextAuth config (credentials + optional Google, JWT sessions); `getCurrentUser`, `requireUser`, `requireAdmin`, `requirePageUser` |
| `api.ts` | `route()` wrapper that turns `ApiError`/`ZodError` into JSON errors, `parseBody`, error helpers |
| `validation.ts` | zod schemas for every write endpoint |
| `rate-limit.ts` | Fixed-window limiter stored in MongoDB (`rateLimits`, TTL-cleaned) |
| `posts.ts`, `listings.ts`, `conversations.ts`, `serializers.ts` | Queries and conversion from documents to DTOs |
| `geo.ts` | GeoJSON helpers, Nominatim search and reverse geocoding |
| `cloudinary.ts`, `email.ts`, `notifications.ts` | Uploads, transactional email, in-app notifications |
| `emergency-numbers.ts` | Official emergency numbers by country |
| `client.ts` | Browser helpers: `api()`, `buildQuery()`, image compression and upload, `imageUrl()` |

## Key design decisions

- **Geo queries:** posts, listings and emergency contacts store a GeoJSON `location` with a `2dsphere` index and are filtered with `$geoWithin`/`$centerSphere`. Only the neighborhood name and approximate point are exposed.
- **Real-time without websockets:** unread counts poll every 25 s, open conversations every 5 s with `?after=`, and polling pauses when the tab is hidden. This works on serverless hosting at no extra cost.
- **Moderation:** reports auto-hide content at 5 reports; admins resolve them at `/admin` (dismiss, remove, or remove and suspend). Suspended users fail `requireUser`.
- **Emergency:** emergency posts expire after 48 h, high or critical alerts notify users within 10 km in the app, critical alerts also email up to 20 of them who allow it, and users can post at most 3 per day. Official numbers come from a curated table, never from user input. Community contacts need moderator approval.
- **Uploads:** images are compressed in the browser (max 1600 px), uploaded through `/api/upload` to Cloudinary, and only Cloudinary URLs pass validation.
- **Security:** CSP and other security headers in `next.config.ts`, bcrypt password hashes, hashed single-use reset tokens, rate limits on all write endpoints.

## Collections

`users`, `posts`, `comments`, `likes`, `listings`, `favorites`, `conversations`, `messages`, `notifications` (90-day TTL), `reports`, `emergencyContacts`, `passwordResets` (TTL), `rateLimits` (TTL).
