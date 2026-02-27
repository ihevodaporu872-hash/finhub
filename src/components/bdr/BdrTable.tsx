import { useMemo } from 'react';
import { Table } from 'antd';
import { RightOutlined, DownOutlined } from '@ant-design/icons';
import type { BdrTableRow, BdrSubType } from '../../types/bdr';
import { buildBdrMonthColumns, buildBdrTotalColumns } from './BdrMonthColumns';

interface IProps {
  rows: BdrTableRow[];
  overheadExpanded: boolean;
  onToggleOverhead: () => void;
  onUpdatePlan: (rowCode: string, month: number, amount: number) => void;
  onUpdateFact: (rowCode: string, month: number, amount: number) => void;
  onOpenSub: (subType: BdrSubType) => void;
}

export const BdrTable = ({ rows, overheadExpanded, onToggleOverhead, onUpdatePlan, onUpdateFact, onOpenSub }: IProps) => {
  const columns = useMemo(() => {
    const nameCol = {
      title: 'Статья',
      dataIndex: 'name',
      key: 'name',
      width: 320,
      fixed: 'left' as const,
      render: (_: unknown, record: BdrTableRow) => {
        if (record.isHeader) {
          return <strong>{record.name}</strong>;
        }

        if (record.isOverhead) {
          return (
            <span
              className="bdr-clickable-name"
              onClick={onToggleOverhead}
            >
              {overheadExpanded ? <DownOutlined /> : <RightOutlined />}
              {' '}{record.name}
            </span>
          );
        }

        if (record.isClickable && record.subType) {
          return (
            <span
              className="bdr-clickable-name"
              onClick={() => onOpenSub(record.subType!)}
            >
              {record.name}
            </span>
          );
        }

        if (record.isOverheadItem) {
          return <span className="bdr-overhead-indent">{record.name}</span>;
        }

        if (record.isSemiBold) {
          return <span className="bdr-semibold-name">{record.name}</span>;
        }

        return record.name;
      },
    };

    const monthCols = buildBdrMonthColumns({ onUpdatePlan, onUpdateFact });
    const totalCols = buildBdrTotalColumns();

    return [nameCol, ...monthCols, ...totalCols];
  }, [overheadExpanded, onToggleOverhead, onUpdatePlan, onUpdateFact, onOpenSub]);

  const rowClassName = (record: BdrTableRow) => {
    const classes: string[] = [];
    if (record.isHeader) classes.push('bdr-header-row');
    if (record.isSemiBold) classes.push('bdr-semibold-row');
    if (record.isCalculated && !record.isHeader) classes.push('bdr-calculated-row');
    if (record.isOverheadItem) classes.push('bdr-overhead-item');
    return classes.join(' ');
  };

  return (
    <Table<BdrTableRow>
      columns={columns}
      dataSource={rows}
      pagination={false}
      size="small"
      bordered
      scroll={{ x: 'max-content' }}
      sticky
      rowClassName={rowClassName}
      rowKey="key"
    />
  );
};
