import { useMemo } from 'react';
import { Table } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { BddsSection, BddsTableRow } from '../../types/bdds';
import { MONTHS } from '../../utils/constants';
import { buildMonthColumns, buildTotalColumns } from './BddsMonthColumns';

const DRILLDOWN_MAP: Record<string, string> = {
  income: '/bdds/income',
};

interface Props {
  sections: BddsSection[];
  onUpdateFact: (categoryId: string, month: number, amount: number) => void;
}

export function BddsTable({ sections, onUpdateFact }: Props) {
  const navigate = useNavigate();

  const dataSource = useMemo((): BddsTableRow[] => {
    const rows: BddsTableRow[] = [];

    for (const section of sections) {
      rows.push({
        key: `header-${section.sectionCode}`,
        name: section.sectionName.toUpperCase(),
        isHeader: true,
      });

      for (const row of section.rows) {
        const tableRow: BddsTableRow = {
          key: row.categoryId,
          name: row.name,
          categoryId: row.categoryId,
          isCalculated: row.isCalculated,
          rowType: row.rowType,
          plan_total: row.total,
          fact_total: row.factTotal,
        };

        for (const m of MONTHS) {
          tableRow[`plan_month_${m.key}`] = row.months[m.key] || 0;
          tableRow[`fact_month_${m.key}`] = row.factMonths[m.key] || 0;
        }

        rows.push(tableRow);
      }
    }

    return rows;
  }, [sections]);

  const columns = useMemo((): ColumnsType<BddsTableRow> => {
    const nameCol: ColumnsType<BddsTableRow> = [
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

          const drilldownPath = record.rowType ? DRILLDOWN_MAP[record.rowType] : undefined;
          if (drilldownPath && record.rowType === 'income' && !record.isCalculated) {
            return (
              <span
                onClick={() => navigate(drilldownPath)}
                style={{ cursor: 'pointer', color: '#1677ff' }}
              >
                {text} <RightOutlined style={{ fontSize: 10 }} />
              </span>
            );
          }

          return text;
        },
      },
    ];

    const monthCols = buildMonthColumns({ onUpdateFact });
    const totalCols = buildTotalColumns();

    return [...nameCol, ...monthCols, ...totalCols];
  }, [onUpdateFact, navigate]);

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      pagination={false}
      bordered
      size="small"
      scroll={{ x: 4500 }}
      sticky
      rowClassName={(record) => {
        if (record.isHeader) return 'bdds-section-header';
        if (record.isCalculated) return 'bdds-calculated-row';
        return '';
      }}
    />
  );
}
