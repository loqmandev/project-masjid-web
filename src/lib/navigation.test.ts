// @vitest-environment jsdom
import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HeaderContent } from '@/components/Header'
import Reviews from '@/components/Reviews'

beforeEach(() => vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('shared navigation', () => {
  it('keeps mobile navigation accessible and closes it with Escape and an outside click', () => {
    render(createElement(HeaderContent, { path: '/' }))
    const button = screen.getByRole('button', { name: 'Buka menu' })
    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button)
    fireEvent.click(button)
    fireEvent.click(document.body)
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })
  it('closes the native Products disclosure and returns focus on Escape', () => {
    const { container } = render(createElement(HeaderContent, { path: '/en' }))
    const details = container.querySelector('details')!
    const summary = details.querySelector('summary')!
    // Native summary keyboard activation is covered by the host browser script.
    details.open = true
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(details.open).toBe(false)
    expect(document.activeElement).toBe(summary)
    details.open = true
    fireEvent.click(document.body)
    expect(details.open).toBe(false)
  })
  it('uses local homepage anchors, paired language links and no new-tab product links', () => {
    const { container, rerender } = render(createElement(HeaderContent, { path: '/en/collaboration' }))
    expect(container.querySelector('a[href="/en#ciri"]')).toBeTruthy()
    expect(container.querySelector('a[href="/kolaborasi"][lang="ms"]')).toBeTruthy()
    expect(container.querySelector('a[href="https://shop.jejakmasjid.my"]')?.getAttribute('target')).toBeNull()
    rerender(createElement(HeaderContent, { path: '/privacy' }))
    expect(container.querySelector('a[lang]')).toBeNull()
    expect(container.querySelector('a[href="/en#ciri"]')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeTruthy()
  })
})

it('filters real reviews with aria-pressed buttons and restores all four', () => {
  const { container } = render(createElement(Reviews, { locale: 'en' }))
  expect(container.querySelectorAll('figure')).toHaveLength(4)
  fireEvent.click(screen.getByRole('button', { name: 'App Store' }))
  expect(screen.getByRole('button', { name: 'App Store' }).getAttribute('aria-pressed')).toBe('true')
  expect(container.querySelectorAll('figure')).toHaveLength(2)
  expect(screen.queryByText('Zulzaim Hilmee')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Google Play' }))
  expect(container.querySelectorAll('figure')).toHaveLength(2)
  expect(screen.queryByText('Pakracle')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'All' }))
  expect(container.querySelectorAll('figure')).toHaveLength(4)
})

it('exposes collaboration in desktop and mobile navigation as well as Products', () => {
  for (const [path, href, name] of [['/', '/kolaborasi', 'Kolaborasi'], ['/en', '/en/collaboration', 'Collaborate']]) {
    const { container, unmount } = render(createElement(HeaderContent, { path }))
    const links = [...container.querySelectorAll(`a[href="${href}"]`)]
    expect(links).toHaveLength(3)
    expect(links.filter(link => link.textContent === name)).toHaveLength(2)
    expect(container.textContent).not.toContain('AJK')
    unmount()
  }
})
