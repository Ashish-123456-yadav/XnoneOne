# Database Design

The running API now supports MongoDB-backed persistence through `DatabaseService`. Set `DATABASE_PROVIDER=mongodb` and `MONGODB_URI` to hydrate seed data on first boot and persist app mutations such as users, posts, videos, comments, likes, follows, notifications, reports, refresh tokens, and shares.

MongoDB collections:

- `users` - identity, Firebase UID, role, verification, ban status
- `profiles` - public creator profile and denormalized counters
- `refreshTokens` - hashed refresh tokens with revocation state
- `posts` - social content metadata, visibility, status, counters
- `videos` - R2/S3 storage keys, HLS manifest, dimensions, processing status
- `comments` - threaded comments
- `likes` - unique user/post likes
- `followers` - user follow graph
- `shares` - share events
- `notifications` - in-app notification inbox
- `reports` - moderation queue

Indexes cover auth lookup, feed ordering, comments, followers, notifications, reports, shares, and hashtag search. `docker-compose.yml` starts MongoDB 7 on `localhost:27017` with database `novasocial`.

`database/schema.sql` is retained as a normalized PostgreSQL reference schema.

Reference PostgreSQL tables:

- `users` - identity, Firebase UID, role, verification, ban status
- `profiles` - public creator profile and denormalized counters
- `admins` - admin scopes
- `refresh_tokens` - hashed refresh tokens with revocation state
- `posts` - social content metadata, visibility, status, counters
- `videos` - R2/S3 storage keys, HLS manifest, dimensions, processing status
- `comments` - threaded comments
- `likes` - unique user/post likes
- `followers` - user follow graph
- `shares` - share events
- `hashtags` and `post_hashtags` - normalized tag index
- `notifications` - in-app notification inbox
- `reports` - moderation queue
- `devices` - FCM device tokens

Foreign keys use cascading deletes where child data should not outlive its owner.

If MongoDB is unavailable, the API falls back to the in-memory seed data so local UI work can continue. For production, run with MongoDB enabled and monitor the startup log for `MongoDB connected`.
