import type { Metadata } from 'next'
import Link from 'next/link'
import { Anek_Malayalam } from 'next/font/google'
import NavLinks from './NavLinks'
import { APP_URL, SITE_URL } from '@/lib/site'
import './globals.css'

const font = Anek_Malayalam({ subsets: ['malayalam', 'latin'], display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Ramadan.Islamonlive.in',
    locale: 'ml_IN',
    images: ['/site/rmdn-logo1.png'],
  },
  title: 'Ramadan.Islamonlive.in | The one and only Comprehensive Ramadan portal in Malayalam',
  description: 'The one and only Comprehensive Ramadan portal in Malayalam',
}

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
      <body className={font.className}>
        <header className="site-header wrap">
          <Link href="/" className="logo">
            <img src="/site/rmdn-logo1.png" alt="Ramadan Online" />
          </Link>
          <a href={APP_URL} target="_blank" rel="noopener" className="banner">
            <img src="/site/for-rmdn.png" alt="Thafheem ul Quran app" />
          </a>
        </header>
        <nav className="wrap main-nav">
          <NavLinks items={nav} />
        </nav>
        <main>{children}</main>
        <footer className="site-footer">
          <img src="/site/onlive-logo-w.png" alt="islamonlive" />
          <p>
            Copyright © 2026 | islamonlive.in | Powered by <a href="https://d4dx.co/" target="_blank" rel="noopener">D4DX</a>
          </p>
          <a className="admin-btn" href="/admin/">Admin</a>
        </footer>
      </body>
    </html>
  )
}
