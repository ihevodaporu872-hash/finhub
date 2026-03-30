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
import { COST_GROUP_LABELS } from '../utils/scheduleV2Categories';
import * as scheduleV2Service from '../services/scheduleV2Service';
import * as projectsService from '../services/projectsService';

interface IUseScheduleV2Result {
  projects: Project[];
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  costRows: IScheduleV2CostRow[];
  monthlyRows: IScheduleV2MonthlyRow[];
  monthKeys: string[];
  categories: IScheduleV2Category[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useScheduleV2(yearFrom: number, yearTo: number): IUseScheduleV2Result {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [categories, setCategories] = useState<IScheduleV2Category[]>([]);
  const [monthlyData, setMonthlyData] = useState<IScheduleV2Monthly[]>([]);
  const [financeData, setFinanceData] = useState<IScheduleV2Finance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const projectsData = await projectsService.getProjects();
      const activeProjects = projectsData.filter((p) => p.is_active);
      setProjects(activeProjects);

      // Автовыбор первого проекта при загрузке
      if (!selectedProjectId && activeProjects.length > 0) {
        const sobytie = activeProjects.find((p) =>
          p.code === 'SOB-62' || p.name.includes('Событие 6.2')
        );
        const autoProject = sobytie ?? activeProjects[0];
        setSelectedProjectId(autoProject.id);
        return;
      }

      if (!selectedProjectId) {
        setCategories([]);
        setMonthlyData([]);
        setFinanceData([]);
        return;
      }

      const [cats, monthly, finance] = await Promise.all([
        scheduleV2Service.getCategories(selectedProjectId),
        scheduleV2Service.getMonthlyData(selectedProjectId),
        scheduleV2Service.getFinanceData(selectedProjectId),
      ]);

      setCategories(cats);
      setMonthlyData(monthly);
      setFinanceData(finance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

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

  // Месяцы
  const monthKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const e of filteredMonthly) keys.add(e.month_key);
    for (const e of filteredFinance) keys.add(e.month_key);
    return Array.from(keys).sort();
  }, [filteredMonthly, filteredFinance]);

  // Таблица стоимости
  const costRows = useMemo((): IScheduleV2CostRow[] => {
    const result: IScheduleV2CostRow[] = [];
    const groups: Array<'direct' | 'commercial'> = ['direct', 'commercial'];

    for (const group of groups) {
      result.push({
        key: `header_${group}`,
        name: COST_GROUP_LABELS[group],
        costGroup: group,
        isHeader: true,
        volume: 0,
        unit: '',
        pricePerUnit: 0,
        costMaterials: 0,
        costLabor: 0,
        costSubMaterials: 0,
        costSubLabor: 0,
        total: 0,
      });

      const groupCats = categories
        .filter((c) => c.cost_group === group)
        .sort((a, b) => a.sort_order - b.sort_order);

      for (const cat of groupCats) {
        result.push({
          key: cat.id,
          id: cat.id,
          name: cat.name,
          costGroup: group,
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

      // Итого по группе
      const totalRow: IScheduleV2CostRow = {
        key: `total_${group}`,
        name: `Итого ${COST_GROUP_LABELS[group].toLowerCase()}`,
        costGroup: group,
        isTotal: true,
        volume: 0,
        unit: '',
        pricePerUnit: 0,
        costMaterials: groupCats.reduce((s, c) => s + Number(c.cost_materials), 0),
        costLabor: groupCats.reduce((s, c) => s + Number(c.cost_labor), 0),
        costSubMaterials: groupCats.reduce((s, c) => s + Number(c.cost_sub_materials), 0),
        costSubLabor: groupCats.reduce((s, c) => s + Number(c.cost_sub_labor), 0),
        total: groupCats.reduce((s, c) => s + Number(c.total), 0),
      };
      result.push(totalRow);
    }

    // Общий итог
    const allCats = categories;
    result.push({
      key: 'grand_total',
      name: 'Итого',
      costGroup: 'direct',
      isTotal: true,
      volume: 0,
      unit: '',
      pricePerUnit: 0,
      costMaterials: allCats.reduce((s, c) => s + Number(c.cost_materials), 0),
      costLabor: allCats.reduce((s, c) => s + Number(c.cost_labor), 0),
      costSubMaterials: allCats.reduce((s, c) => s + Number(c.cost_sub_materials), 0),
      costSubLabor: allCats.reduce((s, c) => s + Number(c.cost_sub_labor), 0),
      total: allCats.reduce((s, c) => s + Number(c.total), 0),
    });

    return result;
  }, [categories]);

  // Таблица помесячного распределения
  const monthlyRows = useMemo((): IScheduleV2MonthlyRow[] => {
    const result: IScheduleV2MonthlyRow[] = [];
    const groups: Array<'direct' | 'commercial'> = ['direct', 'commercial'];

    for (const group of groups) {
      result.push({
        key: `header_${group}`,
        name: COST_GROUP_LABELS[group],
        isHeader: true,
        costGroup: group,
      });

      const groupCats = categories
        .filter((c) => c.cost_group === group)
        .sort((a, b) => a.sort_order - b.sort_order);

      for (const cat of groupCats) {
        const row: IScheduleV2MonthlyRow = {
          key: `monthly_${cat.id}`,
          name: cat.name,
          categoryId: cat.id,
          costGroup: group,
        };
        const catMonthly = filteredMonthly.filter((m) => m.category_id === cat.id);
        for (const m of catMonthly) {
          row[m.month_key] = Number(m.amount);
        }
        result.push(row);
      }

      // Итого по группе
      const groupTotalRow: IScheduleV2MonthlyRow = {
        key: `total_${group}`,
        name: `Итого ${COST_GROUP_LABELS[group].toLowerCase()}`,
        isTotal: true,
        isBold: true,
        costGroup: group,
      };
      const groupCatIds = new Set(groupCats.map((c) => c.id));
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
    }

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
        // Сумма всех категорий
        for (const mk of monthKeys) {
          let sum = 0;
          for (const m of filteredMonthly) {
            if (m.month_key === mk) sum += Number(m.amount);
          }
          if (sum !== 0) row[mk] = sum;
        }
      } else if (code === 'total_smr_no_vat') {
        // СМР без НДС
        for (const mk of monthKeys) {
          let sum = 0;
          for (const m of filteredMonthly) {
            if (m.month_key === mk) sum += Number(m.amount);
          }
          if (sum !== 0) {
            const year = parseInt(mk.split('-')[0], 10);
            const vatRate = year >= 2026 ? 22 : 20;
            row[mk] = sum * 100 / (100 + vatRate);
          }
        }
      } else if (code === 'total_income') {
        // Итого поступление = СМР + Аванс - Зачет Аванса - ГУ + Возврат ГУ
        for (const mk of monthKeys) {
          let smrSum = 0;
          for (const m of filteredMonthly) {
            if (m.month_key === mk) smrSum += Number(m.amount);
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
  }, [categories, filteredMonthly, filteredFinance, monthKeys]);

  return {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    costRows,
    monthlyRows,
    monthKeys,
    categories,
    loading,
    error,
    reload: loadData,
  };
}
