# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jejak Masjid (jejakmasjid.my) is a marketing/waitlist website for a mosque visit tracking mobile app. Built with TanStack Start (SSR React framework) and deployed to Cloudflare Pages.

## Commands

```bash
pnpm dev          # Start dev server on port 3000
pnpm build        # Build for production
pnpm test         # Run tests with Vitest
pnpm deploy       # Build and deploy to Cloudflare
```

## Architecture

### Tech Stack
- **Framework**: TanStack Start (React SSR) with TanStack Router (file-based routing)
- **Styling**: Tailwind CSS v4 with custom design tokens in `src/styles.css`
- **Deployment**: Cloudflare Pages via Wrangler
- **Email**: Resend API for transactional emails
- **Data Storage**: Google Sheets API for waitlist submissions

### Project Structure
```
src/
  routes/           # File-based routes (TanStack Router)
    __root.tsx      # Root layout with HTML shell, devtools
    index.tsx       # Homepage
    privacy.tsx     # Privacy policy
    tos.tsx         # Terms of service
    support.tsx     # Support page
    beta-ios.tsx    # iOS beta redirect
    beta-android.tsx # Android beta redirect
    google-groups.tsx # Google Groups redirect
  components/       # React components (Hero, Waitlist, Footer, etc.)
  emails/           # Email templates (onboarding-ios.ts, onboarding-android.ts)
  router.tsx        # Router configuration
  routeTree.gen.ts  # Auto-generated route tree (do not edit)
  styles.css        # Tailwind CSS with custom design system
```

### Key Patterns

**Server Functions**: Use `createServerFn` from `@tanstack/react-start` for server-side logic. See `src/components/Waitlist.tsx` for an example of form handling with server functions.

**Route Files**: Each file in `src/routes/` becomes a route. Use `createFileRoute` from `@tanstack/react-router`.

**Path Aliases**: Use `@/` to reference `src/` (e.g., `import Foo from '@/components/Foo'`).

**Design System**: CSS custom properties in `src/styles.css` define the color palette. Use Tailwind classes like `bg-primary`, `text-foreground`, `border-border`, etc. Supports both light and dark modes.

### Environment Variables (Production)
- `SHEET_ID` - Google Sheets ID for waitlist
- `GOOGLE_SERVICE_ACCOUNT_JSON` - Google service account credentials (JSON string)
- `RESEND_API_KEY` - Resend email API key
- `RESEND_FROM_EMAIL` - Sender email address
- `APP_DOMAIN` - Optional, defaults to https://jejakmasjid.my
