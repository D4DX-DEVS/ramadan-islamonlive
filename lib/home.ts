import { allPosts, postsIn, type Post } from './data'

// Curated homepage picks, copied from the original WordPress homepage (slug order = display order).
const pick = (slugs: string[]) =>
  slugs.map((s) => allPosts.find((p) => p.slug === s)).filter((p): p is Post => !!p)

export const hero = postsIn('naseehat').slice(0, 4)

export const articles = pick([
  'the-preaching-of-islam',
  'the-last-ten-days-of-ramadan-2',
  'dont-hold-hatred-and-grudges',
  'winners-of-ramadan',
  'losers-of-ramadan',
  'stealing-away-the-good-things-of-fasting',
])

export const columns = pick(['prophets-smile', 'the-message-of-ramadan-fasts', 'fasting-period-and-time'])

export const features = pick([
  'eid-al-fitr-prayers-in-medina',
  'travel-to-madinah',
  'qatmul-quran-in-makkah-and-qiyamullah-in-madinah',
  'the-last-friday-of-ramadan-in-haram',
])

export const zakat = pick(['organized-zakat-management', 'wealth-virtue-and-importance', 'zakat-and-fitr-zakat'])

export const quran = pick([
  'maintaining-perseverance',
  'thwagooth',
  'various-types-of-verses',
  'value-of-time',
  'those-who-announce-the-good-news',
  'the-world-from-love',
])

export const qa = pick([
  'niyyat-of-fasting',
  'atonement-of-fasting',
  'special-prayers',
  'missed-fasts-in-ramadan',
  'fasting-while-travelling',
  'ihthikaf',
  'breaking-the-fast-for-non-muslims',
  'ramadan-fiqh-6',
])

export const synopsis = [
  { slug: 'patheyam-through-ramadan', img: 'Ramadan-1-150x150.jpeg', by: 'അബ്ദുൽ ഹകീം നദ് വി' },
  { slug: 'ramadan-zakat', img: 'Ramadan-zakat-150x150.jpeg', by: 'ഡോ. എ എ ഹലീം' },
  { slug: 'synopsis', img: 'Ramadan-150x150.jpeg', by: 'അബ്ദുൽ ഹകീം നദ് വി' },
].flatMap((s) => {
  const post = allPosts.find((p) => p.slug === s.slug)
  return post ? [{ ...s, post }] : []
})

export const videos = pick(['ramadan-naseehath-9', 'lesson-given-by-badr', 'ramadan-naseehath-8']).flatMap((post) =>
  post.video ? [{ slug: post.slug, yt: post.video, post }] : [],
)
