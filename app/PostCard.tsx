import Link from 'next/link'
import { Post, db, decode, fmtLong, strip } from '@/lib/data'
import Placeholder from './Placeholder'

export const href = (p: Post) => `/${p.category}/${p.slug}`

const Arrow = () => <span className="arrow" aria-hidden="true">→</span>
const Img = ({ post, priority, eager }: { post: Post; priority?: boolean; eager?: boolean }) =>
  post.image ? <img src={post.image} alt="" {...(priority ? { fetchPriority: 'high' as const } : eager ? {} : { loading: 'lazy' as const })} /> : <Placeholder />

const ICONS: Record<string, string> = {
  doc: 'M7 3h7l5 5v13H7z M14 3v5h5 M10 13h6 M10 17h6',
  pen: 'M4 20l4-1 11-11-3-3L5 16z',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5l-5.4 3 1.2-6L3.3 9.3l6.1-.7z',
  coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v10 M9.5 9.5c0-1.4 5-1.4 5 0s-5 1.6-5 3 5 1.4 5 0',
  book: 'M4 5h7a3 3 0 0 1 1 .2V20a3 3 0 0 0-1-.2H4z M20 5h-7a3 3 0 0 0-1 .2V20a3 3 0 0 1 1-.2h7z',
  ask: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7 M12 17h.01',
  play: 'M8 5v14l11-7z',
  dome: 'M12 3a5 5 0 0 0-5 5v4h10V8a5 5 0 0 0-5-5z M5 12h14v8H5z',
}

/** Section heading: gold icon square, serif title and a "View all" pill. */
export function Head({ icon, title, href: to }: { icon: keyof typeof ICONS; title: string; href: string }) {
  return (
    <div className="head">
      <span className="ico" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[icon]} /></svg>
      </span>
      <h2>{title}</h2>
      <Link href={to} className="all">View all <span aria-hidden="true">→</span></Link>
    </div>
  )
}

/** Image with the title overlaid. hero-lead is the big first hero story. */
export async function Lead({ post, variant, priority, eager }: { post: Post; variant: 'hero-lead' | 'hero' | 'col' | 'stack'; priority?: boolean; eager?: boolean }) {
  const { categoryBySlug } = await db()
  const hero = variant === 'hero-lead' || variant === 'hero'
  return (
    <Link href={href(post)} className="tile">
      <Img post={post} priority={priority} eager={eager} />
      <span className="shade" />
      <span className="caption">
        {hero && <span className="badge">{categoryBySlug(post.category)?.name}</span>}
        <span className="t">{decode(post.title)}</span>
        {variant === 'hero-lead' && <span className="ex">{strip(post.excerpt)}</span>}
        {variant === 'hero-lead' && <span className="readmore">Read More →</span>}
        {(variant === 'hero' || variant === 'stack') && <span className="meta">{fmtLong(post.date)}</span>}
        {variant === 'col' && (
          <span className="cap-foot">
            <span className="avatar" aria-hidden="true">{post.author.trim().charAt(0)}</span>
            <span>{post.author} · {fmtLong(post.date)}</span>
            <Arrow />
          </span>
        )}
      </span>
    </Link>
  )
}

/** Article card: image with category pill, title, excerpt, date and arrow. */
export async function ArticleCard({ post }: { post: Post }) {
  const { categoryBySlug } = await db()
  return (
    <Link href={href(post)} className="card ac">
      <span className="ac-img">
        <Img post={post} />
        <span className="badge">{categoryBySlug(post.category)?.name}</span>
      </span>
      <span className="ac-body">
        <span className="t">{decode(post.title)}</span>
        <span className="ex">{strip(post.excerpt)}</span>
        <span className="ac-foot"><time dateTime={post.date}>{fmtLong(post.date)}</time><Arrow /></span>
      </span>
    </Link>
  )
}

/** Plain image card with title and date (features). */
export function Card({ post }: { post: Post }) {
  return (
    <Link href={href(post)} className="acard">
      {post.image ? <img src={post.image} alt="" loading="lazy" /> : <Placeholder />}
      <span className="t">{decode(post.title)}</span>
      <time dateTime={post.date}>{fmtLong(post.date)}</time>
    </Link>
  )
}

/** Compact row: thumbnail, title, date (or a custom line) and arrow. */
export function Mini({ post, sub, round }: { post: Post; sub?: string; round?: boolean }) {
  return (
    <Link href={href(post)} className={`mini${round ? ' round' : ''}`}>
      {post.image ? <img src={post.image} alt="" loading="lazy" width={64} height={64} /> : <Placeholder />}
      <span>
        <span className="t">{decode(post.title)}</span>
        <small>{sub ?? fmtLong(post.date)}</small>
      </span>
      <Arrow />
    </Link>
  )
}

/** Video card: YouTube thumbnail with a play button, linking to the post page. */
export function VideoCard({ post, yt }: { post: Post; yt: string }) {
  return (
    <Link href={href(post)} className="vc">
      <span className="vc-img">
        <img src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`} alt="" loading="lazy" width={480} height={360} />
        <span className="play" aria-hidden="true" />
      </span>
      <span className="t">{decode(post.title)}</span>
    </Link>
  )
}
