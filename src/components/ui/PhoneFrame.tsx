/**
 * A restrained device frame for app screenshots — a thin bezel and a soft
 * shadow, no glossy chrome.
 */
export default function PhoneFrame({
  src,
  alt,
  className = '',
  priority = false,
}: {
  src: string
  alt: string
  className?: string
  priority?: boolean
}) {
  return (
    <div
      className={`relative rounded-[2rem] border border-border-strong/70 bg-surface p-2 shadow-[0_28px_60px_-24px_rgba(0,48,47,0.35)] ${className}`}
    >
      <div className="overflow-hidden rounded-[1.6rem] bg-surface-sunken">
        <img
          src={src}
          alt={alt}
          width={720}
          height={1600}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : undefined}
          className="block h-auto w-full"
        />
      </div>
    </div>
  )
}
