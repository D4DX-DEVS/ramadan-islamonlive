'use client'
import { useState } from 'react'

// Plain share links; only "Copy link" needs the browser.
export default function Share({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)
  const links = [
    ['Facebook', 'f', `https://www.facebook.com/sharer/sharer.php?u=${u}`],
    ['X', 'X', `https://twitter.com/intent/tweet?url=${u}&text=${t}`],
    ['WhatsApp', 'W', `https://wa.me/?text=${t}%20${u}`],
    ['Telegram', 'T', `https://t.me/share/url?url=${u}&text=${t}`],
  ]
  return (
    <div className="share">
      <span>Share</span>
      {links.map(([name, glyph, href]) => (
        <a key={name} href={href} target="_blank" rel="noopener noreferrer" className={`s-${name.toLowerCase()}`} aria-label={`Share on ${name}`}>{glyph}</a>
      ))}
      <button
        type="button"
        className="s-copy"
        onClick={() => navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }, () => {})}
      >
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )
}
