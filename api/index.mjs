import { createZlbxClient, PaymentRequiredError, ZlbxApiError } from '../packages/core/src/api-client.mjs';
import { resolveApiRoute } from '../apps/workbench/src/router.mjs';
import { resolveOnlineDeviceId, resolveOnlinePath } from '../packages/vercel/src/handler-core.mjs';

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
  if (Buffer.isBuffer(req.body)) return req.body.length ? JSON.parse(req.body.toString('utf8')) : {};
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error('请求体过大');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function errorPayload(error) {
  if (error instanceof PaymentRequiredError || error instanceof ZlbxApiError) return error.toJSON();
  return { type: 'unexpected_error', message: error?.message || String(error) };
}

export default async function handler(req, res) {
  try {
    const pathname = resolveOnlinePath(req.url);
    const route = resolveApiRoute(req.method, pathname);
    if (!route) {
      sendJson(res, 404, { success: false, error: { type: 'not_found', message: '未知 API 路由' } });
      return;
    }

    let deviceId;
    try {
      deviceId = resolveOnlineDeviceId(req.headers);
    } catch (error) {
      sendJson(res, 400, { success: false, error: { type: 'device_id_required', message: error.message } });
      return;
    }

    const zlbx = createZlbxClient({ deviceId });
    let data;
    if (route.kind === 'tool') data = await zlbx.callTool(route.tool, await readJson(req));
    else if (route.kind === 'account_balance') data = await zlbx.getBalance();
    else {
      const url = new URL(req.url, 'https://workbench.local');
      const params = Object.fromEntries(url.searchParams);
      delete params.path;
      data = await zlbx.getDailyConsumption(params);
    }
    sendJson(res, 200, { success: true, data });
  } catch (error) {
    const status = error instanceof PaymentRequiredError ? 402 : error instanceof ZlbxApiError && error.status ? error.status : 500;
    sendJson(res, status, { success: false, error: errorPayload(error) });
  }
}
