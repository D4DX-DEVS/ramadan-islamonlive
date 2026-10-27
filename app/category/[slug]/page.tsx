import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { allCategories, categoryBySlug, postsIn } from '@/lib/data'
import PostList from '../../PostList'

export const dynamicParams = false
export const generateStaticParams = () => allCategories.map((c) => ({ slug: c.slug }))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const cat = categoryBySlug((await params).slug)
  return cat
    ? { title: cat.name, description: `${cat.name} – Ramadan.Islamonlive.in`, alternates: { canonical: `/category/${cat.slug}` } }
    : {}
}

export default async function Category({ params }: { params: Promise<{ slug: string }> }) {
  const cat = categoryBySlug((await params).slug)
  if (!cat) notFound()
  return <PostList title={`Category: ${cat.name}`} posts={postsIn(cat.slug)} />
}
