import type { FC } from 'react';
import { Row, Col, Card, Statistic, Alert } from 'antd';
import { BankOutlined, LockOutlined, WarningOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/charts';

const fmt = (v: number) => v.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

interface IProps {
  liquidity: {
    rsBalance: number;
    obsBalance: number;
    rsFact: number;
    obsFact: number;
  };
}

export const BddsLiquidityCards: FC<IProps> = ({ liquidity }) => {
  const { rsBalance, obsBalance, rsFact, obsFact } = liquidity;
  const totalPlan = rsBalance + obsBalance;
  const totalFact = rsFact + obsFact;

  const hasData = totalPlan !== 0 || totalFact !== 0;
  if (!hasData) return null;

  // Факт приоритетнее, если есть
  const rsValue = rsFact || rsBalance;
  const obsValue = obsFact || obsBalance;
  const isFactMode = rsFact !== 0 || obsFact !== 0;

  const rsWarning = rsValue <= 0 && obsValue > 0;

  const pieData = [
    { type: 'Р/С (свободный)', value: Math.max(rsValue, 0) },
    { type: 'ОБС (целевой)', value: Math.max(obsValue, 0) },
  ];

  const pieConfig = {
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    innerRadius: 0.6,
    height: 160,
    color: ['#52c41a', '#faad14'],
    label: false as const,
    legend: { position: 'bottom' as const },
    statistic: {
      title: { content: 'Ликвидность', style: { fontSize: '12px' } },
      content: { content: fmt(rsValue + obsValue) + ' ₽', style: { fontSize: '14px' } },
    },
  };

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card size="small" className={rsWarning ? 'bdds-liquidity-card bdds-liquidity-warning' : 'bdds-liquidity-card'}>
            <Statistic
              title={<><BankOutlined /> Доступная ликвидность (р/с)</>}
              value={fmt(rsValue)}
              suffix="₽"
              valueStyle={{ color: rsValue >= 0 ? '#3f8600' : '#cf1322', fontSize: 22 }}
            />
            {isFactMode && rsBalance !== 0 && (
              <div className="bdds-liquidity-plan-hint">План: {fmt(rsBalance)} ₽</div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" className="bdds-liquidity-card">
            <Statistic
              title={<><LockOutlined /> Связанная ликвидность (ОБС)</>}
              value={fmt(obsValue)}
              suffix="₽"
              valueStyle={{ color: '#faad14', fontSize: 22 }}
            />
            {isFactMode && obsBalance !== 0 && (
              <div className="bdds-liquidity-plan-hint">План: {fmt(obsBalance)} ₽</div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" className="bdds-liquidity-card">
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
          description={`Свободный кэш (р/с): ${fmt(rsValue)} ₽, при этом на ОБС заблокировано ${fmt(obsValue)} ₽. Операционные расходы не могут быть покрыты со счёта ОБС.`}
          className="mt-16"
        />
      )}
    </>
  );
};
