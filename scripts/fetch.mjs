// Snapshot WordPress content to data/*.json so the site no longer needs WP at build/run time.
import { writeFileSync } from 'node:fs'
const API = `${process.env.WP_URL || 'https://ramadan.islamonlive.in'}/wp-json/wp/v2`

async function get(url) {
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(90000) })
      if (r.ok) return r
    } catch {}
  }
  throw new Error('failed ' + url)
}

const cats = await (await get(`${API}/categories?per_page=100&_fields=id,slug,name,count`)).json()
const users = Object.fromEntries(
  (await (await get(`${API}/users?per_page=100&_fields=id,name`)).json()).map((u) => [u.id, u.name]),
)
const slugById =Object.fromEntries(cats.map((c) => [c.id, c.slug]))

const posts = []
for (let page = 1; ; page++) {
  const r = await get(`${API}/posts?per_page=50&page=${page}&_embed=wp:featuredmedia&_fields=id,date,slug,link,author,title,content,excerpt,categories,_links,_embedded`)
  const batch = await r.json()
  for (const p of batch) {
    const m = p._embedded?.['wp:featuredmedia']?.[0]
    posts.push({
      id: p.id,
      date: p.date,
      author: users[p.author] ?? '',
      slug: p.slug,
      title: p.title.rendered,
      excerpt: p.excerpt.rendered,
      content: p.content.rendered,
      // Permalink's first segment is WP's primary category, which may not be categories[0].
      category: new URL(p.link).pathname.split('/')[1] || (slugById[p.categories[0]] ?? 'articles'),
      image: m?.media_details?.sizes?.large?.source_url ?? m?.source_url ?? null,
    })
  }
  console.log('page', page, posts.length)
  if (page >= +r.headers.get('x-wp-totalpages')) break
}
posts.sort((a, b) => b.date.localeCompare(a.date))
writeFileSync('data/categories.json', JSON.stringify(cats.filter((c) => c.count), null, 1))
writeFileSync('data/posts.json', JSON.stringify(posts))
