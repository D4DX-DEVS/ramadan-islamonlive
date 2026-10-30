import { MIN_INDEXABLE, db } from '@/lib/data'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-static' // rebuilt on every deploy

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function GET() {
  const { allAuthors, allCategories, allPosts, allTags, allVideos, postsTagged } = await db()
  const url = (path: string, date?: string) => `<url><loc>${esc(encodeURI(SITE_URL + path))}</loc>${date ? `<lastmod>${new Date(date).toISOString()}</lastmod>` : ''}</url>`
  const urls = [
    url('/', allPosts[0]?.date),
    ...allCategories.map((c) => url(`/category/${c.slug}`)),
    ...allTags.filter((t) => postsTagged(t.slug).length >= MIN_INDEXABLE).map((t) => url(`/tag/${t.slug}`)),
    ...allAuthors.map((a) => url(`/author/${a.slug}`)),
    ...allVideos.map((v) => url(`/aiovg_videos/${v.slug}`, v.date)),
    ...allPosts.map((p) => url(`/${p.category}/${p.slug}`, p.date)),
  ]
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`.replace('sitemap.org/schemas/sitemap/0.9', 'sitemaps.org/schemas/sitemap/0.9'), {
    headers: { 'content-type': 'application/xml' },
  })
}
