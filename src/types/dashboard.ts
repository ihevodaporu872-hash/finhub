export interface IMonthDataPoint {
  month: string;
  value: number;
  type: string;
}

export interface ICostItem {
  month: string;
  category: string;
  value: number;
}

export interface IWaterfallItem {
  name: string;
  value: number;
}

export interface IBdrDashboardData {
  revenueByMonth: IMonthDataPoint[];
  costStructure: ICostItem[];
  waterfall: IWaterfallItem[];
  marginPercent: number;
  scurve: IMonthDataPoint[];
  kpis: {
    revenueFact: number;
    revenuePlan: number;
    marginalProfit: number;
    operatingProfit: number;
    operatingProfitPct: number;
    netProfit: number;
    costTotal: number;
  };
}

export interface IBddsDashboardData {
  planFactIncome: IMonthDataPoint[];
  ncfBySection: IMonthDataPoint[];
  kpis: {
    ncfOperating: number;
    ncfInvesting: number;
    ncfFinancing: number;
    ncfTotal: number;
    planIncomeTotal: number;
    factIncomeTotal: number;
  };
}
