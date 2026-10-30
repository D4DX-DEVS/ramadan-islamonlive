import type { Metadata } from 'next'
import { db, decode, strip } from '@/lib/data'
import PostList from '../PostList'

export const dynamic = 'force-dynamic' // reads the query string; the post list itself comes from the cached content
export const metadata: Metadata = { title: 'Search', robots: { index: false, follow: true } }

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? '').trim().toLowerCase().slice(0, 100)
  const { allPosts } = await db()
  const hits = q ? allPosts.filter((p) => `${decode(p.title)} ${strip(p.excerpt)} ${p.author}`.toLowerCase().includes(q)).slice(0, 60) : []
  const note = !q ? 'Type a word in the search box above.' : hits.length ? `${hits.length} result${hits.length === 1 ? '' : 's'}.` : 'No posts matched your search.'
  return <PostList title={q ? `Search: ${q}` : 'Search'} posts={hits} intro={note} />
}
