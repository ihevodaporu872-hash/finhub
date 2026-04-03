import { useRef, type FC } from 'react';
import { Card, Row, Col, Table, Alert, Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import { useContracts1cImport } from '../../hooks/useContracts1cImport';
import type { IContract1c } from '../../types/contracts1c';
import { formatAmount } from '../../utils/formatters';

const { Dragger } = Upload;

interface IContracts1cImportTabProps {
  contracts: IContract1c[];
  onImportDone: () => void;
}

export const Contracts1cImportTab: FC<IContracts1cImportTabProps> = ({ contracts, onImportDone }) => {
  const { importing, lastResult, error, importFile } = useContracts1cImport('supplier');
  const importDoneRef = useRef(false);

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.csv',
    showUploadList: false,
    beforeUpload: async (file) => {
      importDoneRef.current = false;
      await importFile(file);
      if (!importDoneRef.current) {
        importDoneRef.current = true;
        onImportDone();
      }
      return false;
    },
  };

  // Статистика
  const total = contracts.length;
  const newCount = contracts.filter(c => c.status === 'new').length;
  const activeCount = contracts.filter(c => c.status === 'active').length;
  const changedCount = contracts.filter(c => c.status === 'amount_changed').length;
  const overlimitCount = contracts.filter(c => c.status === 'overlimit').length;

  const columns = [
    { title: 'GUID', dataIndex: 'guid_1c', width: 120, ellipsis: true },
    { title: '№ договора', dataIndex: 'contract_number', width: 140 },
    { title: 'Контрагент', dataIndex: 'counterparty_name', width: 200, ellipsis: true },
    { title: 'ИНН', dataIndex: 'inn', width: 120 },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      width: 130,
      align: 'right' as const,
      render: (v: number) => formatAmount(v),
    },
    {
      title: 'Дата',
      dataIndex: 'contract_date',
      width: 110,
      render: (v: string | null) => v ? dayjs(v).format('DD.MM.YYYY') : '—',
    },
    { title: 'Валюта', dataIndex: 'currency', width: 70 },
  ];

  return (
    <>
      {lastResult && (
        <Alert
          type="success"
          showIcon
          className="mb-16"
          message={`Импорт завершён: ${lastResult.inserted} новых, ${lastResult.updated} обновлено, ${lastResult.amount_changed} с изменённой суммой`}
          closable
        />
      )}

      {error && (
        <Alert type="error" showIcon className="mb-16" message={error} closable />
      )}

      <Dragger {...uploadProps} disabled={importing} style={{ marginBottom: 16 }}>
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">
          {importing ? 'Импорт...' : 'Перетащите Excel-файл или нажмите для выбора'}
        </p>
        <p className="ant-upload-hint">
          Формат: contract_export.xlsx — экспорт из «Универсального отчёта» 1С
        </p>
      </Dragger>

      <Row gutter={[12, 12]} className="mb-16">
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderLeft: '3px solid #1677ff', background: '#f0f5ff' }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1677ff' }}>{total}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Всего</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderLeft: '3px solid #f5222d', background: '#fff1f0' }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#f5222d' }}>{newCount}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Не привязаны</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderLeft: '3px solid #52c41a', background: '#f6ffed' }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>{activeCount}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Активные</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderLeft: '3px solid #fa8c16', background: '#fff7e6' }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#fa8c16' }}>{changedCount + overlimitCount}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Требуют внимания</div>
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={contracts}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 20 }}
        scroll={{ x: 'max-content' }}
        loading={importing}
      />
    </>
  );
};
