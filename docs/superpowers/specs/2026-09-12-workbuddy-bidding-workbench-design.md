# 知了标讯 · WorkBuddy 商机作战台设计

## 目标
把 `zlbx-bidding-pay` 从只能在对话里由模型调用的 Skill，升级为可操作、可筛选、可追踪的 WorkBuddy 行业工作台。核心搜索与分析必须可以直接在页面中完成，AI 负责意图理解、工具编排与结果解释，但不是唯一交互入口。

## MVP 闭环
发现商机 → 判断商机 → 分析甲方 → 分析竞对/潜在供应商 → 查历史价格 → 形成跟进建议。

## UI
左侧主导航：商机库、企业库、竞对供应商、市场分析、账户中心。

首页 8 个场景入口：找今天值得跟进的项目、找即将到期项目、查某公司的采购情况、分析竞争对手、找项目潜在投标商、查 Top 采购单位、查品牌/型号历史中标价、分析行业过去 12 个月趋势。

## WorkBuddy 工作模式
1. 商机雷达：`search_bids`、`query_bids_advanced`、`get_bid_detail`、`search_expiring_projects`。
2. 客户情报：`search_company`、`get_company_profile`、`get_company_business_keywords`、`get_company_partners`、`get_company_contacts`。
3. 竞对与供应商：`find_competitors`、`find_potential_bidders`，并复用合作关系工具。
4. 市场洞察：`get_top_purchasers`、`get_top_suppliers`、`get_top_brands`、`aggregate_bids_advanced`、`get_price_trends`。

## 架构
```text
WorkBuddy Buddy App
  ├─ 4 个工作模式 + 8 个场景胶囊
  ├─ Skill（业务编排、支付恢复、回答规范）
  └─ Connector（stdio MCP）
          ├─ 16 个业务工具
          ├─ account_balance
          └─ account_daily_consumption
                 ↓
          shared ZLBX API client
                 ↓
https://mcp-server.zhiliaobiaoxun.com/api_pay/*

独立操作台 Web UI
  └─ Local HTTP gateway ──复用同一个 shared ZLBX API client
```

## 数据层
`packages/core/src/api-client.mjs` 是唯一远端调用入口：固定 Base URL；业务 POST 自动添加 `Content-Type`、`X-Device-Id`、`X-Skill-Id: zlbx-bidding-payskill`；账户接口 GET 使用同一设备号；402 转换为 `PaymentRequiredError`；其它非 2xx 转换为 `ZlbxApiError`；不硬编码凭证。

`packages/core/src/device-store.mjs` 管理设备号：优先 `ZLBX_DEVICE_ID`，否则持久化到 `${ZLBX_HOME:-~/.zlbx_pay}/device.json`。

## MCP
保持原 Skill 的 16 个业务工具名不变，另外增加 `account_balance` 和 `account_daily_consumption`。工具只负责参数验证、调用 core client、返回结构化结果；金额单位差异写入工具描述，不擅自换算。

## 非聊天工作台
用户可直接输入筛选条件搜索标讯；点击公告查看详情并进入甲方/竞对分析；输入公司查看企业画像、合作方、联系人和竞对；输入品类查看 Top 买家/供应商/品牌和趋势；输入品牌/型号查看价格；账户中心查看积分和日消耗。浏览器通过自身 `/api/*` 网关访问 core client，避免 CORS 和设备号泄露。

## 支付与错误
402 是支付状态，不是普通异常。MCP 返回结构化 `payment_required`，由 WorkBuddy Skill 引导 `weixinpay` 完成支付后重试；独立 Web 工作台展示支付所需信息，不伪造支付成功。API/网络失败时不编造标讯、企业或价格数据，也不推荐第三方竞品数据源。

## 测试与 CI
覆盖设备号生成/复用、API headers/method、402 映射、18 工具注册表、Web 路由白名单、WorkBuddy JSON 配置解析。CI 使用 Node 20 执行 `npm ci`、`npm test`、`npm run check`。

## WorkBuddy 兼容
连接器采用官方支持的 stdio MCP + Node 20；目录包含 `connector-meta.json`、`mcp.json`、`icon.svg`、`skills/.../SKILL.md`。Buddy App 配置保存为 `workbuddy/buddy-app-config.example.json`，作为开放平台配置的版本化来源。