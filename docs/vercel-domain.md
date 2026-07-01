# Vercel Deployment And Domain

This repo is configured for Vercel with `vercel.json`.

## Build Settings

- Framework preset: Other
- Install command: `npm ci --legacy-peer-deps`
- Build command: `EXPO_PUBLIC_API_URL=mock://local npm --workspace mobile run export:web:pages`
- Output directory: `mobile/dist-pages`
- Node.js version on Vercel: `24.x`

## Deploy

```bash
npm exec vercel
npm exec vercel -- --prod
```

If the CLI is not logged in, Vercel will show a device login URL. Open it in the browser and approve login.

## Buy A Domain

The easiest path is buying directly from Vercel:

1. Open https://vercel.com/domains
2. Search your domain, for example `xnova.ai`, `xnovaapp.com`, or `xnova.social`
3. Buy the domain in your Vercel account
4. Open your Vercel project
5. Go to Settings -> Domains
6. Add the domain to the project

If you buy from another registrar, add the domain in Vercel project Settings -> Domains, then set the DNS records shown by Vercel at your registrar.

DNS updates can take time to propagate.

Official docs:

- Vercel domains overview: https://vercel.com/docs/domains
- Add a custom domain: https://vercel.com/docs/domains/working-with-domains/add-a-domain
- Configure builds: https://vercel.com/docs/builds/configure-a-build
- Vercel domain search: https://vercel.com/domains
