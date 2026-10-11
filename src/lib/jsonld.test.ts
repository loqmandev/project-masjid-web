import {it,expect} from 'vitest'
import {jsonLdScript,mosqueJsonLd,eventJsonLd} from './jsonld'
import {page,program} from './masjid-fixture'
it('escapes script breakout, ampersands and line separators',()=>{const text='</script>&\u2028\u2029';const result=jsonLdScript({text});expect(result).not.toContain('<');expect(result).not.toContain('&');expect(result).not.toContain('\u2028');expect(JSON.parse(result)).toEqual({text})})
it('Mosque omits absent telephone',()=>{const m=mosqueJsonLd(page);expect(m['@type']).toBe('Mosque');expect(m).not.toHaveProperty('telephone');expect(m['@id']).toContain('surau-fixture#place')})
it('Event has MYT dates and cancelled status',()=>{const e=eventJsonLd({...program,status:'cancelled'});expect(e.eventStatus).toContain('EventCancelled');expect(e.startDate).toBe('2099-10-12T20:30:00+08:00');expect(e.isAccessibleForFree).toBe(true)})
