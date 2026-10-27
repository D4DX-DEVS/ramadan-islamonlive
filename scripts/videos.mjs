// Video posts keep their YouTube id in a WP plugin (not in the REST API), so scrape it from the post page.
// Run after `npm run fetch`; adds `video` (YouTube id) to data/posts.json.
import { readFileSync, writeFileSync } from 'node:fs'

const posts = JSON.parse(readFileSync('data/posts.json', 'utf8'))
const videos = posts.filter((p) => p.category === 'videos')
let next = 0
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (next < videos.length) {
      const p = videos[next++]
      const url = `${process.env.WP_URL || 'https://ramadan.islamonlive.in'}/videos/${p.slug}/`
      for (let i = 0; i < 4; i++) {
        try {
          const html = await (await fetch(url, { signal: AbortSignal.timeout(90000) })).text()
          p.video = html.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/)?.[1]
          if (p.video) break
        } catch {}
      }
      if (!p.video) console.warn('no video found', p.slug)
    }
  }),
)
writeFileSync('data/posts.json', JSON.stringify(posts))
console.log(videos.filter((p) => p.video).length, '/', videos.length, 'videos found')
