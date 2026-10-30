/** @type {import('next').NextConfig} */
export default {
  output: 'export', // static HTML into out/ for Cloudflare Pages; redirects and headers live in public/_redirects and public/_headers
  images: { unoptimized: true }, // images are plain <img> from public/ or R2
}
