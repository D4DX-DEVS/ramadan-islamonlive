import Link from 'next/link'
import { db, decode, fmtDate } from '@/lib/data'
import { APP_URL } from '@/lib/site'
import { href } from './PostCard'

export const Ad = () => (
  <a href={APP_URL} target="_blank" rel="noopener" className="ad">
    <img src="/site/new-1-scaled.jpg" alt="Thafheem ul Quran app" loading="lazy" />
  </a>
)

export default async function Sidebar({ latest = false }: { latest?: boolean }) {
  const { allPosts } = latest ? await db() : { allPosts: [] }
  return (
    <aside className="side">
      {latest && (
        <div className="box">
          <h3 className="side-title">Latest Posts</h3>
          {allPosts.slice(0, 3).map((p) => (
            <Link key={p.id} href={href(p)} className="lp">
              {p.image && <img src={p.image} alt="" loading="lazy" />}
              <span className="t">{decode(p.title)}</span>
              <small>{p.author} · {fmtDate(p.date)}</small>
            </Link>
          ))}
        </div>
      )}
      <div className="box"><Ad /></div>
    </aside>
  )
}
