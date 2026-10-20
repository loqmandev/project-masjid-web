import { useEffect, useRef, useState } from 'react'
import PageLayout from './PageLayout'
import MasjidFacilities from './MasjidFacilities'
import { trustedImage } from '@/lib/masjid-seo'
import StoreBadges from './ui/StoreBadges'
import { API_PUBLIC_URL } from '@/lib/site'
import { masjidAppUrl, masjidIntentUrl } from '@/lib/deep-links'
import {
  audienceLabels,
  categoryLabels,
  programDate,
  directionsUrl,
  prayerTime,
  recurringTime,
  PRAYER_KEYS,
  placeParts,
} from '@/lib/masjid-format'
import type {
  FacilityCatalogueDetails,
  PublicMasjidPage,
  PublicProgramCard,
  PublicProgramDetail,
} from '@/lib/masjid-types'
const button =
  'inline-flex min-h-12 items-center rounded-full px-6 py-3 font-display font-extrabold no-underline'
export function OpenMasjid({
  id,
  label = 'Open in Jejak Masjid',
  onDeep = false,
}: {
  id: string
  label?: string
  onDeep?: boolean
}) {
  const [href, setHref] = useState(masjidAppUrl(id))
  useEffect(
    () =>
      setHref(
        /Android/i.test(navigator.userAgent)
          ? masjidIntentUrl(id)
          : masjidAppUrl(id),
      ),
    [id],
  )
  return (
    <a
      className={`${button} ${onDeep ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}`}
      href={href}
    >
      {label}
    </a>
  )
}
function ViewBeacon({ kind, id }: { kind: 'masjid' | 'program'; id: string }) {
  const sent = useRef('')
  useEffect(() => {
    const key = kind + id
    if (
      sent.current === key ||
      navigator.webdriver ||
      location.hostname !== 'jejakmasjid.my'
    )
      return
    sent.current = key
    navigator.sendBeacon?.(
      API_PUBLIC_URL + '/api/public/views',
      new Blob([JSON.stringify({ kind, id, surface: 'web' })], {
        type: 'text/plain',
      }),
    )
  }, [kind, id])
  return null
}
export function MissingMasjid() {
  return (
    <PageLayout title="We couldn't find this masjid">
      <a href="/">Return home</a>
    </PageLayout>
  )
}
export function MissingProgram() {
  return (
    <PageLayout title="We couldn't find this program">
      <a href="/">Return home</a>
    </PageLayout>
  )
}
export function RestingPage() {
  return (
    <PageLayout title="This page is resting for a moment.">
      <p>Please try again.</p>
      <a href="/">Return home</a>
    </PageLayout>
  )
}
function ProgramTags({ p }: { p: PublicProgramCard }) {
  return (
    <>
      <p>
        {categoryLabels[p.category]} ·{' '}
        {p.audienceTags.map((t) => audienceLabels[t]).join(' · ')}
      </p>
      {p.foodProvided && <p>Food provided</p>}
      {p.sponsorName && <p>Sponsored by {p.sponsorName}</p>}
    </>
  )
}
function Photo({
  url,
  alt,
  eager = false,
}: {
  url: string
  alt: string
  eager?: boolean
}) {
  const src = trustedImage(url)
  if (!src) return null
  return (
    <img
      src={src}
      alt={alt}
      width={960}
      height={640}
      loading={eager ? 'eager' : 'lazy'}
      className="h-auto w-full rounded-[20px] object-cover"
    />
  )
}
export function MasjidPage({
  page,
  prayers,
  ajk,
  facilityCatalogue = [],
}: {
  page: PublicMasjidPage
  prayers: Record<string, string> | null
  ajk: boolean
  facilityCatalogue?: FacilityCatalogueDetails[]
}) {
  const m = page.masjid,
    p = page.profile,
    cover =
      trustedImage(p?.coverUrl) ||
      page.photos.map((photo) => trustedImage(photo.url)).find(Boolean)
  return (
    <PageLayout
      title={m.name}
      intro={placeParts(m.districtName, m.stateName).line}
      actions={
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-center gap-5">
            <OpenMasjid id={m.id} onDeep />
            <a
              className="text-deep-foreground underline"
              href={directionsUrl(m.lat, m.lng)}
            >
              Get directions
            </a>
          </div>
          <p className="mt-4 text-sm text-deep-muted">
            Don't have the app? Get it below.
          </p>
        </div>
      }
    >
      {ajk && <ViewBeacon kind="masjid" id={m.id} />}
      {cover && <Photo url={cover} alt={m.name} eager />}
      <AboutSection page={page} />
      {Array.isArray(page.facilities) && (
        <MasjidFacilities
          facilities={page.facilities}
          catalogue={facilityCatalogue}
          masjidName={m.name}
        />
      )}
      <div className="path-rule my-10" aria-hidden />
      {ajk && <ProgramsSection page={page} />}
      {ajk && <NewsSection page={page} />}
      <PhotosSection page={page} />
      <PrayerTimesSection prayers={prayers} />
      <ClaimCta page={page} ajk={ajk} />
      <StoreBadges />
    </PageLayout>
  )
}

function AboutSection({ page }: { page: PublicMasjidPage }) {
  const m = page.masjid,
    p = page.profile
  return (
    <>
      <section>
        <h2>About this masjid</h2>
        {p?.description?.split(/\n+/).map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        <p>{m.address}</p>
        {p?.whatsappUrl && (
          <p>
            <a href={p.whatsappUrl}>WhatsApp the AJK</a>
          </p>
        )}
        {p?.contactPhone && (
          <p>
            <a href={`tel:${p.contactPhone}`}>{p.contactPhone}</a>
          </p>
        )}
        {!Array.isArray(page.facilities) && !!p?.facilities.length && (
          <ul>
            {p.facilities.map((f) => (
              <li key={f.code}>{f.label}</li>
            ))}
          </ul>
        )}
        {!!p?.recurringClasses.length && (
          <>
            <h3>Recurring classes</h3>
            <ul>
              {p.recurringClasses.map((c, i) => (
                <li key={i}>
                  Every{' '}
                  {
                    [
                      'Sunday',
                      'Monday',
                      'Tuesday',
                      'Wednesday',
                      'Thursday',
                      'Friday',
                      'Saturday',
                    ][c.dayOfWeek]
                  }{' '}
                  · {recurringTime(c.startTime)} · {c.title}
                  {c.note ? ` · ${c.note}` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  )
}
function ProgramsSection({ page }: { page: PublicMasjidPage }) {
  const m = page.masjid
  return (
    <>
      <section>
        <h2>Upcoming programs</h2>
        {page.upcomingPrograms.length ? (
          page.upcomingPrograms.map((p) => (
            <article key={p.id} className="my-5 rounded-[20px] bg-surface p-6">
              {p.posterUrl && (
                <Photo url={p.posterUrl} alt={`Poster for ${p.title}`} />
              )}
              <h3>
                <a href={`/masjid/${m.slug}/p/${p.id}`}>{p.title}</a>
              </h3>
              <p>{programDate(p.startsAt)} MYT</p>
              {p.status === 'cancelled' && <p>Cancelled</p>}
              <ProgramTags p={p} />
            </article>
          ))
        ) : (
          <p>No upcoming programs listed yet.</p>
        )}
        {page.pastProgramCount > 0 && (
          <p>
            {page.pastProgramCount}{' '}
            {page.pastProgramCount === 1 ? 'program' : 'programs'} held here on
            Jejak Masjid
          </p>
        )}
      </section>
    </>
  )
}
function NewsSection({ page }: { page: PublicMasjidPage }) {
  const posts = page.posts.filter((p) =>
    ['news', 'volunteer', 'appeal'].includes(p.type),
  )
  return (
    <>
      {!!posts.length && (
        <section>
          <h2>News</h2>
          {posts.map((p) => (
            <article key={p.id}>
              <h3>{p.title}</h3>
              {p.type === 'appeal' && <p>Appeal · checked by Jejak Masjid</p>}
              <p className="whitespace-pre-line">{p.body}</p>
            </article>
          ))}
        </section>
      )}
    </>
  )
}
function PhotosSection({ page }: { page: PublicMasjidPage }) {
  const m = page.masjid
  const photos = page.photos
    .filter((photo) => trustedImage(photo.url))
    .slice(0, 8)
  return (
    <>
      {!!photos.length && (
        <section>
          <h2>Photos</h2>
          <div className="grid grid-cols-2 gap-4">
            {photos.map((p, i) => (
              <Photo key={i} url={p.url} alt={`${m.name}, photo ${i + 1}`} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
function PrayerTimesSection({
  prayers,
}: {
  prayers: Record<string, string> | null
}) {
  return (
    <>
      {prayers && (
        <section>
          <h2>Today's prayer times</h2>
          <dl>
            {PRAYER_KEYS.map((k) => (
              <div
                key={k}
                className="flex justify-between border-b border-border py-2"
              >
                <dt className="capitalize">{k}</dt>
                <dd>{prayerTime(prayers[k])}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </>
  )
}
function ClaimCta({ page, ajk }: { page: PublicMasjidPage; ajk: boolean }) {
  const m = page.masjid
  return (
    <>
      <aside className="on-deep my-10 rounded-[20px] bg-deep p-8 text-deep-foreground [&_h2]:text-deep-foreground [&_a]:text-deep-foreground">
        {!ajk ? (
          <>
            <h2>Are you on this masjid's committee?</h2>
            <a href="https://jejakmasjid.my/ajk">Register your interest</a>
          </>
        ) : page.claimed ? (
          <p>
            Managed by the AJK of {m.name} · Are you AJK here?{' '}
            <a href="https://ajk.jejakmasjid.my/login">Sign in</a>
          </p>
        ) : (
          <>
            <h2>Are you the AJK of this surau?</h2>
            <p>
              Claim this page to share your programs with the kariah and people
              nearby. It's free.
            </p>
            <a
              href={`https://ajk.jejakmasjid.my/claim?masjid=${encodeURIComponent(m.id)}`}
            >
              Claim this surau
            </a>
          </>
        )}
      </aside>
    </>
  )
}

export function ProgramPage({ p }: { p: PublicProgramDetail }) {
  return (
    <PageLayout title={p.title} intro={p.masjid.name}>
      <ViewBeacon kind="program" id={p.id} />
      {p.status === 'cancelled' && <p>Cancelled</p>}
      {p.posterUrl && (
        <Photo url={p.posterUrl} alt={`Poster for ${p.title}`} eager />
      )}
      <p>
        {programDate(p.startsAt)} – {programDate(p.endsAt)} MYT
      </p>
      {p.venueNote && <p>{p.venueNote}</p>}
      <p>
        <a href={`/masjid/${p.masjid.slug}`}>{p.masjid.name}</a>
      </p>
      <p className="whitespace-pre-line">{p.description}</p>
      <ProgramTags p={p} />
      {trustedImage(p.sponsorLogoUrl, true) && (
        <img
          src={trustedImage(p.sponsorLogoUrl, true)}
          alt={p.sponsorName || 'Sponsor'}
          width={160}
          height={80}
          loading="lazy"
        />
      )}
      {p.registrationEnabled && p.spotsLeft !== null && (
        <p>{p.spotsLeft} spots left</p>
      )}
      {p.status !== 'cancelled' && (
        <>
          <OpenMasjid
            id={p.masjid.id}
            label="Register in the Jejak Masjid app"
          />
          <p>Don't have the app? Get it below.</p>
        </>
      )}
      <p>At the door, the AJK scans your Jejak Masjid Passport.</p>
      <StoreBadges />
    </PageLayout>
  )
}
