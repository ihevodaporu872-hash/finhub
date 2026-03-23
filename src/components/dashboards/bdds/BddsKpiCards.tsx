import type { FC } from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import type { IBddsDashboardData } from '../../../types/dashboard';

const fmt = (v: number) => v.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

interface IProps {
  data: IBddsDashboardData;
}

export const BddsKpiCards: FC<IProps> = ({ data }) => {
  const { kpis } = data;
  const smrBalance = kpis.planIncomeTotal - kpis.factIncomeTotal;

  return (
    <Row gutter={[16, 16]} className="dashboard-kpi-row">
      <Col xs={12} md={6}>
        <Card size="small">
          <Statistic
            title="ЧДП Основная"
            value={fmt(kpis.ncfOperating)}
            suffix="₽"
            valueStyle={{ color: kpis.ncfOperating >= 0 ? '#3f8600' : '#cf1322' }}
          />
        </Card>
      </Col>
      <Col xs={12} md={6}>
        <Card size="small">
          <Statistic
            title="ЧДП Инвестиционная"
            value={fmt(kpis.ncfInvesting)}
            suffix="₽"
            valueStyle={{ color: kpis.ncfInvesting >= 0 ? '#3f8600' : '#cf1322' }}
          />
        </Card>
      </Col>
      <Col xs={12} md={6}>
        <Card size="small">
          <Statistic
            title="ЧДП Финансовая"
            value={fmt(kpis.ncfFinancing)}
            suffix="₽"
            valueStyle={{ color: kpis.ncfFinancing >= 0 ? '#3f8600' : '#cf1322' }}
          />
        </Card>
      </Col>
      <Col xs={12} md={6}>
        <Card size="small">
          <Statistic
            title="Итого ЧДП"
            value={fmt(kpis.ncfTotal)}
            suffix="₽"
            valueStyle={{ color: kpis.ncfTotal >= 0 ? '#3f8600' : '#cf1322' }}
          />
        </Card>
      </Col>
    </Row>
    <Row gutter={[16, 16]} className="dashboard-kpi-row" style={{ marginTop: 16 }}>
      <Col xs={24} md={8}>
        <Card size="small">
          <Statistic
            title="Итого планируемые поступления за СМР"
            value={fmt(kpis.planIncomeTotal)}
            suffix="₽"
          />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card size="small">
          <Statistic
            title="Поступило за СМР по проекту"
            value={fmt(kpis.factIncomeTotal)}
            suffix="₽"
          />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card size="small">
          <Statistic
            title="Остаток за СМР по проекту"
            value={fmt(smrBalance)}
            suffix="₽"
            valueStyle={{ color: smrBalance >= 0 ? '#3f8600' : '#cf1322' }}
          />
        </Card>
      </Col>
    </Row>
  );
};
