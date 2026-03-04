import { useMemo } from 'react';
import { useBdr } from './useBdr';
import { useBdds } from './useBdds';
import { MONTHS, SECTION_NAMES } from '../utils/constants';
import type { IBdrDashboardData, IBddsDashboardData, IMonthDataPoint, ICostItem, IWaterfallItem } from '../types/dashboard';
import type { BdrTableRow } from '../types/bdr';
import type { SectionCode } from '../types/bdds';

interface IUseDashboardResult {
  bdrData: IBdrDashboardData | null;
  bddsData: IBddsDashboardData | null;
  loading: boolean;
  error: string | null;
}

const getRow = (rows: BdrTableRow[], code: string): BdrTableRow | undefined =>
  rows.find((r) => r.rowCode === code);

const getMonthVal = (row: BdrTableRow | undefined, month: number, type: 'plan' | 'fact'): number =>
  (row?.[`${type}_month_${month}`] as number) || 0;

const COST_LABELS: Record<string, string> = {
  cost_materials: 'Материалы',
  cost_labor: 'ФОТ',
  cost_subcontract: 'Субподряд',
  cost_design: 'Проектные',
  cost_rental: 'Аренда',
  cost_overhead: 'Накладные',
};

export function useDashboard(year: number, projectId: string | null = null): IUseDashboardResult {
  const bdr = useBdr(year, projectId);
  const bdds = useBdds(year, projectId);

  const bdrData = useMemo((): IBdrDashboardData | null => {
    if (bdr.loading || !bdr.rows.length) return null;
    const { rows } = bdr;

    const revenueRow = getRow(rows, 'revenue');
    const costTotalRow = getRow(rows, 'cost_total');
    const marginalRow = getRow(rows, 'marginal_profit');
    const operatingRow = getRow(rows, 'operating_profit');
    const operatingPctRow = getRow(rows, 'operating_profit_pct');
    const netProfitRow = getRow(rows, 'net_profit');

    // KPIs
    const kpis = {
      revenueFact: (revenueRow?.fact_total as number) || 0,
      revenuePlan: (revenueRow?.plan_total as number) || 0,
      marginalProfit: (marginalRow?.fact_total as number) || 0,
      operatingProfit: (operatingRow?.fact_total as number) || 0,
      operatingProfitPct: 0,
      netProfit: (netProfitRow?.fact_total as number) || 0,
      costTotal: (costTotalRow?.fact_total as number) || 0,
    };

    // Рентабельность — средняя за все месяцы с данными
    const pctValues: number[] = [];
    for (const m of MONTHS) {
      const val = getMonthVal(operatingPctRow, m.key, 'fact');
      if (val !== 0) pctValues.push(val);
    }
    kpis.operatingProfitPct = pctValues.length > 0
      ? pctValues.reduce((s, v) => s + v, 0) / pctValues.length
      : 0;

    // S-кривая (кумулятивная выручка)
    const scurve: IMonthDataPoint[] = [];
    let cumPlan = 0;
    let cumFact = 0;
    for (const m of MONTHS) {
      cumPlan += getMonthVal(revenueRow, m.key, 'plan');
      cumFact += getMonthVal(revenueRow, m.key, 'fact');
      scurve.push({ month: m.short, value: cumPlan, type: 'План' });
      scurve.push({ month: m.short, value: cumFact, type: 'Факт' });
    }

    // Структура себестоимости по месяцам
    const costCodes = Object.keys(COST_LABELS);
    const costStructure: ICostItem[] = [];
    for (const m of MONTHS) {
      for (const code of costCodes) {
        const row = getRow(rows, code);
        costStructure.push({
          month: m.short,
          category: COST_LABELS[code],
          value: getMonthVal(row, m.key, 'fact'),
        });
      }
    }

    // Waterfall: Выручка → Чистая прибыль
    const fixedRow = getRow(rows, 'fixed_expenses');
    const otherRow = getRow(rows, 'other_income_expense');
    const waterfall: IWaterfallItem[] = [
      { name: 'Выручка', value: kpis.revenueFact },
      { name: 'Материалы', value: -((getRow(rows, 'cost_materials')?.fact_total as number) || 0) },
      { name: 'ФОТ', value: -((getRow(rows, 'cost_labor')?.fact_total as number) || 0) },
      { name: 'Субподряд', value: -((getRow(rows, 'cost_subcontract')?.fact_total as number) || 0) },
      { name: 'Проектные', value: -((getRow(rows, 'cost_design')?.fact_total as number) || 0) },
      { name: 'Аренда', value: -((getRow(rows, 'cost_rental')?.fact_total as number) || 0) },
      { name: 'Накладные', value: -((getRow(rows, 'cost_overhead')?.fact_total as number) || 0) },
      { name: 'Пост. расходы', value: -((fixedRow?.fact_total as number) || 0) },
      { name: 'Прочие', value: (otherRow?.fact_total as number) || 0 },
      { name: 'Чистая прибыль', value: kpis.netProfit },
    ];

    // Gauge — маржинальность
    const marginPercent = kpis.revenueFact
      ? (kpis.marginalProfit / kpis.revenueFact) * 100
      : 0;

    // Revenue by month (план vs факт)
    const revenueByMonth: IMonthDataPoint[] = [];
    for (const m of MONTHS) {
      revenueByMonth.push({ month: m.short, value: getMonthVal(revenueRow, m.key, 'plan'), type: 'План' });
      revenueByMonth.push({ month: m.short, value: getMonthVal(revenueRow, m.key, 'fact'), type: 'Факт' });
    }

    return { kpis, scurve, costStructure, waterfall, marginPercent, revenueByMonth };
  }, [bdr.rows, bdr.loading]);

  const bddsData = useMemo((): IBddsDashboardData | null => {
    if (bdds.loading || !bdds.sections.length) return null;
    const { sections } = bdds;

    // KPIs — ЧДП по секциям
    const getNcf = (code: SectionCode) => {
      const section = sections.find((s) => s.sectionCode === code);
      const ncfRow = section?.rows.find((r) => r.isCalculated);
      return ncfRow?.factTotal || 0;
    };

    const ncfOp = getNcf('operating');
    const ncfInv = getNcf('investing');
    const ncfFin = getNcf('financing');

    // План/факт поступлений (operating income)
    const operatingSection = sections.find((s) => s.sectionCode === 'operating');
    const incomeRows = operatingSection?.rows.filter((r) => r.rowType === 'income' && !r.isCalculated) || [];

    const planFactIncome: IMonthDataPoint[] = [];
    let planTotal = 0;
    let factTotal = 0;
    for (const m of MONTHS) {
      let planSum = 0;
      let factSum = 0;
      for (const row of incomeRows) {
        planSum += row.months[m.key] || 0;
        factSum += row.factMonths[m.key] || 0;
      }
      planTotal += planSum;
      factTotal += factSum;
      planFactIncome.push({ month: m.short, value: planSum, type: 'План' });
      planFactIncome.push({ month: m.short, value: factSum, type: 'Факт' });
    }

    // ЧДП по секциям по месяцам
    const ncfBySection: IMonthDataPoint[] = [];
    for (const m of MONTHS) {
      for (const section of sections) {
        const ncfRow = section.rows.find((r) => r.isCalculated);
        ncfBySection.push({
          month: m.short,
          value: ncfRow?.factMonths[m.key] || 0,
          type: SECTION_NAMES[section.sectionCode],
        });
      }
    }

    return {
      planFactIncome,
      ncfBySection,
      kpis: {
        ncfOperating: ncfOp,
        ncfInvesting: ncfInv,
        ncfFinancing: ncfFin,
        ncfTotal: ncfOp + ncfInv + ncfFin,
        planIncomeTotal: planTotal,
        factIncomeTotal: factTotal,
      },
    };
  }, [bdds.sections, bdds.loading]);

  return {
    bdrData,
    bddsData,
    loading: bdr.loading || bdds.loading,
    error: bdr.error || bdds.error,
  };
}
