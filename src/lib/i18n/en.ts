import { discoveryEn } from './discovery'
import type { Dictionary } from './ms'

export const en = {
  discovery: discoveryEn,
  nav: { collaborate: 'Collaborate', products: 'Products', features: 'Features', reviews: 'Reviews', faq: 'Questions', download: 'Download', language: 'Bahasa Melayu', main: 'Main navigation', mobile: 'Mobile navigation', open: 'Open menu', close: 'Close menu', home: 'Jejak Masjid home', skip: 'Skip to content', external: 'External site' },
  products: {
    app: { name: 'Jejak Masjid', status: 'iOS & Android app', description: 'Find nearby mosques and keep a record of your visits.' },
    shop: { name: 'Jejak Masjid Shop', status: 'Official merchandise', description: 'Get to know the official Jejak Masjid merchandise.' },
    merchant: { name: 'Jejak Masjid Merchant', status: 'Seller portal (by invitation)', description: 'A portal for sellers who have received an invitation.' },
    collaboration: { name: 'Collaboration', status: 'Work with us', description: 'Have an idea that could benefit the community? Let’s talk.' },
  },
  hero: {
    title: 'Find a Mosque Near You',
    description: 'Free app to find mosques near you, at home or on your travels. Check prayer times and keep a private record of every masjid you visit. iPhone and Android.',
    lines: ['Find mosques', 'near you, keep', 'your record.'],
    supporting: 'Jejak Masjid is a free app for finding mosques and surau near you, at home or on your travels. Check prayer times and keep a record of every visit.',
    caption: 'AI-generated illustration', replay: 'Replay animation',
    city: 'A watercolour map of a fictional neighbourhood, with four nearby mosques and surau.',
    phone: 'An actual screenshot of the Explore map in the Jejak Masjid app.',
    destinations: ['Nearby neighbourhood surau, 350 metres', 'Nearby shophouse surau, 600 metres', 'Nearby modern mosque, 900 metres', 'Nearby city mosque, 1400 metres'],
  },
  stores: { apple: 'Download Jejak Masjid on the App Store', google: 'Get Jejak Masjid on Google Play' },
  trust: { label: 'Store ratings and media coverage', checked: 'Checked', featured: 'Featured in', ratings: 'ratings', reviews: 'reviews' },
  stats: {
    title: 'Jejak Masjid in numbers', updated: 'Updated',
    total: 'Mosques and surau', countries: 'Countries with recorded mosques',
    completed: 'Completed visits · 30 days', uniqueMasjids: 'Different mosques visited · 30 days', activeVisitors: 'Active visitors · 30 days',
    byCountry: 'By country', countryNote: 'Recorded mosques and surau, alongside completed visits in 30 days.',
    byState: 'Malaysia by state', state: 'State', masjids: 'Mosques & surau', visits: 'Visits · 30 days',
    unknown: 'Other or unknown',
    definitions: 'A visit counts when someone checks in, stays at least 10 minutes and completes it nearby. Small numbers are hidden for privacy.',
  },
  features: {
    title: 'For every step of your journey.', intro: 'From finding somewhere to stop, to remembering a meaningful visit.',
    tiles: [
      { title: 'A nearby mosque, easier to find.', body: 'Explore a map and list of mosques and surau around you.', alt: 'Map and list of nearby mosques on the Explore screen' },
      { title: 'Be present. Keep a record.', body: 'Check in. Stay at least 10 min. Complete your visit nearby.', alt: 'A completed visit record' },
      { title: 'Prayer times, close at hand.', body: 'Daily prayer times. Malaysian data from JAKIM.', alt: 'Prayer times on the Today screen' },
      { title: 'Encouragement in a small circle.', body: 'Up to 10 people. Public circles need leader approval.', alt: 'Shared activity in a Prayer Circle' },
      { title: 'Your journey, at your own pace.', body: 'Remember your steps through achievements and monthly challenges.', alt: 'Personal achievements in Jejak Masjid' },
    ],
    privacy: 'Your visit history is private. Precise location is used only when checking in and completing a visit, with no background tracking.',
  },
  reviews: { title: 'From those who stopped by.', intro: 'Words from users, as shared in the app stores.', all: 'All', filter: 'Filter reviews by store', source: 'Read on' },
  media: { title: 'In the media', source: 'Read article' },
  ecosystem: { title: 'More than an app', intro: 'Other spaces in the Jejak Masjid family.', more: 'Learn more', visit: 'Visit' },
  faq: {
    title: 'Things people ask', help: 'Need a hand?', support: 'Visit Support',
    items: [
      { q: 'Is Jejak Masjid free?', a: 'Yes. Jejak Masjid is free to download and use on both iOS and Android.' },
      { q: 'Which mosques are covered?', a: 'More than 8,000 mosques and surau across all 13 states and 3 federal territories of Malaysia, drawn from JAKIM records and community submissions. You can also find mosques and record visits overseas; listings continue to grow, including Singapore, Brunei and Indonesia.' },
      { q: 'Where are prayer times available?', a: 'Prayer times are available for Malaysia (JAKIM), Singapore (MUIS), Brunei (KHEU), Indonesia (KEMENAG), Saudi Arabia (Umm al-Qura) and three cities in China (calculated). Prayer times are not yet available for every location worldwide.' },
      { q: 'Why does the app need my precise location?', a: 'Precise location is required when you check in and complete a visit to confirm your presence. Approximate location is not enough. Jejak Masjid does not track your location in the background.' },
      { q: 'How is a visit recorded?', a: 'Check in once you are at the mosque, stay at least ten minutes, then complete the visit while still nearby. The visit is then added to your record. A visit you never complete is kept as an incomplete one.' },
      { q: 'Is my visit history private?', a: 'Yes. Your visit history is private and visible only to you. Rankings are optional and secondary: you can appear under an anonymous display name, or simply ignore them.' },
      { q: 'What is a Prayer Circle?', a: 'A private group of up to ten people for sharing check-in activity and a few words of encouragement. Private circles are joined by invitation. Public circles can be found in the directory; requests to join need leader approval.' },
      { q: 'The mosque I visit is missing. What can I do?', a: 'Submit a suggestion from within the app with the mosque’s name and location. Once reviewed and added, it becomes available to other users.' },
      { q: 'What languages does the app support?', a: 'Bahasa Melayu is the app’s primary language. English is available as a secondary language.' },
    ],
  },
  cta: { title: 'A moment to stop by?', line: 'Start with a nearby mosque, at your own pace.' },
  footer: { products: 'Products', app: 'App', company: 'Company', note: 'A quiet record of your visits, to remember your steps and choose where to go next.', thanks: 'Thank you for being present.', built: 'Built by', disclosure: 'Hero illustration is AI-generated and does not show a real place.' },
  collaboration: {
    title: 'Collaborate with Jejak Masjid', description: 'We’re open to discussing ideas that benefit mosques and their communities. Contact Jejak Masjid about a collaboration.',
    intro: 'Have an idea that could bring us closer to the mosque? We’re open to discussing it.',
    cards: [
      { title: 'Islamic organisations & NGOs', body: 'Explore ideas for community challenges or events that invite people to come together.' },
      { title: 'Brands & sponsors', body: 'Discuss suitable Featured sponsored slots on Home or prizes for challenges.' },
      { title: 'Media & researchers', body: 'Get in touch with stories, data or research ideas about the community.' },
    ],
    bandTitle: 'Collaborate with us', contact: 'Email us', subject: 'Jejak Masjid collaboration', whatsapp: 'WhatsApp us', copy: 'Copy email', copied: 'Email copied.', select: 'Email selected. Copy this text manually.',
  },
} satisfies Dictionary
