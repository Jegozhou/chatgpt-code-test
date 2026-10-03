import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createZlbxClient, PaymentRequiredError, ZlbxApiError } from '../../core/src/api-client.mjs';
import { getOrCreateDeviceId } from '../../core/src/device-store.mjs';
import { TOOL_BY_NAME, TOOL_DEFINITIONS } from './tool-registry.mjs';

function textResult(payload, isError = false) {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }], ...(isError ? { isError: true } : {}) };
}
function missingRequired(schema, args) {
  return (schema.required || []).filter((key) => args?.[key] === undefined || args?.[key] === null || args?.[key] === '');
}
export async function createServer({ client } = {}) {
  const deviceId = client ? null : await getOrCreateDeviceId();
  const zlbx = client || createZlbxClient({ deviceId });
  const server = new Server({ name: 'zlbx-bidding-workbench', version: '0.1.0' }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOL_DEFINITIONS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const name = request.params.name;
    const tool = TOOL_BY_NAME.get(name);
    if (!tool) return textResult({ success: false, error: { type: 'unknown_tool', message: `Unknown tool: ${name}` } }, true);
    const args = request.params.arguments || {};
    const missing = missingRequired(tool.inputSchema, args);
    if (missing.length) return textResult({ success: false, tool: name, error: { type: 'validation_error', missing } }, true);
    try {
      let data;
      if (name === 'account_balance') data = await zlbx.getBalance();
      else if (name === 'account_daily_consumption') data = await zlbx.getDailyConsumption(args);
      else data = await zlbx.callTool(name, args);
      return textResult({ success: true, tool: name, data });
    } catch (error) {
      if (error instanceof PaymentRequiredError || error instanceof ZlbxApiError) return textResult({ success: false, tool: name, error: error.toJSON() }, true);
      return textResult({ success: false, tool: name, error: { type: 'unexpected_error', message: error?.message || String(error) } }, true);
    }
  });
  return server;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await createServer();
  await server.connect(new StdioServerTransport());
}
