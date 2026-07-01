# NovaSocial AI Product Roadmap

## MVP (8–10 Weeks)
### Foundation
- Authentication: email/password, Google, phone OTP, JWT
- User profiles: username, bio, avatar, cover photo, follow system
- Core social feed: infinite scroll, like, comment, share, save, report
- Video experience: upload, compression, thumbnail generation, auto captions
- Discovery: trending feed, following feed
- Search: users, videos, hashtags
- Notifications: likes, comments, new followers
- Admin: login, user management, delete posts, ban users

### Architecture
- Mobile app: React Native / Expo
- Backend: NestJS
- Database: MongoDB
- Cache: Redis
- Storage: Cloudflare R2
- Auth/notifications: Firebase
- AI: OpenAI

## Version 1
### Creator-first features
- Stories, series, playlists
- Drafts and scheduled publishing
- Creator analytics and dashboards
- AI translation, voiceover, auto subtitle
- Collections, bookmarks, watch history
- Push notifications, dark mode, premium UI
- Referral system and invites
- Video quality selector
- Admin analytics and moderation

## Delivery Plan
1. Evolve the MongoDB repository into fully async domain repositories and add migration/index management.
2. Add Redis-backed queues for FFmpeg, AI generation, notifications, and fanout.
3. Connect Firebase Admin SDK and Firebase Cloud Messaging credentials.
4. Replace mock upload tickets with Cloudflare R2 presigned PUT URLs.
5. Add Stripe/Razorpay checkout, subscriptions, webhooks, and creator payouts.
6. Add WebSocket gateway once `@nestjs/websockets` and Socket.IO are installed.
7. Add e2e tests, load tests, observability, audit logs, and OpenAPI generation.
