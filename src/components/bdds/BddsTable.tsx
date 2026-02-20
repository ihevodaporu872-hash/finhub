import { useMemo } from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { BddsSection, BddsTableRow } from '../../types/bdds';
import { MONTHS } from '../../utils/constants';
import { formatAmount } from '../../utils/formatters';
import { BddsEditableCell } from './BddsEditableCell';

interface Props {
  sections: BddsSection[];
  onUpdateEntry: (categoryId: string, month: number, amount: number) => void;
}

export function BddsTable({ sections, onUpdateEntry }: Props) {
  const dataSource = useMemo((): BddsTableRow[] => {
    const rows: BddsTableRow[] = [];

    for (const section of sections) {
      // Строка-заголовок секции
      rows.push({
        key: `header-${section.sectionCode}`,
        name: section.sectionName.toUpperCase(),
        isHeader: true,
      });

      // Строки данных
      for (const row of section.rows) {
        const tableRow: BddsTableRow = {
          key: row.categoryId,
          name: row.name,
          categoryId: row.categoryId,
          isCalculated: row.isCalculated,
          rowType: row.rowType,
          total: row.total,
        };

        for (const m of MONTHS) {
          tableRow[`month_${m.key}`] = row.months[m.key] || 0;
        }

        rows.push(tableRow);
      }
    }

    return rows;
  }, [sections]);

  const columns = useMemo((): ColumnsType<BddsTableRow> => {
    const cols: ColumnsType<BddsTableRow> = [
      {
        title: 'Статья',
        dataIndex: 'name',
        key: 'name',
        fixed: 'left',
        width: 320,
        render: (text: string, record: BddsTableRow) => {
          if (record.isHeader) {
            return <strong>{text}</strong>;
          }
          return text;
        },
      },
    ];

    // Колонки месяцев
    for (const m of MONTHS) {
      cols.push({
        title: m.short,
        dataIndex: `month_${m.key}`,
        key: `month_${m.key}`,
        width: 110,
        align: 'right',
        render: (_: unknown, record: BddsTableRow) => {
          if (record.isHeader) return null;

          const value = record[`month_${m.key}`] as number;

          return (
            <BddsEditableCell
              value={value}
              isCalculated={record.isCalculated}
              onSave={(newValue) => {
                if (record.categoryId) {
                  onUpdateEntry(record.categoryId, m.key, newValue);
                }
              }}
            />
          );
        },
      });
    }

    // Колонка "Итого"
    cols.push({
      title: 'Итого',
      dataIndex: 'total',
      key: 'total',
      width: 130,
      align: 'right',
      className: 'bdds-total-cell',
      render: (value: number, record: BddsTableRow) => {
        if (record.isHeader) return null;
        const display = formatAmount(value);
        return (
          <span className={value < 0 ? 'amount-negative' : ''}>
            {display}
          </span>
        );
      },
    });

    return cols;
  }, [onUpdateEntry]);

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      pagination={false}
      bordered
      size="small"
      scroll={{ x: 1800 }}
      sticky
      rowClassName={(record) => {
        if (record.isHeader) return 'bdds-section-header';
        if (record.isCalculated) return 'bdds-calculated-row';
        return '';
      }}
    />
  );
}
