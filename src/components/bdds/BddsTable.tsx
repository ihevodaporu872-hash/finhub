import { useMemo } from 'react';
import { Table } from 'antd';
import { RightOutlined, DownOutlined, FileTextOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { BddsSection, BddsTableRow } from '../../types/bdds';
import type { YearMonthSlot } from '../../utils/constants';
import { MONTHS } from '../../utils/constants';
import { buildMonthColumns, buildTotalColumns } from './BddsMonthColumns';

const RECEIPT_ROW_NAME = 'Поступление от продажи продукции и товаров, выполнения работ, оказания услуг';

interface IProps {
  sections: BddsSection[];
  yearSections?: Map<number, BddsSection[]>;
  yearMonthSlots?: YearMonthSlot[];
  expandedParents: Set<string>;
  onToggleParent: (categoryId: string) => void;
  onUpdateFact?: (categoryId: string, month: number, amount: number) => void;
  onNavigateReceipts?: (categoryId: string) => void;
}

const buildRowFromBddsRow = (
  row: { categoryId: string; name: string; rowType: string; isCalculated: boolean; months: Record<number, number>; factMonths: Record<number, number>; total: number; factTotal: number },
  sectionCode: string,
  opts: { isChild?: boolean; isExpandable?: boolean; isBalance?: boolean },
  slots?: YearMonthSlot[],
  yearSections?: Map<number, BddsSection[]>,
  rowIndex?: number,
  childIndex?: number,
): BddsTableRow => {
  const tableRow: BddsTableRow = {
    key: row.categoryId,
    name: row.name,
    categoryId: row.categoryId,
    isCalculated: row.isCalculated,
    isExpandable: opts.isExpandable,
    isChild: opts.isChild,
    isBalance: opts.isBalance,
    rowType: row.rowType as BddsTableRow['rowType'],
    sectionCode: sectionCode as BddsTableRow['sectionCode'],
    plan_total: row.total,
    fact_total: row.factTotal,
  };

  if (slots && yearSections) {
    // Multi-year
    let planTotal = 0;
    let factTotal = 0;
    for (const slot of slots) {
      const ySections = yearSections.get(slot.year);
      const ySection = ySections?.find((s) => s.sectionCode === sectionCode);
      let pv = 0;
      let fv = 0;
      if (ySection && rowIndex !== undefined) {
        const yRow = ySection.rows[rowIndex];
        if (opts.isChild && childIndex !== undefined) {
          const yChild = yRow?.children?.[childIndex];
          pv = yChild?.months[slot.month] || 0;
          fv = yChild?.factMonths[slot.month] || 0;
        } else {
          pv = yRow?.months[slot.month] || 0;
          fv = yRow?.factMonths[slot.month] || 0;
        }
      }
      tableRow[`plan_month_${slot.dataKey}`] = pv;
      tableRow[`fact_month_${slot.dataKey}`] = fv;
      planTotal += pv;
      factTotal += fv;
    }
    tableRow.plan_total = planTotal;
    tableRow.fact_total = factTotal;
  } else {
    // Single year
    for (const m of MONTHS) {
      tableRow[`plan_month_${m.key}`] = row.months[m.key] || 0;
      tableRow[`fact_month_${m.key}`] = row.factMonths[m.key] || 0;
    }
  }

  return tableRow;
};

export const BddsTable = ({ sections, yearSections, yearMonthSlots, expandedParents, onToggleParent, onUpdateFact, onNavigateReceipts }: IProps) => {
  const isMultiYear = yearMonthSlots ? yearMonthSlots.length > 12 : false;

  const dataSource = useMemo((): BddsTableRow[] => {
    const rows: BddsTableRow[] = [];

    const addRowsForSection = (section: BddsSection) => {
      for (let ri = 0; ri < section.rows.length; ri++) {
        const row = section.rows[ri];
        const hasChildren = row.children && row.children.length > 0;
        const isBalance = row.rowType === 'balance_open' || row.rowType === 'balance_close';

        const tableRow = buildRowFromBddsRow(
          row,
          section.sectionCode,
          { isExpandable: hasChildren, isBalance },
          isMultiYear ? yearMonthSlots : undefined,
          isMultiYear ? yearSections : undefined,
          ri,
        );
        rows.push(tableRow);

        if (hasChildren && expandedParents.has(row.categoryId)) {
          for (let ci = 0; ci < row.children!.length; ci++) {
            const child = row.children![ci];
            const childRow = buildRowFromBddsRow(
              child,
              section.sectionCode,
              { isChild: true, isBalance },
              isMultiYear ? yearMonthSlots : undefined,
              isMultiYear ? yearSections : undefined,
              ri,
              ci,
            );
            rows.push(childRow);
          }
        }
      }
    };

    for (const section of sections) {
      rows.push({
        key: `header-${section.sectionCode}`,
        name: section.sectionName.toUpperCase(),
        isHeader: true,
      });
      addRowsForSection(section);
    }

    return rows;
  }, [sections, yearSections, yearMonthSlots, isMultiYear, expandedParents]);

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
          if (record.isExpandable && record.categoryId) {
            const expanded = expandedParents.has(record.categoryId);
            const isBalance = record.isBalance;
            return (
              <span
                className={`bdds-clickable-name ${isBalance ? 'bdds-balance-name' : 'bdds-semibold-name'}`}
                onClick={() => onToggleParent(record.categoryId!)}
              >
                {expanded ? <DownOutlined /> : <RightOutlined />}
                {' '}{text}
              </span>
            );
          }
          if (record.isChild) {
            if (record.name === RECEIPT_ROW_NAME && record.categoryId && onNavigateReceipts) {
              return (
                <span
                  className="bdds-child-indent bdds-receipt-link"
                  onClick={() => onNavigateReceipts(record.categoryId!)}
                >
                  <FileTextOutlined /> {text}
                </span>
              );
            }
            return <span className={`bdds-child-indent ${record.isBalance ? 'bdds-balance-child' : ''}`}>{text}</span>;
          }
          return text;
        },
      },
    ];

    const monthCols = buildMonthColumns({
      onUpdateFact,
      slots: isMultiYear ? yearMonthSlots : undefined,
    });
    const totalCols = buildTotalColumns();

    return [...nameCol, ...monthCols, ...totalCols];
  }, [onUpdateFact, expandedParents, onToggleParent, isMultiYear, yearMonthSlots, onNavigateReceipts]);

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      pagination={false}
      bordered
      size="small"
      scroll={{ x: 'max-content' }}
      sticky
      rowClassName={(record) => {
        if (record.isHeader) return 'bdds-section-header';
        if (record.isBalance && !record.isChild) return 'bdds-balance-row';
        if (record.isBalance && record.isChild) return 'bdds-balance-child-row';
        if (record.isCalculated && !record.isExpandable) return 'bdds-calculated-row';
        if (record.isExpandable) return 'bdds-expandable-row';
        if (record.isChild) return 'bdds-child-row';
        if (record.rowType === 'income' && record.sectionCode === 'operating') return 'bdds-auto-row';
        return '';
      }}
    />
  );
};
