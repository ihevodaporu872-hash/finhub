import { supabase } from '../config/supabase';
import type { BblEntry, BblEntryType } from '../types/bbl';

export async function getEntries(year: number, entryType: BblEntryType, projectId?: string): Promise<BblEntry[]> {
  let query = supabase
    .from('bbl_entries')
    .select('*')
    .eq('year', year)
    .eq('entry_type', entryType);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as BblEntry[];
}

export async function upsertBatch(
  entries: Array<{
    row_code: string;
    year: number;
    month: number;
    amount: number;
    entry_type: BblEntryType;
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
    .from('bbl_entries')
    .upsert(withTimestamp, { onConflict });

  if (error) throw error;
}
