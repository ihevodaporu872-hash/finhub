import { supabase } from '../config/supabase';
import type { BdrEntry, BdrEntryType } from '../types/bdr';

export async function getEntries(year: number, entryType: BdrEntryType, projectId?: string): Promise<BdrEntry[]> {
  let query = supabase
    .from('bdr_entries')
    .select('*')
    .eq('year', year)
    .eq('entry_type', entryType);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as BdrEntry[];
}

export async function upsertBatch(
  entries: Array<{
    row_code: string;
    year: number;
    month: number;
    amount: number;
    entry_type: BdrEntryType;
    project_id?: string;
  }>
): Promise<void> {
  if (entries.length === 0) return;

  const withTimestamp = entries.map((e) => ({
    ...e,
    updated_at: new Date().toISOString(),
  }));

  const hasProject = entries.some((e) => e.project_id);
  const onConflict = hasProject
    ? 'row_code,year,month,entry_type,project_id'
    : 'row_code,year,month,entry_type';

  const { error } = await supabase
    .from('bdr_entries')
    .upsert(withTimestamp, { onConflict });

  if (error) throw error;
}

export async function getSmrTotalsByMonth(year: number, projectId?: string): Promise<Record<number, number>> {
  const SMR_CODES = [
    'prep_works', 'dewatering', 'earthworks', 'waterproofing',
    'monolith', 'masonry', 'facade', 'roofing', 'interior',
    'elevators', 'engineering', 'landscaping', 'external_networks',
  ];

  let query = supabase
    .from('bdds_income_entries')
    .select('work_type_code, month_key, amount')
    .like('month_key', `${year}-%`)
    .in('work_type_code', SMR_CODES);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const totals: Record<number, number> = {};
  for (const e of data) {
    const month = parseInt(e.month_key.split('-')[1], 10);
    totals[month] = (totals[month] || 0) + Number(e.amount);
  }
  return totals;
}
