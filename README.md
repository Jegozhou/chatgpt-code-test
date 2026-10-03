# 知了标讯 · WorkBuddy 商机作战台

把上传的 `zlbx-bidding-pay` Skill 产品化为 **可点击操作台 + WorkBuddy MCP Connector + Skill + Buddy App 配置**。核心功能不依赖聊天框：销售/投标人员可以直接筛项目、查企业、分析竞对、看市场、查价格和看积分消耗；AI 负责自然语言意图和跨工具编排。

## 已实现

- **商机库**：标讯搜索、临期项目预测、项目详情。
- **企业库**：企业搜索、画像、主营业务、合作关系、项目联系人。
- **竞对供应商**：竞争对手、潜在投标商。
- **市场分析**：Top 采购方、Top 供应商、Top 品牌、聚合趋势、历史中标价。
- **账户中心**：当前积分、累计购买/消耗、近 15 天调用与日消耗图。
- **MCP Connector**：原 Skill 16 个业务工具 + 2 个账户工具，共 18 个工具。
- **WorkBuddy Skill**：工具选择、金额单位、企业主体识别、402 支付恢复、禁止编造数据。
- **Buddy App 配置源**：4 个工作模式 + 8 个场景胶囊。

## 架构

```text
WorkBuddy Buddy App
  ├─ 4 工作模式 / 8 场景胶囊
  ├─ zlbx-workbench Skill
  └─ WorkBuddy MCP Connector
              │ 18 tools
              ▼
       packages/mcp-server
              │
              ▼
         packages/core ◀──── apps/workbench 可点击 Web 操作台
              │
              ▼
https://mcp-server.zhiliaobiaoxun.com/api_pay/*
```

## 本地运行

要求 Node.js 20+：

```bash
npm install
npm run workbench
```

浏览器打开 `http://127.0.0.1:8787`。

设备号优先读取 `ZLBX_DEVICE_ID`；没有时自动生成并持久化在 `~/.zlbx_pay/device.json`。可用 `ZLBX_HOME` 改变目录。

## MCP Server

```bash
npm install
npm run mcp
```

MCP 使用 stdio。工具清单保持原 Skill 的 16 个业务工具名不变，并新增 `account_balance`、`account_daily_consumption`。

## WorkBuddy 接入

仓库已准备：

```text
workbuddy/connector/
├── connector-meta.json
├── mcp.json
├── icon.svg
└── skills/zlbx-workbench/SKILL.md
```

`workbuddy/buddy-app-config.example.json` 保存 4 个工作模式、8 个场景胶囊和工作台嵌入信息。当前 `mcp.json` 用于仓库本地预览；正式发布时建议把 MCP Server 发布为 npm 包或部署为 HTTPS Streamable HTTP MCP，再切换生产入口。

WorkBuddy 开放平台中的“创建应用 → 配置 → 预览调试 → 审核发布”仍需在你的 WorkBuddy 账号中完成，GitHub 代码不能代替平台审核动作。

## 402 / 微信支付

业务 API 余额不足时返回 HTTP 402。本项目将其结构化为：

```json
{
  "type": "payment_required",
  "payment_code": "...",
  "out_trade_no": "...",
  "amount": 10,
  "description": "..."
}
```

WorkBuddy 内由 Skill 把 `payment_code` 交给可用的 `weixinpay` 能力，支付后用原参数重试；独立 Web 工作台仅展示真实支付状态，不伪造成功。

## 测试

```bash
npm test
npm run check
```

覆盖设备号持久化、请求 Header/Method、402 映射、18 工具注册、Web API 白名单和 WorkBuddy 配置结构。GitHub Actions 还会安装 MCP SDK 并验证服务器可导入。

## 设计文档

- `docs/superpowers/specs/2026-09-12-workbuddy-bidding-workbench-design.md`
- `docs/superpowers/plans/2026-09-12-workbuddy-bidding-workbench.md`
