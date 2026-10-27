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
const wpUsers = await (await get(`${API}/users?per_page=100&_fields=id,name,slug,description`)).json()
const users = Object.fromEntries(wpUsers.map((u) => [u.id, u.name]))
const slugById =Object.fromEntries(cats.map((c) => [c.id, c.slug]))

async function all(path) {
  const out = []
  for (let page = 1; ; page++) {
    const r = await get(`${API}/${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`)
    out.push(...(await r.json()))
    if (page >= +r.headers.get('x-wp-totalpages')) return out
  }
}
const wpTags = (await all('tags?_fields=id,slug,name,count')).filter((t) => t.count)
const tagById = Object.fromEntries(wpTags.map((t) => [t.id, decodeURIComponent(t.slug)]))

const posts = []
for (let page = 1; ; page++) {
  const r = await get(`${API}/posts?per_page=50&page=${page}&_embed=wp:featuredmedia&_fields=id,date,slug,link,author,title,content,excerpt,categories,tags,_links,_embedded`)
  const batch = await r.json()
  for (const p of batch) {
    const m = p._embedded?.['wp:featuredmedia']?.[0]
    posts.push({
      id: p.id,
      date: p.date,
      author: users[p.author] ?? '',
      authorId: p.author,
      tags: p.tags.map((t) => tagById[t]).filter(Boolean),
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
writeFileSync('data/tags.json', JSON.stringify(wpTags.map((t) => ({ slug: tagById[t.id], name: t.name })), null, 1))
// Only authors with posts get an /author page, as on WordPress.
const authorIds = new Set(posts.map((p) => p.authorId))
writeFileSync(
  'data/authors.json',
  JSON.stringify(wpUsers.filter((u) => authorIds.has(u.id)).map((u) => ({ id: u.id, slug: decodeURIComponent(u.slug), name: u.name, description: u.description })), null, 1),
)
// "All-in-One Video Gallery" plugin videos (/aiovg_videos/*); the YouTube id is scraped later by videos.mjs.
const wpVideos = await all('aiovg_videos?_fields=id,slug,date,title,link')
writeFileSync(
  'data/videos.json',
  JSON.stringify(wpVideos.map((v) => ({ id: v.id, slug: decodeURIComponent(v.slug), date: v.date, title: v.title.rendered, path: new URL(v.link).pathname })), null, 1),
)
