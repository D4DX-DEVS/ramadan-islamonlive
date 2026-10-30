import Link from 'next/link'
import { db, decode, fmtDate } from '@/lib/data'
import { APP_URL } from '@/lib/site'
import { href } from './PostCard'

export const Ad = () => (
  <a href={APP_URL} target="_blank" rel="noopener" className="ad">
    <img src="/site/new-1-scaled.jpg" alt="Thafheem ul Quran app" loading="lazy" />
  </a>
)

import type { Post } from '@/lib/data'

const Mini = ({ p }: { p: Post }) => (
  <Link href={href(p)} className="lp">
    {p.image && <img src={p.image} alt="" loading="lazy" width={84} height={64} />}
    <span>
      <span className="t">{decode(p.title)}</span>
      <small>{fmtDate(p.date)}</small>
    </span>
  </Link>
)

export default async function Sidebar({ latest = false, related = [] }: { latest?: boolean; related?: Post[] }) {
  const { allPosts } = latest ? await db() : { allPosts: [] }
  return (
    <aside className="side">
      {latest && (
        <div className="box">
          <h3 className="side-title">Latest Posts</h3>
          {allPosts.slice(0, 5).map((p) => <Mini key={p.id} p={p} />)}
        </div>
      )}
      <div className="box"><Ad /></div>
      {related.length > 0 && (
        <div className="box">
          <h3 className="side-title">Related Articles</h3>
          {related.map((p) => <Mini key={p.id} p={p} />)}
        </div>
      )}
    </aside>
  )
}
