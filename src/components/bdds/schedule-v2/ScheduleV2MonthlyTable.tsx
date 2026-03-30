import { useMemo } from 'react';
import { Table, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { IScheduleV2MonthlyRow } from '../../../types/scheduleV2';
import { formatAmount } from '../../../utils/formatters';

interface IProps {
  rows: IScheduleV2MonthlyRow[];
  monthKeys: string[];
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const monthNames = [
    '', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
    'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
  ];
  const m = parseInt(month, 10);
  return `${monthNames[m] || month} ${year}`;
}

export const ScheduleV2MonthlyTable = ({ rows, monthKeys }: IProps) => {
  const columns = useMemo((): ColumnsType<IScheduleV2MonthlyRow> => {
    const cols: ColumnsType<IScheduleV2MonthlyRow> = [
      {
        title: 'Наименование',
        dataIndex: 'name',
        key: 'name',
        fixed: 'left',
        width: 320,
        render: (text: string, record) => {
          if (record.isHeader || record.isBold) return <strong>{text}</strong>;
          return text;
        },
      },
    ];

    for (const mk of monthKeys) {
      cols.push({
        title: formatMonthLabel(mk),
        dataIndex: mk,
        key: mk,
        width: 130,
        align: 'right',
        className: 'bdds-income-month-cell',
        render: (value: unknown, record) => {
          if (record.isHeader) return null;
          const num = typeof value === 'number' ? value : 0;
          const display = formatAmount(num);
          return (
            <span className={num < 0 ? 'amount-negative' : ''}>
              {display}
            </span>
          );
        },
      });
    }

    cols.push({
      title: 'Итого',
      key: 'row_total',
      fixed: 'right',
      width: 150,
      align: 'right',
      className: 'bdds-total-cell',
      render: (_: unknown, record) => {
        if (record.isHeader) return null;
        let sum = 0;
        for (const mk of monthKeys) {
          const val = record[mk];
          if (typeof val === 'number') sum += val;
        }
        const display = formatAmount(sum);
        return (
          <span className={sum < 0 ? 'amount-negative' : ''}>
            {display}
          </span>
        );
      },
    });

    return cols;
  }, [monthKeys]);

  if (rows.length === 0) {
    return <Empty description="Выберите проект для просмотра данных" />;
  }

  return (
    <Table
      dataSource={rows}
      columns={columns}
      pagination={false}
      bordered
      size="small"
      scroll={{ x: 500 + monthKeys.length * 130 }}
      sticky
      rowClassName={(record) => {
        if (record.isHeader) return 'sv2-section-header';
        if (record.isTotal || record.isBold) return 'sv2-total-row';
        return '';
      }}
    />
  );
};
