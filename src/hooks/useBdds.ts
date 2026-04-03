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

// Имена для KPI
const ADVANCE_INCOME_RS_NAME = 'Авансы от Заказчика (на обычный р/с)';
const ADVANCE_SUB_NAME = 'Авансы субподрядчикам';
const MATERIALS_NAME = 'Материальные расходы (Закупка материалов)';
const GU_RETURN_NAME = 'Возврат гарантийных удержаний от Заказчика';
const GU_SUB_NAME = 'Гарантийные удержания субподрядчикам';
const PAYMENT_FROM_CUSTOMER_NAME = 'Оплата от Заказчика за выполненные работы (на обычный р/с)';

export interface IBddsKpiMetrics {
  rsBalance: number;
  obsBalance: number;
  rsFact: number;
  obsFact: number;
  /** Коэффициент покрытия авансов: авансы от заказчика / (материалы + субподряд авансы) */
  advanceCoverageRatio: number | null;
  /** Баланс гарантийных удержаний: возврат ГУ от заказчика — ГУ субподрядчикам */
  retentionGap: number;
  /** Месяцы, в которых плановый остаток р/с < 0 (кассовый разрыв) */
  cashGapMonths: number[];
  /** Факт поступлений от заказчика за работы (для BG-алерта) */
  customerPaymentFact: MonthValues;
  /** Остаток на ОБС по месяцам (для Profit Sweeping) */
  obsCloseByMonth: MonthValues;
  /** Остаток р/с по месяцам (для OBS Check) */
  rsCloseByMonth: MonthValues;
}

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
  liquidity: IBddsKpiMetrics;
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

  // Ликвидность + KPI метрики
  const liquidity = useMemo((): IBddsKpiMetrics => {
    const empty: IBddsKpiMetrics = {
      rsBalance: 0, obsBalance: 0, rsFact: 0, obsFact: 0,
      advanceCoverageRatio: null, retentionGap: 0, cashGapMonths: [],
      customerPaymentFact: {}, obsCloseByMonth: {}, rsCloseByMonth: {},
    };
    const secs = yearSections.get(yearTo) ?? [];
    const opSec = secs.find((s) => s.sectionCode === 'operating');
    if (!opSec) return empty;

    const balClose = opSec.rows.find((r) => r.rowType === 'balance_close');
    if (!balClose?.children) return empty;

    const rsChild = balClose.children.find((c) => c.name === BALANCE_CLOSE_RS_NAME);
    const obsChild = balClose.children.find((c) => c.name === BALANCE_CLOSE_OBS_NAME);

    const lastMonth = 12;

    // --- Поиск строк для KPI ---
    const findChildRow = (name: string): BddsRow | undefined => {
      for (const row of opSec.rows) {
        if (row.children) {
          const found = row.children.find((ch) => ch.name === name);
          if (found) return found;
        }
        if (row.name === name) return row;
      }
      return undefined;
    };

    // Покрытие авансов
    const advanceRs = findChildRow(ADVANCE_INCOME_RS_NAME);
    const advanceObs = findChildRow(OBS_INCOME_NAME);
    const materials = findChildRow(MATERIALS_NAME);
    const subAdv = findChildRow(ADVANCE_SUB_NAME);

    const advanceIn = (advanceRs ? calculateRowTotal(advanceRs.factMonths) || calculateRowTotal(advanceRs.months) : 0)
      + (advanceObs ? calculateRowTotal(advanceObs.factMonths) || calculateRowTotal(advanceObs.months) : 0);
    const advanceOut = (materials ? calculateRowTotal(materials.factMonths) || calculateRowTotal(materials.months) : 0)
      + (subAdv ? calculateRowTotal(subAdv.factMonths) || calculateRowTotal(subAdv.months) : 0);

    const advanceCoverageRatio = advanceOut > 0 ? advanceIn / advanceOut : null;

    // Retention Gap
    const guReturn = findChildRow(GU_RETURN_NAME);
    const guSub = findChildRow(GU_SUB_NAME);
    const retentionGap = (guReturn ? calculateRowTotal(guReturn.factMonths) || calculateRowTotal(guReturn.months) : 0)
      - (guSub ? calculateRowTotal(guSub.factMonths) || calculateRowTotal(guSub.months) : 0);

    // Кассовый разрыв: плановые месяцы, где р/с < 0
    const cashGapMonths: number[] = [];
    const rsCloseByMonth: MonthValues = {};
    const obsCloseByMonth: MonthValues = {};
    for (const m of MONTHS) {
      const rsVal = rsChild?.months[m.key] || 0;
      rsCloseByMonth[m.key] = rsVal;
      obsCloseByMonth[m.key] = obsChild?.months[m.key] || 0;
      if (rsVal < 0) cashGapMonths.push(m.key);
    }

    // Факт оплаты от заказчика (для BG-алерта)
    const customerPayment = findChildRow(PAYMENT_FROM_CUSTOMER_NAME);
    const customerPaymentFact: MonthValues = customerPayment?.factMonths || {};

    return {
      rsBalance: rsChild?.months[lastMonth] || 0,
      obsBalance: obsChild?.months[lastMonth] || 0,
      rsFact: rsChild?.factMonths[lastMonth] || 0,
      obsFact: obsChild?.factMonths[lastMonth] || 0,
      advanceCoverageRatio,
      retentionGap,
      cashGapMonths,
      customerPaymentFact,
      obsCloseByMonth,
      rsCloseByMonth,
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

      // --- Rolling Balance: переходящие остатки ---
      // balOpen[1] = из БД; balOpen[M] = balClose[M-1] (для M > 1)
      // balClose[M] = balOpen[M] + ΣЧДПвсех секций[M]
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

        // ОБС: поступления для расчёта подстрок
        const obsCat = categories.find((c) => c.name === OBS_INCOME_NAME);
        const obsIncomePlan = obsCat ? (planMap.get(obsCat.id) || {}) : {};
        const obsIncomeFact = obsCat ? (factMap.get(obsCat.id) || {}) : {};

        const openRs = balOpenRow.children?.find((c) => c.name === BALANCE_OPEN_RS_NAME);
        const openObs = balOpenRow.children?.find((c) => c.name === BALANCE_OPEN_OBS_NAME);
        const closeRs = balCloseRow.children?.find((c) => c.name === BALANCE_CLOSE_RS_NAME);
        const closeObs = balCloseRow.children?.find((c) => c.name === BALANCE_CLOSE_OBS_NAME);

        // Последовательный расчёт по месяцам (rolling)
        for (const m of MONTHS) {
          if (m.key > 1) {
            // Переходящий остаток: начало[M] = конец[M-1]
            balOpenRow.months[m.key] = balCloseRow.months[m.key - 1] || 0;
            balOpenRow.factMonths[m.key] = balCloseRow.factMonths[m.key - 1] || 0;

            // Подстроки: ОБС и р/с начало
            if (openObs && closeObs) {
              openObs.months[m.key] = closeObs.months[m.key - 1] || 0;
              openObs.factMonths[m.key] = closeObs.factMonths[m.key - 1] || 0;
            }
            if (openRs && closeRs) {
              openRs.months[m.key] = closeRs.months[m.key - 1] || 0;
              openRs.factMonths[m.key] = closeRs.factMonths[m.key - 1] || 0;
            }
          }

          // Остаток на конец = Остаток на начало + ЧДП
          balCloseRow.months[m.key] = (balOpenRow.months[m.key] || 0) + (totalNcfPlan[m.key] || 0);
          balCloseRow.factMonths[m.key] = (balOpenRow.factMonths[m.key] || 0) + (totalNcfFact[m.key] || 0);

          // ОБС конец = ОБС начало + поступления ОБС
          if (openObs && closeObs) {
            closeObs.months[m.key] = (openObs.months[m.key] || 0) + (obsIncomePlan[m.key] || 0);
            closeObs.factMonths[m.key] = (openObs.factMonths[m.key] || 0) + (obsIncomeFact[m.key] || 0);
          }

          // р/с конец = Общий конец — ОБС конец
          if (closeRs) {
            const obsEnd = closeObs?.months[m.key] || 0;
            const obsEndFact = closeObs?.factMonths[m.key] || 0;
            closeRs.months[m.key] = (balCloseRow.months[m.key] || 0) - obsEnd;
            closeRs.factMonths[m.key] = (balCloseRow.factMonths[m.key] || 0) - obsEndFact;
          }
        }

        // Пересчитываем итоги
        balOpenRow.total = calculateRowTotal(balOpenRow.months);
        balOpenRow.factTotal = calculateRowTotal(balOpenRow.factMonths);
        balCloseRow.total = calculateRowTotal(balCloseRow.months);
        balCloseRow.factTotal = calculateRowTotal(balCloseRow.factMonths);

        if (openRs) { openRs.total = calculateRowTotal(openRs.months); openRs.factTotal = calculateRowTotal(openRs.factMonths); }
        if (openObs) { openObs.total = calculateRowTotal(openObs.months); openObs.factTotal = calculateRowTotal(openObs.factMonths); }
        if (closeRs) { closeRs.total = calculateRowTotal(closeRs.months); closeRs.factTotal = calculateRowTotal(closeRs.factMonths); }
        if (closeObs) { closeObs.total = calculateRowTotal(closeObs.months); closeObs.factTotal = calculateRowTotal(closeObs.factMonths); }
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

        // 1) Обновляем ячейку и пересчитываем NCF в каждой секции
        const updated = secs.map((section) => {
          const hasCategory = section.rows.some(
            (r) => r.categoryId === categoryId || r.children?.some((ch) => ch.categoryId === categoryId)
          );
          if (!hasCategory) return section;

          const updatedRows = section.rows.map((row) => {
            if (row.rowType === 'balance_close' || row.rowType === 'balance_open') return row;

            if (row.children) {
              const hasChild = row.children.some((ch) => ch.categoryId === categoryId);
              if (hasChild) {
                const updatedChildren = row.children.map((ch) => {
                  if (ch.categoryId !== categoryId) return ch;
                  const newFactMonths = { ...ch.factMonths, [month]: amount };
                  return { ...ch, factMonths: newFactMonths, factTotal: calculateRowTotal(newFactMonths) };
                });

                const sumFact: MonthValues = {};
                const sumPlan: MonthValues = {};
                for (const m of MONTHS) {
                  sumFact[m.key] = updatedChildren.reduce((s, ch) => s + (ch.factMonths[m.key] || 0), 0);
                  sumPlan[m.key] = updatedChildren.reduce((s, ch) => s + (ch.months[m.key] || 0), 0);
                }

                return {
                  ...row, children: updatedChildren,
                  months: sumPlan, total: calculateRowTotal(sumPlan),
                  factMonths: sumFact, factTotal: calculateRowTotal(sumFact),
                };
              }
            }

            if (row.categoryId !== categoryId || row.isCalculated) return row;
            const newFactMonths = { ...row.factMonths, [month]: amount };
            return { ...row, factMonths: newFactMonths, factTotal: calculateRowTotal(newFactMonths) };
          });

          // Пересчитываем NCF секции
          const ncfRow = updatedRows.find((r) => r.rowType === 'net_cash_flow');
          if (ncfRow) {
            const dataRows = updatedRows.filter(
              (r) => r.rowType === 'income' || r.rowType === 'expense' || r.rowType === 'overhead'
            );
            const factDataRows: BddsRow[] = dataRows.map((r) => ({ ...r, months: r.factMonths }));
            ncfRow.factMonths = calculateNetCashFlow(section.sectionCode, factDataRows);
            ncfRow.factTotal = calculateRowTotal(ncfRow.factMonths);
          }

          return { ...section, rows: [...updatedRows] };
        });

        // 2) Пересчитываем rolling balance по ВСЕМ секциям
        const operatingSection = updated.find((s) => s.sectionCode === 'operating');
        if (operatingSection) {
          const balOpen = operatingSection.rows.find((r) => r.rowType === 'balance_open');
          const balClose = operatingSection.rows.find((r) => r.rowType === 'balance_close');

          if (balOpen && balClose) {
            // Суммируем ЧДП всех секций
            const totalNcfFact: MonthValues = {};
            for (const sec of updated) {
              const ncf = sec.rows.find((r) => r.rowType === 'net_cash_flow');
              if (ncf) {
                for (const m of MONTHS) {
                  totalNcfFact[m.key] = (totalNcfFact[m.key] || 0) + (ncf.factMonths[m.key] || 0);
                }
              }
            }

            const openObs = balOpen.children?.find((c) => c.name === BALANCE_OPEN_OBS_NAME);
            const openRs = balOpen.children?.find((c) => c.name === BALANCE_OPEN_RS_NAME);
            const closeObs = balClose.children?.find((c) => c.name === BALANCE_CLOSE_OBS_NAME);
            const closeRs = balClose.children?.find((c) => c.name === BALANCE_CLOSE_RS_NAME);

            // ОБС поступления
            const obsCat = categoriesRef.current.find((c) => c.name === OBS_INCOME_NAME);
            let obsIncomeFact: MonthValues = {};
            if (obsCat) {
              for (const sec of updated) {
                for (const r of sec.rows) {
                  const child = r.children?.find((ch) => ch.categoryId === obsCat.id);
                  if (child) { obsIncomeFact = child.factMonths; break; }
                }
              }
            }

            for (const m of MONTHS) {
              if (m.key > 1) {
                balOpen.factMonths[m.key] = balClose.factMonths[m.key - 1] || 0;
                if (openObs && closeObs) openObs.factMonths[m.key] = closeObs.factMonths[m.key - 1] || 0;
                if (openRs && closeRs) openRs.factMonths[m.key] = closeRs.factMonths[m.key - 1] || 0;
              }

              balClose.factMonths[m.key] = (balOpen.factMonths[m.key] || 0) + (totalNcfFact[m.key] || 0);

              if (openObs && closeObs) {
                closeObs.factMonths[m.key] = (openObs.factMonths[m.key] || 0) + (obsIncomeFact[m.key] || 0);
              }
              if (closeRs) {
                closeRs.factMonths[m.key] = (balClose.factMonths[m.key] || 0) - (closeObs?.factMonths[m.key] || 0);
              }
            }

            balOpen.factTotal = calculateRowTotal(balOpen.factMonths);
            balClose.factTotal = calculateRowTotal(balClose.factMonths);
            if (openRs) openRs.factTotal = calculateRowTotal(openRs.factMonths);
            if (openObs) openObs.factTotal = calculateRowTotal(openObs.factMonths);
            if (closeRs) closeRs.factTotal = calculateRowTotal(closeRs.factMonths);
            if (closeObs) closeObs.factTotal = calculateRowTotal(closeObs.factMonths);
          }
        }

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
