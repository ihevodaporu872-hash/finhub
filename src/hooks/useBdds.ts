import { useState, useEffect, useCallback, useRef } from 'react';
import type { BddsCategory, BddsSection, BddsRow, MonthValues } from '../types/bdds';
import * as bddsService from '../services/bddsService';
import * as bddsIncomeService from '../services/bddsIncomeService';
import { SECTION_ORDER, SECTION_NAMES, MONTHS } from '../utils/constants';
import { calculateNetCashFlow, calculateRowTotal } from '../utils/calculations';

interface UseBddsResult {
  sections: BddsSection[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateFactEntry: (categoryId: string, month: number, amount: number) => void;
  saveAll: () => Promise<void>;
}

export function useBdds(year: number): UseBddsResult {
  const [sections, setSections] = useState<BddsSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriesRef = useRef<BddsCategory[]>([]);
  const dirtyFactRef = useRef<Set<string>>(new Set());

  const buildSections = useCallback(
    (
      categories: BddsCategory[],
      planMap: Map<string, MonthValues>,
      factMap: Map<string, MonthValues>,
      incomeTotals: MonthValues
    ): BddsSection[] => {
      return SECTION_ORDER.map((sectionCode) => {
        const sectionCategories = categories
          .filter((c) => c.section_code === sectionCode)
          .sort((a, b) => a.sort_order - b.sort_order);

        const rows: BddsRow[] = sectionCategories.map((cat) => {
          let planMonths = planMap.get(cat.id) || {};
          let factMonths = factMap.get(cat.id) || {};

          // Автозаполнение план и факт для строки "доходы" из Income
          if (cat.row_type === 'income' && !cat.is_calculated) {
            planMonths = { ...incomeTotals };
            factMonths = { ...incomeTotals };
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
          };
        });

        // Рассчитать ЧДП (план и факт)
        const ncfRow = rows.find((r) => r.isCalculated);
        if (ncfRow) {
          const dataRows = rows.filter((r) => !r.isCalculated);
          ncfRow.months = calculateNetCashFlow(sectionCode, dataRows);
          ncfRow.total = calculateRowTotal(ncfRow.months);

          // ЧДП факт — рассчитать из факт-данных строк
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
    },
    []
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      dirtyFactRef.current.clear();

      const [categories, planEntries, factEntries, incomeTotals] = await Promise.all([
        bddsService.getCategories(),
        bddsService.getEntries(year, 'plan'),
        bddsService.getEntries(year, 'fact'),
        bddsIncomeService.getIncomeTotalsByMonth(year),
      ]);

      categoriesRef.current = categories;

      const planMap = new Map<string, MonthValues>();
      for (const entry of planEntries) {
        if (!planMap.has(entry.category_id)) {
          planMap.set(entry.category_id, {});
        }
        planMap.get(entry.category_id)![entry.month] = Number(entry.amount);
      }

      const factMap = new Map<string, MonthValues>();
      for (const entry of factEntries) {
        if (!factMap.has(entry.category_id)) {
          factMap.set(entry.category_id, {});
        }
        factMap.get(entry.category_id)![entry.month] = Number(entry.amount);
      }

      setSections(buildSections(categories, planMap, factMap, incomeTotals));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [year, buildSections]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateFactEntry = useCallback(
    (categoryId: string, month: number, amount: number) => {
      dirtyFactRef.current.add(`${categoryId}_${month}`);

      setSections((prev) =>
        prev.map((section) => {
          const hasCategory = section.rows.some((r) => r.categoryId === categoryId);
          if (!hasCategory) return section;

          const updatedRows = section.rows.map((row) => {
            if (row.categoryId !== categoryId || row.isCalculated) return row;
            const newFactMonths = { ...row.factMonths, [month]: amount };
            return {
              ...row,
              factMonths: newFactMonths,
              factTotal: calculateRowTotal(newFactMonths),
            };
          });

          // Пересчитать ЧДП факт
          const ncfRow = updatedRows.find((r) => r.isCalculated);
          if (ncfRow) {
            const dataRows = updatedRows.filter((r) => !r.isCalculated);
            const factDataRows: BddsRow[] = dataRows.map((r) => ({
              ...r,
              months: r.factMonths,
            }));
            ncfRow.factMonths = calculateNetCashFlow(section.sectionCode, factDataRows);
            ncfRow.factTotal = calculateRowTotal(ncfRow.factMonths);
          }

          return { ...section, rows: [...updatedRows] };
        })
      );
    },
    []
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
      }> = [];

      for (const section of sections) {
        for (const row of section.rows) {
          if (row.isCalculated) continue;
          for (const m of MONTHS) {
            const amount = row.factMonths[m.key] || 0;
            if (amount !== 0 || dirtyFactRef.current.has(`${row.categoryId}_${m.key}`)) {
              entries.push({
                category_id: row.categoryId,
                year,
                month: m.key,
                amount,
                entry_type: 'fact',
              });
            }
          }
        }
      }

      await bddsService.upsertBatch(entries);
      dirtyFactRef.current.clear();
    } finally {
      setSaving(false);
    }
  }, [sections, year]);

  return { sections, loading, saving, error, updateFactEntry, saveAll };
}
