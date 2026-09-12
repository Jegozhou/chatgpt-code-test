const STORAGE_KEY = 'zlbx_workbench_device_id';

export function getOrCreateBrowserDeviceId({
  storage = globalThis.localStorage,
  cryptoObj = globalThis.crypto,
  now = () => Date.now(),
  random = () => Math.random(),
} = {}) {
  const existing = storage?.getItem?.(STORAGE_KEY);
  if (existing) return existing;
  const raw = cryptoObj?.randomUUID?.() || `${now().toString(36)}-${random().toString(36).slice(2)}`;
  const value = `web-${raw}`;
  storage?.setItem?.(STORAGE_KEY, value);
  return value;
}

export function installDeviceFetch(target = globalThis) {
  if (typeof target.fetch !== 'function' || !target.location?.origin) return;
  const originalFetch = target.fetch.bind(target);
  const deviceId = getOrCreateBrowserDeviceId({ storage: target.localStorage, cryptoObj: target.crypto });

  target.fetch = async (input, init = {}) => {
    const rawUrl = typeof input === 'string' || input instanceof URL ? String(input) : input?.url;
    const url = new URL(rawUrl || '', target.location.origin);
    if (url.origin === target.location.origin && url.pathname.startsWith('/api/')) {
      const headers = new Headers(init.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined));
      headers.set('X-ZLBX-Device-Id', deviceId);
      return originalFetch(input, { ...init, headers });
    }
    return originalFetch(input, init);
  };
}

if (typeof window !== 'undefined') installDeviceFetch(window);
