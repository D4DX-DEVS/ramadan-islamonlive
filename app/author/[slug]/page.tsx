import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/data'
import { JsonLd, SITE_ID, abs, breadcrumbs } from '@/lib/seo'
import PostList from '../../PostList'

const find = async (params: Promise<{ slug: string }>) => (await db()).authorBySlug(decodeURIComponent((await params).slug))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const author = await find(params)
  if (!author) return {}
  const count = (await db()).postsBy(author.id).length
  return {
    title: author.name,
    description: (author.description || `${count} Malayalam ${count === 1 ? 'post' : 'posts'} by ${author.name} on Ramadan.Islamonlive.in.`).slice(0, 160),
    alternates: { canonical: `/author/${author.slug}` },
  }
}

export default async function Author({ params }: { params: Promise<{ slug: string }> }) {
  const author = await find(params)
  if (!author) notFound()
  const url = abs(`/author/${author.slug}`)
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'ProfilePage', url, name: author.name, inLanguage: 'ml', isPartOf: { '@id': SITE_ID }, mainEntity: { '@type': 'Person', name: author.name, url, description: author.description || undefined } }} />
      <JsonLd data={breadcrumbs([['Home', '/'], [author.name, `/author/${author.slug}`]])} />
      <PostList title={`Author: ${author.name}`} posts={(await db()).postsBy(author.id)} intro={author.description} />
    </>
  )
}
