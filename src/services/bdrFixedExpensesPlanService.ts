import { supabase } from '../config/supabase';

export interface FixedExpensesPlan {
  id: string;
  year: number;
  amount: number;
}

export async function getFixedExpensesPlan(year: number): Promise<FixedExpensesPlan | null> {
  const { data, error } = await supabase
    .from('bdr_fixed_expenses_plan')
    .select('*')
    .eq('year', year)
    .maybeSingle();

  if (error) throw error;
  return data as FixedExpensesPlan | null;
}

export async function getFixedExpensesPlans(yearFrom: number, yearTo: number): Promise<Record<number, number>> {
  const { data, error } = await supabase
    .from('bdr_fixed_expenses_plan')
    .select('year, amount')
    .gte('year', yearFrom)
    .lte('year', yearTo);

  console.log('[ОФЗ сервис] getPlans', { yearFrom, yearTo, data, error });

  if (error) throw error;

  const result: Record<number, number> = {};
  for (const row of data || []) {
    result[row.year] = Number(row.amount);
  }
  return result;
}

export async function upsertFixedExpensesPlan(year: number, amount: number): Promise<void> {
  const existing = await getFixedExpensesPlan(year);
  console.log('[ОФЗ сервис] upsert', { year, amount, existing });

  if (existing) {
    const { data, error } = await supabase
      .from('bdr_fixed_expenses_plan')
      .update({ amount, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select();
    console.log('[ОФЗ сервис] update result', { data, error });
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('bdr_fixed_expenses_plan')
      .insert({ year, amount })
      .select();
    console.log('[ОФЗ сервис] insert result', { data, error });
    if (error) throw error;
  }
}

/** Доля проекта в общем выполнении за год (по fact_amount из actual_execution_entries) */
export async function getProjectExecutionShare(year: number, projectId: string): Promise<number> {
  const { data: allData, error: allError } = await supabase
    .from('actual_execution_entries')
    .select('fact_amount')
    .like('month_key', `${year}-%`);

  if (allError) throw allError;

  const totalExecution = (allData || []).reduce((sum, e) => sum + Number(e.fact_amount), 0);
  if (!totalExecution) return 0;

  const { data: projData, error: projError } = await supabase
    .from('actual_execution_entries')
    .select('fact_amount')
    .like('month_key', `${year}-%`)
    .eq('project_id', projectId);

  if (projError) throw projError;

  const projectExecution = (projData || []).reduce((sum, e) => sum + Number(e.fact_amount), 0);
  return projectExecution / totalExecution;
}
