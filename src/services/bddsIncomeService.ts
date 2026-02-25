import { supabase } from '../config/supabase';
import type { BddsIncomeEntry, BddsIncomeNote } from '../types/bddsIncome';

export async function getEntries(projectId?: string): Promise<BddsIncomeEntry[]> {
  let query = supabase.from('bdds_income_entries').select('*');
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as BddsIncomeEntry[];
}

export async function getNotes(projectId?: string): Promise<BddsIncomeNote[]> {
  let query = supabase.from('bdds_income_notes').select('*');
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as BddsIncomeNote[];
}

export async function upsertEntries(
  entries: Array<{
    project_id: string;
    work_type_code: string;
    month_key: string;
    amount: number;
  }>
): Promise<void> {
  if (entries.length === 0) return;

  const withTimestamp = entries.map((e) => ({
    ...e,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('bdds_income_entries')
    .upsert(withTimestamp, { onConflict: 'project_id,work_type_code,month_key' });

  if (error) throw error;
}

export async function upsertNotes(
  notes: Array<{
    project_id: string;
    work_type_code: string;
    note: string;
  }>
): Promise<void> {
  if (notes.length === 0) return;

  const withTimestamp = notes.map((n) => ({
    ...n,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('bdds_income_notes')
    .upsert(withTimestamp, { onConflict: 'project_id,work_type_code' });

  if (error) throw error;
}

export async function deleteProjectEntries(projectId: string): Promise<void> {
  const { error: e1 } = await supabase
    .from('bdds_income_entries')
    .delete()
    .eq('project_id', projectId);
  if (e1) throw e1;

  const { error: e2 } = await supabase
    .from('bdds_income_notes')
    .delete()
    .eq('project_id', projectId);
  if (e2) throw e2;
}
