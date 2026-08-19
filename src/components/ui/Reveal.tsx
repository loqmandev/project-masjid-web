import { useEffect, useRef, useState } from 'react'
import type { ElementType, ReactNode } from 'react'

/**
 * Reveals its children once, when they scroll into view.
 *
 * Deliberately IntersectionObserver rather than a motion library: this is the
 * only scroll-driven behaviour on the site, and it does not justify a 35KB
 * dependency. No scroll listener is ever attached.
 *
 * Safety: the pre-reveal state is applied by CSS only under
 * `html[data-motion="on"]`, which the head script sets only when JS runs and
 * the visitor has not asked for reduced motion. Without either, content simply
 * renders visible.
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className = '',
}: {
  children: ReactNode
  as?: ElementType
  /** Milliseconds to hold before this element enters, for ordering a group. */
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (document.documentElement.dataset.motion !== 'on') {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShown(true)
        observer.disconnect()
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      data-reveal={shown ? 'in' : 'out'}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={className}
    >
      {children}
    </Tag>
  )
}
