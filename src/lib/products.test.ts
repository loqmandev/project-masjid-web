import { expect, it } from 'vitest'
import { PRODUCTS, productHref } from './site'
import { t } from './i18n'

it('shares four real product destinations with honest availability in both languages', () => {
  expect(PRODUCTS.map(item => item.href)).toEqual(['/download', 'https://shop.jejakmasjid.my', 'https://merchant.jejakmasjid.my', '/kolaborasi'])
  expect(productHref(PRODUCTS[3], 'en')).toBe('/en/collaboration')
  for (const locale of ['ms', 'en'] as const) {
    for (const product of PRODUCTS) {
      const copy = t(locale).products[product.id]
      expect(copy.status.length).toBeGreaterThan(0)
      expect(JSON.stringify(copy)).not.toMatch(/beli sekarang|order now|sell now/i)
    }
  }
  expect(t('ms').products.merchant.status).toBe('Portal penjual (dengan jemputan)')
  expect(t('en').products.merchant.status).toBe('Seller portal (by invitation)')
})
