/** Stand-in for a post without an image: brand green with the two site logos as a watermark. */
export default function Placeholder({ className = '' }: { className?: string }) {
  return (
    <span className={`ph ${className}`} aria-hidden="true">
      <img src="/site/rmdn-logo1.png" alt="" width={300} height={124} loading="lazy" />
      <img src="/site/onlive-logo-w.png" alt="" width={207} height={59} loading="lazy" />
    </span>
  )
}
