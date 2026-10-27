import type { MetadataRoute } from 'next'
import { allCategories, allPosts } from '@/lib/data'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-static' // required for `output: 'export'`

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/` },
    ...allCategories.map((c) => ({ url: `${SITE_URL}/category/${c.slug}` })),
    ...allPosts.map((p) => ({ url: encodeURI(`${SITE_URL}/${p.category}/${p.slug}`), lastModified: p.date })),
  ]
}
