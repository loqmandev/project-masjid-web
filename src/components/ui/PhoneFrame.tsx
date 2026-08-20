/**
 * A restrained device frame for app screenshots: a thin bezel and a soft
 * shadow, no glossy chrome.
 *
 * Screenshots render between 158 and 240px wide, so the 480px file covers 1x
 * and 2x displays and only 3x screens pull the 720px one.
 */
export default function PhoneFrame({
  src,
  alt,
  className = '',
  priority = false,
}: {
  /** Path to the 480px-wide file. The 2x variant is derived from it. */
  src: string
  alt: string
  className?: string
  priority?: boolean
}) {
  const src2x = src.replace(/\.webp$/, '@2x.webp')

  return (
    <div
      className={`relative rounded-[2rem] border border-border-strong/70 bg-surface p-2 shadow-[0_28px_60px_-24px_rgba(0,48,47,0.35)] ${className}`}
    >
      <div className="overflow-hidden rounded-[1.6rem] bg-surface-sunken">
        <img
          src={src}
          srcSet={`${src} 480w, ${src2x} 720w`}
          sizes="(min-width: 640px) 240px, 224px"
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
