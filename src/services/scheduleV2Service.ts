import { supabase } from '../config/supabase';
import type {
  IScheduleV2Category,
  IScheduleV2Monthly,
  IScheduleV2Finance,
} from '../types/scheduleV2';

// === Категории ===

export async function getCategories(projectId: string): Promise<IScheduleV2Category[]> {
  const { data, error } = await supabase
    .from('schedule_v2_categories')
    .select('*')
    .eq('project_id', projectId)
    .order('cost_group')
    .order('sort_order');
  if (error) throw error;
  return data as IScheduleV2Category[];
}

export async function upsertCategories(
  categories: Array<Omit<IScheduleV2Category, 'id'> & { id?: string }>
): Promise<void> {
  if (categories.length === 0) return;
  const withTimestamp = categories.map((c) => ({
    ...c,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from('schedule_v2_categories')
    .upsert(withTimestamp, { onConflict: 'project_id,name,cost_group' });
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('schedule_v2_categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// === Помесячные данные ===

export async function getMonthlyData(projectId: string): Promise<IScheduleV2Monthly[]> {
  const PAGE_SIZE = 1000;
  const allData: IScheduleV2Monthly[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('schedule_v2_monthly')
      .select('*')
      .eq('project_id', projectId)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData.push(...(data as IScheduleV2Monthly[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allData;
}

export async function upsertMonthlyData(
  entries: Array<{
    project_id: string;
    category_id: string;
    month_key: string;
    amount: number;
  }>
): Promise<void> {
  if (entries.length === 0) return;
  const BATCH_SIZE = 500;
  const withTimestamp = entries.map((e) => ({
    ...e,
    updated_at: new Date().toISOString(),
  }));

  for (let i = 0; i < withTimestamp.length; i += BATCH_SIZE) {
    const batch = withTimestamp.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('schedule_v2_monthly')
      .upsert(batch, { onConflict: 'project_id,category_id,month_key' });
    if (error) throw error;
  }
}

export async function deleteMonthlyByCategory(
  projectId: string,
  categoryId: string
): Promise<void> {
  const { error } = await supabase
    .from('schedule_v2_monthly')
    .delete()
    .eq('project_id', projectId)
    .eq('category_id', categoryId);
  if (error) throw error;
}

// === Финансовые строки ===

export async function getFinanceData(projectId: string): Promise<IScheduleV2Finance[]> {
  const { data, error } = await supabase
    .from('schedule_v2_finance')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw error;
  return data as IScheduleV2Finance[];
}

export async function upsertFinanceData(
  entries: Array<{
    project_id: string;
    row_code: string;
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
    .from('schedule_v2_finance')
    .upsert(withTimestamp, { onConflict: 'project_id,row_code,month_key' });
  if (error) throw error;
}
