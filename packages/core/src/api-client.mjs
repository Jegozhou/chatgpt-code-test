const DEFAULT_BASE_URL = 'https://mcp-server.zhiliaobiaoxun.com/api_pay';
const SKILL_ID = 'zlbx-bidding-payskill';

export class PaymentRequiredError extends Error {
  constructor({ body = {}, headers }) {
    super(body?.description || 'Payment required');
    this.name = 'PaymentRequiredError';
    this.code = 'payment_required';
    this.status = 402;
    this.paymentCode = headers.get('WeixinPay-Required');
    this.outTradeNo = headers.get('X-Out-Trade-No');
    this.amount = body?.amount ?? null;
    this.description = body?.description ?? null;
    this.body = body;
  }
  toJSON() {
    return { type: 'payment_required', code: this.code, status: this.status, payment_code: this.paymentCode, out_trade_no: this.outTradeNo, amount: this.amount, description: this.description };
  }
}

export class ZlbxApiError extends Error {
  constructor({ status, body = {}, message }) {
    super(message || body?.message || `ZLBX API request failed (${status})`);
    this.name = 'ZlbxApiError';
    this.status = status;
    this.code = body?.code || 'api_error';
    this.body = body;
  }
  toJSON() {
    return { type: 'api_error', code: this.code, status: this.status, message: this.message, body: this.body };
  }
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { message: text }; }
}

export function createZlbxClient({ deviceId, fetchImpl = globalThis.fetch, baseUrl = DEFAULT_BASE_URL } = {}) {
  if (!deviceId) throw new TypeError('deviceId is required');
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl must be a function');
  const root = baseUrl.replace(/\/$/, '');
  const commonHeaders = { 'X-Device-Id': deviceId, 'X-Skill-Id': SKILL_ID };

  async function request(url, init) {
    let response;
    try { response = await fetchImpl(url, init); }
    catch (error) { throw new ZlbxApiError({ status: 0, body: { code: 'NETWORK_ERROR' }, message: error?.message || 'Network error' }); }
    const body = await parseBody(response);
    if (response.status === 402) throw new PaymentRequiredError({ body, headers: response.headers });
    if (!response.ok) throw new ZlbxApiError({ status: response.status, body });
    return body;
  }

  return {
    async callTool(name, payload = {}) {
      if (!/^[a-z0-9_]+$/.test(name)) throw new TypeError('Invalid tool name');
      return request(`${root}/${name}`, { method: 'POST', headers: { ...commonHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    },
    async getBalance() {
      return request(`${root}/account/balance`, { method: 'GET', headers: { ...commonHeaders } });
    },
    async getDailyConsumption(params = {}) {
      const query = new URLSearchParams();
      for (const key of ['days', 'start_date', 'end_date']) if (params[key] !== undefined && params[key] !== null && params[key] !== '') query.set(key, String(params[key]));
      return request(`${root}/account/daily_consumption${query.size ? `?${query.toString()}` : ''}`, { method: 'GET', headers: { ...commonHeaders } });
    }
  };
}
