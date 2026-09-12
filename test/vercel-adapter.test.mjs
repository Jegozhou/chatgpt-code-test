import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveOnlineDeviceId, resolveOnlinePath } from '../packages/vercel/src/handler-core.mjs';

test('resolveOnlineDeviceId accepts browser device header', () => {
  assert.equal(resolveOnlineDeviceId({ 'x-zlbx-device-id': 'browser-abc-123' }), 'browser-abc-123');
});

test('resolveOnlineDeviceId rejects missing device header', () => {
  assert.throws(() => resolveOnlineDeviceId({}), /device id/i);
});

test('resolveOnlinePath prefers rewrite path query', () => {
  assert.equal(resolveOnlinePath('/api/index?path=tools/search_bids'), '/api/tools/search_bids');
});
