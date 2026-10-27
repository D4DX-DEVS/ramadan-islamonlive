import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { allCategories, categoryBySlug, decode, fmtDate, postsIn } from '@/lib/data'
import { href } from '../../PostCard'
import Sidebar from '../../Sidebar'

export const dynamicParams = false
export const generateStaticParams = () => allCategories.map((c) => ({ slug: c.slug }))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const cat = categoryBySlug((await params).slug)
  return cat ? { title: cat.name, description: `${cat.name} – Ramadan.Islamonlive.in` } : {}
}

export default async function Category({ params }: { params: Promise<{ slug: string }> }) {
  const cat = categoryBySlug((await params).slug)
  if (!cat) notFound()
  return (
    <div className="gray">
      <div className="wrap titlebar">
        <h1>Category: {cat.name}</h1>
        <span><Link href="/">Home</Link> › {cat.name}</span>
      </div>
      <div className="wrap layout">
        <div className="list">
          {postsIn(cat.slug).map((p) => (
            <Link key={p.id} href={href(p)} className="tile big">
              {p.image && <img src={p.image} alt="" loading="lazy" />}
              <span className="shade" />
              <span className="caption">
                <small>{p.author} · {fmtDate(p.date)}</small>
                <span className="t">{decode(p.title)}</span>
              </span>
            </Link>
          ))}
        </div>
        <Sidebar />
      </div>
    </div>
  )
}
