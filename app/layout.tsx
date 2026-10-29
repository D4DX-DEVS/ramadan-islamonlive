import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { Anek_Malayalam, Noto_Serif_Malayalam } from 'next/font/google'
import NavLinks from './NavLinks'
import { APP_URL, SITE_URL } from '@/lib/site'
import './globals.css'

const font = Anek_Malayalam({ subsets: ['malayalam', 'latin'], display: 'swap' })
const serif = Noto_Serif_Malayalam({ subsets: ['malayalam', 'latin'], display: 'swap', variable: '--font-serif' })

export const dynamic = 'force-static' // pages are cached and refreshed by the admin (revalidatePath)

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

export const viewport: Viewport = { themeColor: '#07140f' }

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
      <body className={`${font.className} ${serif.variable}`}>
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
            <NavLinks items={nav} />
          </div>
        </nav>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <img src="/site/onlive-logo-w.png" alt="islamonlive" width={207} height={59} />
          <div className="links">
            {nav.map(([label, to]) => <Link key={to} href={to}>{label}</Link>)}
          </div>
          <p>
            Copyright © 2026 | islamonlive.in | Powered by <a href="https://d4dx.co/" target="_blank" rel="noopener">D4DX</a>
          </p>
          <a className="admin-btn" href="/admin">Admin</a>
        </footer>
      </body>
    </html>
  )
}
