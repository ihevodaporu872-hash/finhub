import { useState } from 'react';
import type { FC } from 'react';
import { Table, Tag, Button, Tooltip, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { GuaranteeRow, GuaranteeStatus, GuaranteeFactFormData } from '../../types/guarantee';
import { formatAmount } from '../../utils/formatters';
import { MONTHS } from '../../utils/constants';
import { GuaranteeFactModal } from './GuaranteeFactModal';

interface IProps {
  rows: GuaranteeRow[];
  onSaveFact: (data: GuaranteeFactFormData) => Promise<void>;
  onDeleteFact: (projectId: string, monthKey: string) => Promise<void>;
}

interface FlatRow {
  key: string;
  projectId: string;
  projectName: string;
  monthKey: string;
  monthLabel: string;
  retentionPlan: number;
  returnPlan: number;
  returnFact: number;
  factDate: string | null;
  status: GuaranteeStatus;
}

const STATUS_CONFIG: Record<GuaranteeStatus, { color: string; label: string }> = {
  pending: { color: 'blue', label: 'Ожидает' },
  overdue: { color: 'red', label: 'Просрочен' },
  partial: { color: 'orange', label: 'Частично' },
  returned: { color: 'green', label: 'Возвращён' },
};

export const GuaranteeTable: FC<IProps> = ({ rows, onSaveFact, onDeleteFact }) => {
  const [modalState, setModalState] = useState<{
    open: boolean;
    row: FlatRow | null;
  }>({ open: false, row: null });

  const flatRows: FlatRow[] = [];
  for (const row of rows) {
    for (const m of row.months) {
      if (m.returnPlan > 0 || m.returnFact > 0 || m.retentionPlan > 0) {
        const [, monthStr] = m.monthKey.split('-');
        const monthNum = parseInt(monthStr, 10);
        const monthInfo = MONTHS.find((mo) => mo.key === monthNum);
        flatRows.push({
          key: `${row.projectId}-${m.monthKey}`,
          projectId: row.projectId,
          projectName: row.projectName,
          monthKey: m.monthKey,
          monthLabel: monthInfo?.full ?? m.monthKey,
          retentionPlan: m.retentionPlan,
          returnPlan: m.returnPlan,
          returnFact: m.returnFact,
          factDate: m.factDate,
          status: m.status,
        });
      }
    }
  }

  const columns: ColumnsType<FlatRow> = [
    {
      title: 'Проект',
      dataIndex: 'projectName',
      key: 'projectName',
      fixed: 'left',
      width: 200,
      onCell: (_, index) => {
        if (index === undefined) return {};
        const currentProject = flatRows[index].projectId;
        const prevProject = index > 0 ? flatRows[index - 1].projectId : null;
        if (currentProject === prevProject) return { rowSpan: 0 };
        let span = 1;
        for (let i = index + 1; i < flatRows.length; i++) {
          if (flatRows[i].projectId === currentProject) span++;
          else break;
        }
        return { rowSpan: span };
      },
    },
    {
      title: 'Месяц',
      dataIndex: 'monthLabel',
      key: 'monthLabel',
      width: 120,
    },
    {
      title: 'Удержание (план)',
      dataIndex: 'retentionPlan',
      key: 'retentionPlan',
      width: 150,
      align: 'right',
      render: (v: number) => formatAmount(v),
    },
    {
      title: 'Плановая дата возврата',
      dataIndex: 'monthLabel',
      key: 'plannedReturnDate',
      width: 180,
      render: (_: string, record: FlatRow) => {
        if (record.returnPlan <= 0) return '';
        const [yearStr, monthStr] = record.monthKey.split('-');
        const endOfMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0);
        return endOfMonth.toLocaleDateString('ru-RU');
      },
    },
    {
      title: 'Сумма возврата (план)',
      dataIndex: 'returnPlan',
      key: 'returnPlan',
      width: 150,
      align: 'right',
      render: (v: number) => formatAmount(v),
    },
    {
      title: 'Возврат (факт)',
      dataIndex: 'returnFact',
      key: 'returnFact',
      width: 150,
      align: 'right',
      render: (v: number) => <span className="guarantee-fact-value">{formatAmount(v)}</span>,
    },
    {
      title: 'Дата факта',
      dataIndex: 'factDate',
      key: 'factDate',
      width: 120,
      render: (v: string | null) => {
        if (!v) return '';
        const d = new Date(v);
        return d.toLocaleDateString('ru-RU');
      },
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: GuaranteeStatus) => {
        const cfg = STATUS_CONFIG[status];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <span className="guarantee-actions">
          <Tooltip title="Внести факт">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => setModalState({ open: true, row: record })}
            />
          </Tooltip>
          {record.returnFact > 0 && (
            <Popconfirm
              title="Удалить факт возврата?"
              onConfirm={() => onDeleteFact(record.projectId, record.monthKey)}
              okText="Да"
              cancelText="Нет"
            >
              <Button type="text" size="small" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          )}
        </span>
      ),
    },
  ];

  return (
    <>
      <Table
        dataSource={flatRows}
        columns={columns}
        pagination={false}
        size="small"
        scroll={{ x: 1100 }}
        className="guarantee-table"
        bordered
        summary={() => {
          const totalRetention = flatRows.reduce((s, r) => s + r.retentionPlan, 0);
          const totalPlan = flatRows.reduce((s, r) => s + r.returnPlan, 0);
          const totalFact = flatRows.reduce((s, r) => s + r.returnFact, 0);
          return (
            <Table.Summary.Row className="guarantee-summary-row">
              <Table.Summary.Cell index={0} colSpan={2}><strong>Итого</strong></Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right"><strong>{formatAmount(totalRetention)}</strong></Table.Summary.Cell>
              <Table.Summary.Cell index={3} />
              <Table.Summary.Cell index={4} align="right"><strong>{formatAmount(totalPlan)}</strong></Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right"><strong>{formatAmount(totalFact)}</strong></Table.Summary.Cell>
              <Table.Summary.Cell index={6} />
              <Table.Summary.Cell index={7} />
              <Table.Summary.Cell index={8} />
            </Table.Summary.Row>
          );
        }}
      />
      {modalState.row && (
        <GuaranteeFactModal
          open={modalState.open}
          projectId={modalState.row.projectId}
          projectName={modalState.row.projectName}
          monthKey={modalState.row.monthKey}
          planAmount={modalState.row.returnPlan}
          initialData={
            modalState.row.returnFact > 0
              ? {
                  fact_amount: modalState.row.returnFact,
                  fact_date: modalState.row.factDate,
                  note: '',
                }
              : undefined
          }
          onSave={async (data) => {
            await onSaveFact(data);
            setModalState({ open: false, row: null });
          }}
          onCancel={() => setModalState({ open: false, row: null })}
        />
      )}
    </>
  );
};
