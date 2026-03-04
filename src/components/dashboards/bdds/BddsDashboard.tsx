import type { FC } from 'react';
import { Empty, Spin } from 'antd';
import { BddsKpiCards } from './BddsKpiCards';
import { BddsPlanFactChart } from './BddsPlanFactChart';
import { BddsNcfChart } from './BddsNcfChart';
import type { IBddsDashboardData } from '../../../types/dashboard';

interface IProps {
  data: IBddsDashboardData | null;
  loading: boolean;
}

export const BddsDashboard: FC<IProps> = ({ data, loading }) => {
  if (loading) return <Spin size="large" className="dashboard-spin" />;
  if (!data) return <Empty description="Нет данных" />;

  return (
    <div>
      <BddsKpiCards data={data} />
      <BddsPlanFactChart data={data} />
      <BddsNcfChart data={data} />
    </div>
  );
};
