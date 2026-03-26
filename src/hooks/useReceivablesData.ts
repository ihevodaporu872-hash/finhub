import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

export interface IReceivablesPoint {
  month: string;
  monthKey: string;
  cumKs: number;
  cumReceipts: number;
  guaranteeRetention: number;
  problemDebt: number;
  totalDebt: number;
}

interface IUseReceivablesResult {
  data: IReceivablesPoint[];
  loading: boolean;
  error: string | null;
}

const MONTH_NAMES = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const GUARANTEE_RATE = 0.05; // 5% гарантийные удержания

export function useReceivablesData(yearFrom: number, yearTo: number, projectId: string | null): IUseReceivablesResult {
  const [data, setData] = useState<IReceivablesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const monthKeys: string[] = [];
      for (let y = yearFrom; y <= yearTo; y++) {
        for (let m = 1; m <= 12; m++) {
          monthKeys.push(`${y}-${String(m).padStart(2, '0')}`);
        }
      }

      // 1. Загрузка КС-2 из actual_execution_entries
      let ksQuery = supabase
        .from('actual_execution_entries')
        .select('month_key, ks_amount')
        .in('month_key', monthKeys);
      if (projectId) ksQuery = ksQuery.eq('project_id', projectId);
      const { data: ksData, error: ksErr } = await ksQuery;
      if (ksErr) throw ksErr;

      // 2. Загрузка поступлений из bdds_entries (operating income fact)
      const years: number[] = [];
      for (let y = yearFrom; y <= yearTo; y++) years.push(y);

      const receiptQueries = years.map((y) =>
        supabase
          .from('bdds_entries')
          .select('month, amount, bdds_categories!inner(section_code, row_type, is_calculated)')
          .eq('year', y)
          .eq('type', 'fact')
      );
      const receiptResults = await Promise.all(receiptQueries);

      // Агрегация КС-2 по месяцам
      const ksMap = new Map<string, number>();
      for (const key of monthKeys) ksMap.set(key, 0);
      for (const e of ksData || []) {
        ksMap.set(e.month_key, (ksMap.get(e.month_key) || 0) + (Number(e.ks_amount) || 0));
      }

      // Агрегация поступлений по месяцам
      const receiptMap = new Map<string, number>();
      for (const key of monthKeys) receiptMap.set(key, 0);
      for (let i = 0; i < years.length; i++) {
        const res = receiptResults[i];
        if (res.error) throw res.error;
        const y = years[i];
        for (const e of res.data || []) {
          const cat = e.bdds_categories as unknown as { section_code: string; row_type: string; is_calculated: boolean };
          if (cat.section_code === 'operating' && cat.row_type === 'income' && !cat.is_calculated) {
            const key = `${y}-${String(e.month).padStart(2, '0')}`;
            receiptMap.set(key, (receiptMap.get(key) || 0) + (Number(e.amount) || 0));
          }
        }
      }

      // Определяем последний месяц с фактическими данными
      let lastFactKey = '';
      for (const key of monthKeys) {
        const ks = ksMap.get(key) || 0;
        const rec = receiptMap.get(key) || 0;
        if (ks > 0 || rec > 0) lastFactKey = key;
      }

      // Формируем кумулятивные данные, обрезая пустое будущее
      const points: IReceivablesPoint[] = [];
      let cumKs = 0;
      let cumReceipts = 0;
      let started = false;

      for (const key of monthKeys) {
        const ks = ksMap.get(key) || 0;
        const rec = receiptMap.get(key) || 0;

        cumKs += ks;
        cumReceipts += rec;

        if (!started && cumKs === 0 && cumReceipts === 0) continue;
        started = true;

        const [yearStr, monthStr] = key.split('-');
        const monthIdx = parseInt(monthStr, 10) - 1;
        const label = `${MONTH_NAMES[monthIdx]} ${yearStr.slice(2)}`;

        const totalDebt = Math.max(0, cumKs - cumReceipts);
        const guaranteeRetention = Math.min(totalDebt, cumKs * GUARANTEE_RATE);
        const problemDebt = Math.max(0, totalDebt - guaranteeRetention);

        points.push({
          month: label,
          monthKey: key,
          cumKs,
          cumReceipts,
          guaranteeRetention,
          problemDebt,
          totalDebt,
        });

        if (key === lastFactKey) break;
      }

      setData(points);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [yearFrom, yearTo, projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  return { data, loading, error };
}
