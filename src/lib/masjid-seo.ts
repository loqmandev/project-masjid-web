import type { PublicMasjidPage, PublicProgramDetail } from './masjid-types'
import { seo } from './seo'
export function trustedImage(url: string | null | undefined, program=false) {
 if (!url) return undefined
 try { const u=new URL(url); return u.protocol==='https:' && ((u.hostname==='shop.jejakmasjid.my' && u.pathname.startsWith(program?'/media/ajk/':'/media/')) || (!program && ['images.jejakmasjid.my','cdn.jejakmasjid.my'].includes(u.hostname))) ? url : undefined } catch { return undefined }
}
export function masjidSeo(p: PublicMasjidPage) { const m=p.masjid, text=p.profile?.description?.slice(0,150); return seo({title:`${m.name} · ${m.districtName}`,description:text || `${m.name} in ${m.districtName}, ${m.stateName}. Programs, photos and directions on Jejak Masjid.`,path:`/masjid/${m.slug}`,noindex:!p.indexable,image:trustedImage(p.profile?.coverUrl || p.photos[0]?.url)}) }
export function programSeo(p: PublicProgramDetail, now=Date.now()) { return seo({title:`${p.title} · ${p.masjid.name}`,description:p.description?.slice(0,150)||`A program at ${p.masjid.name}.`,path:`/masjid/${p.masjid.slug}/p/${p.id}`,type:'article',noindex:p.status==='cancelled'||Date.parse(p.endsAt)<now,image:trustedImage(p.posterUrl,true)}) }
