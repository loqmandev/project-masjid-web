import {it,expect} from 'vitest'
import {masjidAppUrl,masjidIntentUrl,programAppUrl} from './deep-links'
it('scheme and program fallback target shipped masjid route',()=>{expect(masjidAppUrl('a/b')).toBe('jejakmasjidmobile://masjid/a%2Fb');expect(programAppUrl('x')).toBe(masjidAppUrl('x'))})
it('intent includes encoded Play fallback and package',()=>{const link=masjidIntentUrl('x');expect(link).toContain('intent://masjid/x');expect(link).toContain('package=my.lonasoft.jejakmasjidmobile');expect(link).toContain('S.browser_fallback_url=https%3A%2F%2Fplay.google.com')})
