import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  type Analytics,
  getAnalytics,
  isSupported,
  logEvent as firebaseLogEvent,
  setUserProperties,
} from 'firebase/analytics';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const GA4_ID_PATTERN = /^G-[A-Z0-9]{6,16}$/i;

const rawEnvMeasurementId = (
  (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined) ?? ''
).trim();
const rawConfigMeasurementId = (firebaseConfig.measurementId ?? '').trim();

const validEnvMeasurementId = GA4_ID_PATTERN.test(rawEnvMeasurementId)
  ? rawEnvMeasurementId.toUpperCase()
  : '';
const validConfigMeasurementId = GA4_ID_PATTERN.test(rawConfigMeasurementId)
  ? rawConfigMeasurementId.toUpperCase()
  : '';

const effectiveMeasurementId = validEnvMeasurementId || validConfigMeasurementId || '';
const invalidProvidedMeasurementId =
  rawEnvMeasurementId && !GA4_ID_PATTERN.test(rawEnvMeasurementId)
    ? rawEnvMeasurementId
    : rawConfigMeasurementId && !GA4_ID_PATTERN.test(rawConfigMeasurementId)
      ? rawConfigMeasurementId
      : '';

const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  ...(effectiveMeasurementId ? { measurementId: effectiveMeasurementId } : {}),
});

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_APP_ID = firebaseConfig.appId;
export const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;
export const ADMIN_EMAIL = 'sultanawaischeema@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function buildFirestoreErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGooglePopup(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

let analyticsPromise: Promise<Analytics | null> | null = null;
let analyticsReadyState: 'pending' | 'ready' | 'missing_measurement_id' | 'unsupported' = 'pending';
let resolvedMeasurementId = effectiveMeasurementId;

function detectLoadedMeasurementId(): string {
  if (effectiveMeasurementId) return effectiveMeasurementId;
  if (typeof document === 'undefined') return '';
  const scripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>('script[src*="googletagmanager.com/gtag/js"]')
  );
  for (const script of scripts) {
    try {
      const url = new URL(script.src);
      const id = url.searchParams.get('id')?.trim() ?? '';
      if (GA4_ID_PATTERN.test(id)) {
        return id.toUpperCase();
      }
    } catch {
      // ignore malformed URL
    }
  }
  return '';
}

export function initFirebaseAnalytics(): Promise<Analytics | null> {
  if (analyticsPromise) return analyticsPromise;

  analyticsPromise = isSupported()
    .then(async (supported) => {
      if (!supported) {
        analyticsReadyState = 'unsupported';
        return null;
      }

      let serverMeasurementId = effectiveMeasurementId;
      if (!serverMeasurementId) {
        try {
          const res = await fetch(
            `https://firebase.googleapis.com/v1alpha/projects/-/apps/${encodeURIComponent(
              firebaseConfig.appId
            )}/webConfig?key=${encodeURIComponent(firebaseConfig.apiKey)}`
          );
          if (res.ok) {
            const data = (await res.json()) as { measurementId?: string };
            if (data.measurementId && GA4_ID_PATTERN.test(data.measurementId.trim())) {
              serverMeasurementId = data.measurementId.trim().toUpperCase();
            }
          }
        } catch {
          // Fall back to standard SDK initialization
        }
      }

      if (!serverMeasurementId) {
        analyticsReadyState = 'missing_measurement_id';
        return null;
      }

      resolvedMeasurementId = serverMeasurementId;
      const instance = getAnalytics(app);
      analyticsReadyState = 'ready';
      return instance;
    })
    .catch(() => {
      analyticsReadyState = 'unsupported';
      return null;
    });

  return analyticsPromise;
}

void initFirebaseAnalytics();

export function getFirebaseAnalyticsStatus(): {
  state: 'pending' | 'ready' | 'missing_measurement_id' | 'unsupported';
  projectId: string;
  appId: string;
  databaseId: string;
  measurementId: string;
  invalidMeasurementId: string;
} {
  const detected = resolvedMeasurementId || detectLoadedMeasurementId();
  return {
    state: analyticsReadyState,
    projectId: FIREBASE_PROJECT_ID,
    appId: FIREBASE_APP_ID,
    databaseId: FIRESTORE_DATABASE_ID,
    measurementId: detected,
    invalidMeasurementId: invalidProvidedMeasurementId,
  };
}

export async function logFirebaseEvent(
  eventName: string,
  params: Record<string, string | number | boolean | undefined>
): Promise<void> {
  try {
    const analytics = await initFirebaseAnalytics();
    if (!analytics) return;

    const cleanParams: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === '') continue;
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
      if (!safeKey) continue;
      cleanParams[safeKey] = typeof value === 'string' ? value.slice(0, 100) : value;
    }

    firebaseLogEvent(analytics, eventName, cleanParams);
  } catch {
    // Analytics must never interrupt user navigation
  }
}

export async function setFirebaseUserInterest(
  interestCategory: string,
  course?: string
): Promise<void> {
  try {
    const analytics = await initFirebaseAnalytics();
    if (!analytics) return;

    setUserProperties(analytics, {
      latest_interest: interestCategory.slice(0, 36),
      ...(course ? { last_course_interest: course.slice(0, 36) } : {}),
    });
  } catch {
    // Ignore analytics errors
  }
}
