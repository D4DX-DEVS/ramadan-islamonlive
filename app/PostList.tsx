import Link from 'next/link'
import { Post, decode, fmtDate } from '@/lib/data'
import { href } from './PostCard'
import Placeholder from './Placeholder'
import Sidebar from './Sidebar'

/** Archive page body: title bar, list of big tiles, sidebar (category / tag / author pages). */
export default function PostList({ title, posts, intro }: { title: string; posts: Post[]; intro?: string }) {
  return (
    <div className="gray">
      <div className="wrap titlebar">
        <h1>{title}</h1>
        <nav aria-label="Breadcrumb"><Link href="/">Home</Link> › <span aria-current="page">{title}</span></nav>
      </div>
      <div className="wrap layout">
        <div>
          {intro && <p className="box intro">{intro}</p>}
          <div className="list">
            {posts.map((p) => (
              <Link key={p.id} href={href(p)} className="tile big">
                {p.image ? <img src={p.image} alt="" loading="lazy" /> : <Placeholder />}
                <span className="shade" />
                <span className="caption">
                  <small>{p.author} · {fmtDate(p.date)}</small>
                  <span className="t">{decode(p.title)}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  )
}
