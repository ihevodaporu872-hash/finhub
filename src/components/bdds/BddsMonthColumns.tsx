import type { ColumnsType } from 'antd/es/table';
import type { BddsTableRow } from '../../types/bdds';
import { MONTHS } from '../../utils/constants';
import { formatAmount } from '../../utils/formatters';
import { BddsEditableCell } from './BddsEditableCell';

function formatPercent(plan: number, fact: number): string {
  if (!plan) return '';
  const abs = fact - plan;
  const pct = (abs / plan) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

function formatDeviation(plan: number, fact: number): string {
  const abs = fact - plan;
  if (abs === 0 && !fact && !plan) return '';
  return formatAmount(abs);
}

interface MonthColumnsOptions {
  onUpdateFact: (categoryId: string, month: number, amount: number) => void;
}

export function buildMonthColumns(
  options: MonthColumnsOptions
): ColumnsType<BddsTableRow> {
  const { onUpdateFact } = options;
  const cols: ColumnsType<BddsTableRow> = [];

  for (const m of MONTHS) {
    cols.push({
      title: m.short,
      key: `month_group_${m.key}`,
      children: [
        {
          title: 'План',
          dataIndex: `plan_month_${m.key}`,
          key: `plan_${m.key}`,
          width: 95,
          align: 'right',
          className: 'bdds-plan-cell',
          render: (_: unknown, record: BddsTableRow) => {
            if (record.isHeader) return null;
            const value = record[`plan_month_${m.key}`] as number;
            const display = formatAmount(value);
            return (
              <span className={value < 0 ? 'amount-negative' : ''}>
                {display}
              </span>
            );
          },
        },
        {
          title: 'Факт',
          dataIndex: `fact_month_${m.key}`,
          key: `fact_${m.key}`,
          width: 95,
          align: 'right',
          className: 'bdds-fact-cell',
          render: (_: unknown, record: BddsTableRow) => {
            if (record.isHeader) return null;
            const value = record[`fact_month_${m.key}`] as number;
            return (
              <BddsEditableCell
                value={value}
                isCalculated={record.isCalculated}
                onSave={(newValue) => {
                  if (record.categoryId) {
                    onUpdateFact(record.categoryId, m.key, newValue);
                  }
                }}
              />
            );
          },
        },
        {
          title: 'Абс.',
          key: `abs_${m.key}`,
          width: 85,
          align: 'right',
          className: 'bdds-abs-cell',
          render: (_: unknown, record: BddsTableRow) => {
            if (record.isHeader) return null;
            const plan = (record[`plan_month_${m.key}`] as number) || 0;
            const fact = (record[`fact_month_${m.key}`] as number) || 0;
            const display = formatDeviation(plan, fact);
            const abs = fact - plan;
            return (
              <span className={abs < 0 ? 'amount-negative' : ''}>
                {display}
              </span>
            );
          },
        },
        {
          title: '%',
          key: `rel_${m.key}`,
          width: 65,
          align: 'right',
          className: 'bdds-rel-cell',
          render: (_: unknown, record: BddsTableRow) => {
            if (record.isHeader) return null;
            const plan = (record[`plan_month_${m.key}`] as number) || 0;
            const fact = (record[`fact_month_${m.key}`] as number) || 0;
            const display = formatPercent(plan, fact);
            const abs = fact - plan;
            return (
              <span className={abs < 0 ? 'amount-negative' : ''}>
                {display}
              </span>
            );
          },
        },
      ],
    });
  }

  return cols;
}

export function buildTotalColumns(): ColumnsType<BddsTableRow> {
  return [
    {
      title: 'Итого',
      key: 'total_group',
      className: 'bdds-total-cell',
      children: [
        {
          title: 'План',
          dataIndex: 'plan_total',
          key: 'plan_total',
          width: 110,
          align: 'right',
          className: 'bdds-total-cell',
          render: (value: number, record: BddsTableRow) => {
            if (record.isHeader) return null;
            return (
              <span className={value < 0 ? 'amount-negative' : ''}>
                {formatAmount(value)}
              </span>
            );
          },
        },
        {
          title: 'Факт',
          dataIndex: 'fact_total',
          key: 'fact_total',
          width: 110,
          align: 'right',
          className: 'bdds-total-cell',
          render: (value: number, record: BddsTableRow) => {
            if (record.isHeader) return null;
            return (
              <span className={value < 0 ? 'amount-negative' : ''}>
                {formatAmount(value)}
              </span>
            );
          },
        },
        {
          title: 'Абс.',
          key: 'abs_total',
          width: 100,
          align: 'right',
          className: 'bdds-total-cell',
          render: (_: unknown, record: BddsTableRow) => {
            if (record.isHeader) return null;
            const plan = (record.plan_total as number) || 0;
            const fact = (record.fact_total as number) || 0;
            const display = formatDeviation(plan, fact);
            const abs = fact - plan;
            return (
              <span className={abs < 0 ? 'amount-negative' : ''}>
                {display}
              </span>
            );
          },
        },
        {
          title: '%',
          key: 'rel_total',
          width: 70,
          align: 'right',
          className: 'bdds-total-cell',
          render: (_: unknown, record: BddsTableRow) => {
            if (record.isHeader) return null;
            const plan = (record.plan_total as number) || 0;
            const fact = (record.fact_total as number) || 0;
            const display = formatPercent(plan, fact);
            const abs = fact - plan;
            return (
              <span className={abs < 0 ? 'amount-negative' : ''}>
                {display}
              </span>
            );
          },
        },
      ],
    },
  ];
}
