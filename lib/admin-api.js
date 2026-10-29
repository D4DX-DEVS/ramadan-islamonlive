// Admin API, mounted at /api/* by app/api/[...path]/route.ts. Content lives in D1 table `items(kind, key, data)`.
// env: DB (D1 shim), ADMIN_PASSWORD, onChange() (refreshes the cached pages after every write).

const enc = new TextEncoder()
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
async function sign(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64(await crypto.subtle.sign('HMAC', key, enc.encode(msg)))
}
// Both sides are HMAC outputs of equal length, so this compare does not leak the password length.
const same = (a, b) => a.length === b.length && [...a].reduce((d, c, i) => d | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0
const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } })
const COOKIE = 'admin_session'
const HOURS = 8

async function loggedIn(request, env) {
  const m = (request.headers.get('cookie') || '').match(new RegExp(`${COOKIE}=(\\d+)\\.([\\w-]+)`))
  return !!m && +m[1] > Date.now() && same(m[2], await sign(env.ADMIN_PASSWORD, m[1]))
}

// Editable fields per kind: t = string | number | list of strings. Anything else a client sends is dropped.
const S = (max, req = true) => ({ t: 's', max, req })
const N = { t: 'n', req: true }
const L = { t: 'l', req: false }
const KINDS = {
  posts: { num: true, fields: { title: S(300), slug: S(200), category: S(60), authorId: N, date: S(30), excerpt: S(5000, false), content: S(500000, false), image: S(500, false), video: S(20, false), tags: L } },
  authors: { num: true, fields: { name: S(100), slug: S(100), description: S(2000, false) } },
  tags: { fields: { name: S(100), slug: S(100) } },
  videos: { num: true, fields: { title: S(300), slug: S(200), date: S(30), video: S(20) } },
  categories: { readonly: true },
}
const SLUG = /^[^\s/%?#\\]+$/

function clean(kind, body) {
  const out = {}
  for (const [f, d] of Object.entries(KINDS[kind].fields)) {
    let v = body[f]
    if (d.t === 's') v = typeof v === 'string' ? v.trim() : v == null ? '' : null
    if (d.t === 'n') v = Number.isInteger(v) ? v : null
    if (d.t === 'l') v = Array.isArray(v) && v.every((x) => typeof x === 'string' && SLUG.test(x)) ? v : v == null ? [] : null
    if (v === null || (d.req && v === '') || (d.t === 's' && v.length > d.max)) throw new Error(`Invalid ${f}`)
    out[f] = d.t === 's' && !v && ['image', 'video'].includes(f) ? (f === 'image' ? null : undefined) : v
  }
  if ('slug' in out && !SLUG.test(out.slug)) throw new Error('Slug cannot contain spaces or / % ? #')
  if ('date' in out && out.date && Number.isNaN(Date.parse(out.date))) throw new Error('Invalid date')
  return out
}

export async function onRequest({ request, env, params }) {
  const url = new URL(request.url)
  const [route, kind, key] = params.path
  const method = request.method

  if (route === 'login' && method === 'POST') {
    const { password = '' } = await request.json().catch(() => ({}))
    if (!env.ADMIN_PASSWORD || !same(await sign('pw', String(password)), await sign('pw', env.ADMIN_PASSWORD))) {
      await new Promise((r) => setTimeout(r, 1000)) // slows password guessing
      return json({ error: 'Wrong password' }, 401)
    }
    const exp = Date.now() + HOURS * 3600e3
    const cookie = `${COOKIE}=${exp}.${await sign(env.ADMIN_PASSWORD, String(exp))}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${HOURS * 3600}`
    return json({ ok: true }, 200, { 'set-cookie': cookie })
  }
  if (route === 'logout') return json({ ok: true }, 200, { 'set-cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` })
  if (!(await loggedIn(request, env))) return json({ error: 'Not logged in' }, 401)
  if (route === 'me') return json({ ok: true })

  const write = method !== 'GET'
  if (write && request.headers.get('origin') && request.headers.get('origin') !== url.origin) return json({ error: 'Bad origin' }, 403)

  // Saves already refresh the live pages; Publish just forces a refresh again.
  if (route === 'publish' && method === 'POST') {
    await env.onChange()
    return json({ ok: true })
  }

  const spec = KINDS[kind]
  if (route !== 'items' || !spec) return json({ error: 'Not found' }, 404)
  const first = (sql, ...b) => env.DB.prepare(sql).bind(...b).first()

  if (method === 'GET' && !key) {
    // The list view does not need the bulky body text, so D1 never sends it.
    const { results } = await env.DB.prepare("SELECT json_remove(data, '$.content', '$.excerpt') AS data FROM items WHERE kind = ?").bind(kind).all()
    return json(results.map((r) => JSON.parse(r.data)))
  }
  if (method === 'GET') {
    const row = await first('SELECT data FROM items WHERE kind = ? AND key = ?', kind, key)
    return row ? json(JSON.parse(row.data)) : json({ error: 'Not found' }, 404)
  }
  if (spec.readonly) return json({ error: 'Read only' }, 405)

  if (method === 'DELETE' && key) {
    await env.DB.prepare('DELETE FROM items WHERE kind = ? AND key = ?').bind(kind, key).run()
    await env.onChange()
    return json({ ok: true })
  }
  if ((method === 'POST' && !key) || (method === 'PUT' && key)) {
    let data
    try { data = clean(kind, await request.json()) } catch (e) { return json({ error: e.message }, 400) }
    if (key && !spec.num) data.slug = key // a tag's slug is its key, so it cannot be renamed
    const old = key && (await first('SELECT data FROM items WHERE kind = ? AND key = ?', kind, key))
    if (key && !old) return json({ error: 'Not found' }, 404)
    const id = key ?? (spec.num ? String((await first('SELECT COALESCE(MAX(CAST(key AS INTEGER)), 0) + 1 AS n FROM items WHERE kind = ?', kind)).n) : data.slug)
    if (!key && !spec.num && (await first('SELECT 1 AS x FROM items WHERE kind = ? AND key = ?', kind, id))) return json({ error: 'That slug is already used' }, 409)
    if (spec.num) {
      // Slugs are unique per kind (posts: per category) because they become page addresses.
      const dup = await first(
        "SELECT 1 AS x FROM items WHERE kind = ? AND key != ? AND json_extract(data, '$.slug') = ? AND (? = '' OR json_extract(data, '$.category') = ?)",
        kind, id, data.slug, data.category ?? '', data.category ?? '',
      )
      if (dup) return json({ error: 'That slug is already used' }, 409)
    }
    if (kind === 'posts') {
      if (!(await first('SELECT 1 AS x FROM items WHERE kind = ? AND key = ?', 'categories', data.category))) return json({ error: 'Unknown category' }, 400)
      const a = await first('SELECT data FROM items WHERE kind = ? AND key = ?', 'authors', String(data.authorId))
      if (!a) return json({ error: 'Unknown author' }, 400)
      data.author = JSON.parse(a.data).name
    }
    const merged = { ...(old ? JSON.parse(old.data) : {}), ...data, ...(spec.num ? { id: +id } : {}) }
    if (kind === 'videos') merged.path = `/aiovg_videos/${encodeURIComponent(merged.slug)}/`
    for (const k of Object.keys(merged)) if (merged[k] === undefined) delete merged[k]
    await env.DB.prepare('INSERT INTO items (kind, key, data, updated) VALUES (?, ?, ?, ?) ON CONFLICT (kind, key) DO UPDATE SET data = excluded.data, updated = excluded.updated')
      .bind(kind, id, JSON.stringify(merged), new Date().toISOString()).run()
    await env.onChange()
    return json(merged, key ? 200 : 201)
  }
  return json({ error: 'Method not allowed' }, 405)
}
