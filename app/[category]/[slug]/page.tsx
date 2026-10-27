import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { allPosts, categoryBySlug, decode, fmtDate, strip } from '@/lib/data'
import Sidebar from '../../Sidebar'

type Props = { params: Promise<{ category: string; slug: string }> }

export const dynamicParams = false
export const generateStaticParams = () => allPosts.map((p) => ({ category: p.category, slug: p.slug }))

const find = async (params: Props['params']) => {
  const { category, slug: s } = await params
  const slug = decodeURIComponent(s)
  return allPosts.find((p) => p.category === category && p.slug === slug)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await find(params)
  // Video/Q&A posts can have empty excerpt and text body, so fall back to body, then title.
  return post
    ? { title: decode(post.title), description: (strip(post.excerpt) || strip(post.content) || decode(post.title)).slice(0, 160) }
    : {}
}

export default async function PostPage({ params }: Props) {
  const post = await find(params)
  if (!post) notFound()
  const cat = categoryBySlug(post.category)
  return (
    <div className="gray">
      <div className="wrap crumbs">
        <Link href="/">Home</Link> › <Link href={`/category/${post.category}`}>{cat?.name}</Link> › {decode(post.title)}
      </div>
      <div className="wrap layout">
        <article className="post box">
          <Link href={`/category/${post.category}`} className="tag">{cat?.name}</Link>
          <h1>{decode(post.title)}</h1>
          <p className="meta">{post.author} · {fmtDate(post.date)}</p>
          {post.video ? (
            <iframe className="video" src={`https://www.youtube.com/embed/${post.video}`} title={decode(post.title)} loading="lazy" allowFullScreen />
          ) : (
            post.image && <img src={post.image} alt="" className="hero-img" />
          )}
          <div className="content" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
        <Sidebar latest />
      </div>
    </div>
  )
}
