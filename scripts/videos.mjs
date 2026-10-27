// Video posts keep their YouTube id in a WP plugin (not in the REST API), so scrape it from the page.
// Run after `npm run fetch`; adds `video` (YouTube id) to data/posts.json and data/videos.json.
import { readFileSync, writeFileSync } from 'node:fs'

const ORIGIN = process.env.WP_URL || 'https://ramadan.islamonlive.in'
const posts = JSON.parse(readFileSync('data/posts.json', 'utf8'))
const gallery = JSON.parse(readFileSync('data/videos.json', 'utf8'))
// The gallery pages only carry the id in their YouTube thumbnail (og:image).
const ID = /(?:youtube(?:-nocookie)?\.com\/embed\/|img\.youtube\.com\/vi\/)([\w-]{11})/
const jobs = [
  ...posts.filter((p) => p.category === 'videos').map((item) => ({ item, url: `${ORIGIN}/videos/${item.slug}/` })),
  ...gallery.map((item) => ({ item, url: ORIGIN + item.path })),
]
let next = 0
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (next < jobs.length) {
      const { item, url } = jobs[next++]
      for (let i = 0; i < 4; i++) {
        try {
          const html = await (await fetch(url, { signal: AbortSignal.timeout(90000) })).text()
          item.video = html.match(ID)?.[1]
          if (item.video) break
        } catch {}
      }
      if (!item.video) console.warn('no video found', item.slug)
    }
  }),
)
writeFileSync('data/posts.json', JSON.stringify(posts))
writeFileSync('data/videos.json', JSON.stringify(gallery, null, 1))
console.log(jobs.filter((j) => j.item.video).length, '/', jobs.length, 'videos found')
