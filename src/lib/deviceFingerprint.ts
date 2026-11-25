export interface DeviceFingerprintResult {
  deviceId: string;
  deviceToken: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceSummary: string;
}

const IDB_NAME = 'lsh_device_identity_db';
const IDB_STORE = 'identity';
const IDB_KEY = 'primary';

async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback deterministic FNV-1a 64-bit-like expansion for constrained contexts
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i += 1) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ (c + i), 0x85ebca6b);
  }
  const part = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `${part(h1)}${part(h2)}${part(h1 ^ h2)}${part(h1 + h2)}${part(h1 * 31)}${part(h2 * 17)}`;
}

function getCanvasSignature(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no_2d';

    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial", sans-serif';
    ctx.fillStyle = '#f60';
    ctx.fillRect(10, 8, 90, 24);
    ctx.fillStyle = '#069';
    ctx.fillText('LSH-Spoken-English-4-14', 4, 4);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Confident Voice', 12, 28);
    ctx.beginPath();
    ctx.arc(180, 30, 18, 0, Math.PI * 2);
    ctx.stroke();

    return canvas.toDataURL();
  } catch {
    return 'canvas_err';
  }
}

function getWebGLInfo(): { vendor: string; renderer: string; params: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return { vendor: 'no_webgl', renderer: 'no_webgl', params: 'none' };

    const debugExt = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugExt
      ? String(gl.getParameter(debugExt.UNMASKED_VENDOR_WEBGL) || gl.getParameter(gl.VENDOR) || '')
      : String(gl.getParameter(gl.VENDOR) || '');
    const renderer = debugExt
      ? String(
          gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) || gl.getParameter(gl.RENDERER) || ''
        )
      : String(gl.getParameter(gl.RENDERER) || '');

    const maxTex = String(gl.getParameter(gl.MAX_TEXTURE_SIZE) || '');
    const maxVp = String(gl.getParameter(gl.MAX_VIEWPORT_DIMS) || '');

    return { vendor, renderer, params: `${maxTex}|${maxVp}` };
  } catch {
    return { vendor: 'gl_err', renderer: 'gl_err', params: 'err' };
  }
}

function detectDeviceClass(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'desktop';
  const ua = (navigator.userAgent || '').toLowerCase();
  const touchPoints = navigator.maxTouchPoints || 0;
  const minDim = Math.min(window.screen?.width || 1024, window.screen?.height || 768);
  const maxDim = Math.max(window.screen?.width || 1024, window.screen?.height || 768);

  if (/ipad|tablet|playbook|silk/i.test(ua) || (touchPoints > 1 && minDim >= 600 && maxDim <= 1366)) {
    return 'tablet';
  }
  if (/iphone|ipod|android.*mobile|windows phone|blackberry|mobi/i.test(ua) || minDim < 600) {
    return 'mobile';
  }
  return 'desktop';
}

function detectPlatformLabel(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone/i.test(ua)) return 'iPhone';
  if (/ipad/i.test(ua)) return 'iPad';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/windows/i.test(ua)) return 'Windows';
  if (/linux/i.test(ua)) return 'Linux';
  return navigator.platform || 'Device';
}

export async function readIndexedDbIdentity(): Promise<{
  deviceId: string;
  deviceToken: string;
} | null> {
  if (typeof indexedDB === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => {
        try {
          const db = req.result;
          const tx = db.transaction(IDB_STORE, 'readonly');
          const getReq = tx.objectStore(IDB_STORE).get(IDB_KEY);
          getReq.onsuccess = () => {
            const val = getReq.result as { deviceId?: string; deviceToken?: string } | undefined;
            if (val?.deviceId && val?.deviceToken) {
              resolve({ deviceId: val.deviceId, deviceToken: val.deviceToken });
            } else {
              resolve(null);
            }
            db.close();
          };
          getReq.onerror = () => {
            db.close();
            resolve(null);
          };
        } catch {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function writeIndexedDbIdentity(
  deviceId: string,
  deviceToken: string
): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => {
        try {
          const db = req.result;
          const tx = db.transaction(IDB_STORE, 'readwrite');
          tx.objectStore(IDB_STORE).put({ deviceId, deviceToken }, IDB_KEY);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            resolve();
          };
        } catch {
          resolve();
        }
      };
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function computeDeviceFingerprint(): Promise<DeviceFingerprintResult> {
  const deviceType = detectDeviceClass();
  const platformLabel = detectPlatformLabel();
  const webgl = getWebGLInfo();
  const canvasSig = getCanvasSignature();

  const screenWidth = typeof screen !== 'undefined' ? screen.width : 0;
  const screenHeight = typeof screen !== 'undefined' ? screen.height : 0;
  // Normalize orientation so portrait vs landscape gives the same screen hardware signature
  const minScreen = Math.min(screenWidth, screenHeight);
  const maxScreen = Math.max(screenWidth, screenHeight);
  const colorDepth = typeof screen !== 'undefined' ? screen.colorDepth : 24;
  const dpr = typeof window !== 'undefined' ? Math.round((window.devicePixelRatio || 1) * 100) / 100 : 1;

  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const cores = nav?.hardwareConcurrency ?? 0;
  const mem = (nav as Navigator & { deviceMemory?: number })?.deviceMemory ?? 0;
  const touch = nav?.maxTouchPoints ?? 0;
  const platform = nav?.platform ?? '';
  const lang = nav?.language ?? '';
  const tz =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || ''
      : '';

  const rawSignals = [
    `p:${platform}`,
    `scr:${minScreen}x${maxScreen}x${colorDepth}@${dpr}`,
    `hw:${cores}:${mem}:${touch}`,
    `tz:${tz}`,
    `lang:${lang}`,
    `glv:${webgl.vendor}`,
    `glr:${webgl.renderer}`,
    `glp:${webgl.params}`,
    `cvs:${canvasSig}`,
  ].join('||');

  const primaryHash = await sha256Hex(`lsh_device_v1::${rawSignals}`);
  const secondaryHash = await sha256Hex(`lsh_token_salt_v1::${primaryHash}::${rawSignals}`);

  const deviceId = `dev_${primaryHash.slice(0, 24)}`;
  const deviceToken = `tok_${secondaryHash.slice(0, 28)}`;

  const cleanGpu = webgl.renderer
    .replace(/ANGLE\s*\(([^)]+)\)/i, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48);
  const deviceSummary = `${platformLabel} (${deviceType}) · ${screenWidth}x${screenHeight} · ${tz || 'UTC'}${cleanGpu && cleanGpu !== 'no_webgl' ? ` · ${cleanGpu}` : ''}`.slice(
    0,
    120
  );

  return {
    deviceId,
    deviceToken,
    deviceType,
    deviceSummary,
  };
}
