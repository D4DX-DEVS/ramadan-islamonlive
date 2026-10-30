// Content lives in Cloudflare D1 (table `items`); the build reads it through the D1 HTTP API.
const url = () =>
  `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.D1_DATABASE_ID}/query`

export async function query(sql: string, params: unknown[] = []): Promise<Record<string, any>[]> {
  const r = await fetch(url(), {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ sql, params }),
    cache: 'no-store',
  })
  const j = await r.json()
  if (!j.success) throw new Error(`D1: ${j.errors?.[0]?.message ?? r.status}`)
  return j.result[0].results
}

// Same call shape as a Pages Function's D1 binding, so lib/admin-api.js runs unchanged.
export const DB = {
  prepare: (sql: string) => ({
    bind: (...b: unknown[]) => ({
      all: async () => ({ results: await query(sql, b) }),
      first: async () => (await query(sql, b))[0] ?? null,
      run: async () => ({ results: await query(sql, b) }),
    }),
  }),
}
