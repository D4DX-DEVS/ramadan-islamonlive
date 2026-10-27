import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { allAuthors, authorBySlug, postsBy } from '@/lib/data'
import PostList from '../../PostList'

export const dynamicParams = false
export const generateStaticParams = () => allAuthors.map((a) => ({ slug: a.slug }))

const find = async (params: Promise<{ slug: string }>) => authorBySlug(decodeURIComponent((await params).slug))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const author = await find(params)
  return author
    ? { title: author.name, description: author.description || `${author.name} – Ramadan.Islamonlive.in`, alternates: { canonical: `/author/${author.slug}` } }
    : {}
}

export default async function Author({ params }: { params: Promise<{ slug: string }> }) {
  const author = await find(params)
  if (!author) notFound()
  return <PostList title={`Author: ${author.name}`} posts={postsBy(author.id)} intro={author.description} />
}
