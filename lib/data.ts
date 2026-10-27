import posts from '@/data/posts.json'
import categories from '@/data/categories.json'
import { WP_URL } from './site'

export type Post = (typeof posts)[number]

const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
export const decode = (s: string) =>
  s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1))
    return entities[e] ?? m
  })

export const strip = (s: string) => decode(s.replace(/<[^>]+>/g, '')).trim()
// WP returns non-Latin slugs percent-encoded; routes need the decoded form.
// Pharmacy spam someone injected into the old WordPress posts (ihthikaf-2, optional-fasting).
// Applied here, not in data/*.json, so it survives re-running `npm run fetch`.
const SPAM = /<p[^>]*>(?:(?!<\/p>)[\s\S])*href="https?:\/\/(?:www\.)?(?:danmark-aptk\.com|farmacija-ed\.com)[\s\S]*?<\/p>/g
const cleanContent = (html: string) =>
  html
    .replace(SPAM, '')
    .replace(/<div id="[A-Za-z]{8,}">\s*<\/div>/g, '') // wrapper the spam was injected into
    .replaceAll(`${WP_URL}/`, '/') // links to the old WordPress origin become site-relative

export const allPosts: Post[] = posts.map((p) => {
  const content = cleanContent(p.content)
  // WP auto-excerpts of the spammed posts contain the spam text too, so rebuild them from the clean body.
  const excerpt = new RegExp(SPAM.source).test(p.content) ? `<p>${strip(content).slice(0, 200)}</p>` : p.excerpt
  return { ...p, slug: decodeURIComponent(p.slug), content, excerpt }
})
export const allCategories = categories.map((c) => ({ ...c, name: decode(c.name) }))
export const categoryBySlug = (slug: string) => allCategories.find((c) => c.slug === slug)
export const postsIn = (slug: string) => allPosts.filter((p) => p.category === slug)
export const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB') // dd/mm/yyyy, as on the original
