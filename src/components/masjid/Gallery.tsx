import { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { MOSAIC_MAX } from '@/lib/masjid-gallery'
import MapImage from './MapImage'

/**
 * One set of <img> elements, restyled by CSS: a scroll-snap strip below lg and a
 * mosaic from lg. The first image is the LCP element. The phone counter reads
 * "N photos" in the server HTML and "i / N" after hydration.
 */
export function Gallery({ photos, name }: { photos: string[]; name: string }) {
  const n = photos.length
  const strip = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState<number | null>(null)
  useEffect(() => {
    const root = strip.current
    if (!root || n < 2 || typeof IntersectionObserver === 'undefined') return
    setIndex(0)
    const ratio = new Map<Element, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ratio.set(entry.target, entry.intersectionRatio)
        let best = -1
        let bestRatio = 0
        Array.from(root.children).forEach((child, i) => {
          const r = ratio.get(child) ?? 0
          if (r > bestRatio) {
            bestRatio = r
            best = i
          }
        })
        if (best >= 0) setIndex(best)
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    Array.from(root.children).forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [n])

  const counter =
    n === 1 ? '1 photo' : index === null ? `${n} photos` : `${index + 1} / ${n}`
  return (
    <div className="m-gallery">
      <div
        ref={strip}
        className="m-strip"
        data-n={n}
        data-mosaic={Math.min(n, MOSAIC_MAX)}
        aria-label="Photos"
      >
        {photos.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={i === 0 ? name : `${name}, photo ${i + 1}`}
            width={1200}
            height={900}
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : undefined}
            decoding={i === 0 ? 'sync' : 'async'}
          />
        ))}
      </div>
      <span className="m-count lg:hidden">
        <Camera aria-hidden="true" />
        {counter}
      </span>
      {n > MOSAIC_MAX && (
        <a
          href="#photos"
          className="m-btn m-btn-ghost absolute right-3.5 bottom-3.5 hidden lg:inline-flex"
        >
          <Camera aria-hidden="true" />
          All {n} photos
        </a>
      )}
    </div>
  )
}

/** "No photos yet" card. Over the map from lg when `overlay`; standalone otherwise. */
export function NoPhotosCard({ overlay = false }: { overlay?: boolean }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border-[1.5px] border-dashed border-border-strong bg-white/50 p-4 text-[0.86rem] text-muted-foreground ${
        overlay
          ? 'mt-2.5 lg:absolute lg:bottom-4 lg:left-4 lg:mt-0 lg:max-w-[360px] lg:border-solid lg:border-border lg:bg-white/95'
          : 'mt-2.5'
      }`}
    >
      <Camera aria-hidden="true" className="mt-0.5 h-[18px] w-[18px] flex-none text-primary" />
      <span>
        <b className="block text-primary">No photos yet</b>
        Visitors add photos in the Jejak Masjid app when they singgah.
      </span>
    </div>
  )
}

/** No photos and the map is on: the map takes the gallery slot, with the card. */
export function MapHero({ slug, name }: { slug: string; name: string }) {
  return (
    <div className="relative mt-2.5">
      <MapImage slug={slug} name={name} eager className="m-map-hero" />
      <NoPhotosCard overlay />
    </div>
  )
}
