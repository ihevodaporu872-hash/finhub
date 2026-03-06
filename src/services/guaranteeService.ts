import { supabase } from '../config/supabase';
import type { GuaranteeFact } from '../types/guarantee';

export async function getFacts(projectId?: string): Promise<GuaranteeFact[]> {
  let query = supabase.from('guarantee_facts').select('*');
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as GuaranteeFact[];
}

export async function upsertFact(fact: {
  project_id: string;
  month_key: string;
  fact_amount: number;
  fact_date: string | null;
  note: string;
}): Promise<void> {
  const { error } = await supabase
    .from('guarantee_facts')
    .upsert(
      { ...fact, updated_at: new Date().toISOString() },
      { onConflict: 'project_id,month_key' }
    );
  if (error) throw error;
}

export async function deleteFact(projectId: string, monthKey: string): Promise<void> {
  const { error } = await supabase
    .from('guarantee_facts')
    .delete()
    .eq('project_id', projectId)
    .eq('month_key', monthKey);
  if (error) throw error;
}

export async function getRetentionAndReturnPlan(
  projectId?: string
): Promise<Array<{ project_id: string; work_type_code: string; month_key: string; amount: number }>> {
  let query = supabase
    .from('bdds_income_entries')
    .select('project_id, work_type_code, month_key, amount')
    .in('work_type_code', ['guarantee_retention', 'guarantee_return']);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const PAGE_SIZE = 1000;
  const allData: Array<{ project_id: string; work_type_code: string; month_key: string; amount: number }> = [];
  let from = 0;

  while (true) {
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allData;
}
