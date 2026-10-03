import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiRoute } from '../src/router.mjs';
test('allows business tools through POST /api/tools/:tool',()=>{assert.deepEqual(resolveApiRoute('POST','/api/tools/search_bids'),{kind:'tool',tool:'search_bids'});assert.deepEqual(resolveApiRoute('POST','/api/tools/get_price_trends'),{kind:'tool',tool:'get_price_trends'});});
test('rejects unknown or account tools on generic tool endpoint',()=>{assert.equal(resolveApiRoute('POST','/api/tools/delete_everything'),null);assert.equal(resolveApiRoute('POST','/api/tools/account_balance'),null);});
test('maps account routes to free account operations',()=>{assert.deepEqual(resolveApiRoute('GET','/api/account/balance'),{kind:'account_balance'});assert.deepEqual(resolveApiRoute('GET','/api/account/consumption'),{kind:'account_daily_consumption'});});
test('method mismatches do not resolve',()=>{assert.equal(resolveApiRoute('GET','/api/tools/search_bids'),null);assert.equal(resolveApiRoute('POST','/api/account/balance'),null);});
