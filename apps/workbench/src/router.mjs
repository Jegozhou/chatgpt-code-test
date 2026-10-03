import { BUSINESS_TOOL_NAMES } from '../../../packages/mcp-server/src/tool-registry.mjs';
const BUSINESS = new Set(BUSINESS_TOOL_NAMES);
export function resolveApiRoute(method, pathname) {
  if (method === 'POST' && pathname.startsWith('/api/tools/')) {
    const tool = decodeURIComponent(pathname.slice('/api/tools/'.length));
    return BUSINESS.has(tool) ? { kind: 'tool', tool } : null;
  }
  if (method === 'GET' && pathname === '/api/account/balance') return { kind: 'account_balance' };
  if (method === 'GET' && pathname === '/api/account/consumption') return { kind: 'account_daily_consumption' };
  return null;
}
