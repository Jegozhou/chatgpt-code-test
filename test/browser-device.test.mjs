import test from 'node:test';
import assert from 'node:assert/strict';

import { getOrCreateBrowserDeviceId, installDeviceFetch } from '../apps/workbench/public/device.js';

function storage() {
  const map = new Map();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
  };
}

test('browser device id persists in local storage', () => {
  const store = storage();
  const cryptoObj = { randomUUID: () => 'abc-123' };
  assert.equal(getOrCreateBrowserDeviceId({ storage: store, cryptoObj }), 'web-abc-123');
  assert.equal(getOrCreateBrowserDeviceId({ storage: store, cryptoObj: { randomUUID: () => 'other' } }), 'web-abc-123');
});

test('installed fetch adds device header only to same-origin API calls', async () => {
  const calls = [];
  const target = {
    location: { origin: 'https://example.test' },
    localStorage: storage(),
    crypto: { randomUUID: () => 'fetch-id' },
    fetch: async (input, init) => { calls.push({ input, init }); return { ok: true }; },
  };
  installDeviceFetch(target);
  await target.fetch('/api/account/balance');
  await target.fetch('https://other.test/api/x');
  assert.equal(new Headers(calls[0].init.headers).get('X-ZLBX-Device-Id'), 'web-fetch-id');
  assert.equal(new Headers(calls[1].init?.headers || {}).get('X-ZLBX-Device-Id'), null);
});
