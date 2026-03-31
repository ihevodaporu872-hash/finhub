import type { BblRowDef } from '../types/bbl';

/** Секции ББЛ для tree-grid */
export interface IBblSection {
  key: string;
  title: string;
  summaryRowCode: string;
  childCodes: string[];
  isAsset?: boolean;
  isLiability?: boolean;
  isEquity?: boolean;
}

/** Все строки ББЛ */
export const BBL_ROWS: BblRowDef[] = [
  // === АКТИВЫ ===
  // I. Внеоборотные активы
  { code: 'noncurrent_total', name: 'Внеоборотные активы', isSemiBold: true, isCalculated: true, isSectionTotal: true },
  { code: 'fixed_assets', name: 'Основные средства', isChild: true },
  { code: 'intangible_assets', name: 'Нематериальные активы', isChild: true },
  { code: 'other_noncurrent', name: 'Прочие внеоборотные активы', isChild: true },

  // II. Оборотные активы
  { code: 'current_total', name: 'Оборотные активы', isSemiBold: true, isCalculated: true, isSectionTotal: true },
  { code: 'cash_total', name: 'Денежные средства', isChild: true, isCalculated: true, isLinked: true, linkedSource: 'БДДС: Остаток на конец периода' },
  { code: 'cash_rs', name: 'на расчётных счетах (р/с)', isChild: true, isCalculated: true, isLinked: true, linkedSource: 'БДДС: Остаток на р/с на конец' },
  { code: 'cash_obs', name: 'на ОБС (целевой)', isChild: true, isCalculated: true, isLinked: true, linkedSource: 'БДДС: Остаток на ОБС на конец' },
  { code: 'receivables', name: 'Дебиторская задолженность', isChild: true, isCalculated: true, isLinked: true, linkedSource: 'Входящее + КС-2 (БДР) − Поступления (БДДС)' },
  { code: 'inventory_wip', name: 'Запасы и НЗП', isChild: true, isCalculated: true, isLinked: true, linkedSource: 'БДР: Выполнение − КС-2 с Заказчиком (нарастающий)' },
  { code: 'prepaid_expenses', name: 'Авансы выданные', isChild: true },
  { code: 'other_current_assets', name: 'Прочие оборотные активы', isChild: true },

  // ИТОГО АКТИВЫ
  { code: 'total_assets', name: 'ИТОГО АКТИВЫ', isSemiBold: true, isCalculated: true, isSectionTotal: true },

  // === ПАССИВЫ ===
  // III. Краткосрочные обязательства
  { code: 'current_liabilities_total', name: 'Краткосрочные обязательства', isSemiBold: true, isCalculated: true, isSectionTotal: true },
  { code: 'payables', name: 'Кредиторская задолженность', isChild: true, isCalculated: true, isLinked: true, linkedSource: 'Входящее + Расходы (БДР) − Оплаты (БДДС)' },
  { code: 'advances_received', name: 'Авансы полученные', isChild: true },
  { code: 'short_term_loans', name: 'Краткосрочные кредиты и займы', isChild: true },
  { code: 'current_lt_debt', name: 'Текущая часть долгосрочных обязательств', isChild: true },
  { code: 'other_current_liabilities', name: 'Прочие краткосрочные обязательства', isChild: true },

  // IV. Долгосрочные обязательства
  { code: 'lt_liabilities_total', name: 'Долгосрочные обязательства', isSemiBold: true, isCalculated: true, isSectionTotal: true },
  { code: 'long_term_loans', name: 'Долгосрочные кредиты и займы', isChild: true },
  { code: 'other_lt_liabilities', name: 'Прочие долгосрочные обязательства', isChild: true },

  // V. Собственный капитал
  { code: 'equity_total', name: 'Собственный капитал', isSemiBold: true, isCalculated: true, isSectionTotal: true },
  { code: 'share_capital', name: 'Уставный капитал', isChild: true },
  { code: 'retained_earnings', name: 'Нераспределенная прибыль', isChild: true, isCalculated: true, isLinked: true, linkedSource: 'БДР: Σ Чистая прибыль − БДДС: Дивиденды' },
  { code: 'reserve_capital', name: 'Резервный капитал', isChild: true },

  // ИТОГО ПАССИВЫ И КАПИТАЛ
  { code: 'total_liabilities_equity', name: 'ИТОГО ПАССИВЫ И КАПИТАЛ', isSemiBold: true, isCalculated: true, isSectionTotal: true },

  // Контроль баланса
  { code: 'balance_check', name: 'Контроль баланса (Разрыв)', isSemiBold: true, isCalculated: true, isBalanceCheck: true },
];

/** Секции для tree-grid */
export const BBL_SECTIONS: IBblSection[] = [
  {
    key: 'section_noncurrent',
    title: 'I. ВНЕОБОРОТНЫЕ АКТИВЫ',
    summaryRowCode: 'noncurrent_total',
    childCodes: ['fixed_assets', 'intangible_assets', 'other_noncurrent'],
    isAsset: true,
  },
  {
    key: 'section_current',
    title: 'II. ОБОРОТНЫЕ АКТИВЫ',
    summaryRowCode: 'current_total',
    childCodes: ['cash_total', 'cash_rs', 'cash_obs', 'receivables', 'inventory_wip', 'prepaid_expenses', 'other_current_assets'],
    isAsset: true,
  },
  {
    key: 'section_total_assets',
    title: 'ИТОГО АКТИВЫ',
    summaryRowCode: 'total_assets',
    childCodes: [],
    isAsset: true,
  },
  {
    key: 'section_current_liabilities',
    title: 'III. КРАТКОСРОЧНЫЕ ОБЯЗАТЕЛЬСТВА',
    summaryRowCode: 'current_liabilities_total',
    childCodes: ['payables', 'advances_received', 'short_term_loans', 'current_lt_debt', 'other_current_liabilities'],
    isLiability: true,
  },
  {
    key: 'section_lt_liabilities',
    title: 'IV. ДОЛГОСРОЧНЫЕ ОБЯЗАТЕЛЬСТВА',
    summaryRowCode: 'lt_liabilities_total',
    childCodes: ['long_term_loans', 'other_lt_liabilities'],
    isLiability: true,
  },
  {
    key: 'section_equity',
    title: 'V. СОБСТВЕННЫЙ КАПИТАЛ',
    summaryRowCode: 'equity_total',
    childCodes: ['share_capital', 'retained_earnings', 'reserve_capital'],
    isEquity: true,
  },
  {
    key: 'section_total_le',
    title: 'ИТОГО ПАССИВЫ И КАПИТАЛ',
    summaryRowCode: 'total_liabilities_equity',
    childCodes: [],
    isLiability: true,
  },
  {
    key: 'section_check',
    title: 'КОНТРОЛЬ БАЛАНСА (РАЗРЫВ)',
    summaryRowCode: 'balance_check',
    childCodes: [],
  },
];

/** Строки, редактируемые вручную (не linked и не calculated) */
export const BBL_MANUAL_CODES = BBL_ROWS
  .filter((r) => !r.isCalculated && !r.isSectionHeader)
  .map((r) => r.code);

/** Формулы для тултипов */
export const BBL_FORMULAS: Record<string, string> = {
  noncurrent_total: 'ОС + НМА + Прочие внеоборотные',
  current_total: 'Денежные средства + Дебиторка + НЗП + Авансы выданные + Прочие',
  total_assets: 'Внеоборотные активы + Оборотные активы',
  cash_total: 'Из БДДС: Остаток на конец периода (р/с + ОБС)',
  cash_rs: 'Из БДДС: Остаток на расчётных счетах на конец',
  cash_obs: 'Из БДДС: Остаток на ОБС на конец',
  receivables: 'Входящее сальдо + КС-2 с Заказчиком (БДР) − Поступления (БДДС)',
  inventory_wip: 'Нарастающий итог: Выполнение (БДР) − КС-2 с Заказчиком (БДР)',
  payables: 'Входящее сальдо + Расходы (БДР) − Оплаты (БДДС)',
  retained_earnings: 'Σ Чистая прибыль (БДР) − Дивиденды (БДДС)',
  current_liabilities_total: 'Кредиторка + Авансы получ. + Краткосрочные кредиты + Тек.часть долгосрочных + Прочие',
  lt_liabilities_total: 'Долгосрочные кредиты + Прочие долгосрочные',
  equity_total: 'Уставный капитал + Нераспр. прибыль + Резервный капитал',
  total_liabilities_equity: 'Краткосрочные + Долгосрочные + Капитал',
  balance_check: 'ИТОГО АКТИВЫ − ИТОГО ПАССИВЫ И КАПИТАЛ (должно быть = 0)',
};
