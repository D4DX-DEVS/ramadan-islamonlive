'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavLinks({ items }: { items: string[][] }) {
  const path = usePathname()
  return items.map(([label, to]) => {
    const active = to === '/' ? path === '/' : path === to || path.startsWith(to + '/')
    return <Link key={to} href={to} className={active ? 'active' : undefined}>{label}</Link>
  })
}
