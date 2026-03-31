import type { FC } from 'react';
import { Row, Col, Card, Statistic, Alert } from 'antd';
import { BankOutlined, LockOutlined, WarningOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/charts';

const fmt = (v: number) => v.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

interface IProps {
  liquidity: { rsBalance: number; obsBalance: number };
}

export const BddsLiquidityWidget: FC<IProps> = ({ liquidity }) => {
  const { rsBalance, obsBalance } = liquidity;
  const total = rsBalance + obsBalance;
  if (total === 0 && rsBalance === 0) return null;

  const rsWarning = rsBalance <= 0 && obsBalance > 0;

  const pieData = [
    { type: 'Р/С (свободный)', value: Math.max(rsBalance, 0) },
    { type: 'ОБС (целевой)', value: Math.max(obsBalance, 0) },
  ];

  const pieConfig = {
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    innerRadius: 0.6,
    height: 140,
    color: ['#52c41a', '#faad14'],
    label: false as const,
    legend: { position: 'bottom' as const },
    statistic: {
      title: { content: 'Итого', style: { fontSize: '11px' } },
      content: { content: fmt(total) + ' ₽', style: { fontSize: '13px' } },
    },
  };

  return (
    <div className="dashboard-kpi-row">
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card size="small" className={rsWarning ? 'bdds-liquidity-card bdds-liquidity-warning' : 'bdds-liquidity-card'}>
            <Statistic
              title={<><BankOutlined /> Р/С (свободный)</>}
              value={fmt(rsBalance)}
              suffix="₽"
              valueStyle={{ color: rsBalance >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title={<><LockOutlined /> ОБС (целевой)</>}
              value={fmt(obsBalance)}
              suffix="₽"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small">
            <Pie {...pieConfig} />
          </Card>
        </Col>
      </Row>
      {rsWarning && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          message="Кассовый разрыв по свободным деньгам"
          description={`Р/С: ${fmt(rsBalance)} ₽, ОБС: ${fmt(obsBalance)} ₽`}
          className="mt-16"
        />
      )}
    </div>
  );
};
