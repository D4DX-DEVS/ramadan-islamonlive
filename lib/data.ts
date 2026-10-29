import { unstable_cache } from 'next/cache'
import { query } from './db'
import { MEDIA_URL, WP_URL } from './site'

export type Post = {
  id: number
  date: string
  author: string
  authorId: number
  tags: string[]
  slug: string
  title: string
  category: string
  image: string | null
  excerpt: string
  content: string
  video?: string
}
type Named = { name: string; slug: string }
type Author = Named & { id: number; description: string }
type Video = { id: number; slug: string; date: string; title: string; path: string; video?: string }

const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
export const decode = (s: string) =>
  s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1))
    return entities[e] ?? m
  })

export const strip = (s: string) => decode(s.replace(/<[^>]+>/g, '')).trim()
// Post images live under /uploads; with NEXT_PUBLIC_MEDIA_URL set they are served from R2 instead.
const media = (s: string) => (MEDIA_URL ? s.replace(/(^|["'\s,(])\/uploads\//g, `$1${MEDIA_URL}/uploads/`) : s)
const cleanContent = (html: string) => media(html.replaceAll(`${WP_URL}/`, '/')) // old WordPress links become site-relative

const rows = async <T>(kind: string, col = 'data') =>
  (await query(`SELECT ${col} AS data FROM items WHERE kind = ?`, [kind])).map((r) => JSON.parse(r.data) as T)

// Everything except post bodies (~4 MB; a page fetches only its own). Refreshed by revalidateTag('content').
const load = unstable_cache(
  async () => {
    const [posts, categories, tags, authors, videos] = await Promise.all([
      rows<Post>('posts', "json_remove(data, '$.content')"),
      rows<Named>('categories'),
      rows<Named>('tags'),
      rows<Author>('authors'),
      rows<Video>('videos'),
    ])
    posts.sort((a, b) => b.date.localeCompare(a.date))
    return { posts, categories, tags, authors, videos }
  },
  ['content-meta'],
  { tags: ['content'] },
)

export async function db() {
  const d = await load()
  // WP returns non-Latin slugs percent-encoded; routes need the decoded form.
  const allPosts: Post[] = d.posts.map((p) => ({ ...p, content: '', slug: decodeURIComponent(p.slug), image: p.image && media(p.image) }))
  const allCategories = d.categories.map((c) => ({ ...c, name: decode(c.name) }))
  const allTags = d.tags.map((t) => ({ ...t, name: decode(t.name) }))
  return {
    allPosts,
    allCategories,
    allTags,
    allAuthors: d.authors,
    allVideos: d.videos.filter((v) => v.video),
    categoryBySlug: (slug: string) => allCategories.find((c) => c.slug === slug),
    postsIn: (slug: string) => allPosts.filter((p) => p.category === slug),
    tagBySlug: (slug: string) => allTags.find((t) => t.slug === slug),
    postsTagged: (slug: string) => allPosts.filter((p) => p.tags.includes(slug)),
    authorBySlug: (slug: string) => d.authors.find((a) => a.slug === slug),
    postsBy: (id: number) => allPosts.filter((p) => p.authorId === id),
  }
}

const postById = unstable_cache(
  async (id: number): Promise<Post | null> => {
    const r = await query("SELECT data FROM items WHERE kind = 'posts' AND key = ?", [String(id)]) // primary-key hit: reads one row
    if (!r[0]) return null
    const p = JSON.parse(r[0].data) as Post
    return { ...p, slug: decodeURIComponent(p.slug), content: cleanContent(p.content), image: p.image && media(p.image) }
  },
  ['post'],
  { tags: ['content'] },
)

/** One post with its body. `slug` is the decoded form. The id comes from the cached post list, so D1 is read by key, not scanned. */
export async function getPost(category: string, slug: string): Promise<Post | null> {
  const hit = (await db()).allPosts.find((p) => p.category === category && p.slug === slug)
  return hit ? postById(hit.id) : null
}

/** The newest posts with bodies, for the RSS feed. */
export const latestFull = unstable_cache(
  async (n: number) =>
    (await query("SELECT data FROM items WHERE kind = 'posts' ORDER BY json_extract(data, '$.date') DESC LIMIT ?", [n])).map((r) => JSON.parse(r.data) as Post),
  ['latest-full'],
  { tags: ['content'] },
)

// Tag pages with fewer posts than this are noindex and left out of the sitemap.
export const MIN_INDEXABLE = 2

export const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB') // dd/mm/yyyy, as on the original
