import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { getOrCreateDeviceId } from '../src/device-store.mjs';

test('uses ZLBX_DEVICE_ID without writing a device file', async () => {
  const homeDir = await mkdtemp(join(tmpdir(), 'zlbx-device-'));
  const id = await getOrCreateDeviceId({ homeDir, env: { ZLBX_DEVICE_ID: 'fixed-device-id' }, randomId: () => 'generated-id' });
  assert.equal(id, 'fixed-device-id');
});

test('generates a device id once and reuses the persisted value', async () => {
  const homeDir = await mkdtemp(join(tmpdir(), 'zlbx-device-'));
  let calls = 0;
  const randomId = () => { calls += 1; return '0123456789abcdef0123456789abcdef'; };
  const first = await getOrCreateDeviceId({ homeDir, env: {}, randomId, now: () => '2026-09-12T00:00:00.000Z' });
  const second = await getOrCreateDeviceId({ homeDir, env: {}, randomId: () => 'should-not-run' });
  assert.equal(first, '0123456789abcdef0123456789abcdef');
  assert.equal(second, first);
  assert.equal(calls, 1);
  const raw = JSON.parse(await readFile(join(homeDir, 'device.json'), 'utf8'));
  assert.deepEqual(raw, { device_id: first, created_at: '2026-09-12T00:00:00.000Z' });
});
