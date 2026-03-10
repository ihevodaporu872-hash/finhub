import { Table, Button, Popconfirm, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { BdrSubEntry, BdrSubType } from '../../../types/bdr';
import { formatAmount } from '../../../utils/formatters';

interface IProps {
  subType: BdrSubType;
  entries: BdrSubEntry[];
  loading: boolean;
  onEdit: (entry: BdrSubEntry) => void;
  onDelete: (id: string) => void;
}

const actionsColumn = (onEdit: (e: BdrSubEntry) => void, onDelete: (id: string) => void) => ({
  title: '',
  key: 'actions',
  width: 80,
  render: (_: unknown, record: BdrSubEntry) => (
    <Space size="small">
      <Button
        type="text"
        size="small"
        icon={<EditOutlined />}
        onClick={() => onEdit(record)}
      />
      <Popconfirm
        title="Удалить запись?"
        onConfirm={() => onDelete(record.id)}
        okText="Да"
        cancelText="Нет"
      >
        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
      </Popconfirm>
    </Space>
  ),
});

const amountColumn = {
  title: 'Сумма',
  dataIndex: 'amount',
  key: 'amount',
  width: 140,
  align: 'right' as const,
  render: (value: number) => (
    <span className={value < 0 ? 'amount-negative' : ''}>
      {formatAmount(value)}
    </span>
  ),
};

export const BdrSubTable = ({ subType, entries, loading, onEdit, onDelete }: IProps) => {
  const isOverheadLabor = subType === 'overhead_labor';
  const isFixedExpenses = subType === 'fixed_expenses';

  const yearTotal = isFixedExpenses
    ? entries.reduce((sum, e) => sum + Number(e.amount), 0)
    : 0;

  const MONTH_NAMES = [
    '', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ];

  const columns = isFixedExpenses
    ? [
        {
          title: 'Период',
          dataIndex: 'entry_date',
          key: 'period',
          width: 150,
          render: (date: string) => {
            const m = new Date(date).getMonth() + 1;
            return MONTH_NAMES[m] || date;
          },
        },
        {
          title: 'ОФЗ за год',
          key: 'ofz_year',
          width: 160,
          align: 'right' as const,
          render: () => (
            <span>{formatAmount(yearTotal)}</span>
          ),
        },
        {
          ...amountColumn,
          title: 'Расходы с учетом ОФЗ',
        },
        actionsColumn(onEdit, onDelete),
      ]
    : isOverheadLabor
    ? [
        {
          title: '№п/п',
          key: 'index',
          width: 60,
          render: (_: unknown, __: BdrSubEntry, index: number) => index + 1,
        },
        {
          title: 'Отдел/Сотрудник',
          dataIndex: 'company',
          key: 'company',
        },
        amountColumn,
        actionsColumn(onEdit, onDelete),
      ]
    : [
        {
          title: '№п/п',
          key: 'index',
          width: 60,
          render: (_: unknown, __: BdrSubEntry, index: number) => index + 1,
        },
        {
          title: 'Фирма',
          dataIndex: 'company',
          key: 'company',
          width: 200,
        },
        {
          title: 'Дата',
          dataIndex: 'entry_date',
          key: 'entry_date',
          width: 120,
          render: (date: string) => new Date(date).toLocaleDateString('ru-RU'),
        },
        {
          title: 'Содержание',
          dataIndex: 'description',
          key: 'description',
        },
        amountColumn,
        actionsColumn(onEdit, onDelete),
      ];

  return (
    <Table
      columns={columns}
      dataSource={entries}
      pagination={{ pageSize: 20 }}
      size="small"
      bordered
      rowKey="id"
      loading={loading}
    />
  );
};
