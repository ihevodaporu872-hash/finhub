import { useState, useEffect, useCallback, useMemo } from 'react';
import type { SummaryTableRow } from '../types/bddsIncome';
import type { Project } from '../types/projects';
import * as bddsIncomeService from '../services/bddsIncomeService';
import * as projectsService from '../services/projectsService';
import { SMR_CODES } from '../utils/workTypes';

interface IUseBddsIncomeSummaryResult {
  summaryRows: SummaryTableRow[];
  monthKeys: string[];
  loading: boolean;
  error: string | null;
}

export function useBddsIncomeSummary(yearFrom: number, yearTo: number): IUseBddsIncomeSummaryResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<Array<{ project_id: string; work_type_code: string; month_key: string; amount: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectsData, entriesData] = await Promise.all([
        projectsService.getProjects(),
        bddsIncomeService.getEntries(),
      ]);

      setProjects(projectsData);
      setEntries(entriesData);

      // Диагностика: какие проекты есть в записях
      const projectIdsInEntries = new Set(entriesData.map((e) => e.project_id));
      const projectNames = projectsData
        .filter((p) => projectIdsInEntries.has(p.id))
        .map((p) => p.name);
      console.log('[Сводные данные] Всего записей:', entriesData.length);
      console.log('[Сводные данные] Проекты в записях:', projectNames);
      console.log('[Сводные данные] Все проекты:', projectsData.map((p) => p.name));
      console.log('[Сводные данные] Уникальные project_id в записях:', [...projectIdsInEntries]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const year = parseInt(e.month_key.split('-')[0], 10);
      return year >= yearFrom && year <= yearTo;
    });
  }, [entries, yearFrom, yearTo]);

  const monthKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const e of filteredEntries) {
      keys.add(e.month_key);
    }
    return Array.from(keys).sort();
  }, [filteredEntries]);

  const summaryRows = useMemo((): SummaryTableRow[] => {
    const result: SummaryTableRow[] = [];
    const FINANCE_CODES = ['advance_income', 'advance_offset', 'guarantee_retention', 'guarantee_return'];

    // Только проекты из перечня проектов
    const activeProjectIds = new Set(projects.map((p) => p.id));
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));

    for (const projectId of activeProjectIds) {
      const projectName = projectMap.get(projectId) || '';
      const projectEntries = filteredEntries.filter((e) => e.project_id === projectId);

      // Всего СМР по проекту — сумма всех SMR-кодов
      const smrRow: SummaryTableRow = {
        key: `${projectId}_total_smr`,
        projectName,
        projectId,
        rowLabel: 'Всего СМР по проекту',
        rowType: 'total_smr',
      };
      for (const mk of monthKeys) {
        const sum = SMR_CODES.reduce((acc, code) => {
          const entry = projectEntries.find(
            (e) => e.work_type_code === code && e.month_key === mk
          );
          return acc + (entry ? Number(entry.amount) : 0);
        }, 0);
        if (sum !== 0) smrRow[mk] = sum;
      }

      // Итого поступление за СМР по проекту
      const incomeRow: SummaryTableRow = {
        key: `${projectId}_total_income`,
        projectName,
        projectId,
        rowLabel: 'Итого поступление за СМР по проекту',
        rowType: 'total_income',
      };

      const storedIncome = projectEntries.filter((e) => e.work_type_code === 'total_income');
      if (storedIncome.length > 0) {
        for (const e of storedIncome) {
          incomeRow[e.month_key] = Number(e.amount);
        }
      } else {
        for (const mk of monthKeys) {
          const smrVal = typeof smrRow[mk] === 'number' ? (smrRow[mk] as number) : 0;
          const financeSum = FINANCE_CODES.reduce((acc, code) => {
            const entry = projectEntries.find(
              (e) => e.work_type_code === code && e.month_key === mk
            );
            return acc + (entry ? Number(entry.amount) : 0);
          }, 0);
          const total = smrVal + financeSum;
          if (total !== 0) incomeRow[mk] = total;
        }
      }

      const hasData = monthKeys.some(
        (mk) => typeof smrRow[mk] === 'number' || typeof incomeRow[mk] === 'number'
      );
      if (hasData) {
        result.push(smrRow, incomeRow);
      }
    }

    // Сортировка по имени проекта
    result.sort((a, b) => a.projectName.localeCompare(b.projectName));

    return result;
  }, [projects, filteredEntries, monthKeys]);

  return { summaryRows, monthKeys, loading, error };
}
