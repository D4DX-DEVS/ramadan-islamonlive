import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/data'
import { JsonLd, SITE_ID, abs, breadcrumbs } from '@/lib/seo'
import PostList from '../../PostList'
import { MIN_INDEXABLE } from '@/lib/data'

// Next hands over the still-percent-encoded segment for non-Latin slugs.
const find = async (params: Promise<{ slug: string }>) => (await db()).tagBySlug(decodeURIComponent((await params).slug))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const tag = await find(params)
  if (!tag) return {}
  const count = (await db()).postsTagged(tag.slug).length
  return {
    title: `Tag: ${tag.name}`,
    description: `${count} Malayalam ${count === 1 ? 'post' : 'posts'} tagged ${tag.name} on Ramadan.Islamonlive.in.`,
    alternates: { canonical: `/tag/${tag.slug}` },
    // A tag page with a single post only repeats that post, so keep it out of search results (links still followed).
    robots: count < MIN_INDEXABLE ? { index: false, follow: true } : undefined,
  }
}

export default async function Tag({ params }: { params: Promise<{ slug: string }> }) {
  const tag = await find(params)
  if (!tag) notFound()
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: `Tag: ${tag.name}`, url: abs(`/tag/${tag.slug}`), inLanguage: 'ml', isPartOf: { '@id': SITE_ID } }} />
      <JsonLd data={breadcrumbs([['Home', '/'], [`Tag: ${tag.name}`, `/tag/${tag.slug}`]])} />
      <PostList title={`Tag: ${tag.name}`} posts={(await db()).postsTagged(tag.slug)} />
    </>
  )
}
