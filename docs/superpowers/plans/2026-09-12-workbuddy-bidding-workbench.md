# WorkBuddy Bidding Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a non-chat-only WorkBuddy bidding operations console that wraps the uploaded `zlbx-bidding-pay` API as a tested MCP connector and a clickable web workbench.

**Architecture:** A shared Node.js core owns device identity and ZLBX HTTP calls. Both a stdio MCP server and a local HTTP workbench gateway consume that core, while WorkBuddy-specific connector/Skill/Buddy-App configuration lives under `workbuddy/`.

**Tech Stack:** Node.js 20+, ESM, built-in `node:test`, `@modelcontextprotocol/sdk@1.29.0`, Zod, dependency-free HTML/CSS/JS frontend.

**Spec:** `docs/superpowers/specs/2026-09-12-workbuddy-bidding-workbench-design.md`

## Global Constraints
- Do not modify `main` directly; work on `feat/workbuddy-bidding-workbench`.
- Preserve the original 16 ZLBX business tool names.
- Add exactly two free account tools: `account_balance` and `account_daily_consumption`.
- Never hardcode API keys, tokens, payment credentials, or a real device id.
- A 402 is a payment state, not a generic failure; expose it as structured data.
- The product must have a real clickable workbench UI and must not require chat for core search/browse operations.
- Do not invent bidding/company/price data when the upstream API is unavailable.

---

### Task 1: Core device identity and API client
**Files:** `package.json`, `packages/core/src/device-store.mjs`, `packages/core/src/api-client.mjs`, core tests.

**Interfaces:** `getOrCreateDeviceId(options)`, `createZlbxClient({ deviceId, fetchImpl, baseUrl })`, `callTool()`, `getBalance()`, `getDailyConsumption()`, `PaymentRequiredError`, `ZlbxApiError`.

- [ ] Write failing tests for device id generation/reuse and request headers/methods.
- [ ] Run tests and verify RED.
- [ ] Implement minimal device store and API client.
- [ ] Run tests and verify GREEN.

### Task 2: Tool registry and MCP server
**Files:** `packages/mcp-server/src/tool-registry.mjs`, `packages/mcp-server/src/index.mjs`, registry tests.

- [ ] Write failing registry test asserting all 18 stable tool names and no duplicates.
- [ ] Run and verify RED.
- [ ] Implement Zod schemas/descriptions for the 16 business tools and 2 account tools.
- [ ] Register tools with `McpServer.registerTool()` and connect via `StdioServerTransport`.
- [ ] Run tests and syntax/import checks.

### Task 3: Non-chat Web operations console
**Files:** `apps/workbench/src/router.mjs`, `apps/workbench/server.mjs`, `apps/workbench/public/index.html`, `styles.css`, `app.js`, route tests.

- [ ] Write failing route-resolution tests for allowed tools, account routes, and rejected unknown tools.
- [ ] Run and verify RED.
- [ ] Implement pure route resolver and HTTP server.
- [ ] Build five navigation sections, filters, results, details drawer, status area, and 8 scene shortcuts.
- [ ] Make UI call the HTTP gateway directly; no chat dependency.
- [ ] Run route tests and static syntax checks.

### Task 4: WorkBuddy connector, Skill, and Buddy App config
**Files:** `workbuddy/connector/connector-meta.json`, `mcp.json`, `icon.svg`, connector Skill, `workbuddy/buddy-app-config.example.json`, config tests.

- [ ] Write failing config tests asserting required JSON, 4 modes, and 8 capsules.
- [ ] Run and verify RED.
- [ ] Add stdio MCP connector metadata with Node 20 runtime.
- [ ] Add WorkBuddy Skill with tool selection, 402/payment recovery, no-fabrication, and output rules.
- [ ] Add 4 modes + 8 capsules Buddy App example config.
- [ ] Run config tests and verify GREEN.

### Task 5: Documentation and CI
**Files:** `.github/workflows/ci.yml`, `README.md`.

- [ ] Add Node 20 CI: install, tests, checks.
- [ ] Document architecture, local run, WorkBuddy packaging, 402 behavior, and platform registration/review step.
- [ ] Run `npm install`, `npm test`, and `npm run check` locally.
- [ ] Commit implementation and open a PR against `main`.