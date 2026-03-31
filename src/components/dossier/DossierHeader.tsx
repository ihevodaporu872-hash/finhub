import type { FC } from 'react';
import { Typography, Tag, Space, Row, Col, Statistic } from 'antd';
import {
  CalendarOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import type { IDossierHeaderData } from '../../types/dossier';

const { Title, Text } = Typography;

interface IProps {
  data: IDossierHeaderData;
}

const fmtDate = (d: string) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}`;
};

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: 'В работе' },
  completed: { color: 'blue', label: 'Завершён' },
  suspended: { color: 'orange', label: 'Приостановлен' },
};

export const DossierHeader: FC<IProps> = ({ data }) => {
  const statusInfo = STATUS_MAP[data.status] ?? STATUS_MAP.active;
  const priceLabel = data.price_type === 'fixed' ? 'Твёрдая цена' : 'Ориентировочная цена';

  return (
    <div className="dossier-header">
      <Row justify="space-between" align="top" wrap>
        <Col xs={24} lg={16}>
          <Space align="start" size={12}>
            <FileDoneOutlined className="dossier-header-icon" />
            <div>
              <Title level={4} className="dossier-header-title">
                Финансовое досье: {data.contract_name}
              </Title>
              <Text type="secondary" className="dossier-header-subtitle">
                {data.contract_object}
              </Text>
            </div>
          </Space>
        </Col>
        <Col xs={24} lg={8} className="dossier-header-status-col">
          <Tag color={statusInfo.color} className="dossier-status-badge">{statusInfo.label}</Tag>
        </Col>
      </Row>

      <Row gutter={[24, 16]} className="dossier-header-metrics">
        <Col xs={24} sm={12} md={8}>
          <Statistic
            title="Сумма договора (Выручка)"
            value={data.contract_amount}
            precision={2}
            suffix="₽"
            groupSeparator=" "
            className="dossier-stat"
          />
          <Text type="secondary" className="dossier-stat-note">
            {priceLabel}, вкл. НДС {data.nds_rate}%
          </Text>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <div className="dossier-stat-block">
            <Text type="secondary" className="dossier-stat-label">
              <CalendarOutlined /> Срок реализации
            </Text>
            <div className="dossier-stat-dates">
              {fmtDate(data.start_date)} — {fmtDate(data.end_date)}
            </div>
            <Text type="secondary" className="dossier-stat-note">
              {data.duration_months} месяцев
            </Text>
          </div>
        </Col>
      </Row>
    </div>
  );
};
