import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { BblTableRow, BblEntryType, MonthValues, IBblHealthMetrics } from '../types/bbl';
import type { YearMonthSlot } from '../utils/constants';
import * as bblService from '../services/bblService';
import * as bdrService from '../services/bdrService';
import * as bddsIncomeService from '../services/bddsIncomeService';
import * as receiptService from '../services/bddsReceiptService';
import * as actualExecutionService from '../services/actualExecutionService';
import { useBdds } from './useBdds';
import { BBL_ROWS, BBL_MANUAL_CODES } from '../utils/bblConstants';
import { MONTHS, buildYearMonthSlots } from '../utils/constants';

type EntryMap = Map<string, MonthValues>;

interface ILinkedData {
  /** БДДС: остатки на конец (план) */
  bddsCloseRsPlan: MonthValues;
  bddsCloseObsPlan: MonthValues;
  bddsCloseRsFact: MonthValues;
  bddsCloseObsFact: MonthValues;
  /** БДР: выручка КС-2 с заказчиком (plan/fact) */
  revenuePlan: MonthValues;
  revenueFact: MonthValues;
  /** БДР: выполнение КС-2 внутренняя (plan/fact) */
  executionPlan: MonthValues;
  executionFact: MonthValues;
  /** БДР: расходы себестоимость (plan/fact) */
  costPlan: MonthValues;
  costFact: MonthValues;
  /** БДДС: поступления от заказчика (plan/fact) */
  incomePlan: MonthValues;
  incomeFact: MonthValues;
  /** БДДС: расходные оплаты (plan/fact) */
  expensePlan: MonthValues;
  expenseFact: MonthValues;
  /** БДР: чистая прибыль (plan/fact) */
  netProfitPlan: MonthValues;
  netProfitFact: MonthValues;
  /** БДДС: дивиденды (plan/fact) */
  dividendsPlan: MonthValues;
  dividendsFact: MonthValues;
}

interface IUseBblResult {
  rows: BblTableRow[];
  yearRows: Map<number, BblTableRow[]>;
  yearMonthSlots: YearMonthSlot[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateEntry: (rowCode: string, month: number, amount: number, type: BblEntryType) => void;
  saveAll: () => Promise<void>;
  healthMetrics: IBblHealthMetrics;
}

export function useBbl(yearFrom: number, yearTo: number, projectId: string | null = null): IUseBblResult {
  const [yearDataMap, setYearDataMap] = useState<Map<number, { planMap: EntryMap; factMap: EntryMap; linked: ILinkedData }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirtyRef = useRef<Set<string>>(new Set());
  const yearMonthSlots = useMemo(() => buildYearMonthSlots(yearFrom, yearTo), [yearFrom, yearTo]);

  // Используем useBdds для получения остатков
  const { yearSections: bddsYearSections } = useBdds(yearFrom, yearTo, projectId);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      dirtyRef.current.clear();

      const pid = projectId || undefined;
      const years: number[] = [];
      for (let y = yearFrom; y <= yearTo; y++) years.push(y);

      const newYearData = new Map<number, { planMap: EntryMap; factMap: EntryMap; linked: ILinkedData }>();

      for (const yr of years) {
        // Загружаем данные ББЛ
        const [planEntries, factEntries] = await Promise.all([
          bblService.getEntries(yr, 'plan', pid),
          bblService.getEntries(yr, 'fact', pid),
        ]);

        const planMap: EntryMap = new Map();
        const factMap: EntryMap = new Map();

        for (const e of planEntries) {
          if (!planMap.has(e.row_code)) planMap.set(e.row_code, {});
          const m = planMap.get(e.row_code)!;
          m[e.month] = (m[e.month] || 0) + Number(e.amount);
        }

        for (const e of factEntries) {
          if (!factMap.has(e.row_code)) factMap.set(e.row_code, {});
          const m = factMap.get(e.row_code)!;
          m[e.month] = (m[e.month] || 0) + Number(e.amount);
        }

        // Загружаем связанные данные из БДР и БДДС
        const [bdrPlan, bdrFact, smr, actTotals, incomeTotals, receiptFacts] = await Promise.all([
          bdrService.getEntries(yr, 'plan', pid),
          bdrService.getEntries(yr, 'fact', pid),
          bdrService.getSmrTotalsByMonth(yr, pid),
          actualExecutionService.getAggregatedTotals(yr, pid),
          bddsIncomeService.getIncomeTotalsByMonth(yr, pid),
          receiptService.getReceiptFactTotals(yr, pid),
        ]);

        // BDR row values
        const bdrPlanMap: EntryMap = new Map();
        const bdrFactMap: EntryMap = new Map();
        for (const e of bdrPlan) {
          if (!bdrPlanMap.has(e.row_code)) bdrPlanMap.set(e.row_code, {});
          bdrPlanMap.get(e.row_code)![e.month] = (bdrPlanMap.get(e.row_code)![e.month] || 0) + Number(e.amount);
        }
        for (const e of bdrFact) {
          if (!bdrFactMap.has(e.row_code)) bdrFactMap.set(e.row_code, {});
          bdrFactMap.get(e.row_code)![e.month] = (bdrFactMap.get(e.row_code)![e.month] || 0) + Number(e.amount);
        }

        // Извлекаем из БДДС секций остатки на конец
        const bddsSections = bddsYearSections.get(yr) ?? [];
        const operatingSection = bddsSections.find((s) => s.sectionCode === 'operating');
        const balClose = operatingSection?.rows.find((r) => r.rowType === 'balance_close');
        const rsClose = balClose?.children?.find((c) => c.name.includes('расчётных счетах'));
        const obsClose = balClose?.children?.find((c) => c.name.includes('ОБС'));

        // Расходные оплаты из БДДС (expense)
        const expenseRow = operatingSection?.rows.find((r) => r.rowType === 'expense');
        const overheadRow = operatingSection?.rows.find((r) => r.rowType === 'overhead');

        // Суммируем receipt facts для incomeFact
        const totalReceiptFact: MonthValues = {};
        for (const [, months] of receiptFacts) {
          for (const [month, amount] of Object.entries(months)) {
            totalReceiptFact[Number(month)] = (totalReceiptFact[Number(month)] || 0) + amount;
          }
        }

        // Выручка план = SMR без НДС, факт = КС из actual_execution
        const revenuePlan: MonthValues = smr.withoutVat;
        const revenueFact: MonthValues = actTotals.withoutVat.ks;

        // Выполнение: plan = revenue, fact = actual execution
        const executionPlan: MonthValues = { ...revenuePlan };
        const executionFact: MonthValues = actTotals.withoutVat.fact;

        // Себестоимость (cost_total из БДР)
        const costPlan: MonthValues = {};
        const costFact: MonthValues = {};
        const costCodes = ['cost_materials', 'cost_labor', 'cost_subcontract', 'cost_design', 'cost_rental'];
        for (const m of MONTHS) {
          costPlan[m.key] = costCodes.reduce((sum, c) => sum + (bdrPlanMap.get(c)?.[m.key] || 0), 0);
          costFact[m.key] = costCodes.reduce((sum, c) => sum + (bdrFactMap.get(c)?.[m.key] || 0), 0);
        }

        // Чистая прибыль
        const netProfitPlan = bdrPlanMap.get('net_profit') || {};
        const netProfitFact = bdrFactMap.get('net_profit') || {};

        // Дивиденды
        const dividendsPlan = bdrPlanMap.get('dividends') || {};
        const dividendsFact = bdrFactMap.get('dividends') || {};

        // Расходные оплаты БДДС
        const expensePlanM: MonthValues = {};
        const expenseFactM: MonthValues = {};
        if (expenseRow) {
          for (const m of MONTHS) {
            expensePlanM[m.key] = (expenseRow.months[m.key] || 0) + (overheadRow?.months[m.key] || 0);
            expenseFactM[m.key] = (expenseRow.factMonths[m.key] || 0) + (overheadRow?.factMonths[m.key] || 0);
          }
        }

        const linked: ILinkedData = {
          bddsCloseRsPlan: {},
          bddsCloseObsPlan: {},
          bddsCloseRsFact: {},
          bddsCloseObsFact: {},
          revenuePlan,
          revenueFact,
          executionPlan,
          executionFact,
          costPlan,
          costFact,
          incomePlan: incomeTotals,
          incomeFact: totalReceiptFact,
          expensePlan: expensePlanM,
          expenseFact: expenseFactM,
          netProfitPlan,
          netProfitFact,
          dividendsPlan,
          dividendsFact,
        };

        // Заполняем БДДС остатки
        for (const m of MONTHS) {
          linked.bddsCloseRsPlan[m.key] = rsClose?.months[m.key] || 0;
          linked.bddsCloseObsPlan[m.key] = obsClose?.months[m.key] || 0;
          linked.bddsCloseRsFact[m.key] = rsClose?.factMonths[m.key] || 0;
          linked.bddsCloseObsFact[m.key] = obsClose?.factMonths[m.key] || 0;
        }

        newYearData.set(yr, { planMap, factMap, linked });
      }

      setYearDataMap(newYearData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [yearFrom, yearTo, projectId, bddsYearSections]);

  useEffect(() => {
    // Ждём загрузки БДДС данных
    if (bddsYearSections.size === 0) return;
    loadData();
  }, [loadData, bddsYearSections.size]);

  const buildRowsForYear = useCallback(
    (planMap: EntryMap, factMap: EntryMap, linked: ILinkedData): BblTableRow[] => {
      const getVal = (code: string, month: number, type: 'plan' | 'fact'): number => {
        const map = type === 'plan' ? planMap : factMap;
        return map.get(code)?.[month] || 0;
      };

      const calcMonthVal = (code: string, month: number, type: 'plan' | 'fact'): number => {
        switch (code) {
          // Денежные средства из БДДС
          case 'cash_rs':
            return type === 'plan' ? (linked.bddsCloseRsPlan[month] || 0) : (linked.bddsCloseRsFact[month] || 0);
          case 'cash_obs':
            return type === 'plan' ? (linked.bddsCloseObsPlan[month] || 0) : (linked.bddsCloseObsFact[month] || 0);
          case 'cash_total':
            return calcMonthVal('cash_rs', month, type) + calcMonthVal('cash_obs', month, type);

          // Дебиторка: входящее + КС-2 (БДР revenue) - поступления (БДДС income)
          case 'receivables': {
            const opening = getVal('receivables', month, type);
            const revenue = type === 'plan' ? (linked.revenuePlan[month] || 0) : (linked.revenueFact[month] || 0);
            const income = type === 'plan' ? (linked.incomePlan[month] || 0) : (linked.incomeFact[month] || 0);
            return opening + revenue - income;
          }

          // НЗП: нарастающий (выполнение - КС-2)
          case 'inventory_wip': {
            const exec = type === 'plan' ? (linked.executionPlan[month] || 0) : (linked.executionFact[month] || 0);
            const rev = type === 'plan' ? (linked.revenuePlan[month] || 0) : (linked.revenueFact[month] || 0);
            // Текущий месяц + входящее ручное
            const opening = getVal('inventory_wip', month, type);
            return opening + exec - rev;
          }

          // Кредиторка: входящее + расходы (БДР) - оплаты (БДДС)
          case 'payables': {
            const opening = getVal('payables', month, type);
            const costs = type === 'plan' ? (linked.costPlan[month] || 0) : (linked.costFact[month] || 0);
            const payments = type === 'plan' ? (linked.expensePlan[month] || 0) : (linked.expenseFact[month] || 0);
            return opening + costs - payments;
          }

          // Нераспр. прибыль: накопленная чистая прибыль - дивиденды
          case 'retained_earnings': {
            const np = type === 'plan' ? (linked.netProfitPlan[month] || 0) : (linked.netProfitFact[month] || 0);
            const div = type === 'plan' ? (linked.dividendsPlan[month] || 0) : (linked.dividendsFact[month] || 0);
            const opening = getVal('retained_earnings', month, type);
            return opening + np - div;
          }

          // Секционные итоги
          case 'noncurrent_total':
            return getVal('fixed_assets', month, type)
              + getVal('intangible_assets', month, type)
              + getVal('other_noncurrent', month, type);

          case 'current_total':
            return calcMonthVal('cash_total', month, type)
              + calcMonthVal('receivables', month, type)
              + calcMonthVal('inventory_wip', month, type)
              + getVal('prepaid_expenses', month, type)
              + getVal('other_current_assets', month, type);

          case 'total_assets':
            return calcMonthVal('noncurrent_total', month, type)
              + calcMonthVal('current_total', month, type);

          case 'current_liabilities_total':
            return calcMonthVal('payables', month, type)
              + getVal('advances_received', month, type)
              + getVal('short_term_loans', month, type)
              + getVal('current_lt_debt', month, type)
              + getVal('other_current_liabilities', month, type);

          case 'lt_liabilities_total':
            return getVal('long_term_loans', month, type)
              + getVal('other_lt_liabilities', month, type);

          case 'equity_total':
            return getVal('share_capital', month, type)
              + calcMonthVal('retained_earnings', month, type)
              + getVal('reserve_capital', month, type);

          case 'total_liabilities_equity':
            return calcMonthVal('current_liabilities_total', month, type)
              + calcMonthVal('lt_liabilities_total', month, type)
              + calcMonthVal('equity_total', month, type);

          case 'balance_check':
            return calcMonthVal('total_assets', month, type)
              - calcMonthVal('total_liabilities_equity', month, type);

          default:
            return getVal(code, month, type);
        }
      };

      const result: BblTableRow[] = [];

      for (const def of BBL_ROWS) {
        const row: BblTableRow = {
          key: def.code,
          name: def.name,
          rowCode: def.code,
          isSectionHeader: def.isSectionHeader,
          isSemiBold: def.isSemiBold,
          isCalculated: def.isCalculated,
          isLinked: def.isLinked,
          linkedSource: def.linkedSource,
          isChild: def.isChild,
          isSectionTotal: def.isSectionTotal,
          isBalanceCheck: def.isBalanceCheck,
        };

        let planTotal = 0;
        let factTotal = 0;

        for (const m of MONTHS) {
          const planVal = def.isCalculated || def.isLinked
            ? calcMonthVal(def.code, m.key, 'plan')
            : getVal(def.code, m.key, 'plan');
          const factVal = def.isCalculated || def.isLinked
            ? calcMonthVal(def.code, m.key, 'fact')
            : getVal(def.code, m.key, 'fact');

          row[`plan_month_${m.key}`] = planVal;
          row[`fact_month_${m.key}`] = factVal;
          planTotal += planVal;
          factTotal += factVal;
        }

        row.plan_total = planTotal;
        row.fact_total = factTotal;
        result.push(row);
      }

      return result;
    },
    []
  );

  const yearRows = useMemo((): Map<number, BblTableRow[]> => {
    const map = new Map<number, BblTableRow[]>();
    for (const [yr, data] of yearDataMap) {
      map.set(yr, buildRowsForYear(data.planMap, data.factMap, data.linked));
    }
    return map;
  }, [yearDataMap, buildRowsForYear]);

  const rows = useMemo(() => yearRows.get(yearFrom) ?? [], [yearRows, yearFrom]);

  // Health metrics из последнего месяца с данными
  const healthMetrics = useMemo((): IBblHealthMetrics => {
    const lastYearRows = yearRows.get(yearTo) ?? [];
    const getRowLastMonthFact = (code: string): number => {
      const row = lastYearRows.find((r) => r.rowCode === code);
      if (!row) return 0;
      for (let m = 12; m >= 1; m--) {
        const v = (row[`fact_month_${m}`] as number) || 0;
        if (v) return v;
      }
      return 0;
    };

    const currentAssets = getRowLastMonthFact('current_total');
    const currentLiabilities = getRowLastMonthFact('current_liabilities_total');
    const totalAssets = getRowLastMonthFact('total_assets');
    const totalLE = getRowLastMonthFact('total_liabilities_equity');
    const shortLoans = getRowLastMonthFact('short_term_loans');
    const longLoans = getRowLastMonthFact('long_term_loans');
    const equity = getRowLastMonthFact('equity_total');
    const wip = getRowLastMonthFact('inventory_wip');

    return {
      nwc: currentAssets - currentLiabilities,
      currentRatio: currentLiabilities ? currentAssets / currentLiabilities : 0,
      debtToEquity: equity ? (shortLoans + longLoans) / equity : 0,
      wipShare: totalAssets ? (wip / totalAssets) * 100 : 0,
      totalAssets,
      totalLiabilitiesEquity: totalLE,
      balanceGap: totalAssets - totalLE,
    };
  }, [yearRows, yearTo]);

  const updateEntry = useCallback(
    (rowCode: string, month: number, amount: number, type: BblEntryType) => {
      dirtyRef.current.add(`${rowCode}_${month}_${type}`);

      setYearDataMap((prev) => {
        const next = new Map(prev);
        const data = next.get(yearFrom);
        if (!data) return prev;
        const map = type === 'plan' ? new Map(data.planMap) : new Map(data.factMap);
        const months = { ...(map.get(rowCode) || {}) };
        months[month] = amount;
        map.set(rowCode, months);
        next.set(yearFrom, {
          ...data,
          [type === 'plan' ? 'planMap' : 'factMap']: map,
        });
        return next;
      });
    },
    [yearFrom]
  );

  const saveAll = useCallback(async () => {
    try {
      setSaving(true);
      const entries: Array<{
        row_code: string;
        year: number;
        month: number;
        amount: number;
        entry_type: BblEntryType;
        project_id?: string;
      }> = [];

      const data = yearDataMap.get(yearFrom);
      if (!data) return;

      for (const code of BBL_MANUAL_CODES) {
        for (const m of MONTHS) {
          const planAmount = data.planMap.get(code)?.[m.key] || 0;
          const factAmount = data.factMap.get(code)?.[m.key] || 0;

          const base: { row_code: string; year: number; month: number; project_id?: string } = {
            row_code: code, year: yearFrom, month: m.key,
          };
          if (projectId) base.project_id = projectId;

          if (planAmount !== 0 || dirtyRef.current.has(`${code}_${m.key}_plan`)) {
            entries.push({ ...base, amount: planAmount, entry_type: 'plan' });
          }
          if (factAmount !== 0 || dirtyRef.current.has(`${code}_${m.key}_fact`)) {
            entries.push({ ...base, amount: factAmount, entry_type: 'fact' });
          }
        }
      }

      await bblService.upsertBatch(entries);
      dirtyRef.current.clear();
    } finally {
      setSaving(false);
    }
  }, [yearDataMap, yearFrom, projectId]);

  return {
    rows,
    yearRows,
    yearMonthSlots,
    loading,
    saving,
    error,
    updateEntry,
    saveAll,
    healthMetrics,
  };
}
