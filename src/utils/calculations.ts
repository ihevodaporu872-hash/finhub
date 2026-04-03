import type { BddsRow, MonthValues, SectionCode } from '../types/bdds';
import { MONTHS } from './constants';

export function calculateRowTotal(months: MonthValues): number {
  return MONTHS.reduce((sum, m) => sum + (months[m.key] || 0), 0);
}

export function calculateNetCashFlow(
  sectionCode: SectionCode,
  rows: BddsRow[]
): MonthValues {
  const incomeRows = rows.filter((r) => r.rowType === 'income');
  const expenseRows = rows.filter((r) => r.rowType === 'expense');
  const overheadRows = rows.filter((r) => r.rowType === 'overhead');

  const result: MonthValues = {};

  for (const m of MONTHS) {
    const inc = incomeRows.reduce((s, r) => s + (r.months[m.key] || 0), 0);
    const exp = expenseRows.reduce((s, r) => s + (r.months[m.key] || 0), 0);

    if (sectionCode === 'operating') {
      const ovh = overheadRows.reduce((s, r) => s + (r.months[m.key] || 0), 0);
      result[m.key] = inc - exp - ovh;
    } else {
      result[m.key] = inc - exp;
    }
  }

  return result;
}
