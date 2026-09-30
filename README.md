# HidzStreaming

HidzStreaming is the web build of the HidzStream app, using the same source-oriented architecture for Anime, Comic, Donghua, Drachin, Movies, YouTube and Live TV.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, HLS.js and server-side source adapters.

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm run lint
npm run build
npm start
```

## Environment

Copy `.env.example` to your deployment configuration.

`CUBMU_CHANNEL_TOKEN` enables the full CubMu Live TV catalogue. Without it, the web app uses a small safe fallback list.

`DRACINEMA_API_KEY` is required for Dracinema playback. The key is intentionally not stored in the repository.

The remaining source adapters are configured in `lib/apk-web.ts` and do not require secrets for their base catalogue routes.

## Deployment

The repository is configured for Vercel. GitHub Actions runs type-checking and the production build on every push to `main`.
