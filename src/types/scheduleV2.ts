export interface IScheduleV2Category {
  id: string;
  project_id: string;
  name: string;
  cost_group: 'commercial' | 'direct';
  sort_order: number;
  volume: number;
  unit: string;
  price_per_unit: number;
  cost_materials: number;
  cost_labor: number;
  cost_sub_materials: number;
  cost_sub_labor: number;
  total: number;
}

export interface IScheduleV2Monthly {
  id: string;
  project_id: string;
  category_id: string;
  month_key: string;
  amount: number;
}

export interface IScheduleV2Finance {
  id: string;
  project_id: string;
  row_code: string;
  month_key: string;
  amount: number;
}

export interface IScheduleV2CostRow {
  key: string;
  id?: string;
  name: string;
  costGroup: 'commercial' | 'direct';
  isHeader?: boolean;
  isTotal?: boolean;
  volume: number;
  unit: string;
  pricePerUnit: number;
  costMaterials: number;
  costLabor: number;
  costSubMaterials: number;
  costSubLabor: number;
  total: number;
}

export interface IScheduleV2MonthlyRow {
  key: string;
  name: string;
  isHeader?: boolean;
  isTotal?: boolean;
  isBold?: boolean;
  costGroup?: 'commercial' | 'direct';
  categoryId?: string;
  rowCode?: string;
  [monthKey: string]: unknown;
}

export type ScheduleV2FinanceCode =
  | 'total_smr'
  | 'total_smr_no_vat'
  | 'advance_income'
  | 'advance_offset'
  | 'guarantee_retention'
  | 'guarantee_return'
  | 'total_income';

export const FINANCE_ROW_LABELS: Record<ScheduleV2FinanceCode, string> = {
  total_smr: 'Всего СМР по проекту',
  total_smr_no_vat: 'Всего СМР по проекту без НДС',
  advance_income: 'Аванс (Приход)',
  advance_offset: 'Зачет Аванса',
  guarantee_retention: 'Гарантийное Удержание',
  guarantee_return: 'Возврат ГУ',
  total_income: 'Итого поступление за СМР по проекту',
};

export const FINANCE_CODES: ScheduleV2FinanceCode[] = [
  'total_smr',
  'total_smr_no_vat',
  'advance_income',
  'advance_offset',
  'guarantee_retention',
  'guarantee_return',
  'total_income',
];

export const EDITABLE_FINANCE_CODES: ScheduleV2FinanceCode[] = [
  'advance_income',
  'advance_offset',
  'guarantee_retention',
  'guarantee_return',
];
