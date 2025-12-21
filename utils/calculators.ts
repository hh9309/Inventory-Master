
import { InventoryModelType, InventoryParams, CalculationResult, DistributionType } from '../types';

// 服务水平到 Z 分数的映射 (用于快速查询)
const Z_MAP: Record<number, number> = {
  0.80: 0.84,
  0.85: 1.04,
  0.90: 1.28,
  0.95: 1.645,
  0.99: 2.33
};

// 简单的正态分布累积分布函数的近似逆函数 (用于报童模型)
function getZFromProbability(p: number): number {
  if (p <= 0) return -3;
  if (p >= 1) return 3;
  // 简单的分段近似逻辑
  if (p < 0.5) return -getZFromProbability(1 - p);
  if (p < 0.85) return (p - 0.5) / 0.35 * 1.04; 
  if (p < 0.95) return 1.04 + (p - 0.84) / 0.11 * 0.605; 
  return 1.645 + (p - 0.95) / 0.05 * 0.685;
}

// 正态分布随机数生成 (Box-Muller)
function randomNormal(mean: number, stdDev: number) {
  if (stdDev <= 0) return mean;
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function calculateInventory(type: InventoryModelType, p: InventoryParams): CalculationResult {
  let Q = 0, S_max = 0, ROP = 0, totalCost = 0, cycleTime = 0, safetyStock = 0;
  const steps: string[] = [];
  const D_annual = p.demand;
  const S = p.setupCost;
  const H = p.holdingCost;
  const L = p.leadTime;
  const K = p.unitPrice; 
  const sigma = p.standardDeviation || 0;
  const dailyDemand = D_annual / 365;
  const z = Z_MAP[p.serviceLevel] || 1.645;

  // 基础计算
  switch (type) {
    case InventoryModelType.BASIC_EOQ:
      Q = Math.sqrt((2 * D_annual * S) / H);
      S_max = Q;
      ROP = dailyDemand * L;
      totalCost = (D_annual / Q) * S + (Q / 2) * H + (D_annual * K);
      steps.push(`推导 Q*: 令 dTC/dQ = 0, 得到平衡点 Q* = √(2DS/H)`);
      steps.push(`计算 Q*: √((2 * ${D_annual} * ${S}) / ${H}) = ${Q.toFixed(2)}`);
      steps.push(`TC 表达式: TC = (D/Q)S + (Q/2)H + DK = ${totalCost.toFixed(0)}`);
      break;

    case InventoryModelType.EOQ_SHORTAGE:
      const B = p.shortageCost || 12;
      Q = Math.sqrt((2 * D_annual * S * (H + B)) / (H * B));
      const backorderMax = Q * (H / (H + B));
      S_max = Q - backorderMax;
      ROP = dailyDemand * L - backorderMax;
      totalCost = Math.sqrt((2 * D_annual * S * H * B) / (H + B)) + (D_annual * K);
      steps.push(`推导 Q*: 引入缺货因子修正系数 √((H+B)/B)`);
      steps.push(`计算 Q*: √(2DS/H * (H+B)/B) = ${Q.toFixed(2)}`);
      steps.push(`TC 表达式: TC = √[2DSHB/(H+B)] + DK = ${totalCost.toFixed(0)}`);
      break;

    case InventoryModelType.EPQ:
      const P = p.productionRate || D_annual * 1.5; 
      Q = Math.sqrt((2 * D_annual * S) / (H * (1 - D_annual / P)));
      S_max = Q * (1 - D_annual / P);
      ROP = dailyDemand * L;
      totalCost = (D_annual / Q) * S + (S_max / 2) * H + (D_annual * K);
      steps.push(`推导 Q*: 引入生产修正系数 √(1/(1-D/P))`);
      steps.push(`计算 Q*: √[2DS / (H(1-D/P))] = ${Q.toFixed(2)}`);
      steps.push(`TC 表达式: TC = (D/Q)S + [Q(1-D/P)/2]H + DK = ${totalCost.toFixed(0)}`);
      break;

    case InventoryModelType.EPQ_SHORTAGE_COMBINED:
      const P2 = p.productionRate || D_annual * 2;
      const B2 = p.shortageCost || 12;
      const factorP = 1 - D_annual / P2;
      Q = Math.sqrt((2 * D_annual * S) / (H * factorP * (B2 / (H + B2))));
      const backorderMax2 = Q * factorP * (H / (H + B2));
      S_max = Q * factorP - backorderMax2;
      ROP = dailyDemand * L - backorderMax2;
      totalCost = (D_annual / Q) * S + (S_max / 2) * H + (backorderMax2 / 2) * B2 + (D_annual * K);
      steps.push(`推导 Q*: 综合生产修正与缺货惩罚系数`);
      steps.push(`计算 Q*: √[(2DS/(H(1-D/P))) * ((H+B)/B)] = ${Q.toFixed(2)}`);
      steps.push(`TC 表达式: TC = 订货 + 持有 + 缺货 + 采购成本 = ${totalCost.toFixed(0)}`);
      break;

    case InventoryModelType.DISCOUNT:
      let minTC = Infinity;
      p.discountTiers?.forEach(tier => {
        let currentQ = Math.sqrt((2 * D_annual * S) / H);
        if (currentQ < tier.minQty) currentQ = tier.minQty;
        if (currentQ > tier.maxQty) currentQ = tier.maxQty;
        const tc = (D_annual / currentQ) * S + (currentQ / 2) * H + (D_annual * tier.price);
        if (tc < minTC) { minTC = tc; Q = currentQ; }
      });
      S_max = Q;
      totalCost = minTC;
      ROP = dailyDemand * L;
      steps.push(`推导过程: 遍历各价格区间 K(Q)，寻找分段函数 TC(Q) 的全局最小值`);
      steps.push(`计算 Q*: 选定区间最优量 = ${Q.toFixed(2)}`);
      steps.push(`TC 表达式: TC = (D/Q)S + (Q/2)H + K(Q)D = ${totalCost.toFixed(0)}`);
      break;

    case InventoryModelType.PROBABILISTIC:
      Q = Math.sqrt((2 * D_annual * S) / H);
      safetyStock = z * sigma * Math.sqrt(L / 365);
      S_max = Q + safetyStock;
      ROP = dailyDemand * L + safetyStock;
      totalCost = (D_annual / Q) * S + (Q / 2 + safetyStock) * H + (D_annual * K);
      steps.push(`随机需求模型: 需求 σ = ${sigma.toFixed(1)}`);
      steps.push(`计算 SS: zσ√L = ${z} * ${sigma} * √(${L}/365) = ${safetyStock.toFixed(2)}`);
      steps.push(`计算 ROP: DL + SS = ${ROP.toFixed(2)}`);
      break;

    case InventoryModelType.P_SYSTEM:
      const T = p.reviewPeriod || 14;
      cycleTime = T;
      safetyStock = z * sigma * Math.sqrt((T + L) / 365);
      const targetS = dailyDemand * (T + L) + safetyStock;
      Q = dailyDemand * T;
      S_max = targetS;
      ROP = dailyDemand * L + safetyStock;
      totalCost = (365 / T) * S + (Q / 2 + safetyStock) * H + (D_annual * K);
      steps.push(`P模型逻辑: 复核周期 T = ${T} 天`);
      steps.push(`计算 Target S: D(T+L) + SS = ${targetS.toFixed(2)}`);
      steps.push(`安全库存: 基于风险期 (T+L) 计算 = ${safetyStock.toFixed(2)}`);
      break;

    case InventoryModelType.NEWSVENDOR:
      const Cu = p.shortageCost || 12;
      const Co = p.overstockCost || 8;
      const cr = Cu / (Cu + Co); 
      const mu = dailyDemand; // 以天为单位的报童
      const zNews = getZFromProbability(cr);
      
      Q = mu + zNews * sigma;
      S_max = Q;
      totalCost = (Cu + Co) * sigma * 0.4; // 预期损失近似
      ROP = 0;

      steps.push(`单周期报童: 需求均值 μ = ${mu.toFixed(1)}, 标准差 σ = ${sigma}`);
      steps.push(`临界概率: Cu/(Cu+Co) = ${cr.toFixed(4)} -> Z = ${zNews.toFixed(2)}`);
      steps.push(`最优量: Q* = μ + zσ = ${Q.toFixed(1)}`);
      break;
  }

  if (type !== InventoryModelType.P_SYSTEM) {
    cycleTime = (Q / D_annual) * 365;
  }
  if (type === InventoryModelType.NEWSVENDOR) cycleTime = 1;

  // 仿真数据生成
  const chartData = [];
  const cycleCount = 3;
  const pointsPerCycle = 60;
  const totalPoints = cycleCount * pointsPerCycle;
  const timeStep = (cycleTime * cycleCount) / totalPoints;

  let currentLevel = S_max + safetyStock;

  for (let i = 0; i <= totalPoints; i++) {
    const t = i * timeStep;
    const cyclePos = t % cycleTime;
    
    if (cyclePos < timeStep && i > 0) {
      currentLevel += Q;
    }

    let demandThisStep = dailyDemand * timeStep;
    // 如果设置了正态分布，则在仿真中使用标准差
    if (p.demandDistribution === DistributionType.NORMAL && sigma > 0) {
      // 将年标准差转换为对应步长的标准差
      const stepStdDev = sigma / Math.sqrt(365) * Math.sqrt(timeStep);
      demandThisStep = randomNormal(demandThisStep, stepStdDev);
    }
    
    currentLevel -= demandThisStep;
    
    // EPQ 生产逻辑
    if (type === InventoryModelType.EPQ || type === InventoryModelType.EPQ_SHORTAGE_COMBINED) {
      const P_val = (p.productionRate || D_annual * 2) / 365; 
      const productionTime = Q / P_val;
      if (cyclePos < productionTime) {
         currentLevel += (P_val * timeStep);
      }
    }

    chartData.push({
      time: t.toFixed(1),
      level: currentLevel
    });
  }

  return { optimalQty: Q, maxInventory: S_max + safetyStock, reorderPoint: ROP, totalCost, cycleTime, safetyStock, chartData, steps };
}
