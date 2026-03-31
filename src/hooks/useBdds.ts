import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { BddsCategory, BddsSection, BddsRow, MonthValues } from '../types/bdds';
import * as bddsService from '../services/bddsService';
import * as bddsIncomeService from '../services/bddsIncomeService';
import * as bdrSubService from '../services/bdrSubService';
import * as receiptService from '../services/bddsReceiptService';
import { SECTION_ORDER, SECTION_NAMES, MONTHS, buildYearMonthSlots } from '../utils/constants';
import { BDR_SUB_TO_BDDS_NAME } from '../utils/bdrConstants';
import type { BdrSubType } from '../types/bdr';
import type { YearMonthSlot } from '../utils/constants';
import { calculateNetCashFlow, calculateRowTotal } from '../utils/calculations';

// Имена категорий для РП-зеркалирования
const RP_INCOME_NAME = 'Оплата по распред. письмам (РП)';
const RP_EXPENSE_NAME = 'Субподряд: оплата по РП';

// Имена категорий для разделения по типам счетов
const OBS_INCOME_NAME = 'Поступления от Заказчика на ОБС';
const BALANCE_OPEN_RS_NAME = 'Остаток на расчётных счетах (Свободный кэш)';
const BALANCE_OPEN_OBS_NAME = 'Остаток на ОБС (Заблокированный/Целевой кэш)';
const BALANCE_CLOSE_RS_NAME = 'Остаток на расчётных счетах на конец (Свободный кэш)';
const BALANCE_CLOSE_OBS_NAME = 'Остаток на ОБС на конец (Заблокированный/Целевой кэш)';

interface IUseBddsResult {
  sections: BddsSection[];
  yearSections: Map<number, BddsSection[]>;
  yearMonthSlots: YearMonthSlot[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  expandedParents: Set<string>;
  toggleParent: (categoryId: string) => void;
  updateFactEntry: (categoryId: string, month: number, amount: number) => void;
  saveAll: () => Promise<void>;
  /** Данные ликвидности для дашборда (текущий месяц, план+факт) */
  liquidity: { rsBalance: number; obsBalance: number; rsFact: number; obsFact: number };
}

export function useBdds(yearFrom: number, yearTo: number, projectId: string | null = null): IUseBddsResult {
  const [yearSections, setYearSections] = useState<Map<number, BddsSection[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  const categoriesRef = useRef<BddsCategory[]>([]);
  const dirtyFactRef = useRef<Set<string>>(new Set());

  const yearMonthSlots = useMemo(() => buildYearMonthSlots(yearFrom, yearTo), [yearFrom, yearTo]);

  const sections = useMemo(() => {
    return yearSections.get(yearFrom) ?? [];
  }, [yearSections, yearFrom]);

  // Ликвидность: из последнего месяца balance_close
  const liquidity = useMemo(() => {
    const secs = yearSections.get(yearTo) ?? [];
    const balClose = secs.find((s) => s.sectionCode === 'operating')
      ?.rows.find((r) => r.rowType === 'balance_close');
    if (!balClose?.children) return { rsBalance: 0, obsBalance: 0, rsFact: 0, obsFact: 0 };

    const rsChild = balClose.children.find((c) => c.name === BALANCE_CLOSE_RS_NAME);
    const obsChild = balClose.children.find((c) => c.name === BALANCE_CLOSE_OBS_NAME);

    // Берём последний месяц с данными (или декабрь)
    const lastMonth = 12;
    return {
      rsBalance: rsChild?.months[lastMonth] || 0,
      obsBalance: obsChild?.months[lastMonth] || 0,
      rsFact: rsChild?.factMonths[lastMonth] || 0,
      obsFact: obsChild?.factMonths[lastMonth] || 0,
    };
  }, [yearSections, yearTo]);

  const toggleParent = useCallback((categoryId: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const buildSections = useCallback(
    (
      categories: BddsCategory[],
      planMap: Map<string, MonthValues>,
      factMap: Map<string, MonthValues>,
      incomeTotals: MonthValues
    ): BddsSection[] => {
      // --- РП-зеркалирование ---
      const rpIncomeCat = categories.find((c) => c.name === RP_INCOME_NAME);
      const rpExpenseCat = categories.find((c) => c.name === RP_EXPENSE_NAME);
      if (rpIncomeCat && rpExpenseCat) {
        const rpPlan = planMap.get(rpIncomeCat.id) || {};
        const rpFact = factMap.get(rpIncomeCat.id) || {};
        // Зеркалируем в расходную строку
        if (!planMap.has(rpExpenseCat.id)) planMap.set(rpExpenseCat.id, {});
        if (!factMap.has(rpExpenseCat.id)) factMap.set(rpExpenseCat.id, {});
        const expPlan = planMap.get(rpExpenseCat.id)!;
        const expFact = factMap.get(rpExpenseCat.id)!;
        for (const m of MONTHS) {
          if (rpPlan[m.key]) expPlan[m.key] = rpPlan[m.key];
          if (rpFact[m.key]) expFact[m.key] = rpFact[m.key];
        }
      }

      // --- Разделяем категории: balance vs обычные ---
      const balanceOpenCats = categories.filter((c) => c.row_type === 'balance_open');
      const balanceCloseCats = categories.filter((c) => c.row_type === 'balance_close');
      const regularCats = categories.filter(
        (c) => c.row_type !== 'balance_open' && c.row_type !== 'balance_close'
      );

      // --- Построение обычных секций ---
      const builtSections = SECTION_ORDER.map((sectionCode) => {
        const sectionCategories = regularCats
          .filter((c) => c.section_code === sectionCode)
          .sort((a, b) => a.sort_order - b.sort_order);

        const parentCats = sectionCategories.filter((c) => !c.parent_id);
        const childCats = sectionCategories.filter((c) => c.parent_id);

        const rows: BddsRow[] = parentCats.map((cat) => {
          let planMonths = planMap.get(cat.id) || {};
          const factMonths = factMap.get(cat.id) || {};

          if (sectionCode === 'operating' && cat.row_type === 'income' && !cat.is_calculated) {
            planMonths = { ...incomeTotals };
          }

          const catChildren = childCats.filter((c) => c.parent_id === cat.id);
          let children: BddsRow[] | undefined;

          if (catChildren.length > 0) {
            children = catChildren.map((child, idx) => {
              let childPlan = planMap.get(child.id) || {};
              if (sectionCode === 'operating' && cat.row_type === 'income' && idx === 0) {
                childPlan = { ...incomeTotals };
              }
              return {
                categoryId: child.id,
                name: child.name,
                rowType: child.row_type,
                isCalculated: child.is_calculated,
                months: childPlan,
                total: calculateRowTotal(childPlan),
                factMonths: factMap.get(child.id) || {},
                factTotal: calculateRowTotal(factMap.get(child.id) || {}),
                parentId: child.parent_id,
              };
            });

            if (cat.calculation_formula === 'sum_children') {
              const sumPlan: MonthValues = {};
              const sumFact: MonthValues = {};
              for (const m of MONTHS) {
                sumPlan[m.key] = children.reduce((s, ch) => s + (ch.months[m.key] || 0), 0);
                sumFact[m.key] = children.reduce((s, ch) => s + (ch.factMonths[m.key] || 0), 0);
              }
              return {
                categoryId: cat.id,
                name: cat.name,
                rowType: cat.row_type,
                isCalculated: true,
                months: sumPlan,
                total: calculateRowTotal(sumPlan),
                factMonths: sumFact,
                factTotal: calculateRowTotal(sumFact),
                parentId: null,
                children,
              };
            }
          }

          return {
            categoryId: cat.id,
            name: cat.name,
            rowType: cat.row_type,
            isCalculated: cat.is_calculated,
            months: planMonths,
            total: calculateRowTotal(planMonths),
            factMonths,
            factTotal: calculateRowTotal(factMonths),
            parentId: null,
            children,
          };
        });

        const ncfRow = rows.find((r) => r.isCalculated && !r.children);
        if (ncfRow) {
          const dataRows = rows.filter((r) => !r.isCalculated || r.children);
          ncfRow.months = calculateNetCashFlow(sectionCode, dataRows);
          ncfRow.total = calculateRowTotal(ncfRow.months);

          const factDataRows: BddsRow[] = dataRows.map((r) => ({
            ...r,
            months: r.factMonths,
          }));
          ncfRow.factMonths = calculateNetCashFlow(sectionCode, factDataRows);
          ncfRow.factTotal = calculateRowTotal(ncfRow.factMonths);
        }

        return {
          sectionCode,
          sectionName: SECTION_NAMES[sectionCode],
          rows,
        };
      });

      // --- Построение balance-строк ---
      const buildBalanceRow = (
        cats: BddsCategory[],
        rowType: 'balance_open' | 'balance_close'
      ): BddsRow | null => {
        const parentCat = cats.find((c) => !c.parent_id);
        if (!parentCat) return null;

        const childCats = cats.filter((c) => c.parent_id === parentCat.id);
        const children: BddsRow[] = childCats.map((child) => ({
          categoryId: child.id,
          name: child.name,
          rowType,
          isCalculated: false,
          months: planMap.get(child.id) || {},
          total: calculateRowTotal(planMap.get(child.id) || {}),
          factMonths: factMap.get(child.id) || {},
          factTotal: calculateRowTotal(factMap.get(child.id) || {}),
          parentId: child.parent_id,
        }));

        const sumPlan: MonthValues = {};
        const sumFact: MonthValues = {};
        for (const m of MONTHS) {
          sumPlan[m.key] = children.reduce((s, ch) => s + (ch.months[m.key] || 0), 0);
          sumFact[m.key] = children.reduce((s, ch) => s + (ch.factMonths[m.key] || 0), 0);
        }

        return {
          categoryId: parentCat.id,
          name: parentCat.name,
          rowType,
          isCalculated: true,
          months: sumPlan,
          total: calculateRowTotal(sumPlan),
          factMonths: sumFact,
          factTotal: calculateRowTotal(sumFact),
          parentId: null,
          children,
        };
      };

      const balOpenRow = buildBalanceRow(balanceOpenCats, 'balance_open');
      const balCloseRow = buildBalanceRow(balanceCloseCats, 'balance_close');

      // --- Расчёт Остатка на конец ---
      // Остаток на конец[M] = Остаток на начало[M] + ΣЧДПвсех секций[M]
      if (balOpenRow && balCloseRow) {
        // Суммируем ЧДП всех секций
        const totalNcfPlan: MonthValues = {};
        const totalNcfFact: MonthValues = {};
        for (const sec of builtSections) {
          const ncf = sec.rows.find((r) => r.rowType === 'net_cash_flow');
          if (ncf) {
            for (const m of MONTHS) {
              totalNcfPlan[m.key] = (totalNcfPlan[m.key] || 0) + (ncf.months[m.key] || 0);
              totalNcfFact[m.key] = (totalNcfFact[m.key] || 0) + (ncf.factMonths[m.key] || 0);
            }
          }
        }

        // Расчёт итогового остатка на конец
        for (const m of MONTHS) {
          balCloseRow.months[m.key] = (balOpenRow.months[m.key] || 0) + (totalNcfPlan[m.key] || 0);
          balCloseRow.factMonths[m.key] = (balOpenRow.factMonths[m.key] || 0) + (totalNcfFact[m.key] || 0);
        }
        balCloseRow.total = calculateRowTotal(balCloseRow.months);
        balCloseRow.factTotal = calculateRowTotal(balCloseRow.factMonths);

        // Расчёт подстрок: ОБС и р/с
        // ОБС: поступления на ОБС минус (пока нет расходов с ОБС, = поступления ОБС)
        const obsCat = categories.find((c) => c.name === OBS_INCOME_NAME);
        const obsIncomePlan = obsCat ? (planMap.get(obsCat.id) || {}) : {};
        const obsIncomeFact = obsCat ? (factMap.get(obsCat.id) || {}) : {};

        if (balOpenRow.children && balCloseRow.children) {
          const openRs = balOpenRow.children.find((c) => c.name === BALANCE_OPEN_RS_NAME);
          const openObs = balOpenRow.children.find((c) => c.name === BALANCE_OPEN_OBS_NAME);
          const closeRs = balCloseRow.children.find((c) => c.name === BALANCE_CLOSE_RS_NAME);
          const closeObs = balCloseRow.children.find((c) => c.name === BALANCE_CLOSE_OBS_NAME);

          if (openObs && closeObs) {
            for (const m of MONTHS) {
              // ОБС конец = ОБС начало + поступления ОБС
              closeObs.months[m.key] = (openObs.months[m.key] || 0) + (obsIncomePlan[m.key] || 0);
              closeObs.factMonths[m.key] = (openObs.factMonths[m.key] || 0) + (obsIncomeFact[m.key] || 0);
            }
            closeObs.total = calculateRowTotal(closeObs.months);
            closeObs.factTotal = calculateRowTotal(closeObs.factMonths);
          }

          if (openRs && closeRs) {
            for (const m of MONTHS) {
              // р/с конец = Общий остаток конец — ОБС конец
              const obsEnd = closeObs?.months[m.key] || 0;
              const obsEndFact = closeObs?.factMonths[m.key] || 0;
              closeRs.months[m.key] = (balCloseRow.months[m.key] || 0) - obsEnd;
              closeRs.factMonths[m.key] = (balCloseRow.factMonths[m.key] || 0) - obsEndFact;
            }
            closeRs.total = calculateRowTotal(closeRs.months);
            closeRs.factTotal = calculateRowTotal(closeRs.factMonths);
          }
        }
      }

      // Вставляем balance-строки в operating секцию
      const operatingSection = builtSections.find((s) => s.sectionCode === 'operating');
      if (operatingSection) {
        if (balOpenRow) {
          operatingSection.rows.unshift(balOpenRow);
        }
        if (balCloseRow) {
          operatingSection.rows.push(balCloseRow);
        }
      }

      return builtSections;
    },
    []
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      dirtyFactRef.current.clear();

      const pid = projectId || undefined;
      const years: number[] = [];
      for (let y = yearFrom; y <= yearTo; y++) years.push(y);

      const categories = await bddsService.getCategories();
      categoriesRef.current = categories;

      const newYearSections = new Map<number, BddsSection[]>();

      const nameToId = new Map<string, string>();
      for (const cat of categories) {
        nameToId.set(cat.name, cat.id);
      }

      for (const yr of years) {
        const [planEntries, factEntries, yearIncomeTotals, bddsTotals, receiptFacts] = await Promise.all([
          bddsService.getEntries(yr, 'plan', pid),
          bddsService.getEntries(yr, 'fact', pid),
          bddsIncomeService.getIncomeTotalsByMonth(yr, pid),
          bdrSubService.getSubTotalsForBdds(yr, pid),
          receiptService.getReceiptFactTotals(yr, pid),
        ]);

        const planMap = new Map<string, MonthValues>();
        const factMap = new Map<string, MonthValues>();

        for (const entry of planEntries) {
          if (!planMap.has(entry.category_id)) planMap.set(entry.category_id, {});
          const m = planMap.get(entry.category_id)!;
          m[entry.month] = (m[entry.month] || 0) + Number(entry.amount);
        }

        for (const entry of factEntries) {
          if (!factMap.has(entry.category_id)) factMap.set(entry.category_id, {});
          const m = factMap.get(entry.category_id)!;
          m[entry.month] = (m[entry.month] || 0) + Number(entry.amount);
        }

        for (const [catId, months] of receiptFacts) {
          if (!factMap.has(catId)) factMap.set(catId, {});
          const m = factMap.get(catId)!;
          for (const [month, amount] of Object.entries(months)) {
            m[Number(month)] = (m[Number(month)] || 0) + amount;
          }
        }

        for (const [subType, months] of Object.entries(bddsTotals)) {
          const bddsName = BDR_SUB_TO_BDDS_NAME[subType as BdrSubType];
          if (!bddsName) continue;
          const catId = nameToId.get(bddsName);
          if (!catId) continue;

          if (!planMap.has(catId)) planMap.set(catId, {});
          const m = planMap.get(catId)!;
          for (const [month, amount] of Object.entries(months)) {
            m[Number(month)] = (m[Number(month)] || 0) + amount;
          }
        }

        newYearSections.set(yr, buildSections(categories, planMap, factMap, yearIncomeTotals));
      }

      setYearSections(newYearSections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [yearFrom, yearTo, projectId, buildSections]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateFactEntry = useCallback(
    (categoryId: string, month: number, amount: number) => {
      dirtyFactRef.current.add(`${categoryId}_${month}`);

      setYearSections((prev) => {
        const next = new Map(prev);
        const secs = next.get(yearFrom);
        if (!secs) return prev;

        const updated = secs.map((section) => {
          const hasCategory = section.rows.some(
            (r) => r.categoryId === categoryId || r.children?.some((ch) => ch.categoryId === categoryId)
          );
          if (!hasCategory) return section;

          const updatedRows = section.rows.map((row) => {
            // Не редактируем balance-строки напрямую (кроме подстрок начала)
            if (row.rowType === 'balance_close') return row;

            if (row.children) {
              const hasChild = row.children.some((ch) => ch.categoryId === categoryId);
              if (hasChild) {
                const updatedChildren = row.children.map((ch) => {
                  if (ch.categoryId !== categoryId) return ch;
                  const newFactMonths = { ...ch.factMonths, [month]: amount };
                  return {
                    ...ch,
                    factMonths: newFactMonths,
                    factTotal: calculateRowTotal(newFactMonths),
                  };
                });

                const sumFact: MonthValues = {};
                const sumPlan: MonthValues = {};
                for (const m of MONTHS) {
                  sumFact[m.key] = updatedChildren.reduce((s, ch) => s + (ch.factMonths[m.key] || 0), 0);
                  sumPlan[m.key] = updatedChildren.reduce((s, ch) => s + (ch.months[m.key] || 0), 0);
                }

                return {
                  ...row,
                  children: updatedChildren,
                  months: sumPlan,
                  total: calculateRowTotal(sumPlan),
                  factMonths: sumFact,
                  factTotal: calculateRowTotal(sumFact),
                };
              }
            }

            if (row.categoryId !== categoryId || row.isCalculated) return row;
            const newFactMonths = { ...row.factMonths, [month]: amount };
            return {
              ...row,
              factMonths: newFactMonths,
              factTotal: calculateRowTotal(newFactMonths),
            };
          });

          // Пересчитываем NCF
          const ncfRow = updatedRows.find((r) => r.rowType === 'net_cash_flow');
          if (ncfRow) {
            const dataRows = updatedRows.filter(
              (r) => (r.rowType !== 'net_cash_flow' && r.rowType !== 'balance_open' && r.rowType !== 'balance_close') || r.children
            ).filter((r) => r.rowType === 'income' || r.rowType === 'expense' || r.rowType === 'overhead');
            const factDataRows: BddsRow[] = dataRows.map((r) => ({
              ...r,
              months: r.factMonths,
            }));
            ncfRow.factMonths = calculateNetCashFlow(section.sectionCode, factDataRows);
            ncfRow.factTotal = calculateRowTotal(ncfRow.factMonths);
          }

          // Пересчитываем balance_close после NCF
          const balOpen = updatedRows.find((r) => r.rowType === 'balance_open');
          const balClose = updatedRows.find((r) => r.rowType === 'balance_close');
          if (balOpen && balClose && ncfRow) {
            for (const m of MONTHS) {
              balClose.factMonths[m.key] = (balOpen.factMonths[m.key] || 0) + (ncfRow.factMonths[m.key] || 0);
            }
            balClose.factTotal = calculateRowTotal(balClose.factMonths);
          }

          return { ...section, rows: [...updatedRows] };
        });

        next.set(yearFrom, updated);
        return next;
      });
    },
    [yearFrom]
  );

  const saveAll = useCallback(async () => {
    try {
      setSaving(true);
      const entries: Array<{
        category_id: string;
        year: number;
        month: number;
        amount: number;
        entry_type: 'fact';
        project_id?: string;
      }> = [];

      const secs = yearSections.get(yearFrom) ?? [];
      for (const section of secs) {
        for (const row of section.rows) {
          // Пропускаем balance_close (вычисляемый)
          if (row.rowType === 'balance_close') continue;

          const rowsToSave = row.children ? row.children : (row.isCalculated ? [] : [row]);
          for (const r of rowsToSave) {
            if (r.isCalculated) continue;
            for (const m of MONTHS) {
              const amount = r.factMonths[m.key] || 0;
              if (amount !== 0 || dirtyFactRef.current.has(`${r.categoryId}_${m.key}`)) {
                const entry: typeof entries[number] = {
                  category_id: r.categoryId,
                  year: yearFrom,
                  month: m.key,
                  amount,
                  entry_type: 'fact',
                };
                if (projectId) entry.project_id = projectId;
                entries.push(entry);
              }
            }
          }
        }
      }

      await bddsService.upsertBatch(entries);
      dirtyFactRef.current.clear();
    } finally {
      setSaving(false);
    }
  }, [yearSections, yearFrom, projectId]);

  return { sections, yearSections, yearMonthSlots, loading, saving, error, expandedParents, toggleParent, updateFactEntry, saveAll, liquidity };
}
