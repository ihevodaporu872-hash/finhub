import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Project } from '../types/projects';
import type {
  IScheduleV2Category,
  IScheduleV2Monthly,
  IScheduleV2Finance,
  IScheduleV2CostRow,
  IScheduleV2MonthlyRow,
  ScheduleV2FinanceCode,
} from '../types/scheduleV2';
import { FINANCE_CODES, FINANCE_ROW_LABELS, EDITABLE_FINANCE_CODES } from '../types/scheduleV2';
import * as scheduleV2Service from '../services/scheduleV2Service';
import * as projectsService from '../services/projectsService';

type CostGroup = 'direct' | 'commercial';

interface IUseScheduleV2Result {
  projectName: string;
  costGroup: CostGroup;
  setCostGroup: (g: CostGroup) => void;
  costRows: IScheduleV2CostRow[];
  monthlyRows: IScheduleV2MonthlyRow[];
  monthKeys: string[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useScheduleV2(yearFrom: number, yearTo: number): IUseScheduleV2Result {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [costGroup, setCostGroup] = useState<CostGroup>('direct');
  const [categories, setCategories] = useState<IScheduleV2Category[]>([]);
  const [monthlyData, setMonthlyData] = useState<IScheduleV2Monthly[]>([]);
  const [financeData, setFinanceData] = useState<IScheduleV2Finance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Находим проект Событие 6.2 при загрузке
  useEffect(() => {
    (async () => {
      try {
        const projects = await projectsService.getProjects();
        const sobytie = projects.find((p: Project) =>
          p.code === 'SOB-62' || p.name.includes('Событие 6.2')
        );
        if (sobytie) {
          setProjectId(sobytie.id);
          setProjectName(sobytie.name);
        } else {
          setError('Проект «Событие 6.2» не найден. Выполните миграцию 022.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки проектов');
      }
    })();
  }, []);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const [cats, monthly, finance] = await Promise.all([
        scheduleV2Service.getCategories(projectId),
        scheduleV2Service.getMonthlyData(projectId),
        scheduleV2Service.getFinanceData(projectId),
      ]);
      setCategories(cats);
      setMonthlyData(monthly);
      setFinanceData(finance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Фильтрация по годам
  const filteredMonthly = useMemo(() => {
    return monthlyData.filter((e) => {
      const year = parseInt(e.month_key.split('-')[0], 10);
      return year >= yearFrom && year <= yearTo;
    });
  }, [monthlyData, yearFrom, yearTo]);

  const filteredFinance = useMemo(() => {
    return financeData.filter((e) => {
      const year = parseInt(e.month_key.split('-')[0], 10);
      return year >= yearFrom && year <= yearTo;
    });
  }, [financeData, yearFrom, yearTo]);

  // Категории текущей группы
  const groupCategories = useMemo(() => {
    return categories
      .filter((c) => c.cost_group === costGroup)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [categories, costGroup]);

  // ID категорий текущей группы для фильтрации monthly
  const groupCatIds = useMemo(() => {
    return new Set(groupCategories.map((c) => c.id));
  }, [groupCategories]);

  // Месяцы
  const monthKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const e of filteredMonthly) {
      if (groupCatIds.has(e.category_id)) keys.add(e.month_key);
    }
    for (const e of filteredFinance) keys.add(e.month_key);
    return Array.from(keys).sort();
  }, [filteredMonthly, filteredFinance, groupCatIds]);

  // Таблица стоимости
  const costRows = useMemo((): IScheduleV2CostRow[] => {
    const result: IScheduleV2CostRow[] = [];

    for (const cat of groupCategories) {
      result.push({
        key: cat.id,
        id: cat.id,
        name: cat.name,
        costGroup: costGroup,
        volume: Number(cat.volume),
        unit: cat.unit,
        pricePerUnit: Number(cat.price_per_unit),
        costMaterials: Number(cat.cost_materials),
        costLabor: Number(cat.cost_labor),
        costSubMaterials: Number(cat.cost_sub_materials),
        costSubLabor: Number(cat.cost_sub_labor),
        total: Number(cat.total),
      });
    }

    // Итого
    result.push({
      key: 'grand_total',
      name: 'Итого',
      costGroup: costGroup,
      isTotal: true,
      volume: 0,
      unit: '',
      pricePerUnit: 0,
      costMaterials: groupCategories.reduce((s, c) => s + Number(c.cost_materials), 0),
      costLabor: groupCategories.reduce((s, c) => s + Number(c.cost_labor), 0),
      costSubMaterials: groupCategories.reduce((s, c) => s + Number(c.cost_sub_materials), 0),
      costSubLabor: groupCategories.reduce((s, c) => s + Number(c.cost_sub_labor), 0),
      total: groupCategories.reduce((s, c) => s + Number(c.total), 0),
    });

    return result;
  }, [groupCategories, costGroup]);

  // Таблица помесячного распределения
  const monthlyRows = useMemo((): IScheduleV2MonthlyRow[] => {
    const result: IScheduleV2MonthlyRow[] = [];

    for (const cat of groupCategories) {
      const row: IScheduleV2MonthlyRow = {
        key: `monthly_${cat.id}`,
        name: cat.name,
        categoryId: cat.id,
      };
      const catMonthly = filteredMonthly.filter((m) => m.category_id === cat.id);
      for (const m of catMonthly) {
        row[m.month_key] = Number(m.amount);
      }
      result.push(row);
    }

    // Итого по категориям
    const groupTotalRow: IScheduleV2MonthlyRow = {
      key: 'total_categories',
      name: 'Итого по категориям',
      isTotal: true,
      isBold: true,
    };
    for (const mk of monthKeys) {
      let sum = 0;
      for (const m of filteredMonthly) {
        if (groupCatIds.has(m.category_id) && m.month_key === mk) {
          sum += Number(m.amount);
        }
      }
      if (sum !== 0) groupTotalRow[mk] = sum;
    }
    result.push(groupTotalRow);

    // Финансовые строки
    result.push({
      key: 'header_finance',
      name: 'Финансовые параметры',
      isHeader: true,
    });

    for (const code of FINANCE_CODES) {
      const row: IScheduleV2MonthlyRow = {
        key: `finance_${code}`,
        name: FINANCE_ROW_LABELS[code],
        rowCode: code,
        isBold: code === 'total_smr' || code === 'total_income',
      };

      if (code === 'total_smr') {
        for (const mk of monthKeys) {
          let sum = 0;
          for (const m of filteredMonthly) {
            if (groupCatIds.has(m.category_id) && m.month_key === mk) {
              sum += Number(m.amount);
            }
          }
          if (sum !== 0) row[mk] = sum;
        }
      } else if (code === 'total_smr_no_vat') {
        for (const mk of monthKeys) {
          let sum = 0;
          for (const m of filteredMonthly) {
            if (groupCatIds.has(m.category_id) && m.month_key === mk) {
              sum += Number(m.amount);
            }
          }
          if (sum !== 0) {
            const year = parseInt(mk.split('-')[0], 10);
            const vatRate = year >= 2026 ? 22 : 20;
            row[mk] = sum * 100 / (100 + vatRate);
          }
        }
      } else if (code === 'total_income') {
        for (const mk of monthKeys) {
          let smrSum = 0;
          for (const m of filteredMonthly) {
            if (groupCatIds.has(m.category_id) && m.month_key === mk) {
              smrSum += Number(m.amount);
            }
          }
          const getFinVal = (fc: ScheduleV2FinanceCode) => {
            const entry = filteredFinance.find(
              (f) => f.row_code === fc && f.month_key === mk
            );
            return entry ? Number(entry.amount) : 0;
          };
          const total = smrSum
            + getFinVal('advance_income')
            - getFinVal('advance_offset')
            - getFinVal('guarantee_retention')
            + getFinVal('guarantee_return');
          if (total !== 0) row[mk] = total;
        }
      } else if (EDITABLE_FINANCE_CODES.includes(code)) {
        const codeEntries = filteredFinance.filter((f) => f.row_code === code);
        for (const e of codeEntries) {
          row[e.month_key] = Number(e.amount);
        }
      }

      result.push(row);
    }

    return result;
  }, [groupCategories, filteredMonthly, filteredFinance, monthKeys, groupCatIds]);

  return {
    projectName,
    costGroup,
    setCostGroup,
    costRows,
    monthlyRows,
    monthKeys,
    loading,
    error,
    reload: loadData,
  };
}
