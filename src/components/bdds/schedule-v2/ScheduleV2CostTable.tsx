import { useMemo } from 'react';
import { Table, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { IScheduleV2CostRow } from '../../../types/scheduleV2';
import { formatAmount } from '../../../utils/formatters';

interface IProps {
  rows: IScheduleV2CostRow[];
}

export const ScheduleV2CostTable = ({ rows }: IProps) => {
  const columns = useMemo((): ColumnsType<IScheduleV2CostRow> => [
    {
      title: 'Категория',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 320,
      render: (text: string, record) => {
        if (record.isHeader || record.isTotal) return <strong>{text}</strong>;
        return text;
      },
    },
    {
      title: 'Объем',
      dataIndex: 'volume',
      key: 'volume',
      width: 100,
      align: 'right',
      render: (val: number, record) => {
        if (record.isHeader || record.isTotal) return null;
        return val ? formatAmount(val) : '';
      },
    },
    {
      title: 'Ед.',
      dataIndex: 'unit',
      key: 'unit',
      width: 60,
      render: (val: string, record) => {
        if (record.isHeader || record.isTotal) return null;
        return val;
      },
    },
    {
      title: 'Р/ед.',
      dataIndex: 'pricePerUnit',
      key: 'pricePerUnit',
      width: 120,
      align: 'right',
      render: (val: number, record) => {
        if (record.isHeader || record.isTotal) return null;
        return val ? formatAmount(val) : '';
      },
    },
    {
      title: 'Мат.',
      dataIndex: 'costMaterials',
      key: 'costMaterials',
      width: 140,
      align: 'right',
      render: (val: number, record) => {
        if (record.isHeader) return null;
        return formatAmount(val);
      },
    },
    {
      title: 'Раб.',
      dataIndex: 'costLabor',
      key: 'costLabor',
      width: 140,
      align: 'right',
      render: (val: number, record) => {
        if (record.isHeader) return null;
        return formatAmount(val);
      },
    },
    {
      title: 'Суб-мат.',
      dataIndex: 'costSubMaterials',
      key: 'costSubMaterials',
      width: 140,
      align: 'right',
      render: (val: number, record) => {
        if (record.isHeader) return null;
        return formatAmount(val);
      },
    },
    {
      title: 'Суб-раб.',
      dataIndex: 'costSubLabor',
      key: 'costSubLabor',
      width: 140,
      align: 'right',
      render: (val: number, record) => {
        if (record.isHeader) return null;
        return formatAmount(val);
      },
    },
    {
      title: 'Итого',
      dataIndex: 'total',
      key: 'total',
      fixed: 'right',
      width: 160,
      align: 'right',
      className: 'bdds-total-cell',
      render: (val: number, record) => {
        if (record.isHeader) return null;
        const display = formatAmount(val);
        return (
          <span className={val < 0 ? 'amount-negative' : ''}>
            {display}
          </span>
        );
      },
    },
  ], []);

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
      scroll={{ x: 1400 }}
      sticky
      rowClassName={(record) => {
        if (record.isHeader) return 'sv2-section-header';
        if (record.isTotal) return 'sv2-total-row';
        return '';
      }}
    />
  );
};
