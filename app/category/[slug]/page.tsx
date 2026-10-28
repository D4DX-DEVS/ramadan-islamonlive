import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/data'
import PostList from '../../PostList'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const cat = (await db()).categoryBySlug((await params).slug)
  return cat
    ? { title: cat.name, description: `${cat.name} – Ramadan.Islamonlive.in`, alternates: { canonical: `/category/${cat.slug}` } }
    : {}
}

export default async function Category({ params }: { params: Promise<{ slug: string }> }) {
  const { categoryBySlug, postsIn } = await db()
  const cat = categoryBySlug((await params).slug)
  if (!cat) notFound()
  return <PostList title={`Category: ${cat.name}`} posts={postsIn(cat.slug)} />
}
