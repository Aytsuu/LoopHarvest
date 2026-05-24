This is the LoopHarvest frontend built with [Next.js](https://nextjs.org).

## Getting Started

Create `www/.env.local` for local frontend runtime. Required keys are documented in `.env.example`.

The frontend now expects:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` for map views
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` for browser push subscription

Important:

- `NEXT_PUBLIC_SUPABASE_URL` must be the project base URL, for example `https://your-ref.supabase.co`
- Do not use `.../rest/v1` here
- OAuth redirect URLs are derived from the live browser origin, not a static site URL env var
- For LAN or mobile testing, Supabase Auth must allow the callback host in `Authentication -> URL Configuration`

For LAN/mobile auth testing, add redirect allowlist entries in Supabase such as:

- `http://localhost:3000/**`
- `http://127.0.0.1:3000/**`
- `http://192.168.*:3000/**`
- `http://10.*:3000/**`
- `http://172.*:3000/**`
- `http://*.local:3000/**`

If Supabase rejects the dynamic host, it falls back to the hosted project's `Site URL`, which often appears as a redirect to `http://localhost:3000`.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
