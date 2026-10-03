import test from 'node:test';
import assert from 'node:assert/strict';
import { createZlbxClient, PaymentRequiredError, ZlbxApiError } from '../src/api-client.mjs';

function jsonResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

test('callTool POSTs to api_pay with device and skill headers', async () => {
  let seen;
  const client = createZlbxClient({ deviceId: 'device-123', fetchImpl: async (url, init) => { seen = { url, init }; return jsonResponse(200, { success: true, data: { total: 1 } }); } });
  const result = await client.callTool('search_bids', { keywords: ['AI'] });
  assert.equal(seen.url, 'https://mcp-server.zhiliaobiaoxun.com/api_pay/search_bids');
  assert.equal(seen.init.method, 'POST');
  assert.equal(seen.init.headers['X-Device-Id'], 'device-123');
  assert.equal(seen.init.headers['X-Skill-Id'], 'zlbx-bidding-payskill');
  assert.deepEqual(JSON.parse(seen.init.body), { keywords: ['AI'] });
  assert.deepEqual(result, { success: true, data: { total: 1 } });
});

test('account balance uses GET and the same device id', async () => {
  let seen;
  const client = createZlbxClient({ deviceId: 'device-abc', fetchImpl: async (url, init) => { seen = { url, init }; return jsonResponse(200, { data: { balance_units: 88 } }); } });
  const result = await client.getBalance();
  assert.equal(seen.url, 'https://mcp-server.zhiliaobiaoxun.com/api_pay/account/balance');
  assert.equal(seen.init.method, 'GET');
  assert.equal(seen.init.headers['X-Device-Id'], 'device-abc');
  assert.equal(result.data.balance_units, 88);
});

test('daily consumption serializes optional query parameters', async () => {
  let seenUrl;
  const client = createZlbxClient({ deviceId: 'device-abc', fetchImpl: async (url) => { seenUrl = url; return jsonResponse(200, { data: { total_calls: 3 } }); } });
  await client.getDailyConsumption({ days: 15, start_date: '2026-09-01' });
  assert.match(seenUrl, /account\/daily_consumption\?/);
  assert.match(seenUrl, /days=15/);
  assert.match(seenUrl, /start_date=2026-09-01/);
});

test('HTTP 402 becomes PaymentRequiredError with payment metadata', async () => {
  const client = createZlbxClient({ deviceId: 'device-abc', fetchImpl: async () => jsonResponse(402, { amount: 10, description: '100积分' }, { 'WeixinPay-Required': 'wx-code', 'X-Out-Trade-No': 'trade-1' }) });
  await assert.rejects(() => client.callTool('search_bids', { keywords: ['服务器'] }), (error) => {
    assert.ok(error instanceof PaymentRequiredError);
    assert.equal(error.code, 'payment_required');
    assert.equal(error.paymentCode, 'wx-code');
    assert.equal(error.outTradeNo, 'trade-1');
    assert.equal(error.amount, 10);
    return true;
  });
});

test('other non-2xx responses become ZlbxApiError without inventing data', async () => {
  const client = createZlbxClient({ deviceId: 'device-abc', fetchImpl: async () => jsonResponse(500, { code: 'UPSTREAM_ERROR', message: 'service failed' }) });
  await assert.rejects(() => client.callTool('search_bids', { keywords: ['服务器'] }), (error) => error instanceof ZlbxApiError && error.status === 500 && error.code === 'UPSTREAM_ERROR');
});
