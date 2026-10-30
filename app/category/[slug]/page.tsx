import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/data'
import { JsonLd, SITE_ID, abs, breadcrumbs } from '@/lib/seo'
import PostList from '../../PostList'

// Every page is built at deploy time (output: 'export'); an admin save starts a rebuild.
export const dynamicParams = false
export const generateStaticParams = async () => (await db()).allCategories.map((c) => ({ slug: c.slug }))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { categoryBySlug, postsIn } = await db()
  const cat = categoryBySlug((await params).slug)
  return cat
    ? {
        title: cat.name,
        description: `${postsIn(cat.slug).length} Malayalam posts in ${cat.name} on Ramadan.Islamonlive.in, the Malayalam Ramadan portal.`,
        alternates: { canonical: `/category/${cat.slug}` },
      }
    : {}
}

export default async function Category({ params }: { params: Promise<{ slug: string }> }) {
  const { categoryBySlug, postsIn } = await db()
  const cat = categoryBySlug((await params).slug)
  if (!cat) notFound()
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: cat.name, url: abs(`/category/${cat.slug}`), inLanguage: 'ml', isPartOf: { '@id': SITE_ID } }} />
      <JsonLd data={breadcrumbs([['Home', '/'], [cat.name, `/category/${cat.slug}`]])} />
      <PostList title={`Category: ${cat.name}`} posts={postsIn(cat.slug)} />
    </>
  )
}
