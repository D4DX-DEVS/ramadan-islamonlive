'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type Item = { t: string; u: string; a: string; d: string; e: string; i: string | null }

// The site is static, so search runs in the browser over /search-index.json.
export default function SearchResults() {
  const q = (useSearchParams().get('q') ?? '').trim().toLowerCase().slice(0, 100)
  const [items, setItems] = useState<Item[] | null>(null)
  useEffect(() => {
    fetch('/search-index.json').then((r) => r.json() as Promise<Item[]>).then(setItems, () => setItems([]))
  }, [])
  const hits = q && items ? items.filter((p) => `${p.t} ${p.e} ${p.a}`.toLowerCase().includes(q)).slice(0, 60) : []
  const note = !q ? 'Type a word in the search box above.' : !items ? 'Searching…' : hits.length ? `${hits.length} result${hits.length === 1 ? '' : 's'}.` : 'No posts matched your search.'
  return (
    <div className="gray">
      <div className="wrap titlebar">
        <h1>{q ? `Search: ${q}` : 'Search'}</h1>
      </div>
      <div className="wrap">
        <p className="intro">{note}</p>
        {hits.length > 0 && (
          <div className="card rows">
            {hits.map((p) => (
              <a key={p.u} href={p.u} className="mini">
                {p.i ? <img src={p.i} alt="" loading="lazy" width={64} height={64} /> : <span className="ph" />}
                <span>
                  <span className="t">{p.t}</span>
                  <small>{p.a} · {p.d}</small>
                </span>
                <span className="arrow" aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
