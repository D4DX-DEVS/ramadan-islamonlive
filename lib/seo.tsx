import { SITE_URL } from './site'

export const SITE_NAME = 'Ramadan.Islamonlive.in'
export const abs = (path: string) => encodeURI(SITE_URL + path)

// Stable @id values so the schema blocks on every page refer to the same Organization and WebSite.
export const ORG_ID = `${SITE_URL}/#organization`
export const SITE_ID = `${SITE_URL}/#website`

/** One JSON-LD block. `<` is escaped so page text can never close the script tag. */
export const JsonLd = ({ data }: { data: object }) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
)

export const breadcrumbs = (trail: [name: string, path: string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
})

export const publisher = { '@type': 'Organization', '@id': ORG_ID, name: SITE_NAME, url: SITE_URL, logo: { '@type': 'ImageObject', url: abs('/site/rmdn-logo1.png') } }
