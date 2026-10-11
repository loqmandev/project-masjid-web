import type { PublicMasjidPage, PublicProgramDetail } from './masjid-types'
import { SITE } from './site'
import { directionsUrl, localISO } from './masjid-format'
export function jsonLdScript(value: unknown) {
  const escapes: Record<string,string> = {'<':'\\u003c','>':'\\u003e','&':'\\u0026','\u2028':'\\u2028','\u2029':'\\u2029'}
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, c => escapes[c])
}
export function mosqueJsonLd(page: PublicMasjidPage) {
 const m=page.masjid,url=`${SITE.url}/masjid/${m.slug}`
 return {'@context':'https://schema.org','@type':'Mosque','@id':url+'#place',name:m.name,url,address:{'@type':'PostalAddress',streetAddress:m.address,addressLocality:m.districtName,addressRegion:m.stateName,addressCountry:'MY'},geo:{'@type':'GeoCoordinates',latitude:m.lat,longitude:m.lng},hasMap:directionsUrl(m.lat,m.lng),...(page.profile?.contactPhone?{telephone:page.profile.contactPhone}:{}),...(page.profile?.coverUrl?{image:page.profile.coverUrl}:{}),event:page.upcomingPrograms.slice(0,10).map(p=>({'@type':'Event',url:`${url}/p/${p.id}`,name:p.title,startDate:localISO(p.startsAt)}))}
}
export function eventJsonLd(p: PublicProgramDetail) {
 const url=`${SITE.url}/masjid/${p.masjid.slug}`
 return {'@context':'https://schema.org','@type':'Event',name:p.title,startDate:localISO(p.startsAt),endDate:localISO(p.endsAt),eventStatus:`https://schema.org/Event${p.status==='cancelled'?'Cancelled':'Scheduled'}`,eventAttendanceMode:'https://schema.org/OfflineEventAttendanceMode',location:{'@type':'Mosque','@id':url+'#place',name:p.masjid.name,address:{'@type':'PostalAddress',addressLocality:p.masjid.districtName,addressRegion:p.masjid.stateName,addressCountry:'MY'}},organizer:{'@type':'Organization',name:p.masjid.name,url},isAccessibleForFree:true,...(p.posterUrl?{image:p.posterUrl}:{}),...(p.description?{description:p.description}:{}),...(p.sponsorName?{sponsor:{'@type':'Organization',name:p.sponsorName}}:{})}
}
