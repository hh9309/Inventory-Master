
import { InventoryModelType, InventoryParams, DistributionType } from './types';

// 定义展示顺序
export const MODEL_ORDER = [
  InventoryModelType.BASIC_EOQ,
  InventoryModelType.EOQ_SHORTAGE,
  InventoryModelType.EPQ,
  InventoryModelType.EPQ_SHORTAGE_COMBINED,
  InventoryModelType.DISCOUNT,
  InventoryModelType.P_SYSTEM, // 上移
  InventoryModelType.NEWSVENDOR,
  InventoryModelType.PROBABILISTIC // 垫底
];

export const MODEL_METADATA = {
  [InventoryModelType.BASIC_EOQ]: {
    name: '基本 EOQ 模型',
    description: '瞬时到货，需求恒定，无缺货。',
    icon: '📦',
    formula: 'Q* = √( 2DS / H )',
    logic: '寻找订货成本与持有成本之和的最小点，总成本包含采购成本 DK。',
    fullAssumptions: '基本经济订货批量(EOQ)模型建立在以下严格假设之上：1. 外部需求是连续、恒定且已知的；2. 订货提前期(Lead Time)为零或固定常数，且补货是瞬时完成的；3. 单位商品采购单价 K 固定；4. 库存持有成本 H 与平均库存成正比；5. 每次订货设置成本 S 固定。'
  },
  [InventoryModelType.EOQ_SHORTAGE]: {
    name: 'EOQ 允许缺货',
    description: '允许延期交货，平衡持有与缺货成本。',
    icon: '⌛',
    formula: 'Q* = √[ (2DS/H) * ((H+B)/B) ]',
    logic: '当缺货成本 B 低于持有成本时，允许适度缺货是经济的方案。',
    fullAssumptions: '该模型在基本EOQ基础上放宽了“不允许缺货”的限制。假设允许出现短时间的缺货，且这些缺货需求会转化为“延期交货”(Backorders)；单位缺货成本 B 是已知且恒定的。'
  },
  [InventoryModelType.EPQ]: {
    name: '经济生产批量 (EPQ)',
    description: '非瞬时到货，边生产边消耗。',
    icon: '🏭',
    formula: 'Q* = √[ 2DS / (H(1 - D/P)) ]',
    logic: '考虑了生产速率 P 的限制，库存水平以 (P-D) 的速度缓慢上升。',
    fullAssumptions: '经济生产批量(EPQ)模型模拟的是“边生产边消耗”的内部供应场景。生产过程是连续的，且生产速率 P 必须大于需求率 D；每次生产启动需要固定成本 S。'
  },
  [InventoryModelType.EPQ_SHORTAGE_COMBINED]: {
    name: 'EPQ 允许缺货',
    description: '综合生产率与延期交货。',
    icon: '🛠️',
    formula: 'Q* = √[ (2DS / H(1-D/P)) * ((H+B)/B) ]',
    logic: '生产场景下的最全参数模型，在生产速率 P、持有成本 H 与缺货成本 B 之间博弈。',
    fullAssumptions: '结合了有限生产速率 P 和延期交货假设。系统的总成本由订货成本、持有成本和缺货成本三部分构成。'
  },
  [InventoryModelType.DISCOUNT]: {
    name: '数量折扣模型',
    description: '价格随采购量阶梯变动。',
    icon: '💰',
    formula: 'min TC = (D/Q)S + (Q/2)H + KD',
    logic: '在采购单价 K 的优惠和持有成本增加之间寻找全局最优方案。',
    fullAssumptions: '数量折扣模型假设单价随采购量阶梯变动。决策核心在于权衡大批量带来的单价优势与高库存导致的持有成本上升。模型通过遍历各价格区间的EOQ及断点，核算年度总成本TC以寻找全局最优解。这要求管理者在追求采购折扣的同时，审慎评估仓储积压与资金占用，实现供应链整体效益最大化。'
  },
  [InventoryModelType.P_SYSTEM]: {
    name: '定期订货 (P模型)',
    description: '固定周期检查，订货量不固定。',
    icon: '📅',
    formula: 'Target S = D(T+L) + zσ√(T+L)',
    logic: '固定周期 T 订货，管理便捷，但需更高安全库存以覆盖 (T+L) 风险期。',
    fullAssumptions: '定期订货系统核心假设是：库存检查仅在固定的时间间隔 T 发生；目标是补足到预设的最大库存水平 S。'
  },
  [InventoryModelType.NEWSVENDOR]: {
    name: '报童模型',
    description: '单周期库存，易腐商品。',
    icon: '📰',
    formula: 'P(D < Q*) = Cu / (Cu + Co)',
    logic: '平衡缺货损失 Cu 与超储损失 Co，决策单次最优进货量 Q*。',
    fullAssumptions: '报童模型针对单周期易腐商品，假设需求服从正态分布且不可中途补货。核心通过平衡缺货成本(Cu)与超储成本(Co)计算临界比率，并查标准正态分布表获取Z分数，确定最优订货量Q*。该模型能在需求不确定性与库存风险间实现量化平衡，是单周期不确定性环境下决策的基石。'
  },
  [InventoryModelType.PROBABILISTIC]: {
    name: '随机需求 (Q模型)',
    description: '需求波动，设置安全库存。',
    icon: '🎲',
    formula: 'ROP = DL + z * σ',
    logic: '连续检查库存，一旦低于再订货点 ROP 即发起订货 Q*。',
    fullAssumptions: '随机需求Q模型假设实时监控库存，且需求服从正态分布。核心逻辑是设定再订货点触发固定批量订货。为达服务水平，模型在提前期内持有安全库存以缓冲波动。利用标准正态表Z分数来量化风险，在持有成本与缺货损失间寻找总成本最低的科学解，有效应对现实中的供应不确定性。'
  }
};

export const INITIAL_PARAMS: InventoryParams = {
  demand: 12000,
  setupCost: 60,
  holdingCost: 2.5,
  leadTime: 5,
  unitPrice: 15,
  shortageCost: 12,
  productionRate: 25000,
  serviceLevel: 0.95,
  standardDeviation: 150,
  overstockCost: 8,
  reviewPeriod: 14,
  demandDistribution: DistributionType.CONSTANT,
  leadTimeDistribution: DistributionType.CONSTANT,
  discountTiers: [
    { minQty: 0, maxQty: 500, price: 15 },
    { minQty: 501, maxQty: 1200, price: 14 },
    { minQty: 1201, maxQty: Infinity, price: 13 }
  ]
};
