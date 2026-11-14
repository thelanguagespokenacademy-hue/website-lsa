export const WHATSAPP_NUMBER_E164 = '923483452142';
export const WHATSAPP_DISPLAY = '+92 348 3452142';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER_E164}`;
export const PHONE_URL = 'tel:+923483452142';
export const EMAIL_URL = 'mailto:rimshaofficials24@gmail.com';

export const COURSE_OPTIONS: string[] = [
  'Kids Spoken English Program (Ages 4–6 · Rs. 133/Day)',
  'Kids Spoken English Program (Ages 7–9 · Rs. 145/Day)',
  'Kids Spoken English Program (Ages 10–14 · Rs. 155/Day)',
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
  kidsWelcomePoster: asset('assets/aistudio/WhatsApp_Image_2026-11-13_at_9.51.22_AM_e217f483.jpeg'),
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
      'Contact Language Spoken House on WhatsApp or phone at +92 348 3452142 to book a free online trial class.',
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
};
