import { allPosts, decode, strip } from '@/lib/data'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-static' // required for `output: 'export'`

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Replaces WordPress's /feed/ (which /_redirects points here).
export function GET() {
  const items = allPosts.slice(0, 20).map((p) => {
    const url = encodeURI(`${SITE_URL}/${p.category}/${p.slug}`)
    return `<item><title>${esc(decode(p.title))}</title><link>${url}</link><guid>${url}</guid><pubDate>${new Date(p.date).toUTCString()}</pubDate><description>${esc(strip(p.excerpt || p.content).slice(0, 300))}</description></item>`
  })
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Ramadan.Islamonlive.in</title><link>${SITE_URL}</link><description>The one and only Comprehensive Ramadan portal in Malayalam</description><language>ml</language>${items.join('')}</channel></rss>`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
