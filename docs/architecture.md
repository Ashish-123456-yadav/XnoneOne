# NovaSocial AI Architecture

NovaSocial AI is organized as a modular monorepo so each domain can grow independently while sharing contracts.

## Runtime Shape

- Mobile app calls the NestJS REST API and receives FCM push notifications.
- API validates Firebase/JWT auth, serves feed/social workflows, and emits realtime notification events.
- MongoDB stores product data for the running API; the PostgreSQL schema is retained as a normalized reference.
- Redis is reserved for queues, rate limiting, sessions, fanout, and feed caches.
- Cloudflare R2 or S3 stores raw videos, thumbnails, and HLS output.
- FFmpeg workers transcode raw uploads into HLS renditions.
- AI providers are abstracted behind OpenAI, Gemini, and mock adapters.
- Admin dashboard calls protected admin APIs.

## Backend Modules

- `auth` - registration, login, Firebase exchange, JWTs, refresh tokens
- `users` - profile, follow graph
- `feed` - home/following pagination
- `posts` - posts, likes, comments, shares, reports
- `videos` - upload tickets, validation, processing handoff, playback metadata
- `ai` - captions, titles, descriptions, hashtags, transcription
- `search` - users/posts/hashtags
- `notifications` - inbox, FCM token registration, realtime events
- `analytics` - creator metrics
- `admin` - dashboard, reports, bans
- `infrastructure` - database repository, auth primitives, storage, realtime

## Scaling Path

The database repository is intentionally isolated. The current implementation keeps a fast in-memory read model hydrated from MongoDB and writes mutations through to MongoDB. Redis should back feed caches, notification fanout, rate limiting, and video/AI job queues. Video processing should run in worker services that consume queue jobs and write status updates back to MongoDB.
