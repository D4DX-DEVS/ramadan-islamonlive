import { getCloudflareContext } from '@opennextjs/cloudflare'

// Content lives in Cloudflare D1 (table `items`), reached through the DB binding declared in wrangler.jsonc.
export async function query(sql: string, params: unknown[] = []): Promise<Record<string, any>[]> {
  return (await getCloudflareContext().env.DB.prepare(sql).bind(...params).all()).results as Record<string, any>[]
}

// Same call shape lib/admin-api.js expects (prepare / bind / all / first / run).
export const DB = {
  prepare: (sql: string) => getCloudflareContext().env.DB.prepare(sql),
}

// Every admin write marks all stored pages (worker.ts) out of date; this location sees it at once, the others within 30 s.
export async function purgePages() {
  await getCloudflareContext().env.UPLOADS.put('cache/purged', String(Date.now()))
  await (caches as unknown as { default: Cache }).default.delete(new Request('https://cache.internal/purged'))
}
