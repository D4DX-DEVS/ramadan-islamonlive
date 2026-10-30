import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { Anek_Malayalam, Noto_Serif_Malayalam } from 'next/font/google'
import NavLinks from './NavLinks'
import { APP_URL, SITE_URL } from '@/lib/site'
import './globals.css'

const font = Anek_Malayalam({ subsets: ['malayalam', 'latin'], display: 'swap' })
const serif = Noto_Serif_Malayalam({ subsets: ['malayalam', 'latin'], display: 'swap', variable: '--font-serif' })


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/', types: { 'application/rss+xml': '/feed.xml' } },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  openGraph: {
    type: 'website',
    siteName: 'Ramadan.Islamonlive.in',
    locale: 'ml_IN',
    images: ['/site/rmdn-logo1.png'],
  },
  title: { default: 'Ramadan.Islamonlive.in | The one and only Comprehensive Ramadan portal in Malayalam', template: '%s | Ramadan.Islamonlive.in' },
  description: 'The one and only Comprehensive Ramadan portal in Malayalam',
}

export const viewport: Viewport = { themeColor: '#3a2412' }

const nav = [
  ['Home', '/'],
  ['Articles', '/category/articles'],
  ['Quran-Hadith', '/category/quran-hadith'],
  ['Fiqh-Fatwa', '/category/fiqh-fatwa'],
  ['Zakat', '/category/zakat'],
  ['Quthuba Synopsis', '/category/quthuba-synopsis'],
  ['Videos', '/category/videos'],
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ml">
      <body className={`${font.className} ${serif.variable}`} id="top">
        <a href="#main" className="skip">Skip to content</a>
        <header className="site-header wrap">
          <Link href="/" className="logo">
            <img src="/site/rmdn-logo1.png" alt="Ramadan Online" width={300} height={124} />
          </Link>
          <a href={APP_URL} target="_blank" rel="noopener" className="banner">
            <img src="/site/for-rmdn.png" alt="Thafheem ul Quran app" width={720} height={90} />
          </a>
        </header>
        <nav className="main-nav" aria-label="Main">
          <div className="wrap">
            <div className="nav-links"><NavLinks items={nav} /></div>
            <form className="search" action="/search" role="search">
              <input type="search" name="q" placeholder="Search…" aria-label="Search the site" />
              <button type="submit" aria-label="Search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
              </button>
            </form>
          </div>
        </nav>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="foot">
            <div>
              <img src="/site/onlive-logo-w.png" alt="islamonlive" width={207} height={59} />
              <p>The one and only Comprehensive Ramadan portal in Malayalam.</p>
            </div>
            <div>
              <h4>Quick links</h4>
              <ul>{nav.map(([label, to]) => <li key={to}><Link href={to}>{label}</Link></li>)}</ul>
            </div>
            <div>
              <h4>More</h4>
              <ul>
                <li><a href="/feed.xml">RSS feed</a></li>
                <li><a href="/sitemap.xml">Sitemap</a></li>
                <li><a href={APP_URL} target="_blank" rel="noopener">Thafheem ul Quran app</a></li>
              </ul>
            </div>
          </div>
          <div className="foot-bar">
            <span>
              Copyright © 2026 | islamonlive.in | Powered by <a href="https://d4dx.co/" target="_blank" rel="noopener">D4DX</a>
            </span>
            <span><a href="#top">Back to top ↑</a> &nbsp; <a className="admin-btn" href="/admin">Admin</a></span>
          </div>
        </footer>
      </body>
    </html>
  )
}
