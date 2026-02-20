import { useState, useEffect, useCallback, useRef } from 'react';
import type { BddsCategory, BddsSection, BddsRow, EntryType, MonthValues } from '../types/bdds';
import * as bddsService from '../services/bddsService';
import { SECTION_ORDER, SECTION_NAMES, MONTHS } from '../utils/constants';
import { calculateNetCashFlow, calculateRowTotal } from '../utils/calculations';

interface UseBddsResult {
  sections: BddsSection[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateEntry: (categoryId: string, month: number, amount: number) => void;
  saveAll: () => Promise<void>;
}

export function useBdds(year: number, entryType: EntryType): UseBddsResult {
  const [sections, setSections] = useState<BddsSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriesRef = useRef<BddsCategory[]>([]);
  const dirtyRef = useRef<Set<string>>(new Set());

  const buildSections = useCallback(
    (categories: BddsCategory[], entriesMap: Map<string, MonthValues>): BddsSection[] => {
      return SECTION_ORDER.map((sectionCode) => {
        const sectionCategories = categories
          .filter((c) => c.section_code === sectionCode)
          .sort((a, b) => a.sort_order - b.sort_order);

        const rows: BddsRow[] = sectionCategories.map((cat) => {
          const months = entriesMap.get(cat.id) || {};
          return {
            categoryId: cat.id,
            name: cat.name,
            rowType: cat.row_type,
            isCalculated: cat.is_calculated,
            months,
            total: calculateRowTotal(months),
          };
        });

        // Рассчитать ЧДП
        const ncfRow = rows.find((r) => r.isCalculated);
        if (ncfRow) {
          const dataRows = rows.filter((r) => !r.isCalculated);
          ncfRow.months = calculateNetCashFlow(sectionCode, dataRows);
          ncfRow.total = calculateRowTotal(ncfRow.months);
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
      dirtyRef.current.clear();

      const [categories, entries] = await Promise.all([
        bddsService.getCategories(),
        bddsService.getEntries(year, entryType),
      ]);

      categoriesRef.current = categories;

      const entriesMap = new Map<string, MonthValues>();
      for (const entry of entries) {
        if (!entriesMap.has(entry.category_id)) {
          entriesMap.set(entry.category_id, {});
        }
        entriesMap.get(entry.category_id)![entry.month] = Number(entry.amount);
      }

      setSections(buildSections(categories, entriesMap));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [year, entryType, buildSections]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateEntry = useCallback(
    (categoryId: string, month: number, amount: number) => {
      dirtyRef.current.add(`${categoryId}_${month}`);

      setSections((prev) =>
        prev.map((section) => {
          const hasCategory = section.rows.some((r) => r.categoryId === categoryId);
          if (!hasCategory) return section;

          const updatedRows = section.rows.map((row) => {
            if (row.categoryId !== categoryId || row.isCalculated) return row;
            const newMonths = { ...row.months, [month]: amount };
            return { ...row, months: newMonths, total: calculateRowTotal(newMonths) };
          });

          // Пересчитать ЧДП
          const ncfRow = updatedRows.find((r) => r.isCalculated);
          if (ncfRow) {
            const dataRows = updatedRows.filter((r) => !r.isCalculated);
            ncfRow.months = calculateNetCashFlow(section.sectionCode, dataRows);
            ncfRow.total = calculateRowTotal(ncfRow.months);
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
        entry_type: EntryType;
      }> = [];

      for (const section of sections) {
        for (const row of section.rows) {
          if (row.isCalculated) continue;
          for (const m of MONTHS) {
            const amount = row.months[m.key] || 0;
            if (amount !== 0 || dirtyRef.current.has(`${row.categoryId}_${m.key}`)) {
              entries.push({
                category_id: row.categoryId,
                year,
                month: m.key,
                amount,
                entry_type: entryType,
              });
            }
          }
        }
      }

      await bddsService.upsertBatch(entries);
      dirtyRef.current.clear();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  }, [sections, year, entryType]);

  return { sections, loading, saving, error, updateEntry, saveAll };
}
