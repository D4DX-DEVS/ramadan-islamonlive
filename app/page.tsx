import Link from 'next/link'
import { decode } from '@/lib/data'
import { APP_URL } from '@/lib/site'
import { homeData } from '@/lib/home'
import { JsonLd, ORG_ID, SITE_ID, SITE_NAME, abs, publisher } from '@/lib/seo'
import { SITE_URL } from '@/lib/site'
import { Card, Tile, href } from './PostCard'

const Title = ({ children }: { children: React.ReactNode }) => <h2 className="sec">{children}</h2>

const Ad = () => (
  <a href={APP_URL} target="_blank" rel="noopener" className="ad">
    <img src="/site/new-1-scaled.jpg" alt="Thafheem ul Quran app" loading="lazy" />
  </a>
)

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
        {hero.map((p, i) => <Tile key={p.id} post={p} badge priority={i === 0} />)}
      </section>

      <section className="wrap">
        <Title>Articles</Title>
        <div className="grid3">{articles.map((p) => <Card key={p.id} post={p} />)}</div>
      </section>

      <div className="band">
        <div className="wrap split">
          <div>
            <Title>Columns</Title>
            {columns[0] && <Tile post={columns[0]} className="big" />}
            <div className="grid2 gap-top">{columns.slice(1).map((p) => <Tile key={p.id} post={p} className="small" />)}</div>

            <Title>Features</Title>
            <div className="grid2">{features.map((p) => <Card key={p.id} post={p} />)}</div>
          </div>

          <aside>
            <h2 className="sec">Quthuba Synopsis</h2>
            <ul className="thumbs">
              {synopsis.map((s) => (
                <li key={s.slug}>
                  <Link href={href(s.post)}>
                    <img src={`/site/${s.img}`} alt="" />
                    <span>{decode(s.post.title)}</span>
                  </Link>
                  <small>By {s.by}</small>
                </li>
              ))}
            </ul>
            <Ad />
            <Ad />
          </aside>
        </div>

        <div className="wrap triple">
          <div className="z">
            <Title>Zakat</Title>
            {zakat[0] && <Tile post={zakat[0]} className="big" />}
            <div className="grid2 gap-top">{zakat.slice(1).map((p) => <Tile key={p.id} post={p} className="small" />)}</div>
          </div>
          <div className="q">
            <Title>Quran / Hadith</Title>
            {quran[0] && <Tile post={quran[0]} className="big" />}
            <div className="grid2 gap-top">{quran.slice(1, 3).map((p) => <Tile key={p.id} post={p} className="small" />)}</div>
          </div>
          <div className="a">
            <Title>QA</Title>
            {qa[0]?.image && (
              <Link href={href(qa[0])}><img src={qa[0].image} alt="" className="qa-img" loading="lazy" /></Link>
            )}
            <ul className="qa">
              {qa.map((p) => (
                <li key={p.id}><Link href={href(p)}>{decode(p.title)}</Link></li>
              ))}
            </ul>
          </div>
          <div className="v">
            <Title>Videos</Title>
            {videos[0] && (
              <div className="vcard">
                <iframe src={`https://www.youtube.com/embed/${videos[0].yt}`} title={decode(videos[0].post.title)} loading="lazy" allowFullScreen />
                <Link href={href(videos[0].post)} className="t">{decode(videos[0].post.title)}</Link>
              </div>
            )}
            <div className="grid2 gap-top">
              {videos.slice(1).map((v) => (
                <div key={v.slug} className="vcard">
                  <iframe src={`https://www.youtube.com/embed/${v.yt}`} title={decode(v.post.title)} loading="lazy" allowFullScreen />
                  <Link href={href(v.post)} className="t">{decode(v.post.title)}</Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
