import { createFileRoute, notFound } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import Footer from '@/components/Footer'
import Header from '@/components/Header'
import StoreBadges from '@/components/ui/StoreBadges'
import { LogoMark } from '@/components/ui/Logo'
import { Container } from '@/components/ui/Section'
import {
  type Invite,
  androidIntentUrl,
  appJoinUrl,
  formatInviteCode,
  normalizeInviteCode,
} from '@/lib/invite'
import { seo } from '@/lib/seo'

/**
 * Landing page for a shared Prayer Circle invite.
 *
 * Capability-neutral by design: no backend call, so the page never reveals the
 * circle's name or members to whoever holds the link. It only hands the code
 * to the app. Not indexed, not cached, no referrer, and the code is never
 * logged.
 *
 * When the app is installed and the association documents are live, iOS and
 * Android open the app directly and this page is never shown.
 */
export const Route = createFileRoute('/prayer-circles/invite/$code')({
  loader: ({ params }) => {
    const invite = normalizeInviteCode(params.code)
    if (!invite) throw notFound()
    return { invite }
  },
  headers: () => ({
    'Cache-Control': 'private, no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex, nofollow',
  }),
  head: ({ loaderData }) => {
    const base = seo({
      title: "You're invited to a prayer circle",
      socialTitle: 'Join my prayer circle on Jejak Masjid',
      description:
        'Pray together with family and friends on Jejak Masjid. Open this link on your phone to join.',
      path:
        loaderData?.invite.kind === 'code'
          ? `/prayer-circles/invite/${loaderData.invite.value}`
          : '/prayer-circles/invite',
      noindex: true,
    })
    return {
      ...base,
      meta: [...base.meta, { name: 'referrer', content: 'no-referrer' }],
    }
  },
  component: InvitePage,
  notFoundComponent: IncompleteInvitePage,
})

function InvitePage() {
  const { invite } = Route.useLoaderData()

  return (
    <InviteShell>
      <LogoMark className="mx-auto h-14 w-14" />
      <h1 className="mt-7 text-[2rem] leading-tight text-foreground sm:text-4xl">
        You're invited to a prayer circle
      </h1>
      <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
        Pray together with family and friends on Jejak Masjid.
      </p>

      <OpenInAppButton invite={invite} />

      {invite.kind === 'code' ? <CodeBlock code={invite.value} /> : null}

      <div aria-hidden className="path-rule mx-auto my-12 max-w-xs" />

      <h2 className="text-2xl leading-tight text-foreground">Don't have the app?</h2>
      <StoreBadges size="compact" className="mt-6 justify-center" />

      <ol className="mx-auto mt-9 max-w-sm space-y-3 text-left text-muted-foreground">
        <Step n={1}>Install Jejak Masjid</Step>
        {invite.kind === 'code' ? (
          <>
            <Step n={2}>Open Prayer Circle → Join</Step>
            <Step n={3}>Enter the code above</Step>
          </>
        ) : (
          <Step n={2}>Come back to this link and tap Open in Jejak Masjid</Step>
        )}
      </ol>
    </InviteShell>
  )
}

function IncompleteInvitePage() {
  return (
    <InviteShell>
      <LogoMark className="mx-auto h-14 w-14" />
      <h1 className="mt-7 text-[2rem] leading-tight text-foreground sm:text-4xl">
        This invite link looks incomplete
      </h1>
      <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
        Ask the person who shared it to send it again, or enter their code in the app under
        Prayer Circle → Join.
      </p>
      <a
        href="/download"
        className="jm-press mt-9 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-7 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-strong"
      >
        Download the app
      </a>
    </InviteShell>
  )
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(120%_100%_at_50%_0%,var(--color-primary-tint)_0%,transparent_70%)]"
        />
        <Container className="relative max-w-xl py-14 text-center sm:py-20">{children}</Container>
      </main>
      <Footer />
    </>
  )
}

/**
 * Renders the custom-scheme link on the server. On Android, swaps in an
 * intent:// URL after hydration so Chrome falls through to the Play Store when
 * the app is missing. Only ever navigates on tap — never automatically.
 */
function OpenInAppButton({ invite }: { invite: Invite }) {
  const [href, setHref] = useState(() => appJoinUrl(invite.value))

  useEffect(() => {
    if (/Android/i.test(navigator.userAgent)) setHref(androidIntentUrl(invite.value))
  }, [invite.value])

  return (
    <a
      href={href}
      className="jm-press mt-9 inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-full bg-primary px-7 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-strong"
    >
      Open in Jejak Masjid
    </a>
  )
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2400)
    return () => clearTimeout(t)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      // Clipboard can be blocked (insecure context, in-app browsers). The code
      // stays selectable on screen, so there is nothing more to do.
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-xs rounded-2xl border border-border bg-surface px-5 py-6">
      <p className="text-sm text-subtle-foreground">Invite code</p>
      <p
        className="mt-2 font-mono text-[1.75rem] leading-none tracking-[0.12em] text-foreground select-all"
        aria-label={`Invite code ${code.split('').join(' ')}`}
      >
        {formatInviteCode(code)}
      </p>
      <button
        type="button"
        onClick={copy}
        className="jm-press mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-border-strong px-5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
      >
        {copied ? 'Copied' : 'Copy code'}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Invite code copied' : ''}
      </span>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-tint text-xs font-semibold text-primary-strong">
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  )
}
