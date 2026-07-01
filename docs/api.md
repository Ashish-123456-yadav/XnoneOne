# NovaSocial AI API

Base URL: `/api/v1`

All successful responses are wrapped:

```json
{
  "data": {},
  "requestId": "uuid",
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

Authenticated routes require `Authorization: Bearer <accessToken>`.

## Auth

- `POST /auth/register` - create creator account
- `POST /auth/login` - email/password login
- `POST /auth/firebase` - exchange Firebase ID token for app JWTs
- `POST /auth/refresh` - rotate refresh token
- `POST /auth/logout` - revoke refresh token
- `GET /auth/me` - current user

## Users

- `GET /users/me/profile` - current profile
- `PATCH /users/me/profile` - update profile
- `GET /users/:username` - public profile
- `POST /users/:username/follow` - follow creator
- `POST /users/:username/unfollow` - unfollow creator

## Feed and Posts

- `GET /feed?cursor=&limit=` - public home feed
- `GET /feed/following?cursor=&limit=` - authenticated following feed
- `POST /posts` - create draft or published post
- `GET /posts/:postId` - post detail
- `POST /posts/:postId/like` - like
- `DELETE /posts/:postId/like` - unlike
- `GET /posts/:postId/comments` - list comments
- `POST /posts/:postId/comments` - add comment
- `POST /posts/:postId/share` - record share
- `POST /posts/:postId/report` - report post

## Video

- `POST /videos/uploads/initiate` - validate file metadata and create upload ticket
- `POST /videos/:videoId/complete` - queue processing and publish post metadata
- `GET /videos/:videoId/playback` - playback metadata
- `POST /videos/uploads/:videoId/mock-put` - local mock upload sink

## AI

- `POST /ai/generate` - generate one caption/title/description/hashtag set
- `POST /ai/generate/batch` - generate all metadata fields
- `POST /ai/transcribe` - Whisper-compatible transcription adapter

## Discovery, Notifications, Analytics

- `GET /search?q=&type=` - search users, posts, hashtags
- `GET /notifications` - notification inbox
- `PATCH /notifications/:notificationId/read` - mark read
- `POST /notifications/devices` - register FCM token
- `GET /analytics/creator` - creator metrics

## Admin

Admin and moderator roles:

- `GET /admin/dashboard`
- `GET /admin/reports?status=open`
- `PATCH /admin/reports/:reportId`

Admin only:

- `PATCH /admin/users/:userId/ban`
