import Link from 'next/link'
import { Post, decode, categoryBySlug } from '@/lib/data'

export const href = (p: Post) => `/${p.category}/${p.slug}`

/** Image with the title overlaid (hero / columns / zakat). */
export function Tile({ post, badge, className = '' }: { post: Post; badge?: boolean; className?: string }) {
  return (
    <Link href={href(post)} className={`tile ${className}`}>
      {post.image && <img src={post.image} alt="" loading="lazy" />}
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
      {post.image && <img src={post.image} alt="" loading="lazy" />}
      <span className="t">{decode(post.title)}</span>
    </Link>
  )
}

/** Archive-page card: kept for category pages. */
export default Card
