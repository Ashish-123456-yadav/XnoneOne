# NovaSocial AI

NovaSocial AI is an AI-first short-form social platform for creators to create, edit, share, discover, and monetize AI-powered video content.

This repository is a production-oriented foundation, not a one-file demo. It includes a modular NestJS API, Expo mobile app, React admin dashboard, shared TypeScript contracts, MongoDB-backed persistence, a PostgreSQL reference schema, Docker setup, CI, API docs, and initial tests.

## Project Structure

- `backend/` - NestJS REST API with auth, users, feed, posts, video, AI, search, notifications, analytics, and admin modules
- `mobile/` - Expo React Native app with React Navigation, React Query, Redux Toolkit, NativeWind, themes, and creator workflows
- `admin/` - React/Vite operations dashboard for moderation, uploads, retention, and monetization readiness
- `shared/` - shared TypeScript contracts for API responses, users, feed posts, notifications, and admin metrics
- `database/` - normalized PostgreSQL reference schema and seed data
- `docs/` - architecture, API, database, and security documentation
- `infra/` - deployment support such as Nginx config

## Local Development

Prerequisites:

- Node.js 26.4.0+
- npm 10+

```bash
cp .env.example .env
npm install
npm --workspace backend run start:dev
npm --workspace admin run start
npm --workspace mobile run start
```

Seed credentials:

- Creator: `ava@novasocial.ai` / `NovaPass123!`
- Admin: `admin@novasocial.ai` / `NovaPass123!`

The API runs at `http://localhost:3000/api/v1`. The admin dashboard runs at `http://localhost:5173`.

## Docker

```bash
docker compose up --build
```

Docker starts MongoDB, Redis, MinIO-compatible object storage, the API, and the admin dashboard. A PostgreSQL reference service is still included for the original normalized schema, but the API uses MongoDB when `DATABASE_PROVIDER=mongodb`. Cloudflare R2 can replace MinIO by setting the S3-compatible env vars in `.env`.

MongoDB connection:

```txt
Host: localhost
Port: 27017
Database: novasocial
Username: novasocial
Password: novasocial
Auth DB: admin
```

## Implemented First-Build Features

- Registration, login, refresh tokens, logout, Firebase token exchange adapter
- JWT access tokens, password hashing, role guards, rate limiting, input/file validation
- User profiles, follow/unfollow, public profile lookup
- Home and following feeds with pagination
- Short video upload ticket creation, validation, simulated FFmpeg/HLS processing
- Posts, likes, comments, shares, and reports
- Search across users, posts, and hashtags
- Notifications and device registration endpoint for FCM integration
- AI caption, title, description, hashtag generation with OpenAI/Gemini/mock providers
- Whisper-compatible transcription endpoint stub
- Admin dashboard APIs and UI for reports, metrics, upload health, payments, retention
- Dark/light mobile theme, loading skeletons, empty states, premium mobile tab UI

## Validation

```bash
npm --workspace backend run build
npm --workspace backend run test
npm --workspace admin run build
```

See [docs/api.md](docs/api.md), [docs/architecture.md](docs/architecture.md), [docs/database.md](docs/database.md), [docs/deployment.md](docs/deployment.md), and [docs/security.md](docs/security.md).
