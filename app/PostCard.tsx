import Link from 'next/link'
import { Post, db, decode } from '@/lib/data'
import Placeholder from './Placeholder'

export const href = (p: Post) => `/${p.category}/${p.slug}`

/** Image with the title overlaid (hero / columns / zakat). */
export async function Tile({ post, badge, className = '', priority, eager }: { post: Post; badge?: boolean; className?: string; priority?: boolean; eager?: boolean }) {
  const { categoryBySlug } = badge ? await db() : { categoryBySlug: () => undefined }
  return (
    <Link href={href(post)} className={`tile ${className}`}>
      {post.image ? <img src={post.image} alt="" {...(priority ? { fetchPriority: 'high' as const } : eager ? {} : { loading: 'lazy' as const })} /> : <Placeholder />}
      <span className="shade" />
      <span className="caption">
        {badge && <span className="badge">{categoryBySlug(post.category)?.name}</span>}
        <span className="t">{decode(post.title)}</span>
      </span>
    </Link>
  )
}

/** Image on top, title below on white with orange underline (articles / features / videos). */
export function Card({ post }: { post: Post }) {
  return (
    <Link href={href(post)} className="acard">
      {post.image ? <img src={post.image} alt="" loading="lazy" /> : <Placeholder />}
      <span className="t">{decode(post.title)}</span>
    </Link>
  )
}

/** Archive-page card: kept for category pages. */
export default Card
