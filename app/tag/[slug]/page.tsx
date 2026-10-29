import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/data'
import PostList from '../../PostList'

// Next hands over the still-percent-encoded segment for non-Latin slugs.
const find = async (params: Promise<{ slug: string }>) => (await db()).tagBySlug(decodeURIComponent((await params).slug))

// Built at deploy time and cached; new or edited items render on first visit and the admin refreshes the rest.
export const generateStaticParams = async () => (await db()).allTags.map((t) => ({ slug: t.slug }))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const tag = await find(params)
  return tag
    ? { title: `Tag: ${tag.name}`, description: `${tag.name} – Ramadan.Islamonlive.in`, alternates: { canonical: `/tag/${tag.slug}` } }
    : {}
}

export default async function Tag({ params }: { params: Promise<{ slug: string }> }) {
  const tag = await find(params)
  if (!tag) notFound()
  return <PostList title={`Tag: ${tag.name}`} posts={(await db()).postsTagged(tag.slug)} />
}
