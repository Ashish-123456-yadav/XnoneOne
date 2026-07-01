# Deployment

## 1. Push To GitHub

Initialize and push the repository:

```bash
cd /Users/apple/Xnova
git init
git branch -M main
git add .
git commit -m "Initial NovaSocial AI production foundation"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

The GitHub CI workflow runs typecheck, backend tests, and admin build on every push.

## 2. Publish Docker Images

On `main`, `.github/workflows/docker-publish.yml` publishes:

- `ghcr.io/YOUR_USERNAME/novasocial-api`
- `ghcr.io/YOUR_USERNAME/novasocial-admin`

Use the `sha-*` or branch tag in production.

## 3. Self-Hosted Production

Create production env:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and replace every placeholder secret and public URL.

Run:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Health checks:

```bash
curl http://localhost:3000/api/v1/health
open http://localhost:8080
```

## 4. MongoDB Compass

For local Docker:

```txt
mongodb://novasocial:novasocial@localhost:27017/novasocial?authSource=admin
```

For production, use the password from `.env.production`.

## 5. Mobile Production

Set `EXPO_PUBLIC_API_URL` to your production API before building:

```bash
cd mobile
EXPO_PUBLIC_API_URL=https://api.example.com/api/v1 npm run web
```

Native store builds should use Expo EAS with the same API URL configured in build environment variables.
