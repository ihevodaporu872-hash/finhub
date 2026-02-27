import { supabase } from '../config/supabase';
import type { BdrEntry, BdrEntryType } from '../types/bdr';

export async function getEntries(year: number, entryType: BdrEntryType): Promise<BdrEntry[]> {
  const { data, error } = await supabase
    .from('bdr_entries')
    .select('*')
    .eq('year', year)
    .eq('entry_type', entryType);

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
  }>
): Promise<void> {
  if (entries.length === 0) return;

  const withTimestamp = entries.map((e) => ({
    ...e,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('bdr_entries')
    .upsert(withTimestamp, { onConflict: 'row_code,year,month,entry_type' });

  if (error) throw error;
}

export async function getSmrTotalsByMonth(year: number): Promise<Record<number, number>> {
  const SMR_CODES = [
    'prep_works', 'dewatering', 'earthworks', 'waterproofing',
    'monolith', 'masonry', 'facade', 'roofing', 'interior',
    'elevators', 'engineering', 'landscaping', 'external_networks',
  ];

  const { data, error } = await supabase
    .from('bdds_income_entries')
    .select('work_type_code, month_key, amount')
    .like('month_key', `${year}-%`)
    .in('work_type_code', SMR_CODES);

  if (error) throw error;

  const totals: Record<number, number> = {};
  for (const e of data) {
    const month = parseInt(e.month_key.split('-')[1], 10);
    totals[month] = (totals[month] || 0) + Number(e.amount);
  }
  return totals;
}
