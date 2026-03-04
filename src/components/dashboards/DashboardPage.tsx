import { useState } from 'react';
import { Card, Tabs, Alert } from 'antd';
import { useDashboard } from '../../hooks/useDashboard';
import { DashboardToolbar } from './DashboardToolbar';
import { BdrDashboard } from './bdr/BdrDashboard';
import { BddsDashboard } from './bdds/BddsDashboard';

export const DashboardPage = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { bdrData, bddsData, loading, error } = useDashboard(year, selectedProjectId);

  if (error) {
    return <Alert type="error" message="Ошибка" description={error} showIcon />;
  }

  const items = [
    {
      key: 'bdr',
      label: 'БДР',
      children: <BdrDashboard data={bdrData} loading={loading} />,
    },
    {
      key: 'bdds',
      label: 'БДДС',
      children: <BddsDashboard data={bddsData} loading={loading} />,
    },
  ];

  return (
    <Card title="Дашборды">
      <DashboardToolbar
        year={year}
        onYearChange={setYear}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />
      <Tabs items={items} defaultActiveKey="bdr" />
    </Card>
  );
};
