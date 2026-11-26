export const WHATSAPP_NUMBER_E164 = '923483452142';
export const WHATSAPP_DISPLAY = '+92 348 3452142';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER_E164}`;
export const PHONE_URL = 'tel:+923483452142';
export const EMAIL_DISPLAY = 'Rimshaofficials24@gmail.com';
export const EMAIL_URL = `mailto:${EMAIL_DISPLAY}`;

export type PricingRegionId = 'pakistan' | 'uae' | 'saudi' | 'other';

export interface RegionPricing {
  id: PricingRegionId;
  label: string;
  shortLabel: string;
  monthlyPrice: string;
  currencyCode: string;
  perMonthText: string;
}

export const REGION_PRICING: RegionPricing[] = [
  {
    id: 'pakistan',
    label: 'Pakistan',
    shortLabel: 'Pakistan',
    monthlyPrice: 'Rs. 3,500',
    currencyCode: 'PKR',
    perMonthText: 'Rs. 3,500 / month · 20 Live Classes',
  },
  {
    id: 'uae',
    label: 'UAE',
    shortLabel: 'UAE',
    monthlyPrice: '120 AED',
    currencyCode: 'AED',
    perMonthText: '120 AED / month · 20 Live Classes',
  },
  {
    id: 'saudi',
    label: 'Saudi Arabia',
    shortLabel: 'Saudi Arabia',
    monthlyPrice: '120 SR',
    currencyCode: 'SAR',
    perMonthText: '120 SR / month · 20 Live Classes',
  },
  {
    id: 'other',
    label: 'International',
    shortLabel: 'Other',
    monthlyPrice: '$30',
    currencyCode: 'USD',
    perMonthText: '$30 USD / month · 20 Live Classes',
  },
];

export interface DetectedCountryInfo {
  regionId: PricingRegionId;
  countryCode: string;
  countryName: string;
}

export function getRegionPricing(regionId: PricingRegionId): RegionPricing {
  return REGION_PRICING.find((r) => r.id === regionId) ?? REGION_PRICING[0];
}

export function mapCountryCodeToRegion(countryCode?: string | null): PricingRegionId {
  const code = (countryCode || '').trim().toUpperCase();
  if (code === 'PK') return 'pakistan';
  if (code === 'AE') return 'uae';
  if (code === 'SA') return 'saudi';
  return 'other';
}

export function normalizeCountryName(countryCode: string, rawName?: string | null): string {
  const code = countryCode.trim().toUpperCase();
  if (code === 'PK') return 'Pakistan';
  if (code === 'AE') return 'UAE';
  if (code === 'SA') return 'Saudi Arabia';
  const cleaned = (rawName || '').trim();
  if (cleaned) return cleaned;
  if (code && /^[A-Z]{2}$/.test(code)) {
    try {
      const dn = new Intl.DisplayNames(['en'], { type: 'region' });
      return dn.of(code) || code;
    } catch {
      return code;
    }
  }
  return 'International';
}

export function detectTimezoneFallback(): DetectedCountryInfo {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Karachi')) {
      return { regionId: 'pakistan', countryCode: 'PK', countryName: 'Pakistan' };
    }
    if (tz.includes('Dubai') || tz.includes('Abu_Dhabi')) {
      return { regionId: 'uae', countryCode: 'AE', countryName: 'UAE' };
    }
    if (tz.includes('Riyadh')) {
      return { regionId: 'saudi', countryCode: 'SA', countryName: 'Saudi Arabia' };
    }
    if (tz) {
      return { regionId: 'other', countryCode: 'INTL', countryName: 'International' };
    }
  } catch {
    // ignore Intl errors
  }

  return { regionId: 'pakistan', countryCode: 'PK', countryName: 'Pakistan' };
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 3500): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function detectNetworkCountry(): Promise<DetectedCountryInfo | null> {
  if (typeof window === 'undefined') return null;

  // Try GeoJS first (fast CORS geo-IP endpoint)
  const geojs = await fetchJsonWithTimeout('https://get.geojs.io/v1/ip/country.json');
  if (geojs && typeof geojs.country === 'string' && /^[A-Za-z]{2}$/.test(geojs.country)) {
    const code = geojs.country.toUpperCase();
    return {
      regionId: mapCountryCodeToRegion(code),
      countryCode: code,
      countryName: normalizeCountryName(code, typeof geojs.name === 'string' ? geojs.name : null),
    };
  }

  // Fallback 2: api.country.is
  const countryIs = await fetchJsonWithTimeout('https://api.country.is/');
  if (countryIs && typeof countryIs.country === 'string' && /^[A-Za-z]{2}$/.test(countryIs.country)) {
    const code = countryIs.country.toUpperCase();
    return {
      regionId: mapCountryCodeToRegion(code),
      countryCode: code,
      countryName: normalizeCountryName(code, null),
    };
  }

  // Fallback 3: ipwho.is
  const ipwho = await fetchJsonWithTimeout('https://ipwho.is/?fields=success,country_code,country');
  if (
    ipwho &&
    ipwho.success !== false &&
    typeof ipwho.country_code === 'string' &&
    /^[A-Za-z]{2}$/.test(ipwho.country_code)
  ) {
    const code = ipwho.country_code.toUpperCase();
    return {
      regionId: mapCountryCodeToRegion(code),
      countryCode: code,
      countryName: normalizeCountryName(
        code,
        typeof ipwho.country === 'string' ? ipwho.country : null
      ),
    };
  }

  return null;
}

export const COURSE_OPTIONS: string[] = [
  'Kids Spoken English Program (Ages 4–6)',
  'Kids Spoken English Program (Ages 7–9)',
  'Kids Spoken English Program (Ages 10–14)',
  'Kids English Speaking Course (Ages 4–14)',
  'Female English Speaking Course',
  'Teacher Communication Track',
  'Free Trial Consultation / General Inquiry',
];

const asset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

export const ASSETS = {
  heroMain: asset('images/english-house-hero-CMLXIy-8.jpg'),
  kidsEnglish: asset('images/kids-online-english-DOEETZlE.jpg'),
  womenEnglish: asset('images/women-online-english-BAtbPt2F.jpg'),
  teachers: asset('images/english-teachers-CQru4C1B.jpg'),
  globalClassroom: asset('images/global-classroom-D3lUBUgr.jpg'),
  kidsPoster1: asset('images/playful-english-speaking-course-square.jpg'),
  kidsPoster2: asset('images/no-fees-english-speaking-poster-fee-3500.png'),
  womenPoster1: asset('images/no-fees-female-speaking-course-reference-style-v4.jpeg'),
  womenPoster2: asset('images/no-fees-female-speaking-course-navy-gold.png'),
  kidsWelcomePoster: asset('assets/aistudio/image_de2d3ae1.png'),
  studentDifferenceVideoId: 'tQhGDwCGTOw',
  studentDifferenceYoutubeUrl: 'https://youtube.com/shorts/tQhGDwCGTOw?si=l7IbqYK09WNFZEFP',
  studentDifferenceEmbedUrl:
    'https://www.youtube.com/embed/tQhGDwCGTOw?autoplay=1&mute=1&loop=1&playlist=tQhGDwCGTOw&playsinline=1&rel=0&modestbranding=1&enablejsapi=1',
};

export interface HeroSlide {
  image: string;
  title: string;
  text: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    image: ASSETS.heroMain,
    title: 'English becomes easier when you start speaking.',
    text: 'Live online classes designed around conversation, confidence, and the courage to use your voice.',
  },
  {
    image: ASSETS.kidsEnglish,
    title: 'Little voices. Big confidence.',
    text: 'A friendly space for children to discover new words, share their stories and enjoy speaking English.',
  },
  {
    image: ASSETS.womenEnglish,
    title: 'Find the confidence to use your voice.',
    text: 'Practical English for daily life, work and every conversation that matters.',
  },
  {
    image: ASSETS.teachers,
    title: 'Learn with warm encouragement.',
    text: 'Live expert guidance, patient feedback and a welcoming space to grow.',
  },
  {
    image: ASSETS.globalClassroom,
    title: 'One classroom. A world of possibility.',
    text: 'Practical spoken English for kids, women, and teachers, taught online in Urdu and English.',
  },
];

export interface CertificateItem {
  name: string;
  group: 'Advanced' | 'Basic' | 'Completed';
  image: string;
}

export const CERTIFICATES: CertificateItem[] = [
  {
    name: 'Ruhi',
    group: 'Advanced',
    image: asset('images/ruhi-advanced-session-certificate.png'),
  },
  {
    name: 'Anushay',
    group: 'Advanced',
    image: asset('images/anushay-advanced-session-certificate-v3.png'),
  },
  {
    name: 'Mariam',
    group: 'Advanced',
    image: asset('images/mariam-advanced-session-certificate-v4.png'),
  },
  {
    name: 'Harm Fatima',
    group: 'Advanced',
    image: asset('images/harm-fatima-advanced-session-certificate-v2.png'),
  },
  {
    name: 'Razia Khatoon',
    group: 'Basic',
    image: asset('images/updated-certificate-v4.png'),
  },
  {
    name: 'Atiqa',
    group: 'Basic',
    image: asset('images/atiqa-basic-session-certificate-v2.png'),
  },
  {
    name: 'Noor Fatima',
    group: 'Completed',
    image: asset('images/certificate-noor-fatima.png'),
  },
  {
    name: 'Nabeela Kousar',
    group: 'Completed',
    image: asset('images/certificate-nabeela-kousar.png'),
  },
  {
    name: 'Asiya Asif',
    group: 'Completed',
    image: asset('images/certificate-asiya-asif.png'),
  },
  {
    name: 'Huma Noor',
    group: 'Completed',
    image: asset('images/certificate-huma-noor.png'),
  },
  {
    name: 'Kinza Afzal',
    group: 'Completed',
    image: asset('images/certificate-kinza-afzal.png'),
  },
  {
    name: 'Mahnoor Shahid',
    group: 'Completed',
    image: asset('images/certificate-mahnoor-shahid.png'),
  },
  {
    name: 'Akasha Abid',
    group: 'Completed',
    image: asset('images/certificate-akasha-abid-v2.png'),
  },
  {
    name: 'Rabia Gulzar',
    group: 'Completed',
    image: asset('images/certificate-rabia-gulzar-v2.png'),
  },
];

export const SPOKEN_ENGLISH_SKILLS: string[] = [
  'Daily Life Conversation',
  'Pronunciation & Fluency',
  'Practical Grammar Usage',
  'Vocabulary Building',
  'Speaking Without Hesitation',
  'Storytelling & Expression',
  'Workplace & Interview English',
  'Active Listening Practice',
  'Parent-Child Speaking Habits',
  'Classroom Teaching English',
];

export interface ClassworkVideo {
  id: string;
  badge: string;
  title: string;
  focus: string;
  youtubeUrl: string;
  embedUrl: string;
}

export const CLASSWORK_PILLARS = [
  {
    title: 'Warm-up & Vocabulary Activation',
    text: 'Every class opens with guided prompts so students start speaking practical words in full sentences right away.',
  },
  {
    title: 'Live Role-Plays & Classwork',
    text: 'Learners practice real-life situations, pair dialogues, and interactive classroom tasks in small batches of 6–8.',
  },
  {
    title: 'Daily Speaking Exercises',
    text: 'Short, structured speaking drills build pronunciation, sentence flow, and confidence outside rote textbook work.',
  },
  {
    title: 'Gentle Real-Time Correction',
    text: 'Teachers guide tone, grammar, and fluency warmly while the student speaks—turning hesitation into natural habit.',
  },
] as const;

export const CLASSWORK_VIDEOS: ClassworkVideo[] = [
  {
    id: 'GK82BZd5h4k',
    badge: 'Classwork 01',
    title: 'Live Speaking Exercise',
    focus: 'Sentence formation & active classroom speaking',
    youtubeUrl: 'https://youtube.com/shorts/GK82BZd5h4k?feature=shared',
    embedUrl:
      'https://www.youtube.com/embed/GK82BZd5h4k?playsinline=1&rel=0&modestbranding=1',
  },
  {
    id: 'XTxNoHTPjAQ',
    badge: 'Classwork 02',
    title: 'Interactive Class Activity',
    focus: 'Guided conversation & quick-response drills',
    youtubeUrl: 'https://youtube.com/shorts/XTxNoHTPjAQ?feature=shared',
    embedUrl:
      'https://www.youtube.com/embed/XTxNoHTPjAQ?playsinline=1&rel=0&modestbranding=1',
  },
  {
    id: '5d4DIItxCr4',
    badge: 'Classwork 03',
    title: 'Confidence & Fluency Drill',
    focus: 'Clear pronunciation & expressive speaking',
    youtubeUrl: 'https://youtube.com/shorts/5d4DIItxCr4?feature=shared',
    embedUrl:
      'https://www.youtube.com/embed/5d4DIItxCr4?playsinline=1&rel=0&modestbranding=1',
  },
  {
    id: 'aXrUkS41oao',
    badge: 'Classwork 04',
    title: 'Practical Dialogue Practice',
    focus: 'Everyday English usage with teacher feedback',
    youtubeUrl: 'https://youtube.com/shorts/aXrUkS41oao?feature=shared',
    embedUrl:
      'https://www.youtube.com/embed/aXrUkS41oao?playsinline=1&rel=0&modestbranding=1',
  },
  {
    id: 'xA1_XBNdQsY',
    badge: 'Classwork 05',
    title: 'Student Classwork Showcase',
    focus: 'Real learner progress through daily exercises',
    youtubeUrl: 'https://youtube.com/shorts/xA1_XBNdQsY?feature=shared',
    embedUrl:
      'https://www.youtube.com/embed/xA1_XBNdQsY?playsinline=1&rel=0&modestbranding=1',
  },
];

export interface RouteMeta {
  title: string;
  description: string;
}

export const ROUTE_META: Record<string, RouteMeta> = {
  '/': {
    title: 'Live Spoken English Courses — Language Spoken House',
    description:
      'Live online English speaking courses for kids, women, and teachers. Small batches, Urdu and English guidance, and a free trial class.',
  },
  '/about': {
    title: 'Our Difference — Language Spoken House',
    description:
      'Speaking-first learning, practical communication and warm expert guidance at Language Spoken House.',
  },
  '/certificates': {
    title: 'Student Certificates — Language Spoken House',
    description:
      'View advanced, basic and course completion certificates awarded to Language Spoken House students.',
  },
  '/contact': {
    title: 'Book a Free Trial — Language Spoken House',
    description:
      'Contact Language Spoken House on WhatsApp (+92 348 3452142) or email Rimshaofficials24@gmail.com to book a free online trial class.',
  },
  '/english': {
    title: 'English Speaking Courses — Language Spoken House',
    description:
      'Kids and female English speaking courses with small batches and live weekday sessions.',
  },
  '/journey': {
    title: 'Your Learning Journey — Language Spoken House',
    description:
      'Discover the six steps from free consultation and trial class to live speaking practice and certification.',
  },
  '/kids-program': {
    title: 'English Speaking Program for Kids — Language Spoken House',
    description:
      'Fun spoken English for kids ages 4–14 through games, storytelling and conversation, with a free trial.',
  },
  '/programs': {
    title: 'Our Programs — Language Spoken House',
    description:
      'Explore live spoken English courses for kids, women, and teachers, with free trial enrollment.',
  },
  '/stories': {
    title: 'Student Voices — Language Spoken House',
    description:
      'Discover the kids, parents and women growing in confidence with Language Spoken House.',
  },
  '/teachers': {
    title: 'Our Teachers — Language Spoken House',
    description:
      'Meet the learning approach of our expert English trainers for kids, women and teacher communication.',
  },
  '/analytics': {
    title: 'Interest Analytics — Language Spoken House',
    description:
      'View screen views, button clicks, and program interest insights for Language Spoken House.',
  },
};
