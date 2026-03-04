import type { FC } from 'react';
import { useMemo } from 'react';
import { Card } from 'antd';
import { Column } from '@ant-design/charts';
import type { IBdrDashboardData } from '../../../types/dashboard';

interface IProps {
  data: IBdrDashboardData;
}

export const BdrWaterfallChart: FC<IProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const items = data.waterfall;
    const result: Array<{ name: string; value: [number, number]; isTotal: boolean }> = [];

    let running = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isTotal = i === 0 || i === items.length - 1;

      if (isTotal) {
        result.push({ name: item.name, value: [0, Math.abs(item.value)], isTotal: true });
        running = item.value;
      } else {
        const start = running;
        running += item.value;
        result.push({
          name: item.name,
          value: [Math.min(start, running), Math.max(start, running)],
          isTotal: false,
        });
      }
    }
    return result;
  }, [data.waterfall]);

  const config = {
    data: chartData,
    xField: 'name',
    yField: 'value',
    colorField: 'isTotal',
    scale: {
      color: {
        domain: [true, false],
        range: ['#1890ff', '#ff7a45'],
      },
    },
    axis: {
      y: {
        labelFormatter: (v: number) => (v / 1000000).toFixed(1) + 'М',
      },
    },
    tooltip: {
      items: [
        {
          channel: 'y',
          valueFormatter: (v: number) => {
            if (Array.isArray(v)) return '';
            return v.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽';
          },
        },
      ],
    },
    legend: false as const,
  };

  return (
    <Card title="Водопад: от выручки к чистой прибыли" size="small" className="dashboard-chart-card">
      <Column {...config} height={300} />
    </Card>
  );
};
