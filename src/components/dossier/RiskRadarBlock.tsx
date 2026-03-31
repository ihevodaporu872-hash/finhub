import { useState } from 'react';
import type { FC } from 'react';
import {
  Card,
  Table,
  InputNumber,
  Typography,
  Alert,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import {
  WarningOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { IDossierPenaltiesData, IPenaltyItem } from '../../types/dossier';

const { Text } = Typography;

interface IPenaltyRow extends IPenaltyItem {
  key: string;
}

const fmtNum = (v: number) =>
  v.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface IProps {
  data: IDossierPenaltiesData;
}

export const RiskRadarBlock: FC<IProps> = ({ data }) => {
  const [days, setDays] = useState<Record<string, number>>({});

  const rows: IPenaltyRow[] = data.penalties.map((p, i) => ({
    ...p,
    key: String(i),
  }));

  const getTotal = (key: string, rate: number) => (days[key] ?? 0) * rate;

  const columns: ColumnsType<IPenaltyRow> = [
    {
      title: 'Тип нарушения',
      dataIndex: 'violation',
      key: 'violation',
      render: (text: string) => (
        <Text strong className="dossier-risk-violation">{text}</Text>
      ),
    },
    {
      title: 'Размер штрафа',
      key: 'rate',
      width: 180,
      render: (_: unknown, record: IPenaltyRow) => (
        <Tag color="red" className="dossier-risk-rate-tag">
          {fmtNum(record.rate)} ₽ / {record.unit}
        </Tag>
      ),
    },
    {
      title: (
        <Tooltip title="Введите количество дней/случаев для расчёта потенциального убытка">
          <span>Кол-во <InfoCircleOutlined /></span>
        </Tooltip>
      ),
      key: 'days',
      width: 120,
      render: (_: unknown, record: IPenaltyRow) => (
        <InputNumber
          min={0}
          max={999}
          value={days[record.key] ?? 0}
          onChange={(v) => setDays((prev) => ({ ...prev, [record.key]: v ?? 0 }))}
          size="small"
          className="dossier-risk-input"
        />
      ),
    },
    {
      title: 'Потенциальный убыток',
      key: 'total',
      width: 200,
      render: (_: unknown, record: IPenaltyRow) => {
        const total = getTotal(record.key, record.rate);
        return (
          <Text
            strong
            className={total > 0 ? 'dossier-risk-total-danger' : 'dossier-risk-total-zero'}
          >
            {total > 0 ? `${fmtNum(total)} ₽` : '—'}
          </Text>
        );
      },
    },
  ];

  const grandTotal = rows.reduce((acc, p) => acc + getTotal(p.key, p.rate), 0);

  return (
    <Card
      title={
        <Space>
          <ThunderboltOutlined className="dossier-risk-header-icon" />
          <span>Блок Г: Радар рисков — Штрафы и санкции</span>
        </Space>
      }
      className="dossier-card dossier-card--danger"
    >
      {rows.length > 0 ? (
        <Table
          dataSource={rows}
          columns={columns}
          pagination={false}
          size="middle"
          className="dossier-risk-table"
          rowClassName="dossier-risk-row"
          summary={() => (
            <Table.Summary.Row className="dossier-risk-summary-row">
              <Table.Summary.Cell index={0} colSpan={3}>
                <Text strong>ИТОГО потенциальный убыток</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <Text
                  strong
                  className={grandTotal > 0 ? 'dossier-risk-total-danger' : ''}
                >
                  {grandTotal > 0 ? `${fmtNum(grandTotal)} ₽` : '—'}
                </Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      ) : (
        <Text type="secondary">Штрафные санкции не указаны</Text>
      )}

      {data.customer_penalty_rate_pct > 0 && (
        <Alert
          type="info"
          showIcon
          icon={<WarningOutlined />}
          className="dossier-risk-alert"
          message="Встречная ответственность"
          description={
            <Text>
              Пени Заказчика за просрочку оплаты составляют{' '}
              <Text strong>{data.customer_penalty_rate_pct}% в день</Text>.
              Внимание: начисление начинается только с{' '}
              <Text strong>{data.customer_penalty_start_day}-го рабочего дня</Text> просрочки.
            </Text>
          }
        />
      )}
    </Card>
  );
};
