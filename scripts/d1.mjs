// Content database used by the /admin page (D1 table `items(kind, key, data)`).
//   node scripts/d1.mjs seed  load data/*.json into D1 (existing rows are kept, so admin edits are never overwritten)
//   node scripts/d1.mjs pull  write D1 back to data/*.json (run before a build to publish admin edits)
// Needs CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (D1 edit) and D1_DATABASE_ID.
import { readFileSync, writeFileSync } from 'node:fs'

const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, D1_DATABASE_ID } = process.env
if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !D1_DATABASE_ID) {
  throw new Error('Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN and D1_DATABASE_ID in .env')
}

async function q(sql, params = []) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`, {
      method: 'POST',
      headers: { authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ sql, params }),
    })
    const j = await r.json().catch(() => ({}))
    if (j.success) return j.result[0].results
    if (r.status < 500 && r.status !== 429) throw new Error(JSON.stringify(j.errors))
  }
  throw new Error('D1 query kept failing')
}

const KINDS = { posts: 'id', authors: 'id', videos: 'id', tags: 'slug', categories: 'slug' }

if (process.argv[2] === 'seed') {
  await q('CREATE TABLE IF NOT EXISTS items (kind TEXT NOT NULL, key TEXT NOT NULL, data TEXT NOT NULL, updated TEXT, PRIMARY KEY (kind, key))')
  for (const [kind, key] of Object.entries(KINDS)) {
    const rows = JSON.parse(readFileSync(`data/${kind}.json`, 'utf8'))
    let next = 0
    await Promise.all(
      Array.from({ length: 6 }, async () => {
        while (next < rows.length) {
          const row = rows[next++]
          await q('INSERT OR IGNORE INTO items (kind, key, data, updated) VALUES (?, ?, ?, ?)', [kind, String(row[key]), JSON.stringify(row), new Date().toISOString()])
        }
      }),
    )
    console.log(kind, rows.length)
  }
} else if (process.argv[2] === 'pull') {
  const load = async (kind) => (await q('SELECT data FROM items WHERE kind = ?', [kind])).map((r) => JSON.parse(r.data))
  const [posts, authors, tags, videos] = await Promise.all(['posts', 'authors', 'tags', 'videos'].map(load))
  if (!posts.length) throw new Error('D1 has no posts; refusing to overwrite data/*.json (run seed first)')
  const tagSlugs = new Set(tags.map((t) => t.slug))
  const authorName = Object.fromEntries(authors.map((a) => [a.id, a.name]))
  for (const p of posts) {
    p.tags = (p.tags ?? []).filter((t) => tagSlugs.has(t)) // a deleted tag has no page to link to
    p.author = authorName[p.authorId] ?? p.author // an author renamed in /admin
  }
  posts.sort((a, b) => b.date.localeCompare(a.date))
  videos.sort((a, b) => b.date.localeCompare(a.date))
  writeFileSync('data/posts.json', JSON.stringify(posts))
  writeFileSync('data/authors.json', JSON.stringify(authors, null, 1))
  writeFileSync('data/tags.json', JSON.stringify(tags, null, 1))
  writeFileSync('data/videos.json', JSON.stringify(videos, null, 1))
  console.log(`${posts.length} posts, ${authors.length} authors, ${tags.length} tags, ${videos.length} videos`)
} else {
  throw new Error('usage: node scripts/d1.mjs seed|pull')
}
