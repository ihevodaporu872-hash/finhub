import { useMemo, useState } from 'react';
import { Table, Tooltip, InputNumber } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { BblTableRow, IBblTreeRow } from '../../types/bbl';
import type { YearMonthSlot } from '../../utils/constants';
import { MONTHS } from '../../utils/constants';
import { BBL_SECTIONS, BBL_FORMULAS } from '../../utils/bblConstants';
import { formatAmount, parseAmount } from '../../utils/formatters';

interface IProps {
  rows: BblTableRow[];
  yearRows?: Map<number, BblTableRow[]>;
  yearMonthSlots?: YearMonthSlot[];
  onUpdatePlan?: (rowCode: string, month: number, amount: number) => void;
  onUpdateFact?: (rowCode: string, month: number, amount: number) => void;
}

export const BblTable = ({
  rows,
  yearRows,
  yearMonthSlots,
  onUpdatePlan,
  onUpdateFact,
}: IProps) => {
  const isMultiYear = yearMonthSlots ? yearMonthSlots.length > 12 : false;

  /** Объединение multi-year данных */
  const flatRows = useMemo((): BblTableRow[] => {
    if (!isMultiYear || !yearRows || !yearMonthSlots) return rows;

    const firstYear = [...yearRows.keys()].sort((a, b) => a - b)[0];
    const baseRows = yearRows.get(firstYear) ?? [];

    return baseRows.map((baseRow, ri) => {
      const merged: BblTableRow = { ...baseRow, plan_total: 0, fact_total: 0 };
      for (let m = 1; m <= 12; m++) {
        delete merged[`plan_month_${m}`];
        delete merged[`fact_month_${m}`];
      }

      let planTotal = 0;
      let factTotal = 0;

      for (const slot of yearMonthSlots) {
        const yRows = yearRows.get(slot.year);
        const yRow = yRows?.[ri];
        const pv = (yRow?.[`plan_month_${slot.month}`] as number) || 0;
        const fv = (yRow?.[`fact_month_${slot.month}`] as number) || 0;
        merged[`plan_month_${slot.dataKey}`] = pv;
        merged[`fact_month_${slot.dataKey}`] = fv;
        planTotal += pv;
        factTotal += fv;
      }

      merged.plan_total = planTotal;
      merged.fact_total = factTotal;
      return merged;
    });
  }, [rows, yearRows, yearMonthSlots, isMultiYear]);

  /** Формирование дерева секций */
  const treeData = useMemo((): IBblTreeRow[] => {
    const rowMap = new Map<string, BblTableRow>();
    for (const row of flatRows) {
      rowMap.set(row.rowCode, row);
    }

    const tree: IBblTreeRow[] = [];

    for (const section of BBL_SECTIONS) {
      const summaryRow = rowMap.get(section.summaryRowCode);
      if (!summaryRow) continue;

      const children: IBblTreeRow[] = [];
      for (const code of section.childCodes) {
        const childRow = rowMap.get(code);
        if (childRow) {
          children.push({ ...childRow });
        }
      }

      const sectionRow: IBblTreeRow = {
        ...summaryRow,
        key: section.key,
        name: section.title,
        isSectionHeader: true,
        children: children.length > 0 ? children : undefined,
      };

      tree.push(sectionRow);
    }

    return tree;
  }, [flatRows]);

  /** Построение колонок */
  const columns = useMemo((): ColumnsType<IBblTreeRow> => {
    const nameCol: ColumnsType<IBblTreeRow>[number] = {
      title: 'Статья баланса',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 320,
      render: (name: string, record: IBblTreeRow) => {
        const formula = BBL_FORMULAS[record.rowCode];
        const content = (
          <span>
            {name}
            {record.isLinked && (
              <Tooltip title={record.linkedSource || 'Данные из БДР/БДДС'}>
                <LinkOutlined className="bbl-link-icon" />
              </Tooltip>
            )}
          </span>
        );
        if (formula) {
          return <Tooltip title={formula}>{content}</Tooltip>;
        }
        return content;
      },
    };

    const slots = isMultiYear && yearMonthSlots ? yearMonthSlots : MONTHS.map((m) => ({
      year: 0, month: m.key, label: m.short, dataKey: String(m.key),
    }));

    const monthCols: ColumnsType<IBblTreeRow> = slots.map((slot) => ({
      title: slot.label,
      key: `month_${slot.dataKey}`,
      width: 160,
      children: [
        {
          title: 'План',
          key: `plan_${slot.dataKey}`,
          width: 80,
          className: 'bdds-plan-cell',
          render: (_: unknown, record: IBblTreeRow) => {
            const val = (record[`plan_month_${slot.dataKey}`] as number) || 0;
            if (record.isSectionHeader || record.isCalculated || record.isLinked || !onUpdatePlan) {
              return <span className={val < 0 ? 'amount-negative' : ''}>{formatAmount(val)}</span>;
            }
            return (
              <EditableCell
                value={val}
                onChange={(v) => onUpdatePlan(record.rowCode, slot.month, v)}
              />
            );
          },
        },
        {
          title: 'Факт',
          key: `fact_${slot.dataKey}`,
          width: 80,
          className: 'bdds-fact-cell',
          render: (_: unknown, record: IBblTreeRow) => {
            const val = (record[`fact_month_${slot.dataKey}`] as number) || 0;
            if (record.isSectionHeader || record.isCalculated || record.isLinked || !onUpdateFact) {
              return <span className={val < 0 ? 'amount-negative' : ''}>{formatAmount(val)}</span>;
            }
            return (
              <EditableCell
                value={val}
                onChange={(v) => onUpdateFact(record.rowCode, slot.month, v)}
              />
            );
          },
        },
      ],
    }));

    const totalCols: ColumnsType<IBblTreeRow> = [
      {
        title: 'Итого План',
        key: 'plan_total',
        width: 100,
        className: 'bdds-total-cell bdds-total-border-left',
        render: (_: unknown, record: IBblTreeRow) => {
          const val = (record.plan_total as number) || 0;
          return <span className={val < 0 ? 'amount-negative' : ''}>{formatAmount(val)}</span>;
        },
      },
      {
        title: 'Итого Факт',
        key: 'fact_total',
        width: 100,
        className: 'bdds-total-cell',
        render: (_: unknown, record: IBblTreeRow) => {
          const val = (record.fact_total as number) || 0;
          return <span className={val < 0 ? 'amount-negative' : ''}>{formatAmount(val)}</span>;
        },
      },
    ];

    return [nameCol, ...monthCols, ...totalCols];
  }, [isMultiYear, yearMonthSlots, onUpdatePlan, onUpdateFact]);

  const rowClassName = (record: IBblTreeRow) => {
    const classes: string[] = [];
    if (record.isSectionHeader) classes.push('bbl-section-header');
    if (record.isSectionTotal) classes.push('bbl-section-total');
    if (record.isLinked) classes.push('bbl-linked-row');
    if (record.isBalanceCheck) {
      classes.push('bbl-balance-check');
      // Проверяем значения: если не 0 — alert
      const planTotal = (record.plan_total as number) || 0;
      const factTotal = (record.fact_total as number) || 0;
      if (Math.abs(planTotal) > 0.01 || Math.abs(factTotal) > 0.01) {
        classes.push('bbl-balance-alert');
      } else {
        classes.push('bbl-balance-ok');
      }
    }
    return classes.join(' ');
  };

  return (
    <Table<IBblTreeRow>
      columns={columns}
      dataSource={treeData}
      pagination={false}
      size="small"
      bordered
      scroll={{ x: 'max-content' }}
      sticky
      rowClassName={rowClassName}
      rowKey="key"
      expandable={{
        defaultExpandedRowKeys: [],
        indentSize: 0,
      }}
    />
  );
};

/** Inline editable cell */
const EditableCell = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [editing, setEditing] = useState(false);
  const [, setInputVal] = useState('');

  if (!editing) {
    return (
      <span
        className={`bbl-editable-cell ${value < 0 ? 'amount-negative' : ''}`}
        onClick={() => {
          setInputVal(value ? String(value) : '');
          setEditing(true);
        }}
      >
        {formatAmount(value) || '\u00A0'}
      </span>
    );
  }

  return (
    <InputNumber
      size="small"
      autoFocus
      defaultValue={value || undefined}
      style={{ width: 72 }}
      formatter={(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''}
      parser={(v) => parseAmount(v || '0')}
      onBlur={(e) => {
        setEditing(false);
        const parsed = parseAmount(e.target.value || '0');
        if (parsed !== value) onChange(parsed);
      }}
      onPressEnter={(e) => {
        (e.target as HTMLInputElement).blur();
      }}
    />
  );
};
