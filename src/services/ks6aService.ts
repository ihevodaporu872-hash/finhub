import { supabase } from '../config/supabase';
import type { IKs6aEntry, IKs6aFormData } from '../types/ks6a';

/** Получить записи КС-6а по проекту */
export async function getEntries(projectId: string): Promise<IKs6aEntry[]> {
  const { data, error } = await supabase
    .from('ks6a_entries')
    .select('*')
    .eq('project_id', projectId)
    .order('entry_date', { ascending: false })
    .order('stage_code', { ascending: true });

  if (error) throw error;
  return data as IKs6aEntry[];
}

/** Получить последний % готовности по проекту (общий — среднее по этапам) */
export async function getLatestReadiness(projectId: string): Promise<number> {
  const { data, error } = await supabase
    .from('ks6a_entries')
    .select('stage_code, readiness_percent')
    .eq('project_id', projectId)
    .order('entry_date', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return 0;

  // Берём последнее значение по каждому этапу
  const latestByStage = new Map<string, number>();
  for (const entry of data) {
    if (!latestByStage.has(entry.stage_code)) {
      latestByStage.set(entry.stage_code, Number(entry.readiness_percent));
    }
  }

  const values = [...latestByStage.values()];
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Создать или обновить запись КС-6а */
export async function upsertEntry(data: IKs6aFormData): Promise<void> {
  const { error } = await supabase
    .from('ks6a_entries')
    .upsert(
      {
        ...data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id,stage_code,entry_date' }
    );

  if (error) throw error;
}

/** Удалить запись */
export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('ks6a_entries')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/** Получить сводку по этапам (последний % по каждому этапу) */
export async function getStageSummary(
  projectId: string
): Promise<Array<{ stage_code: string; stage_name: string; readiness_percent: number; entry_date: string }>> {
  const { data, error } = await supabase
    .from('ks6a_entries')
    .select('stage_code, stage_name, readiness_percent, entry_date')
    .eq('project_id', projectId)
    .order('entry_date', { ascending: false });

  if (error) throw error;

  const seen = new Set<string>();
  const result: Array<{ stage_code: string; stage_name: string; readiness_percent: number; entry_date: string }> = [];

  for (const entry of data) {
    if (!seen.has(entry.stage_code)) {
      seen.add(entry.stage_code);
      result.push({
        stage_code: entry.stage_code,
        stage_name: entry.stage_name,
        readiness_percent: Number(entry.readiness_percent),
        entry_date: entry.entry_date,
      });
    }
  }

  return result;
}
