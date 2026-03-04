import type { FC } from 'react';
import { Card } from 'antd';
import { Area } from '@ant-design/charts';
import type { IBddsDashboardData } from '../../../types/dashboard';

interface IProps {
  data: IBddsDashboardData;
}

export const BddsNcfChart: FC<IProps> = ({ data }) => {
  const config = {
    data: data.ncfBySection,
    xField: 'month',
    yField: 'value',
    colorField: 'type',
    stack: true,
    axis: {
      y: {
        labelFormatter: (v: number) => (v / 1000000).toFixed(1) + 'М',
      },
    },
    tooltip: {
      items: [
        {
          channel: 'y',
          valueFormatter: (v: number) => v.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽',
        },
      ],
    },
    interaction: {
      tooltip: { shared: true },
    },
    style: {
      fillOpacity: 0.6,
    },
  };

  return (
    <Card title="ЧДП по секциям" size="small" className="dashboard-chart-card">
      <Area {...config} height={300} />
    </Card>
  );
};
