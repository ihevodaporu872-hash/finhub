import type { FC } from 'react';
import { Empty, Spin } from 'antd';
import { BddsIncomeComboChart } from '../bdds/BddsIncomeComboChart';
import { BddsReceivablesChart } from './BddsReceivablesChart';
import type { IBddsDashboardData } from '../../../types/dashboard';
import type { IReceivablesPoint } from '../../../hooks/useReceivablesData';

interface IProps {
  data: IBddsDashboardData | null;
  receivablesData: IReceivablesPoint[];
  loading: boolean;
}

export const BddsDashboard2: FC<IProps> = ({ data, receivablesData, loading }) => {
  if (loading) return <Spin size="large" className="dashboard-spin" />;
  if (!data && !receivablesData.length) return <Empty description="Нет данных" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {data && <BddsIncomeComboChart data={data} />}
      {receivablesData.length > 0 && <BddsReceivablesChart data={receivablesData} />}
    </div>
  );
};
