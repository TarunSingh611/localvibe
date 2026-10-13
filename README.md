# LocalVibe

**Your neighborhood, connected.** LocalVibe is a hyperlocal community app: a neighborhood feed, events, a free local marketplace, private messaging, a live map and emergency alerts with official emergency numbers.

Everything runs on free tiers: Vercel Hobby, MongoDB Atlas M0, Cloudinary Free, Resend Free and OpenStreetMap.

## Features

| Area | What's included |
| --- | --- |
| Accounts | Email/password sign-up, optional Google sign-in, password reset by email, profile with avatar, bio and neighborhood |
| Feed | Posts by type (community, event, question, lost & found, emergency), photos, tags, likes, comments, search, latest/top sort, distance filter |
| Marketplace | Listings with up to 6 photos, categories, condition, price or free, saved items, mark as sold, message seller |
| Messages | One-to-one conversations (optionally about a listing), unread badges, polling updates |
| Notifications | Likes, comments, nearby emergency alerts and moderation notices |
| Emergency | Official emergency numbers for about 60 countries (112 fallback), active alerts within your area (expire after 48 h), moderator-verified community contacts |
| Map | Leaflet + OpenStreetMap with posts, alerts and listings around you |
| Safety | Reporting (auto-hide at 5 reports), blocking, moderator dashboard (`/admin`), rate limiting, suspended accounts, security headers |
| Privacy | Neighborhood-level locations only, data export and account deletion in Settings |
| Launch | Landing page, Terms, Privacy, Community Guidelines, sitemap, robots, PWA manifest, generated icons and OpenGraph image |

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS · NextAuth v4 (JWT) · MongoDB driver · zod · Zustand · Cloudinary · Resend · Leaflet / react-leaflet

## Run locally

Requirements: Node.js 22.12+ (production uses Node 24, see `.nvmrc`) and a free MongoDB Atlas cluster.

```bash
npm install
cp env.example .env.local   # then fill in the values
npm run db:setup            # checks the DB connection and creates indexes
npm run dev
```

Open http://localhost:3000. To make yourself a moderator, put your email in `ADMIN_EMAILS` before signing up, or run `npm run db:setup` again after signing up.

Useful scripts: `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run smoke` (end-to-end API check against a running server; see [guidelinesForProject.md](guidelinesForProject.md)).

## Deploy for free

### 1. MongoDB Atlas (database)
1. Create a free **M0** cluster at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas).
2. **Database Access**: create a database user with a strong password.
3. **Network Access**: allow `0.0.0.0/0`. Vercel uses dynamic IPs, so the database user password is what protects it.
4. **Connect → Drivers**: copy the `mongodb+srv://` connection string into `MONGODB_URI`.

> Free M0 clusters pause after 60 days without activity. A paused cluster's hostname stops resolving and the app shows `querySrv ENOTFOUND`. Click **Resume** in Atlas to fix it.

### 2. Cloudinary (photos)
Create a free account at [cloudinary.com](https://cloudinary.com) and copy the cloud name, API key and API secret from the dashboard. Uploads are stored under `localvibe/avatars`, `localvibe/posts` and `localvibe/listings`.

### 3. Resend (email, recommended)
Create an API key at [resend.com](https://resend.com). To email anyone other than yourself, verify a domain in Resend and set `EMAIL_FROM` to an address on that domain. Without Resend, emails are written to the server log.

### 4. Vercel (hosting)
1. Push this repo to GitHub, then **Import Project** at [vercel.com/new](https://vercel.com/new).
2. Add every variable from `env.example` under **Settings → Environment Variables**. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production URL, for example `https://localvibe.vercel.app`.
3. Deploy. Indexes are created automatically on the first request.

### 5. Google sign-in (optional)
In Google Cloud Console, create an OAuth client (Web application) with the redirect URI `https://YOUR_DOMAIN/api/auth/callback/google`, then set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. The Google button appears only when both are set.

### Before you launch
- Replace the placeholder contact address by setting `CONTACT_EMAIL`, and have the Terms and Privacy pages reviewed for your jurisdiction.
- Set `ADMIN_EMAILS` so someone can review reports and approve emergency contacts.
- Busy maps should use a free tile provider key (MapTiler, Stadia) through `NEXT_PUBLIC_MAP_TILE_URL` to respect OpenStreetMap's fair-use policy.

## Free tier limits to watch

| Service | Free allowance |
| --- | --- |
| Vercel Hobby | 100 GB bandwidth/month, serverless functions (non-commercial use per Vercel terms; upgrade to Pro if you monetize) |
| MongoDB Atlas M0 | 512 MB storage, shared CPU |
| Cloudinary | 25 monthly credits (storage + bandwidth + transformations) |
| Resend | 3,000 emails/month, 100/day |
| OpenStreetMap tiles / Nominatim | Fair use; geocoding requests are proxied and cached by the server |

See [ARCHITECTURE.md](ARCHITECTURE.md) for how the code is organized.
