import type { MetadataRoute } from 'next'
import { allAuthors, allCategories, allPosts, allTags, allVideos } from '@/lib/data'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-static' // required for `output: 'export'`

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/` },
    ...allCategories.map((c) => ({ url: `${SITE_URL}/category/${c.slug}` })),
    ...allTags.map((t) => ({ url: encodeURI(`${SITE_URL}/tag/${t.slug}`) })),
    ...allAuthors.map((a) => ({ url: encodeURI(`${SITE_URL}/author/${a.slug}`) })),
    ...allVideos.map((v) => ({ url: encodeURI(`${SITE_URL}/aiovg_videos/${v.slug}`), lastModified: v.date })),
    ...allPosts.map((p) => ({ url: encodeURI(`${SITE_URL}/${p.category}/${p.slug}`), lastModified: p.date })),
  ]
}
