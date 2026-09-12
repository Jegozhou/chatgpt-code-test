import test from 'node:test';
import assert from 'node:assert/strict';
import { TOOL_DEFINITIONS, BUSINESS_TOOL_NAMES, ACCOUNT_TOOL_NAMES } from '../src/tool-registry.mjs';
const expectedBusiness = ['search_bids','query_bids_advanced','get_bid_detail','search_expiring_projects','search_company','get_company_profile','get_company_business_keywords','get_company_partners','get_company_contacts','find_competitors','find_potential_bidders','get_top_purchasers','get_top_suppliers','get_top_brands','aggregate_bids_advanced','get_price_trends'];
const expectedAccount = ['account_balance','account_daily_consumption'];
test('registry preserves all 16 uploaded skill business tool names', () => assert.deepEqual(BUSINESS_TOOL_NAMES, expectedBusiness));
test('registry adds exactly two account tools', () => assert.deepEqual(ACCOUNT_TOOL_NAMES, expectedAccount));
test('registry exposes exactly 18 unique definitions with descriptions', () => {
  const names = TOOL_DEFINITIONS.map((tool) => tool.name);
  assert.equal(names.length,18); assert.equal(new Set(names).size,18);
  for (const tool of TOOL_DEFINITIONS) { assert.ok(tool.description.length >= 10); assert.ok(tool.inputSchema && typeof tool.inputSchema === 'object'); }
});
