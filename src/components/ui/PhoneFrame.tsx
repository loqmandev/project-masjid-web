/**
 * A restrained device frame for app screenshots: a thin bezel and a soft
 * shadow, no glossy chrome.
 *
 * Each screenshot ships at 320, 480 and 720 px wide. Callers pass the real
 * rendered width of the screen as `sizes`, so a phone downloads the 320 px file
 * for the small bento slots and only 3x screens pull the 720 px one.
 */
export default function PhoneFrame({
  src,
  alt,
  sizes = '126px',
  className = '',
  priority = false,
}: {
  /** Path to the 480px-wide file. The 320px (`-320`) and 720px (`@2x`) variants are derived from it. */
  src: string
  alt: string
  /** Rendered width of the screen image (frame minus bezel), for `srcset` selection. */
  sizes?: string
  className?: string
  priority?: boolean
}) {
  const src320 = src.replace(/\.webp$/, '-320.webp')
  const src2x = src.replace(/\.webp$/, '@2x.webp')

  return (
    <div
      className={`relative rounded-[2rem] border border-border-strong/70 bg-surface p-2 shadow-[0_28px_60px_-24px_rgba(0,48,47,0.35)] ${className}`}
    >
      <div className="overflow-hidden rounded-[1.6rem] bg-surface-sunken">
        <img
          src={src}
          srcSet={`${src320} 320w, ${src} 480w, ${src2x} 720w`}
          sizes={sizes}
          alt={alt}
          width={480}
          height={1067}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : undefined}
          className="block h-auto w-full"
        />
      </div>
    </div>
  )
}
