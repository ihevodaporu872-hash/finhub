import type { BddsRow, MonthValues, SectionCode } from '../types/bdds';
import { MONTHS } from './constants';

export function calculateRowTotal(months: MonthValues): number {
  return MONTHS.reduce((sum, m) => sum + (months[m.key] || 0), 0);
}

export function calculateNetCashFlow(
  sectionCode: SectionCode,
  rows: BddsRow[]
): MonthValues {
  const income = rows.find((r) => r.rowType === 'income');
  const expense = rows.find((r) => r.rowType === 'expense');
  const overhead = rows.find((r) => r.rowType === 'overhead');

  const result: MonthValues = {};

  for (const m of MONTHS) {
    const inc = income?.months[m.key] || 0;
    const exp = expense?.months[m.key] || 0;

    if (sectionCode === 'operating') {
      const ovh = overhead?.months[m.key] || 0;
      result[m.key] = inc - exp - ovh;
    } else {
      result[m.key] = inc - exp;
    }
  }

  return result;
}
