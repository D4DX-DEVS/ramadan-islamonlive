import Link from 'next/link'
import { decode } from '@/lib/data'
import { homeData } from '@/lib/home'
import { JsonLd, ORG_ID, SITE_ID, SITE_NAME, abs, publisher } from '@/lib/seo'
import { SITE_URL } from '@/lib/site'
import Placeholder from './Placeholder'
import { ArticleCard, Card, Head, Lead, Mini, VideoCard, href } from './PostCard'

export default async function Home() {
  const { articles, columns, features, hero, qa, quran, synopsis, videos, zakat } = await homeData()
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@graph': [
        { ...publisher, sameAs: undefined },
        { '@type': 'WebSite', '@id': SITE_ID, url: SITE_URL, name: SITE_NAME, inLanguage: 'ml', publisher: { '@id': ORG_ID } },
        { '@type': 'WebPage', '@id': `${SITE_URL}/#webpage`, url: abs('/'), name: SITE_NAME, isPartOf: { '@id': SITE_ID }, inLanguage: 'ml' },
      ] }} />
      <h1 className="sr-only">Ramadan.Islamonlive.in: Malayalam Ramadan portal</h1>

      <section className="wrap hero">
        {hero.map((p, i) => <Lead key={p.id} post={p} variant={i === 0 ? 'hero-lead' : 'hero'} priority={i === 0} eager />)}
      </section>

      <section className="wrap">
        <Head icon="doc" title="Articles" href="/category/articles" />
        <div className="g4">{articles.map((p) => <ArticleCard key={p.id} post={p} />)}</div>
      </section>

      <section className="wrap duo">
        <div>
          <Head icon="pen" title="Columns" href="/category/columns" />
          <div className="cols">
            {columns[0] && <Lead post={columns[0]} variant="col" />}
            <div className="card rows">{columns.slice(1).map((p) => <Mini key={p.id} post={p} />)}</div>
          </div>
        </div>
        <aside>
          <Head icon="dome" title="Quthuba Synopsis" href="/category/quthuba-synopsis" />
          <div className="card rows">
            {synopsis.map((s) => <Mini key={s.slug} post={{ ...s.post, image: `/site/${s.img}` }} sub={`By ${s.by}`} round />)}
          </div>
        </aside>
      </section>

      <section className="wrap">
        <Head icon="star" title="Features" href="/category/features" />
        <div className="g4">{features.map((p) => <Card key={p.id} post={p} />)}</div>
      </section>

      <section className="wrap trio">
        <div>
          <Head icon="coin" title="Zakat" href="/category/zakat" />
          <div className="stack">
            {zakat[0] && <Lead post={zakat[0]} variant="stack" />}
            <div className="rows">{zakat.slice(1).map((p) => <Mini key={p.id} post={p} />)}</div>
          </div>
        </div>
        <div>
          <Head icon="book" title="Quran / Hadith" href="/category/quran-hadith" />
          <div className="stack">
            {quran[0] && <Lead post={quran[0]} variant="stack" />}
            <div className="rows">{quran.slice(1, 3).map((p) => <Mini key={p.id} post={p} />)}</div>
          </div>
        </div>
        <div>
          <Head icon="ask" title="QA" href="/category/fiqh-fatwa" />
          <div className="stack">
            {qa[0] && (
              <Link href={href(qa[0])}>
                {qa[0].image ? <img src={qa[0].image} alt="" className="qa-img" loading="lazy" /> : <Placeholder className="qa-ph" />}
              </Link>
            )}
            <ul className="qa">
              {qa.map((p) => <li key={p.id}><Link href={href(p)}>{decode(p.title)}</Link></li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="wrap">
        <Head icon="play" title="Videos" href="/category/videos" />
        <div className="g3">{videos.map((v) => <VideoCard key={v.slug} post={v.post} yt={v.yt} />)}</div>
      </section>
    </>
  )
}
