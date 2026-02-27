import { Table, Button, Popconfirm, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { BdrSubEntry } from '../../../types/bdr';
import { formatAmount } from '../../../utils/formatters';

interface Props {
  entries: BdrSubEntry[];
  loading: boolean;
  onEdit: (entry: BdrSubEntry) => void;
  onDelete: (id: string) => void;
}

export const BdrSubTable = ({ entries, loading, onEdit, onDelete }: Props) => {
  const columns = [
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
      render: (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('ru-RU');
      },
    },
    {
      title: 'Содержание',
      dataIndex: 'description',
      key: 'description',
    },
    {
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
    },
    {
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
    },
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
