import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  computeDeviceFingerprint,
  readIndexedDbIdentity,
  writeIndexedDbIdentity,
} from './deviceFingerprint';
import {
  buildFirestoreErrorInfo,
  db,
  handleFirestoreError,
  logFirebaseEvent,
  OperationType,
  setFirebaseUserInterest,
} from './firebase';

export type AnalyticsEventType =
  | 'screen_view'
  | 'option_view'
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

export interface VisitorIdentity {
  visitorId: string;
  visitorToken: string;
  sessionId: string;
  visitCount: number;
  isReturning: boolean;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceSummary: string;
}

export interface TrackEventInput {
  eventType: AnalyticsEventType;
  eventName: string;
  label: string;
  screen?: string;
  section?: string;
  optionKey?: string;
  interestCategory?: InterestCategory;
  course?: string;
  metadata?: string;
}

export interface LocalAnalyticsEvent {
  id: string;
  visitorId: string;
  visitorToken: string;
  sessionId: string;
  visitNumber: number;
  eventType: AnalyticsEventType;
  firebaseEventName: string;
  eventName: string;
  screen: string;
  section?: string;
  optionKey?: string;
  label: string;
  interestCategory: InterestCategory;
  course?: string;
  metadata?: string;
  createdAtMs: number;
}

export interface FirestoreVisitorRecord {
  visitorId: string;
  currentSessionId: string;
  visitCount: number;
  totalEvents: number;
  isReturning: boolean;
  lastScreen: string;
  lastEventType: AnalyticsEventType;
  lastEventName: string;
  lastLabel: string;
  lastInterestCategory: InterestCategory;
  lastCourse?: string;
  exploredOptions: string[];
  visitedScreens: string[];
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceSummary?: string;
  firstSeenAtMs: number;
  lastSeenAtMs: number;
}

export interface FirestoreSyncStatus {
  state: 'idle' | 'syncing' | 'synced' | 'error';
  syncedCount: number;
  lastSyncedAtMs: number | null;
  lastError: string | null;
  quotaExceeded: boolean;
}

const VISITOR_ID_KEY = 'lsh_device_id_v2';
const VISITOR_TOKEN_KEY = 'lsh_device_token_v2';
const VISITOR_SUMMARY_KEY = 'lsh_device_summary_v2';
const VISITOR_REMOTE_CREATED_KEY = 'lsh_visitor_remote_created_v2';
const VISIT_COUNT_KEY = 'lsh_visit_count_v2';
const LAST_SESSION_KEY = 'lsh_last_session_id_v2';
const SESSION_STORAGE_KEY = 'lsh_analytics_session_id';
const LOCAL_EVENTS_KEY = 'lsh_session_events_v1';
const EXPLORED_OPTIONS_KEY = 'lsh_explored_options_v1';
const VISITED_SCREENS_KEY = 'lsh_visited_screens_v1';
const MAX_LOCAL_EVENTS = 200;
const MAX_EXPLORED_OPTIONS = 25;
const MAX_VISITED_SCREENS = 20;

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
  option_view: 'Option / Section Loaded',
  button_click: 'Button Click',
  modal_open: 'Modal Open',
  modal_close: 'Modal Close',
  tab_select: 'Selection / Tab',
  slide_change: 'Hero Slide',
  form_submit: 'Form Submit',
  outbound_click: 'External / Contact Link',
};

let syncStatus: FirestoreSyncStatus = {
  state: 'idle',
  syncedCount: 0,
  lastSyncedAtMs: null,
  lastError: null,
  quotaExceeded: false,
};

let firestoreWriteChain: Promise<void> = Promise.resolve();
let visitorEnsuredRemote = false;
let pendingVisitIncrement = false;
let cachedIdentity: VisitorIdentity | null = null;
let identityPromise: Promise<VisitorIdentity> | null = null;

function notifyAnalyticsUpdated(detail?: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('lsh:analytics-updated', { detail }));
}

function generateRandomHex(length: number): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(Math.ceil(length / 2));
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, length);
  }
  return (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).slice(0, length);
}

function generateSafeId(prefix: string): string {
  const stamp = Date.now().toString(36);
  return `${prefix}_${stamp}_${generateRandomHex(12)}`;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const prefix = `${name}=`;
    const parts = document.cookie.split(';');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith(prefix)) {
        return decodeURIComponent(trimmed.slice(prefix.length));
      }
    }
  } catch {
    // ignore cookie errors
  }
  return null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=34560000; Path=/; SameSite=Lax`;
  } catch {
    // ignore cookie errors
  }
}

function detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth || 1024;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function isValidSafeSlug(val: string | null | undefined, minLen: number, maxLen: number): val is string {
  if (!val) return false;
  return val.length >= minLen && val.length <= maxLen && /^[a-zA-Z0-9_-]+$/.test(val);
}

export function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (isValidSafeSlug(existing, 8, 64)) {
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
 * Synchronous snapshot for immediate UI rendering before async device fingerprinting settles.
 */
export function getVisitorIdentity(): VisitorIdentity {
  if (cachedIdentity) return cachedIdentity;

  const sessionId = getSessionId();
  let visitorId = 'resolving_device';
  let visitorToken = 'resolving_device_token';
  let visitCount = 1;
  let isReturning = false;
  let deviceSummary = 'Detecting device signature...';

  try {
    const lsId = localStorage.getItem(VISITOR_ID_KEY);
    const ckId = readCookie(VISITOR_ID_KEY);
    if (isValidSafeSlug(lsId, 8, 64)) visitorId = lsId;
    else if (isValidSafeSlug(ckId, 8, 64)) visitorId = ckId;

    const lsTok = localStorage.getItem(VISITOR_TOKEN_KEY);
    const ckTok = readCookie(VISITOR_TOKEN_KEY);
    if (isValidSafeSlug(lsTok, 16, 64)) visitorToken = lsTok;
    else if (isValidSafeSlug(ckTok, 16, 64)) visitorToken = ckTok;

    const savedSummary = localStorage.getItem(VISITOR_SUMMARY_KEY);
    if (savedSummary) deviceSummary = savedSummary;

    const prevCount = Number(localStorage.getItem(VISIT_COUNT_KEY) || '1');
    visitCount = Number.isFinite(prevCount) && prevCount >= 1 ? prevCount : 1;
    isReturning = visitCount > 1;
  } catch {
    // ignore storage read errors
  }

  return {
    visitorId,
    visitorToken,
    sessionId,
    visitCount,
    isReturning,
    deviceType: detectDeviceType(),
    deviceSummary,
  };
}

/**
 * Resolves a deterministic hardware/browser Device ID across 4 storage layers:
 * 1) localStorage -> 2) Cookie -> 3) IndexedDB -> 4) SHA-256 Hardware/Canvas/WebGL/Screen fingerprint.
 * Even after 7+ days or browser cache/storage purges, the same device computes the exact same dev_ ID.
 */
export function ensureVisitorIdentity(): Promise<VisitorIdentity> {
  if (cachedIdentity) return Promise.resolve(cachedIdentity);
  if (identityPromise) return identityPromise;

  identityPromise = (async () => {
    const sessionId = getSessionId();
    const [fp, idb] = await Promise.all([computeDeviceFingerprint(), readIndexedDbIdentity()]);

    let lsId: string | null = null;
    let lsTok: string | null = null;
    let ckId: string | null = null;
    let ckTok: string | null = null;

    try {
      lsId = localStorage.getItem(VISITOR_ID_KEY);
      lsTok = localStorage.getItem(VISITOR_TOKEN_KEY);
    } catch {
      // ignore storage errors
    }

    ckId = readCookie(VISITOR_ID_KEY);
    ckTok = readCookie(VISITOR_TOKEN_KEY);

    const storedId = isValidSafeSlug(lsId, 8, 64)
      ? lsId
      : isValidSafeSlug(ckId, 8, 64)
        ? ckId
        : isValidSafeSlug(idb?.deviceId, 8, 64)
          ? idb.deviceId
          : null;

    const storedToken = isValidSafeSlug(lsTok, 16, 64)
      ? lsTok
      : isValidSafeSlug(ckTok, 16, 64)
        ? ckTok
        : isValidSafeSlug(idb?.deviceToken, 16, 64)
          ? idb.deviceToken
          : null;

    const visitorId = storedId ?? fp.deviceId;
    const visitorToken = storedToken ?? fp.deviceToken;

    let visitCount = 1;
    let isReturning = false;

    try {
      const existedLocally = Boolean(storedId && storedToken);
      if (!existedLocally) {
        visitCount = 1;
        isReturning = false;
        pendingVisitIncrement = false;
        localStorage.setItem(VISIT_COUNT_KEY, '1');
        localStorage.setItem(LAST_SESSION_KEY, sessionId);
      } else {
        const prevCount = Number(localStorage.getItem(VISIT_COUNT_KEY) || '1');
        const lastSession = localStorage.getItem(LAST_SESSION_KEY);
        if (lastSession !== sessionId) {
          visitCount = Number.isFinite(prevCount) && prevCount >= 1 ? prevCount + 1 : 2;
          isReturning = visitCount > 1;
          pendingVisitIncrement = true;
          localStorage.setItem(VISIT_COUNT_KEY, String(visitCount));
          localStorage.setItem(LAST_SESSION_KEY, sessionId);
        } else {
          visitCount = Number.isFinite(prevCount) && prevCount >= 1 ? prevCount : 1;
          isReturning = visitCount > 1;
        }
      }

      localStorage.setItem(VISITOR_ID_KEY, visitorId);
      localStorage.setItem(VISITOR_TOKEN_KEY, visitorToken);
      localStorage.setItem(VISITOR_SUMMARY_KEY, fp.deviceSummary);
    } catch {
      // ignore storage write errors
    }

    writeCookie(VISITOR_ID_KEY, visitorId);
    writeCookie(VISITOR_TOKEN_KEY, visitorToken);
    void writeIndexedDbIdentity(visitorId, visitorToken);

    cachedIdentity = {
      visitorId,
      visitorToken,
      sessionId,
      visitCount,
      isReturning,
      deviceType: fp.deviceType,
      deviceSummary: fp.deviceSummary,
    };

    notifyAnalyticsUpdated(cachedIdentity);
    return cachedIdentity;
  })();

  return identityPromise;
}

export function getFirestoreSyncStatus(): FirestoreSyncStatus {
  return { ...syncStatus };
}

function toSafeEventName(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/[^a-zA-Z0-9_.:-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100);
  if (cleaned.length >= 2) return cleaned;
  return `ev_${cleaned || 'action'}`;
}

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
    combined.includes('classwork') ||
    combined.includes('exercise') ||
    combined.includes('difference') ||
    sectionId === 'voices' ||
    sectionId === 'classwork' ||
    sectionId === 'why'
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

export function getExploredOptions(): string[] {
  try {
    const raw = localStorage.getItem(EXPLORED_OPTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string' && x.length >= 1).slice(0, MAX_EXPLORED_OPTIONS)
      : [];
  } catch {
    return [];
  }
}

export function getVisitedScreens(): string[] {
  try {
    const raw = localStorage.getItem(VISITED_SCREENS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string' && x.length >= 1).slice(0, MAX_VISITED_SCREENS)
      : [];
  } catch {
    return [];
  }
}

function recordExploredSummary(label: string, screen: string): {
  exploredOptions: string[];
  visitedScreens: string[];
} {
  const safeOption = label.slice(0, 100);
  const safeScreen = screen.slice(0, 80);

  let exploredOptions = getExploredOptions();
  if (safeOption) {
    exploredOptions = [safeOption, ...exploredOptions.filter((item) => item !== safeOption)].slice(
      0,
      MAX_EXPLORED_OPTIONS
    );
  }

  let visitedScreens = getVisitedScreens();
  if (safeScreen) {
    visitedScreens = [safeScreen, ...visitedScreens.filter((item) => item !== safeScreen)].slice(
      0,
      MAX_VISITED_SCREENS
    );
  }

  try {
    localStorage.setItem(EXPLORED_OPTIONS_KEY, JSON.stringify(exploredOptions));
    localStorage.setItem(VISITED_SCREENS_KEY, JSON.stringify(visitedScreens));
  } catch {
    // ignore storage errors
  }

  return { exploredOptions, visitedScreens };
}

export function clearLocalSessionEvents(): void {
  try {
    localStorage.removeItem(LOCAL_EVENTS_KEY);
    notifyAnalyticsUpdated();
  } catch {
    // ignore storage errors
  }
}

function saveLocalEvent(event: LocalAnalyticsEvent): void {
  try {
    const current = getLocalSessionEvents();
    const updated = [event, ...current].slice(0, MAX_LOCAL_EVENTS);
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(updated));
    notifyAnalyticsUpdated(event);
  } catch {
    // ignore storage errors
  }
}

function formatSyncError(error: unknown, op: OperationType, path: string): string {
  const info = buildFirestoreErrorInfo(error, op, path);
  console.error('Firestore Error: ', JSON.stringify(info));
  return info.error;
}

export function trackEvent(input: TrackEventInput): void {
  if (typeof window === 'undefined' || syncStatus.quotaExceeded) return;

  const screen = truncateText(input.screen ?? window.location.pathname, 80) || '/';
  const label = truncateText(input.label, 140) || input.eventName;
  const section = truncateText(input.section, 80);
  const optionKey = truncateText(input.optionKey, 100);
  const course = truncateText(input.course, 140);
  const metadata = truncateText(input.metadata, 200);
  const safeEventName = toSafeEventName(input.eventName);
  const interestCategory =
    input.interestCategory ??
    inferInterestCategory({ text: label, course, sectionId: section, screen });

  const firebaseEventName = toFirebaseEventName(safeEventName, input.eventType);
  const eventId = generateSafeId('evt');
  const createdAtMs = Date.now();
  const summary = recordExploredSummary(label, screen);

  firestoreWriteChain = firestoreWriteChain
    .then(async () => {
      const identity = await ensureVisitorIdentity();
      syncStatus = { ...syncStatus, state: 'syncing' };

      const localRecord: LocalAnalyticsEvent = {
        id: eventId,
        visitorId: identity.visitorId,
        visitorToken: identity.visitorToken,
        sessionId: identity.sessionId,
        visitNumber: identity.visitCount,
        eventType: input.eventType,
        firebaseEventName,
        eventName: safeEventName,
        screen,
        ...(section ? { section } : {}),
        ...(optionKey ? { optionKey } : {}),
        label,
        interestCategory,
        ...(course ? { course } : {}),
        ...(metadata ? { metadata } : {}),
        createdAtMs,
      };
      saveLocalEvent(localRecord);

      const visitorPath = `visitors/${identity.visitorId}`;
      const visitorRef = doc(db, 'visitors', identity.visitorId);
      const eventPath = `visitors/${identity.visitorId}/events/${eventId}`;
      const eventRef = doc(db, 'visitors', identity.visitorId, 'events', eventId);
      const safeCourse = course ? course.slice(0, 140) : undefined;
      const safeDeviceSummary = identity.deviceSummary.slice(0, 120);

      const hasCreatedRemote = (() => {
        if (visitorEnsuredRemote) return true;
        try {
          return localStorage.getItem(VISITOR_REMOTE_CREATED_KEY) === identity.visitorId;
        } catch {
          return false;
        }
      })();

      const markRemoteCreated = () => {
        visitorEnsuredRemote = true;
        pendingVisitIncrement = false;
        try {
          localStorage.setItem(VISITOR_REMOTE_CREATED_KEY, identity.visitorId);
        } catch {
          // ignore storage errors
        }
      };

      const buildUpdatePayload = (forceReturnVisit: boolean): Record<string, unknown> => ({
        currentSessionId: identity.sessionId,
        ...(pendingVisitIncrement || forceReturnVisit
          ? { visitCount: increment(1), isReturning: true }
          : {}),
        totalEvents: increment(1),
        lastScreen: screen,
        lastEventType: input.eventType,
        lastEventName: safeEventName,
        lastLabel: label,
        lastInterestCategory: interestCategory,
        ...(safeCourse ? { lastCourse: safeCourse } : {}),
        exploredOptions: summary.exploredOptions,
        visitedScreens: summary.visitedScreens,
        deviceType: identity.deviceType,
        deviceSummary: safeDeviceSummary,
        lastSeenAt: serverTimestamp(),
      });

      let syncedVisitorDoc = false;

      if (hasCreatedRemote) {
        try {
          await updateDoc(visitorRef, buildUpdatePayload(false));
          syncedVisitorDoc = true;
          markRemoteCreated();
        } catch (err: unknown) {
          const code =
            typeof err === 'object' && err !== null && 'code' in err
              ? String((err as { code?: unknown }).code)
              : '';
          if (code !== 'not-found' && !(!visitorEnsuredRemote && code === 'permission-denied')) {
            const msg = formatSyncError(err, OperationType.UPDATE, visitorPath);
            syncStatus = {
              ...syncStatus,
              state: 'error',
              lastError: msg,
              quotaExceeded: msg.toLowerCase().includes('quota'),
            };
            notifyAnalyticsUpdated();
            return;
          }
        }
      }

      if (!syncedVisitorDoc) {
        try {
          await setDoc(visitorRef, {
            visitorId: identity.visitorId,
            visitorToken: identity.visitorToken,
            currentSessionId: identity.sessionId,
            visitCount: 1,
            totalEvents: 1,
            isReturning: false,
            lastScreen: screen,
            lastEventType: input.eventType,
            lastEventName: safeEventName,
            lastLabel: label,
            lastInterestCategory: interestCategory,
            ...(safeCourse ? { lastCourse: safeCourse } : {}),
            exploredOptions: summary.exploredOptions,
            visitedScreens: summary.visitedScreens,
            deviceType: identity.deviceType,
            deviceSummary: safeDeviceSummary,
            firstSeenAt: serverTimestamp(),
            lastSeenAt: serverTimestamp(),
          });
          syncedVisitorDoc = true;
          markRemoteCreated();
        } catch (createErr: unknown) {
          const code =
            typeof createErr === 'object' && createErr !== null && 'code' in createErr
              ? String((createErr as { code?: unknown }).code)
              : '';
          // If the same device already existed on Firestore (e.g. returning after 7 days / cleared storage),
          // update the existing device document instead of creating a new user!
          if (code === 'permission-denied' || code === 'already-exists') {
            try {
              await updateDoc(visitorRef, buildUpdatePayload(true));
              identity.isReturning = true;
              identity.visitCount = Math.max(identity.visitCount, 2);
              try {
                localStorage.setItem(VISIT_COUNT_KEY, String(identity.visitCount));
              } catch {
                // ignore storage write
              }
              syncedVisitorDoc = true;
              markRemoteCreated();
            } catch (fallbackErr: unknown) {
              const msg = formatSyncError(fallbackErr, OperationType.UPDATE, visitorPath);
              syncStatus = {
                ...syncStatus,
                state: 'error',
                lastError: msg,
                quotaExceeded: msg.toLowerCase().includes('quota'),
              };
              notifyAnalyticsUpdated();
              return;
            }
          } else {
            const msg = formatSyncError(createErr, OperationType.CREATE, visitorPath);
            syncStatus = {
              ...syncStatus,
              state: 'error',
              lastError: msg,
              quotaExceeded: msg.toLowerCase().includes('quota'),
            };
            notifyAnalyticsUpdated();
            return;
          }
        }
      }

      try {
        await setDoc(eventRef, {
          visitorId: identity.visitorId,
          visitorToken: identity.visitorToken,
          sessionId: identity.sessionId,
          visitNumber: identity.visitCount,
          eventType: input.eventType,
          eventName: safeEventName,
          screen,
          ...(section ? { section } : {}),
          ...(optionKey ? { optionKey } : {}),
          label,
          interestCategory,
          ...(safeCourse ? { course: safeCourse } : {}),
          ...(metadata ? { metadata } : {}),
          createdAt: serverTimestamp(),
        });

        syncStatus = {
          state: 'synced',
          syncedCount: syncStatus.syncedCount + 1,
          lastSyncedAtMs: Date.now(),
          lastError: null,
          quotaExceeded: false,
        };
        notifyAnalyticsUpdated();
      } catch (err: unknown) {
        const msg = formatSyncError(err, OperationType.CREATE, eventPath);
        syncStatus = {
          ...syncStatus,
          state: 'error',
          lastError: msg,
          quotaExceeded: msg.toLowerCase().includes('quota'),
        };
        notifyAnalyticsUpdated();
      }

      if (input.eventType === 'screen_view') {
        void logFirebaseEvent('screen_view', {
          firebase_screen: label,
          firebase_screen_class: screen,
          screen_path: screen,
          interest_category: interestCategory,
          visitor_id: identity.visitorId,
        });
      } else {
        void logFirebaseEvent(firebaseEventName, {
          event_type: input.eventType,
          button_label: label,
          screen_path: screen,
          section_name: section,
          option_key: optionKey,
          interest_category: interestCategory,
          course_name: course,
          context: metadata,
          visitor_id: identity.visitorId,
        });
      }

      if (interestCategory !== 'general_info') {
        void setFirebaseUserInterest(interestCategory, course);
      }
    })
    .catch(() => {
      // keep chain alive
    });
}

function timestampToMs(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'object' && val !== null && 'toMillis' in val) {
    return (val as Timestamp).toMillis();
  }
  return 0;
}

export async function fetchAllVisitors(): Promise<FirestoreVisitorRecord[]> {
  const path = 'visitors';
  try {
    const q = query(collection(db, path), orderBy('lastSeenAt', 'desc'), limit(60));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        visitorId: String(data.visitorId || d.id),
        currentSessionId: String(data.currentSessionId || ''),
        visitCount: Number(data.visitCount || 1),
        totalEvents: Number(data.totalEvents || 0),
        isReturning: Boolean(data.isReturning),
        lastScreen: String(data.lastScreen || '/'),
        lastEventType: (data.lastEventType as AnalyticsEventType) || 'screen_view',
        lastEventName: String(data.lastEventName || ''),
        lastLabel: String(data.lastLabel || ''),
        lastInterestCategory: (data.lastInterestCategory as InterestCategory) || 'general_info',
        lastCourse: typeof data.lastCourse === 'string' ? data.lastCourse : undefined,
        exploredOptions: Array.isArray(data.exploredOptions)
          ? data.exploredOptions.filter((x): x is string => typeof x === 'string')
          : [],
        visitedScreens: Array.isArray(data.visitedScreens)
          ? data.visitedScreens.filter((x): x is string => typeof x === 'string')
          : [],
        deviceType:
          data.deviceType === 'mobile' || data.deviceType === 'tablet' ? data.deviceType : 'desktop',
        deviceSummary: typeof data.deviceSummary === 'string' ? data.deviceSummary : undefined,
        firstSeenAtMs: timestampToMs(data.firstSeenAt),
        lastSeenAtMs: timestampToMs(data.lastSeenAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchVisitorEvents(visitorId: string): Promise<LocalAnalyticsEvent[]> {
  const path = `visitors/${visitorId}/events`;
  try {
    const q = query(collection(db, 'visitors', visitorId, 'events'), orderBy('createdAt', 'desc'), limit(120));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      const evType = (data.eventType as AnalyticsEventType) || 'button_click';
      const evName = String(data.eventName || d.id);
      return {
        id: d.id,
        visitorId: String(data.visitorId || visitorId),
        visitorToken: '',
        sessionId: String(data.sessionId || ''),
        visitNumber: Number(data.visitNumber || 1),
        eventType: evType,
        firebaseEventName: toFirebaseEventName(evName, evType),
        eventName: evName,
        screen: String(data.screen || '/'),
        section: typeof data.section === 'string' ? data.section : undefined,
        optionKey: typeof data.optionKey === 'string' ? data.optionKey : undefined,
        label: String(data.label || evName),
        interestCategory: (data.interestCategory as InterestCategory) || 'general_info',
        course: typeof data.course === 'string' ? data.course : undefined,
        metadata: typeof data.metadata === 'string' ? data.metadata : undefined,
        createdAtMs: timestampToMs(data.createdAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteVisitorProfile(visitorId: string): Promise<void> {
  const path = `visitors/${visitorId}`;
  try {
    const eventsSnap = await getDocs(collection(db, 'visitors', visitorId, 'events'));
    await Promise.all(eventsSnap.docs.map((evDoc) => deleteDoc(evDoc.ref)));
    await deleteDoc(doc(db, 'visitors', visitorId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
