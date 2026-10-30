import fs from 'node:fs'

// redirects.txt: "from to status" per line (the old WordPress URLs). Trailing-slash twins are redundant: Next ignores the slash.
// A trailing "/*" with ":splat" in the target (Pages syntax) becomes Next's ":path*".
const redirects = fs
  .readFileSync(new URL('./redirects.txt', import.meta.url), 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim().split(/\s+/))
  .filter(([from, to, code]) => code && !from.startsWith('#') && !from.endsWith('/'))
  .map(([source, destination, code]) => ({ source: source.replace(/\/\*$/, '/:path*'), destination: destination.replace(':splat', ':path*'), permanent: code === '301' }))

/** @type {import('next').NextConfig} */
export default {
  images: { unoptimized: true }, // images are plain <img> from public/ or R2
  redirects: async () => redirects,
}
