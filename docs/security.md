# Security Notes

Implemented in the first build:

- JWT access tokens and rotating refresh tokens
- Refresh tokens are stored as SHA-256 hashes
- Passwords are hashed with `scrypt`
- Role-based access control for admin/moderator APIs
- Global rate limiting guard
- Consistent error responses without stack leakage
- Input validation in service boundaries
- Video upload validation for extension, MIME type, and byte size
- CORS allow-list configuration

Production hardening checklist:

- Replace development JWT secrets with high-entropy secrets in a managed secret store
- Use Firebase Admin SDK to verify ID tokens in `AuthService.firebaseExchange`
- Move refresh tokens and session metadata to Postgres
- Back the rate limiter with Redis for multi-instance deployments
- Replace mock upload URLs with signed Cloudflare R2 or S3 PUT URLs
- Run FFmpeg processing in isolated workers with malware/moderation scans
- Enforce webhook signature verification for Stripe and Razorpay
- Add audit logs for admin actions
- Add OpenAPI generation and contract tests
