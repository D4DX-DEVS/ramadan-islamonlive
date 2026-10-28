import fs from 'node:fs'

// redirects.txt: "from to status" per line (the old WordPress URLs). Trailing-slash twins are redundant: Next ignores the slash.
const redirects = fs
  .readFileSync(new URL('./redirects.txt', import.meta.url), 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim().split(/\s+/))
  .filter(([from, to, code]) => code && !from.startsWith('#') && !from.endsWith('/'))
  .map(([source, destination, code]) => ({ source, destination, permanent: code === '301' }))

const noindex = [{ key: 'Cache-Control', value: 'no-store' }, { key: 'X-Frame-Options', value: 'DENY' }, { key: 'X-Robots-Tag', value: 'noindex' }]
const R2 = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '') // optional: uploads not in public/ are served from the R2 bucket

/** @type {import('next').NextConfig} */
export default {
  images: { unoptimized: true }, // images are plain <img> from public/ or R2
  redirects: async () => redirects,
  rewrites: async () => ({
    beforeFiles: [{ source: '/admin', destination: '/admin/index.html' }],
    fallback: R2 ? [{ source: '/uploads/:path*', destination: `${R2}/uploads/:path*` }] : [],
  }),
  headers: async () => [
    { source: '/uploads/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
    { source: '/site/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
    { source: '/admin', headers: noindex },
    { source: '/admin/:path*', headers: noindex },
  ],
}
