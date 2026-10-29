import { OpenMasjid } from './OpenMasjid'
import {
  reviewMonth,
  reviewReportHref,
  roundToHalf,
  type MasjidReviews,
} from '@/lib/masjid-reviews'

const STAR =
  'M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z'
// The left half of the same star, for half-filled stars in the summary tile.
const STAR_HALF = 'M12 2.8L9.2 8.7 2.8 9.5l4.7 4.4-1.2 6.4L12 17.2z'

function Star({ fill, tone }: { fill: 'full' | 'half' | 'empty'; tone: 'ink' | 'gold' }) {
  const on = tone === 'gold' ? '#ffcc00' : '#003130'
  const off = tone === 'gold' ? '#b9c5c0' : '#b4cfcc'
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true" className="flex-none">
      <path
        d={STAR}
        fill={fill === 'full' ? on : 'none'}
        stroke={fill === 'full' ? on : off}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      {fill === 'half' && <path d={STAR_HALF} fill={on} />}
    </svg>
  )
}

/** Whole-number rating: filled deep-teal stars, outline for the rest. */
function RatingStars({ rating }: { rating: number }) {
  return (
    <span role="img" aria-label={`${rating} out of 5`} className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} tone="ink" fill={n <= rating ? 'full' : 'empty'} />
      ))}
    </span>
  )
}

function AverageStars({ average }: { average: number }) {
  const half = roundToHalf(average)
  return (
    <span role="img" aria-label={`${average.toFixed(1)} out of 5`} className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} tone="gold" fill={n <= half ? 'full' : n - 0.5 === half ? 'half' : 'empty'} />
      ))}
    </span>
  )
}

export default function Reviews({
  reviews,
  slug,
  masjidId,
}: {
  reviews: MasjidReviews
  slug: string
  masjidId: string
}) {
  const { count, average, items } = reviews
  return (
    <section aria-labelledby="reviews-title">
      <h2 id="reviews-title" className="m-h2">
        Reviews
      </h2>
      {count === 0 ? (
        <p className="m-0 text-[0.92rem] text-muted-foreground">
          No reviews yet. Visitors can rate this masjid in the app after they check in.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
          {count >= 3 && average !== null && (
            <span data-review-tile className="on-deep inline-flex items-center gap-2.5 rounded-[14px] bg-deep px-3.5 py-2.5 text-deep-foreground">
              <b className="font-display text-[1.6rem] leading-none font-extrabold [font-variant-numeric:tabular-nums]">
                {average.toFixed(1)}
              </b>
              <AverageStars average={average} />
            </span>
          )}
          <p className="m-0 max-w-[32ch] text-[0.86rem] text-muted-foreground">
            {count} {count === 1 ? 'review' : 'reviews'} from visitors who checked in with Jejak
            Masjid
          </p>
        </div>
      )}
      {items.length > 0 && (
        <ul className="m-0 mt-2.5 list-none p-0">
          {items.map((r) => (
            <li key={r.id} className="grid gap-1.5 border-b border-border py-3.5 last:border-b-0">
              <RatingStars rating={r.rating} />
              <p className="m-0 max-w-[62ch] text-[0.92rem] text-foreground">{r.tip}</p>
              <span className="flex flex-wrap gap-x-3 gap-y-1 text-[0.76rem] text-muted-foreground">
                <span>Visitor · {reviewMonth(r.createdAt)}</span>
                <a className="underline underline-offset-[3px]" href={reviewReportHref(r.id, slug)}>
                  Report
                </a>
              </span>
            </li>
          ))}
        </ul>
      )}
      {count > items.length && (
        <div className="mt-3">
          <OpenMasjid
            id={masjidId}
            label={`Read all ${count} reviews in the app`}
            className="text-[0.88rem] font-bold text-primary underline underline-offset-[3px]"
          />
        </div>
      )}
    </section>
  )
}
