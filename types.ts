
export enum InventoryModelType {
  BASIC_EOQ = 'BASIC_EOQ',
  EOQ_SHORTAGE = 'EOQ_SHORTAGE',
  EPQ = 'EPQ',
  EPQ_SHORTAGE_COMBINED = 'EPQ_SHORTAGE_COMBINED',
  DISCOUNT = 'DISCOUNT',
  PROBABILISTIC = 'PROBABILISTIC',
  P_SYSTEM = 'P_SYSTEM',
  NEWSVENDOR = 'NEWSVENDOR'
}

export enum DistributionType {
  CONSTANT = 'CONSTANT',
  NORMAL = 'NORMAL'
}

export type AIProvider = 'gemini' | 'deepseek';

export interface AIConfig {
  provider: AIProvider;
  geminiKey?: string;
  deepseekKey?: string;
}

export interface InventoryParams {
  demand: number;
  setupCost: number;
  holdingCost: number;
  leadTime: number;
  unitPrice: number;
  shortageCost?: number;
  productionRate?: number;
  standardDeviation?: number;
  serviceLevel: number;   
  overstockCost?: number;
  reviewPeriod?: number;
  demandDistribution: DistributionType;
  leadTimeDistribution: DistributionType;
  discountTiers?: DiscountTier[];
}

export interface DiscountTier {
  minQty: number;
  maxQty: number;
  price: number;
}

export interface CalculationResult {
  optimalQty: number;
  maxInventory: number;
  reorderPoint: number;
  totalCost: number;
  cycleTime: number;
  safetyStock: number;
  chartData: any[];
  steps: string[];
}
