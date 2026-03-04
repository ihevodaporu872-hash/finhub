import type { FC } from 'react';
import { Card } from 'antd';
import { Gauge } from '@ant-design/charts';
import type { IBdrDashboardData } from '../../../types/dashboard';

interface IProps {
  data: IBdrDashboardData;
}

export const BdrMarginGauge: FC<IProps> = ({ data }) => {
  const percent = Math.max(0, Math.min(data.marginPercent / 100, 1));

  const config = {
    percent,
    range: {
      color: ['#cf1322', '#faad14', '#3f8600'],
      width: 12,
    },
    indicator: {
      pointer: { style: { stroke: '#D0D0D0' } },
      pin: { style: { stroke: '#D0D0D0' } },
    },
    statistic: {
      content: {
        formatter: () => data.marginPercent.toFixed(1) + '%',
        style: { fontSize: '24px', color: '#333' },
      },
      title: {
        formatter: () => 'Маржинальность',
        style: { fontSize: '14px', color: '#999' },
      },
    },
  };

  return (
    <Card title="Маржинальность" size="small" className="dashboard-chart-card">
      <Gauge {...config} height={300} />
    </Card>
  );
};
