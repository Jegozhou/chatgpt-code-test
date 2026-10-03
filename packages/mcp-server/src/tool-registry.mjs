const str = (description) => ({ type: 'string', ...(description ? { description } : {}) });
const num = (description) => ({ type: 'number', ...(description ? { description } : {}) });
const integer = (description, extra = {}) => ({ type: 'integer', ...extra, ...(description ? { description } : {}) });
const strList = (description) => ({ type: 'array', items: { type: 'string' }, ...(description ? { description } : {}) });
const numList = (description) => ({ type: 'array', items: { type: 'number' }, ...(description ? { description } : {}) });
const object = (properties = {}, required = []) => ({ type: 'object', properties, additionalProperties: false, ...(required.length ? { required } : {}) });
const dates = { begin_date: str('开始日期 YYYY-MM-DD'), end_date: str('结束日期 YYYY-MM-DD') };
const regions = { provinces: strList('省份列表'), cities: strList('城市列表'), counties: strList('区县列表') };
const companyRef = { company: { anyOf: [{ type: 'string' }, { type: 'number' }], description: '公司全称、简称或公司ID' }, company_url: str('知了标讯公司详情页 URL') };
const keywordGroup = object({ keywords: strList('关键词'), match_modes: strList('匹配范围') }, ['keywords']);
const searchProps = {
  keywords: strList('搜索关键词'), match_modes: strList('匹配范围，如 all/title/sm/winner/tender'), bid_type: str('招标/中标/全部'), bid_process: numList('公告阶段'),
  ...dates, ...regions, page: integer('页码', { minimum: 1 }), page_size: integer('每页数量', { minimum: 1, maximum: 50 })
};
function def(name, description, inputSchema, kind = 'business') { return { name, description, inputSchema, kind }; }

export const BUSINESS_TOOL_NAMES = [
  'search_bids','query_bids_advanced','get_bid_detail','search_expiring_projects','search_company','get_company_profile','get_company_business_keywords','get_company_partners','get_company_contacts','find_competitors','find_potential_bidders','get_top_purchasers','get_top_suppliers','get_top_brands','aggregate_bids_advanced','get_price_trends'
];
export const ACCOUNT_TOOL_NAMES = ['account_balance', 'account_daily_consumption'];

export const TOOL_DEFINITIONS = [
  def('search_bids','按关键词、地区、金额和时间检索招标/中标公告；金额参数 min_amount/max_amount 单位为万元。',object({ ...searchProps, min_amount:num('最低金额，单位万元'), max_amount:num('最高金额，单位万元') },['keywords'])),
  def('query_bids_advanced','高级标讯搜索，支持关键词组、排除词、复杂逻辑与排序；金额参数 min_money/max_money。',object({ ...searchProps, keyword_groups:{type:'array',items:keywordGroup}, exclude_keywords:strList('排除关键词'), min_money:num('最低金额'), max_money:num('最高金额'), sort_field:str('排序字段'), sort_order:{type:'string',enum:['asc','desc']} },['keywords'])),
  def('get_bid_detail','根据 bid_id、bid_url 或 uniq_key 获取单条标讯完整详情和公告正文。',object({ bid_id:integer('标讯 ID'), bid_url:str('标讯 URL'), uniq_key:str('唯一标识'), bid_type:integer('1=招标 2=中标') })),
  def('search_expiring_projects','查询即将到期的周期性项目，用于商机预测、续期机会挖掘和提前跟进。',object({ keywords:strList('产品或服务关键词'), ...dates, ...regions, min_amount:num('最低金额，单位万元'), company_type:strList('招标公司类型'), page:integer('页码',{minimum:1}), page_size:integer('每页数量',{minimum:1,maximum:50}) },['keywords'])),
  def('search_company','按公司全称、简称或别名搜索企业，适合先定位总部及分子公司再做后续分析。',object({ company_name:str('公司名称'), province:str('省份'), city:str('城市'), page:integer('页码',{minimum:1}), page_size:integer('每页数量',{minimum:1,maximum:20}) },['company_name'])),
  def('get_company_profile','获取公司工商基础信息、行业、规模以及招标/中标次数等企业画像。',object({ ...companyRef })),
  def('get_company_business_keywords','从历史中标记录提炼企业主营业务关键词、次数和金额，判断真实业务方向。',object({ ...companyRef, ...dates, provinces:strList('省份'), cities:strList('城市'), limit:integer('数量',{minimum:1,maximum:50}) })),
  def('get_company_partners','查询企业的合作客户和供应商，分析上下游关系、合作频次、金额和产品。',object({ ...companyRef, partner_type:{type:'string',enum:['客户','供应商','全部']}, ...dates, provinces:strList('省份'), keywords:strList('产品关键词'), min_amount:num('最低合作金额，单位万元'), limit:integer('数量',{minimum:1,maximum:100}) },['partner_type'])),
  def('get_company_contacts','查询企业在历史招中标项目中的联系人信息，可按产品、时间和角色筛选。',object({ ...companyRef, keywords:strList('关键词'), match_modes:strList('匹配范围'), ...dates, role:integer('1=招标联系人，2=中标联系人，0=全部',{minimum:0,maximum:2}), limit:integer('数量',{minimum:1,maximum:20}) })),
  def('find_competitors','基于共同投标记录识别目标公司的竞争对手、竞争产品、客户和活跃区域。',object({ ...companyRef, limit:integer('数量',{minimum:1,maximum:50}) })),
  def('find_potential_bidders','针对指定项目推荐历史参与同类项目较多的潜在投标供应商。',object({ bid_id:integer('标讯 ID'), bid_url:str('标讯 URL'), uniq_key:str('唯一标识'), project_title:str('项目标题'), bid_type:{type:'string',enum:['招标','中标']}, limit:integer('数量',{minimum:1,maximum:50}) })),
  def('get_top_purchasers','按业务关键词统计 Top 采购单位，可用于精准获客和市场容量判断；金额参数单位为元。',object({ keywords:strList('业务关键词'), match_modes:strList('匹配范围'), ...dates, provinces:strList('省份'), cities:strList('城市'), exclude_keywords:strList('排除词'), min_amount:num('最低金额，单位元'), max_amount:num('最高金额，单位元'), limit:integer('数量',{minimum:1,maximum:100}), sort_field:{type:'string',enum:['count','amount','pub_time']} },['keywords'])),
  def('get_top_suppliers','按业务关键词统计 Top 中标供应商，可用于渠道拓展与竞对分析；金额参数单位为元。',object({ keywords:strList('业务关键词'), match_modes:strList('匹配范围'), ...dates, provinces:strList('省份'), cities:strList('城市'), exclude_keywords:strList('排除词'), min_amount:num('最低金额，单位元'), max_amount:num('最高金额，单位元'), limit:integer('数量',{minimum:1,maximum:100}), sort_field:{type:'string',enum:['count','amount','pub_time']} },['keywords'])),
  def('get_top_brands','按产品或品类统计 Top 中标品牌、型号、金额和均价，观察品牌竞争格局。',object({ product:str('产品名称'), exclude_keywords:strList('排除词'), min_price:num('最低价格'), max_price:num('最高价格'), ...dates, ...regions, limit:integer('品牌数量',{minimum:1,maximum:50}) },['product'])),
  def('aggregate_bids_advanced','按月、季、年、省份、城市、行业、品牌等维度聚合招中标数据并支持同比/环比。',object({ filters:{type:'object',additionalProperties:true,description:'筛选条件对象'}, group_by:strList('聚合维度，如 month/province/brand'), metrics:strList('指标'), compare_with:{type:'string',enum:['yoy','qoq']} },['group_by'])),
  def('get_price_trends','查询品牌/型号/产品的历史中标单价、区间、均价、中位数和项目明细。',object({ brand:str('品牌'), model:str('型号'), product:str('产品'), exclude_keywords:strList('排除词'), min_price:num('最低价格'), max_price:num('最高价格'), ...dates, ...regions, limit:integer('记录数量',{minimum:1,maximum:200}) },['brand'])),
  def('account_balance','免费查询当前设备的可用积分、赠送/付费来源、累计购买与累计消耗状态。',object(),'account'),
  def('account_daily_consumption','免费查询指定日期范围或最近 N 天的逐日积分消耗与调用次数。',object({ days:integer('最近 N 天',{minimum:1,maximum:366}), start_date:str('开始日期'), end_date:str('结束日期') }),'account')
];
export const TOOL_NAME_SET = new Set(TOOL_DEFINITIONS.map((tool) => tool.name));
export const TOOL_BY_NAME = new Map(TOOL_DEFINITIONS.map((tool) => [tool.name, tool]));
