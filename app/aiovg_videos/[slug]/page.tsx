import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db, decode, fmtDate } from '@/lib/data'
import { JsonLd, abs, breadcrumbs } from '@/lib/seo'
import Sidebar from '../../Sidebar'

type Props = { params: Promise<{ slug: string }> }

// Old WordPress video-gallery URLs (/aiovg_videos/<slug>), kept so existing links and search results still resolve.

// Built at deploy time and cached; new or edited items render on first visit and the admin refreshes the rest.
export const generateStaticParams = async () => (await db()).allVideos.map((v) => ({ slug: v.slug }))

const find = async (params: Props['params']) => {
  const slug = decodeURIComponent((await params).slug)
  return (await db()).allVideos.find((v) => v.slug === slug)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = await find(params)
  if (!v) return {}
  const title = decode(v.title)
  return {
    title,
    description: title,
    alternates: { canonical: `/aiovg_videos/${v.slug}` },
    openGraph: { type: 'video.other', title, description: title, siteName: 'Ramadan.Islamonlive.in', locale: 'ml_IN', images: [`https://img.youtube.com/vi/${v.video}/hqdefault.jpg`] },
  }
}

export default async function VideoPage({ params }: Props) {
  const v = await find(params)
  if (!v) notFound()
  return (
    <div className="gray">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'VideoObject', name: decode(v.title), description: decode(v.title), thumbnailUrl: `https://img.youtube.com/vi/${v.video}/hqdefault.jpg`, uploadDate: v.date, embedUrl: `https://www.youtube.com/embed/${v.video}`, url: abs(`/aiovg_videos/${v.slug}`), inLanguage: 'ml' }} />
      <JsonLd data={breadcrumbs([['Home', '/'], ['Videos', '/category/videos'], [decode(v.title), `/aiovg_videos/${v.slug}`]])} />
      <nav className="wrap crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> › <Link href="/category/videos">Videos</Link> › <span aria-current="page">{decode(v.title)}</span>
      </nav>
      <div className="wrap layout">
        <article className="post box">
          <h1>{decode(v.title)}</h1>
          <p className="meta">{fmtDate(v.date)}</p>
          <iframe className="video" src={`https://www.youtube.com/embed/${v.video}`} title={decode(v.title)} loading="lazy" allowFullScreen />
        </article>
        <Sidebar latest />
      </div>
    </div>
  )
}
