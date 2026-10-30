import { db, decode, fmtLong, strip } from '@/lib/data'

export const dynamic = 'force-dynamic'

// Small index the search page filters in the browser: title, url, author, date, excerpt, image.
export async function GET() {
  const { allPosts } = await db()
  return Response.json(
    allPosts.map((p) => ({ t: decode(p.title), u: encodeURI(`/${p.category}/${p.slug}`), a: p.author, d: fmtLong(p.date), e: strip(p.excerpt).slice(0, 160), i: p.image })),
  )
}
