import type { FC } from 'react';
import { Card } from 'antd';
import { Column } from '@ant-design/charts';
import type { IBdrDashboardData } from '../../../types/dashboard';

interface IProps {
  data: IBdrDashboardData;
}

export const BdrCostStructureChart: FC<IProps> = ({ data }) => {
  const config = {
    data: data.costStructure,
    xField: 'month',
    yField: 'value',
    colorField: 'category',
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
  };

  return (
    <Card title="Структура себестоимости" size="small" className="dashboard-chart-card">
      <Column {...config} height={300} />
    </Card>
  );
};
