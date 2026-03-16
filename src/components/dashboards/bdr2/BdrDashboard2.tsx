import type { FC } from 'react';
import { Empty, Spin } from 'antd';
import { BdrBubbleChart } from './BdrBubbleChart';
import type { IBubbleDataPoint } from '../../../types/dashboard';

interface IProps {
  data: IBubbleDataPoint[];
  loading: boolean;
}

export const BdrDashboard2: FC<IProps> = ({ data, loading }) => {
  if (loading) return <Spin size="large" className="dashboard-spin" />;
  if (!data.length) return <Empty description="Нет данных по проектам" />;

  return (
    <div>
      <BdrBubbleChart data={data} />
    </div>
  );
};
