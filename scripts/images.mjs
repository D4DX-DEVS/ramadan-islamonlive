// Download every WP upload referenced by data/posts.json into public/ and rewrite the URLs.
// Run after `npm run fetch`; safe to re-run (existing files are skipped).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

const ORIGIN = process.env.WP_URL || 'https://ramadan.islamonlive.in'
const RE = new RegExp(ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/wp-content/uploads/[^\\s"\'<>,)]+', 'g')

const raw = readFileSync('data/posts.json', 'utf8')
// Also keep the rest of the media library (logos, theme assets, fonts) so nothing is left behind on the old site.
const library = []
for (let page = 1; ; page++) {
  const r = await fetch(`${ORIGIN}/wp-json/wp/v2/media?per_page=100&page=${page}&_fields=source_url`)
  library.push(...(await r.json()).map((m) => m.source_url))
  if (page >= +r.headers.get('x-wp-totalpages')) break
}
const urls = [...new Set([...(raw.replace(/\\\//g, '/').match(RE) ?? []), ...library])]
console.log(urls.length, 'files')

async function save(url) {
  const path = 'public' + decodeURIComponent(new URL(url).pathname.replace('/wp-content', ''))
  if (existsSync(path)) return true
  // The WP host stores Malayalam filenames NFD-normalised, so the API's own URL 404s.
  const variants = [url, url.normalize('NFD')]
  for (let i = 0; i < 4; i++) {
    try {
      let r
      // WP answers some bad filenames with a 200 HTML "not found" page, so reject HTML (the library also has fonts).
      const isImage = (res) => res.ok && !(res.headers.get('content-type') ?? '').startsWith('text/html')
      for (const v of variants) if (isImage((r = await fetch(encodeURI(v), { signal: AbortSignal.timeout(60000) })))) break
      if (!isImage(r)) break
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, Buffer.from(await r.arrayBuffer()))
      return true
    } catch {}
  }
  console.warn('FAILED', url)
  return false
}

const ok = new Set()
let next = 0
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (next < urls.length) {
      const u = urls[next++]
      if (await save(u)) ok.add(u)
    }
  }),
)

// Only rewrite URLs that downloaded; failures keep pointing at WordPress.
const posts = JSON.parse(raw).map((p) => JSON.parse(JSON.stringify(p), (_, v) =>
  typeof v === 'string' ? v.replace(RE, (u) => (ok.has(u) ? u.slice(ORIGIN.length).replace('/wp-content', '') : u)) : v,
))
writeFileSync('data/posts.json', JSON.stringify(posts))
console.log(ok.size, 'downloaded,', urls.length - ok.size, 'failed')
