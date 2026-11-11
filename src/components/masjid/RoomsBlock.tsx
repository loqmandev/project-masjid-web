import { roomBlock, venueLinkText } from '@/lib/venue-rooms'
import type { PrayerRoom, VenueSummary } from '@/lib/masjid-types'

/** Disclosure for directions, access notes and way-finding photos; closed by default. */
export function RoomDetails({ details }: { details: ReturnType<typeof roomBlock>['details'] }) {
  if (!details.length) return null
  return (
    <details className="mt-2 text-[0.88rem] text-muted-foreground">
      <summary className="cursor-pointer font-semibold text-primary">How to get there</summary>
      <div className="mt-1.5 grid gap-1.5">
        {details.map((d, i) => (
          <div key={i}>
            {d.label && <p className="m-0 font-semibold">{d.label}</p>}
            {d.directions && <p className="m-0 whitespace-pre-line">{d.directions}</p>}
            {d.accessNotes && <p className="m-0 whitespace-pre-line">{d.accessNotes}</p>}
            {d.photos.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-2">
                {d.photos.map((p, j) => (
                  <a key={p.url} href={p.url} target="_blank" rel="noopener">
                    <img
                      src={p.url}
                      alt={`Way to the ${d.audience === 'men' ? "men's " : ''}surau, photo ${j + 1} of ${d.photos.length}`}
                      width={p.width ?? undefined}
                      height={p.height ?? undefined}
                      loading="lazy"
                      decoding="async"
                      className="block h-24 w-auto rounded-xl object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </details>
  )
}

/** Pin + location lines. Leading `strong` lines are bold; the rest are muted detail. */
export function RoomLines({ lines, strong }: { lines: string[]; strong: number }) {
  return (
    <>
      {lines.map((line, i) =>
        i < strong ? (
          <p key={i} className="m-0 flex items-start gap-2 font-semibold text-primary">
            {i === 0 ? <span aria-hidden="true">📍</span> : <span aria-hidden="true" className="w-[1.25em]" />}
            <span>{line}</span>
          </p>
        ) : (
          <p key={i} className="m-0 pl-7 text-[0.92rem] text-muted-foreground">
            {line}
          </p>
        ),
      )}
    </>
  )
}

/**
 * "Where to find it": the prayer room's floor and landmark inside its venue, directly
 * under the masjid name. Unverified rooms show a soft "Not yet confirmed" label.
 * Renders nothing without rooms (older backend payloads).
 */
export function RoomsBlock({ rooms, venue }: { rooms?: PrayerRoom[]; venue?: VenueSummary | null }) {
  if (!rooms?.length) return null
  const { lines, strong, details } = roomBlock(rooms)
  return (
    <section aria-label="Where to find it" className="mt-3 grid gap-0.5">
      <RoomLines lines={lines} strong={strong} />
      <div className="pl-7">
        <RoomDetails details={details} />
        {venue && (
          <>
            <p className="mt-2 mb-0 text-[0.92rem]">
              <a
                className="font-semibold text-primary underline underline-offset-[3px]"
                href={`/surau/${venue.slug}`}
              >
                {venueLinkText(venue)}
              </a>
            </p>
            {venue.openingHours && (
              <p className="mt-1 mb-0 text-[0.85rem] text-muted-foreground">
                {`Open when ${venue.name} is open · ${venue.openingHours}`}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
