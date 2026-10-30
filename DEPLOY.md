# Deploying to Cloudflare (Workers + D1 + R2)

Same setup as the fatwa and zakion sites: a Worker (OpenNext) renders every page live from the D1 database `ramadan-admin`
(binding `DB`). `worker.ts` keeps each rendered page in the edge cache and in the R2 bucket `ramdan` (binding `UPLOADS`,
`cache/pages/...`) until the next admin change. Every admin save writes `cache/purged`, so edits are live at once and
no rebuild is needed. A cron trigger pre-renders a few pages every 5 minutes.

- Publish a new version: `npm run deploy` (or push to `main`; the GitHub workflow does the same).
- Production admin password: `npm run cf -- secret put ADMIN_PASSWORD`.
- The deploy token needs Workers Scripts Edit, Workers R2 Storage and D1 Edit.
- Live address: `https://ramadan.d4dx-fatwa.workers.dev` (marked noindex: `worker.ts` only allows `SITE_URL`).
- Domain: `islamonlive.in` is in another Cloudflare account, so its owner deploys `forwarder/worker.js` on the route
  `ramadan.islamonlive.in/*`. It sends `x-forwarded-host`, which is how the Worker recognises real-domain traffic.
- Old WordPress URLs are redirected by `redirects.txt` (read by `next.config.mjs`).
