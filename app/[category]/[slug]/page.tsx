import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { allPosts, categoryBySlug, decode, fmtDate, strip } from '@/lib/data'
import { SITE_URL } from '@/lib/site'
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
  if (!post) return {}
  const title = decode(post.title)
  const description = (strip(post.excerpt) || strip(post.content) || title).slice(0, 160)
  return {
    title,
    description,
    alternates: { canonical: `/${post.category}/${post.slug}` },
    // A page-level openGraph replaces the layout's, so repeat siteName/locale.
    openGraph: {
      type: 'article',
      title,
      description,
      siteName: 'Ramadan.Islamonlive.in',
      locale: 'ml_IN',
      publishedTime: post.date,
      images: post.image ? [post.image] : ['/site/rmdn-logo1.png'],
    },
  }
}

export default async function PostPage({ params }: Props) {
  const post = await find(params)
  if (!post) notFound()
  const cat = categoryBySlug(post.category)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: decode(post.title),
    datePublished: post.date,
    author: post.author ? { '@type': 'Person', name: post.author } : undefined,
    image: post.image ? new URL(post.image, SITE_URL).href : undefined,
    inLanguage: 'ml',
  }
  return (
    <div className="gray">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
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
