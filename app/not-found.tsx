import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="gray">
      <div className="wrap nf">
        <p className="nf-code">404</p>
        <h1>ഈ പേജ് കണ്ടെത്താനായില്ല</h1>
        <p>This page could not be found.</p>
        <Link href="/" className="tag">Back to home</Link>
      </div>
    </div>
  )
}
