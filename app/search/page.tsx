import type { Metadata } from 'next'
import { Suspense } from 'react'
import SearchResults from './SearchResults'

export const metadata: Metadata = { title: 'Search', robots: { index: false, follow: true } }

export default function Search() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  )
}
