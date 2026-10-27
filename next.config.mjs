/** @type {import('next').NextConfig} */
export default {
  output: 'export', // static HTML into out/, deployable to Cloudflare Pages with no server
  images: { unoptimized: true }, // required for export; images are plain <img> from public/ anyway
}
