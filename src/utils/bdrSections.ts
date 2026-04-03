import type { BdrTableRow } from '../types/bdr';
import { BDR_OVERHEAD_ROWS, OVERHEAD_GROUPS } from './bdrConstants';

/** Определение секции БДР */
export interface IBdrSection {
  key: string;
  title: string;
  /** row_code строки-итога секции (для отображения значений в строке-заголовке) */
  summaryRowCode: string;
  /** row_code'ы дочерних строк */
  childCodes: string[];
  /** Секция является расчётной (подсветка) */
  isProfit?: boolean;
}

/** 7 секций БДР */
export const BDR_SECTIONS: IBdrSection[] = [
  {
    key: 'section_1',
    title: 'I. ПРОИЗВОДСТВО И ВЫРУЧКА',
    summaryRowCode: 'revenue',
    childCodes: ['revenue_smr', 'execution_total', 'contract_not_accepted', 'readiness_percent', 'nzp_to_revenue'],
  },
  {
    key: 'section_2',
    title: 'II. ПРЯМАЯ СЕБЕСТОИМОСТЬ',
    summaryRowCode: 'direct_cost_total',
    childCodes: ['cost_materials', 'cost_labor', 'cost_subcontract', 'cost_design', 'cost_rental'],
  },
  {
    key: 'section_3',
    title: 'III. ПРОИЗВОДСТВЕННЫЕ НАКЛАДНЫЕ РАСХОДЫ',
    summaryRowCode: 'cost_overhead',
    childCodes: BDR_OVERHEAD_ROWS.map((r) => r.code),
  },
  {
    key: 'section_4',
    title: 'IV. МАРЖИНАЛЬНАЯ ПРИБЫЛЬ',
    summaryRowCode: 'marginal_profit',
    childCodes: ['cost_total', 'gross_margin', 'overhead_ratio', 'labor_cost_ratio'],
    isProfit: true,
  },
  {
    key: 'section_5',
    title: 'V. КОММЕРЧЕСКИЕ И УПРАВЛЕНЧЕСКИЕ РАСХОДЫ (OPEX)',
    summaryRowCode: 'fixed_expenses',
    childCodes: [],
  },
  {
    key: 'section_6',
    title: 'VI. ОПЕРАЦИОННАЯ ПРИБЫЛЬ',
    summaryRowCode: 'operating_profit',
    childCodes: ['operating_profit_pct'],
    isProfit: true,
  },
  {
    key: 'section_7',
    title: 'VII. ЧИСТАЯ ПРИБЫЛЬ И ФИН. РЕЗУЛЬТАТ',
    summaryRowCode: 'net_profit',
    childCodes: ['other_income_expense', 'profit_before_tax', 'income_tax', 'net_profit_margin', 'dividends'],
    isProfit: true,
  },
];

/** Формулы для тултипов расчётных строк */
export const BDR_FORMULAS: Record<string, string> = {
  revenue: 'Выручка = КС-2 с Заказчиком',
  direct_cost_total: 'Прямая себестоимость = Материалы + ФОТ + Субподряд + ПИР + Аренда',
  cost_total: 'Полная себестоимость = Прямая себестоимость (II) + Накладные расходы (III)',
  cost_overhead: 'План: 10% от КС-2. Факт: сумма всех статей накладных расходов',
  marginal_profit: 'Маржинальная прибыль = Выручка − Прямая себестоимость (II) − Накладные расходы (III)',
  gross_margin: 'Gross Margin = Маржинальная прибыль / Выручка × 100%',
  overhead_ratio: 'Коэф. накладных = Накладные / Прямая себестоимость × 100%',
  labor_cost_ratio: 'Labor Cost Ratio = ФОТ / Себестоимость × 100%',
  fixed_expenses: 'План: 20% от КС-2. Факт: годовой ОФЗ / 12 × доля проекта',
  operating_profit: 'Операционная прибыль = Маржинальная прибыль − ОФЗ',
  operating_profit_pct: 'В % к выручке = Операционная прибыль / Выручка × 100%',
  profit_before_tax: 'Прибыль до налога = Операционная прибыль + Прочие доходы/расходы',
  net_profit: 'Чистая прибыль = Прибыль до налога − Налог на прибыль',
  net_profit_margin: 'Net Profit Margin = Чистая прибыль / Выручка × 100%',
  readiness_percent: '% готовности = Σ КС-2 с начала строительства / Контрактная стоимость × 100%',
  nzp_to_revenue: 'НЗП / Выручка = (Выполнение − КС-2) / Выручка × 100%',
  contract_not_accepted: 'НЗП = Выполнение (КС-2 внутренняя) − КС-2 с Заказчиком',
  execution_total: 'Выполнение = План: КС-2 с Заказчиком. Факт: фактическое выполнение',
  revenue_smr: 'КС-2 = План: из ПГ СМР. Факт: из журнала фактического выполнения',
};

export interface IBdrTreeRow extends BdrTableRow {
  children?: IBdrTreeRow[];
  isSectionHeader?: boolean;
  isGroupHeader?: boolean;
  sectionKey?: string;
  isProfit?: boolean;
}

/** Собирает все dataKey для plan/fact из дочерних строк */
function collectMonthKeys(rows: BdrTableRow[]): string[] {
  const keys = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      const match = k.match(/^plan_month_(.+)$/);
      if (match) keys.add(match[1]);
    }
  }
  return [...keys];
}

/** Построение подгрупп для секции III (накладные расходы) */
function buildOverheadGroups(rowMap: Map<string, BdrTableRow>, allRows: BdrTableRow[]): IBdrTreeRow[] {
  const groups: IBdrTreeRow[] = [];
  const monthKeys = collectMonthKeys(allRows);

  for (const group of OVERHEAD_GROUPS) {
    const groupChildren: IBdrTreeRow[] = [];
    let planTotal = 0;
    let factTotal = 0;

    for (const code of group.childCodes) {
      const row = rowMap.get(code);
      if (row) {
        groupChildren.push({ ...row });
        planTotal += (row.plan_total as number) || 0;
        factTotal += (row.fact_total as number) || 0;
      }
    }

    const groupRow: IBdrTreeRow = {
      key: group.code,
      name: group.name,
      rowCode: group.code,
      isGroupHeader: true,
      isSemiBold: true,
      isCalculated: true,
      plan_total: planTotal,
      fact_total: factTotal,
      children: groupChildren.length > 0 ? groupChildren : undefined,
    };

    // Помесячные суммы (поддержка multi-year dataKey)
    for (const dk of monthKeys) {
      let pSum = 0;
      let fSum = 0;
      for (const code of group.childCodes) {
        const row = rowMap.get(code);
        if (row) {
          pSum += (row[`plan_month_${dk}`] as number) || 0;
          fSum += (row[`fact_month_${dk}`] as number) || 0;
        }
      }
      groupRow[`plan_month_${dk}`] = pSum;
      groupRow[`fact_month_${dk}`] = fSum;
    }

    groups.push(groupRow);
  }

  return groups;
}

/** Группировка плоских строк в дерево секций */
export function buildBdrTree(flatRows: BdrTableRow[]): IBdrTreeRow[] {
  const rowMap = new Map<string, BdrTableRow>();
  for (const row of flatRows) {
    rowMap.set(row.rowCode, row);
  }

  const tree: IBdrTreeRow[] = [];

  for (const section of BDR_SECTIONS) {
    const summaryRow = rowMap.get(section.summaryRowCode);
    if (!summaryRow) continue;

    let children: IBdrTreeRow[];

    // Секция III — группируем накладные расходы в подгруппы
    if (section.key === 'section_3') {
      children = buildOverheadGroups(rowMap, flatRows);
    } else {
      children = [];
      for (const code of section.childCodes) {
        const childRow = rowMap.get(code);
        if (childRow) {
          children.push({ ...childRow });
        }
      }
    }

    const sectionRow: IBdrTreeRow = {
      ...summaryRow,
      key: section.key,
      name: section.title,
      isSectionHeader: true,
      sectionKey: section.key,
      isProfit: section.isProfit,
      children: children.length > 0 ? children : undefined,
    };

    tree.push(sectionRow);
  }

  return tree;
}

/** Фильтрация пустых строк (все plan и fact = 0) */
export function filterEmptyRows(tree: IBdrTreeRow[]): IBdrTreeRow[] {
  return tree.map((section) => {
    if (!section.children) return section;
    const filtered = section.children.filter((row) => {
      if (row.isPercent) return true;
      // Для подгрупп — проверяем наличие непустых дочерних
      if (row.isGroupHeader && row.children) {
        const nonEmpty = row.children.filter((child) => {
          const p = (child.plan_total as number) || 0;
          const f = (child.fact_total as number) || 0;
          return p !== 0 || f !== 0;
        });
        if (nonEmpty.length === 0) return false;
        row.children = nonEmpty;
        return true;
      }
      const plan = (row.plan_total as number) || 0;
      const fact = (row.fact_total as number) || 0;
      return plan !== 0 || fact !== 0;
    });
    return { ...section, children: filtered.length > 0 ? filtered : undefined };
  });
}

/** Проверка: факт по расходной статье превышает план (>100%) */
export function isOverBudget(plan: number, fact: number): boolean {
  if (!plan || plan <= 0) return false;
  return fact > plan;
}

/** Проверка: % субподряда обгоняет % готовности */
export function isSubcontractAhead(
  subPlan: number, subFact: number, readinessPlan: number, readinessFact: number
): boolean {
  if (!subPlan || !readinessPlan) return false;
  const subPct = (subFact / subPlan) * 100;
  const readinessPct = readinessFact > 0 ? readinessFact : (readinessPlan || 0);
  return subPct > readinessPct && subPct > 0;
}
