import { logFirebaseEvent, setFirebaseUserInterest } from './firebase';

export type AnalyticsEventType =
  | 'screen_view'
  | 'button_click'
  | 'modal_open'
  | 'modal_close'
  | 'tab_select'
  | 'slide_change'
  | 'form_submit'
  | 'outbound_click';

export type InterestCategory =
  | 'kids_program'
  | 'womens_program'
  | 'teacher_track'
  | 'trial_booking'
  | 'certificates'
  | 'stories'
  | 'general_info'
  | 'contact';

export interface TrackEventInput {
  eventType: AnalyticsEventType;
  eventName: string;
  label: string;
  screen?: string;
  interestCategory?: InterestCategory;
  course?: string;
  metadata?: string;
}

export interface LocalAnalyticsEvent {
  id: string;
  sessionId: string;
  eventType: AnalyticsEventType;
  firebaseEventName: string;
  eventName: string;
  screen: string;
  label: string;
  interestCategory: InterestCategory;
  course?: string;
  metadata?: string;
  createdAtMs: number;
}

const SESSION_STORAGE_KEY = 'lsh_analytics_session_id';
const LOCAL_EVENTS_KEY = 'lsh_session_events_v1';
const MAX_LOCAL_EVENTS = 200;

export const INTEREST_LABELS: Record<InterestCategory, string> = {
  kids_program: 'Kids Program (Ages 4–14)',
  womens_program: 'Women’s Spoken English',
  teacher_track: 'Teacher Communication',
  trial_booking: 'Free Trial & WhatsApp Booking',
  certificates: 'Student Certificates',
  stories: 'Student Voices & Stories',
  general_info: 'General Exploration',
  contact: 'Direct Call & Email',
};

export const EVENT_TYPE_LABELS: Record<AnalyticsEventType, string> = {
  screen_view: 'Screen View',
  button_click: 'Button Click',
  modal_open: 'Modal Open',
  modal_close: 'Modal Close',
  tab_select: 'Selection / Tab',
  slide_change: 'Hero Slide',
  form_submit: 'Form Submit',
  outbound_click: 'External / Contact Link',
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

function generateSafeId(prefix: string): string {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${Date.now()}_${randomPart}`;
}

export function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) {
      return existing;
    }
    const created = generateSafeId('sess').slice(0, 48);
    sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return generateSafeId('sess').slice(0, 48);
  }
}

/**
 * Firebase Analytics requires event names to be 1-40 chars,
 * starting with a letter and containing only letters, numbers, and underscores.
 */
function toFirebaseEventName(raw: string, eventType: AnalyticsEventType): string {
  if (eventType === 'screen_view') return 'screen_view';
  if (eventType === 'form_submit') return 'generate_lead';

  let cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!cleaned || !/^[a-z]/.test(cleaned)) {
    cleaned = `evt_${cleaned || 'click'}`;
  }

  // Avoid Firebase reserved prefixes
  if (
    cleaned.startsWith('firebase_') ||
    cleaned.startsWith('google_') ||
    cleaned.startsWith('ga_')
  ) {
    cleaned = `app_${cleaned}`;
  }

  return cleaned.slice(0, 40);
}

function truncateText(raw: string | undefined, max: number): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.replace(/\s+/g, ' ').trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

export function getScreenInfo(pathname: string): {
  eventName: string;
  label: string;
  interestCategory: InterestCategory;
} {
  switch (pathname) {
    case '/':
      return {
        eventName: 'screen_home',
        label: 'Home Screen',
        interestCategory: 'general_info',
      };
    case '/programs':
      return {
        eventName: 'screen_programs',
        label: 'Programs Screen',
        interestCategory: 'general_info',
      };
    case '/kids-program':
      return {
        eventName: 'screen_kids_program',
        label: 'Kids Program Screen',
        interestCategory: 'kids_program',
      };
    case '/english':
      return {
        eventName: 'screen_english_courses',
        label: 'English Courses Screen',
        interestCategory: 'womens_program',
      };
    case '/teachers':
      return {
        eventName: 'screen_teachers',
        label: 'Our Teachers Screen',
        interestCategory: 'teacher_track',
      };
    case '/certificates':
      return {
        eventName: 'screen_certificates',
        label: 'Student Certificates Screen',
        interestCategory: 'certificates',
      };
    case '/stories':
      return {
        eventName: 'screen_stories',
        label: 'Student Stories Screen',
        interestCategory: 'stories',
      };
    case '/about':
      return {
        eventName: 'screen_about',
        label: 'Our Difference Screen',
        interestCategory: 'general_info',
      };
    case '/journey':
      return {
        eventName: 'screen_journey',
        label: 'Learning Journey Screen',
        interestCategory: 'general_info',
      };
    case '/contact':
      return {
        eventName: 'screen_contact',
        label: 'Book Free Demo Screen',
        interestCategory: 'trial_booking',
      };
    case '/analytics':
      return {
        eventName: 'screen_analytics',
        label: 'Event Logs Inspector Screen',
        interestCategory: 'general_info',
      };
    default:
      return {
        eventName: `screen_${pathname.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown'}`,
        label: `Screen ${pathname}`,
        interestCategory: 'general_info',
      };
  }
}

export function inferInterestCategory({
  text = '',
  course = '',
  href = '',
  sectionId = '',
  screen = '/',
}: {
  text?: string;
  course?: string;
  href?: string;
  sectionId?: string;
  screen?: string;
}): InterestCategory {
  const combined = `${course} ${text} ${href} ${sectionId}`.toLowerCase();

  if (
    combined.includes('kid') ||
    combined.includes('child') ||
    combined.includes('ages 4') ||
    combined.includes('ages 7') ||
    combined.includes('ages 10') ||
    combined.includes('ages 12') ||
    combined.includes('little explorer') ||
    combined.includes('young speaker') ||
    combined.includes('smart communicator') ||
    combined.includes('young but advanced') ||
    combined.includes('parent')
  ) {
    return 'kids_program';
  }

  if (
    combined.includes('women') ||
    combined.includes('female') ||
    combined.includes('ladies') ||
    combined.includes('/english')
  ) {
    return 'womens_program';
  }

  if (
    combined.includes('teacher') ||
    combined.includes('educator') ||
    combined.includes('trainer')
  ) {
    return 'teacher_track';
  }

  if (combined.includes('certif') || sectionId === 'certificates') {
    return 'certificates';
  }

  if (
    combined.includes('stori') ||
    combined.includes('story') ||
    combined.includes('voice') ||
    sectionId === 'voices'
  ) {
    return 'stories';
  }

  if (
    combined.startsWith('tel:') ||
    combined.startsWith('mailto:') ||
    combined.includes('call 0348') ||
    combined.includes('@gmail.com')
  ) {
    return 'contact';
  }

  if (
    combined.includes('demo') ||
    combined.includes('trial') ||
    combined.includes('enroll') ||
    combined.includes('register') ||
    combined.includes('whatsapp') ||
    combined.includes('chat') ||
    combined.includes('/contact')
  ) {
    return 'trial_booking';
  }

  return getScreenInfo(screen).interestCategory;
}

export function getLocalSessionEvents(): LocalAnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearLocalSessionEvents(): void {
  try {
    localStorage.removeItem(LOCAL_EVENTS_KEY);
    window.dispatchEvent(new CustomEvent('lsh:analytics-updated'));
  } catch {
    // ignore storage errors
  }
}

function saveLocalEvent(event: LocalAnalyticsEvent): void {
  try {
    const current = getLocalSessionEvents();
    const updated = [event, ...current].slice(0, MAX_LOCAL_EVENTS);
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('lsh:analytics-updated', { detail: event }));
  } catch {
    // ignore storage errors
  }
}

export function trackEvent(input: TrackEventInput): void {
  const sessionId = getSessionId();
  const screen = truncateText(input.screen ?? window.location.pathname, 80) || '/';
  const label = truncateText(input.label, 100) || input.eventName;
  const course = truncateText(input.course, 100);
  const metadata = truncateText(input.metadata, 100);
  const interestCategory =
    input.interestCategory ??
    inferInterestCategory({ text: label, course, screen });

  const firebaseEventName = toFirebaseEventName(input.eventName, input.eventType);
  const eventId = generateSafeId('evt');

  const localRecord: LocalAnalyticsEvent = {
    id: eventId,
    sessionId,
    eventType: input.eventType,
    firebaseEventName,
    eventName: input.eventName,
    screen,
    label,
    interestCategory,
    ...(course ? { course } : {}),
    ...(metadata ? { metadata } : {}),
    createdAtMs: Date.now(),
  };

  saveLocalEvent(localRecord);

  // Send to Firebase Analytics (free event logs, zero Firestore database quota used)
  if (input.eventType === 'screen_view') {
    void logFirebaseEvent('screen_view', {
      firebase_screen: label,
      firebase_screen_class: screen,
      screen_path: screen,
      interest_category: interestCategory,
    });
  } else {
    void logFirebaseEvent(firebaseEventName, {
      event_type: input.eventType,
      button_label: label,
      screen_path: screen,
      interest_category: interestCategory,
      course_name: course,
      context: metadata,
    });
  }

  // Segment user by their latest interest in Firebase Analytics
  if (interestCategory !== 'general_info') {
    void setFirebaseUserInterest(interestCategory, course);
  }
}
