import type { FC } from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { IBdrDashboardData } from '../../../types/dashboard';

const fmt = (v: number) => v.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
const fmtPct = (v: number) => v.toFixed(1) + '%';

interface IProps {
  data: IBdrDashboardData;
}

export const BdrKpiCards: FC<IProps> = ({ data }) => {
  const { kpis } = data;
  const revDiff = kpis.revenueFact - kpis.revenuePlan;
  const revPositive = revDiff >= 0;

  return (
    <Row gutter={[16, 16]} className="dashboard-kpi-row">
      <Col xs={12} md={6}>
        <Card size="small">
          <Statistic
            title="Выручка (факт)"
            value={fmt(kpis.revenueFact)}
            suffix={
              kpis.revenuePlan ? (
                <span className={revPositive ? 'dashboard-kpi-positive' : 'dashboard-kpi-negative'}>
                  {revPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {' '}{fmt(Math.abs(revDiff))}
                </span>
              ) : null
            }
          />
        </Card>
      </Col>
      <Col xs={12} md={6}>
        <Card size="small">
          <Statistic
            title="Маржинальная прибыль"
            value={fmt(kpis.marginalProfit)}
            valueStyle={{ color: kpis.marginalProfit >= 0 ? '#3f8600' : '#cf1322' }}
          />
        </Card>
      </Col>
      <Col xs={12} md={6}>
        <Card size="small">
          <Statistic
            title="Операционная прибыль"
            value={fmt(kpis.operatingProfit)}
            valueStyle={{ color: kpis.operatingProfit >= 0 ? '#3f8600' : '#cf1322' }}
          />
        </Card>
      </Col>
      <Col xs={12} md={6}>
        <Card size="small">
          <Statistic
            title="Рентабельность"
            value={fmtPct(kpis.operatingProfitPct)}
            valueStyle={{ color: kpis.operatingProfitPct >= 0 ? '#3f8600' : '#cf1322' }}
          />
        </Card>
      </Col>
    </Row>
  );
};
