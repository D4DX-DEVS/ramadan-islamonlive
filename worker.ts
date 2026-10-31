// Entry point of the deployed Worker: the OpenNext app wrapped in a page cache.
//
// D1's free tier allows 5M row reads a day, so every public page is rendered once and then stored:
//   1. the edge cache of the Cloudflare location serving the visitor (fastest, per location)
//   2. the R2 bucket (shared by every location: a page is rendered once for the whole world)
// A stored page stays valid until the next admin change (lib/db.ts writes `cache/purged`) or MAX_AGE.
// After a change, pages render again when someone asks for them; a Cron Trigger also renders a few pages
// nobody has asked for yet on every run, so almost every page is stored before it is ever visited.
// If D1 fails while a page is rendered, the old stored copy is served instead of an error.
// the file only exists after `opennextjs-cloudflare build`, so the type checker cannot always resolve it
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import openNext from "./.open-next/worker.js";

const MAX_AGE = 7 * 86_400_000; // ms a stored page is trusted even without a change
const PURGED = "cache/purged"; // R2 object: time of the last admin change
const PAGES = "cache/pages"; // R2 prefix: one object per page path
const STAMP = "x-cached-at";
const WARM_PER_RUN = 5; // pages the Cron Trigger renders per run (a free-plan invocation may make 50 subrequests)
const TEXT = /^(text\/(html|plain|xml|x-component)|application\/(xml|rss\+xml|json))/;

type Env = CloudflareEnv;
const edge = () => (caches as unknown as { default: Cache }).default;
const valid = (at: number, purged: number) => at > purged && Date.now() - at < MAX_AGE;

// time of the last admin change; looked up in R2 at most every 30 s per location
async function purgedAt(env: Env, ctx: ExecutionContext): Promise<number> {
  const k = new Request("https://cache.internal/purged");
  const hit = await edge().match(k);
  if (hit) return Number(await hit.text());
  const obj = await env.UPLOADS.get(PURGED);
  const t = obj ? Number(await obj.text()) : 0;
  ctx.waitUntil(edge().put(k, new Response(String(t), { headers: { "cache-control": "public, max-age=30" } })));
  return t;
}

// what the browser gets: always ask the edge again, the edge decides what is still good
const toBrowser = (body: BodyInit | null, type: string) =>
  new Response(body, { headers: { "content-type": type, "cache-control": "public, max-age=0, must-revalidate" } });

// On the free plan a render may be cut off at 10 ms of CPU (about 1 in 7 fresh renders; stored pages use 3 ms). A cut-off ends the
// whole invocation, so the render runs in a separate one (the Worker calling itself) that this wrapper can retry. Only calls
// carrying the key, which is derived from a secret, skip the cache, so nobody outside can force renders.
const renderKey = (env: Env) => (env.ADMIN_PASSWORD ? `render:${env.ADMIN_PASSWORD}` : null);

async function render(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const key = renderKey(env);
  const self = env.WORKER_SELF_REFERENCE;
  if (!key || !self) return openNext.fetch(request, env, ctx);
  const headers = new Headers(request.headers);
  headers.set("x-render", key);
  let last: Response | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      last = await self.fetch(new Request(request, { headers }));
      if (last.status < 500) return last;
    } catch (e) {
      console.error("render attempt failed", attempt, e);
    }
    // after a burst of heavy renders the free plan cuts off several in a row; waiting costs no CPU and lets it recover
    if (attempt < 2) await new Promise((done) => setTimeout(done, 400 * (attempt + 1)));
  }
  return last ?? openNext.fetch(request, env, ctx);
}

async function handle(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const image = url.pathname.startsWith("/media/"); // uploaded images never change under one URL
  const rsc = url.searchParams.has("_rsc") || request.headers.has("rsc"); // Next's client-side navigation
  const r2Key = !rsc && !url.searchParams.has("q") && url.pathname.length + url.search.length < 800 ? `${PAGES}${url.pathname}${url.search}` : null;
  const key = new Request(url.toString());
  const purged = image ? 0 : await purgedAt(env, ctx);
  let stale: Response | undefined; // an out-of-date copy, still better than an error

  const local = await edge().match(key);
  if (local) {
    if (image) return local;
    const at = Number(local.headers.get(STAMP));
    if (valid(at, purged)) return toBrowser(local.body, local.headers.get("content-type") ?? "text/html");
    stale = local;
  }

  if (!stale && r2Key) {
    const obj = await env.UPLOADS.get(r2Key);
    if (obj) {
      const at = Number(obj.customMetadata?.at);
      const type = obj.httpMetadata?.contentType ?? "text/html";
      const body = await obj.arrayBuffer();
      if (valid(at, purged)) {
        ctx.waitUntil(edge().put(key, new Response(body, { headers: { "content-type": type, "cache-control": "public, s-maxage=86400", [STAMP]: String(at) } })));
        return toBrowser(body, type);
      }
      stale = toBrowser(body, type);
    }
  }

  // not stored (or out of date): render it
  let res: Response;
  try {
    res = await render(request, env, ctx);
  } catch (e) {
    if (stale) return stale;
    throw e;
  }
  if (res.status >= 500 && stale) return stale; // D1 trouble: keep serving the old copy
  const type = res.headers.get("content-type") ?? "";
  if (res.status !== 200 || res.headers.has("set-cookie")) return res;
  if (image) {
    ctx.waitUntil(edge().put(key, res.clone()));
    return res;
  }
  if (!TEXT.test(type)) return res;

  const body = await res.arrayBuffer();
  const at = Date.now();
  ctx.waitUntil(
    Promise.all([
      edge().put(key, new Response(body, { headers: { "content-type": type, "cache-control": "public, s-maxage=86400", [STAMP]: String(at) } })),
      r2Key ? env.UPLOADS.put(r2Key, body, { httpMetadata: { contentType: type }, customMetadata: { at: String(at) } }) : undefined,
    ]),
  );
  return toBrowser(body, type);
}

// render a few pages that are not stored yet (or went out of date), sitemap order
async function warm(env: Env, ctx: ExecutionContext) {
  const base = env.SITE_URL;
  const purged = await purgedAt(env, ctx);
  const listed = await env.UPLOADS.list({ prefix: `${PAGES}/`, limit: 1000, include: ["customMetadata"] });
  const stored = new Map(listed.objects.map((o) => [o.key, Number(o.customMetadata?.at)]));

  const sitemap = await handle(new Request(`${base}/sitemap.xml`), env, ctx);
  const locs = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);

  let left = WARM_PER_RUN;
  for (const path of new Set(["/", ...locs])) {
    if (left <= 0) break;
    const at = stored.get(`${PAGES}${path}`);
    if (at && valid(at, purged)) continue;
    left--;
    try {
      await handle(new Request(`${base}${path}`), env, ctx);
    } catch (e) {
      console.error("warm: page failed", path, e); // it stays unstored and the next run tries it again
    }
  }
}

// Search engines must only index the real domain. Every other address that serves this Worker (workers.dev, a staging
// name) answers robots.txt with "disallow all" and marks pages noindex. The domain forwarder sets x-forwarded-host, or Cloudflare marks it with cf-worker.
function offDomain(request: Request, env: Env, url: URL) {
  const site = new URL(env.SITE_URL).host;
  const forwarded = request.headers.get("x-forwarded-host");
  if (forwarded) return forwarded !== site;
  // Cloudflare adds cf-worker (the zone) when another Worker makes the request: the islamonlive.in forwarder, which does not send x-forwarded-host
  const zone = request.headers.get("cf-worker");
  if (zone && (site === zone || site.endsWith(`.${zone}`))) return false;
  return url.host !== site;
}

async function route(request: Request, env: Env, ctx: ExecutionContext, url: URL): Promise<Response> {
  // only plain page loads are stored: not the admin, not form posts
  if (request.method !== "GET" || url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/") || request.headers.has("next-action")) {
    return openNext.fetch(request, env, ctx);
  }
  return handle(request, env, ctx);
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const key = renderKey(env);
    if (key && request.headers.get("x-render") === key) return openNext.fetch(request, env, ctx); // the internal render call
    const url = new URL(request.url);
    if (!offDomain(request, env, url)) return route(request, env, ctx, url);
    if (url.pathname === "/robots.txt") return new Response("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
    const original = await route(request, env, ctx, url);
    const res = new Response(original.body, original); // copy, so the headers can be changed
    res.headers.set("x-robots-tag", "noindex, nofollow");
    return res;
  },

  async scheduled(_event: unknown, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(warm(env, ctx).catch((e) => console.error("warm failed", e)));
  },
};

export default worker;
