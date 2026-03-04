import { useState, useCallback } from 'react';
import { Card, Tabs, Alert } from 'antd';
import { useDashboard } from '../../hooks/useDashboard';
import { DashboardToolbar } from './DashboardToolbar';
import { BdrDashboard } from './bdr/BdrDashboard';
import { BddsDashboard } from './bdds/BddsDashboard';

const currentYear = new Date().getFullYear();

export const DashboardPage = () => {
  const [yearFrom, setYearFrom] = useState(currentYear);
  const [yearTo, setYearTo] = useState(currentYear);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleYearFromChange = useCallback((y: number) => {
    setYearFrom(y);
    if (y > yearTo) setYearTo(y);
  }, [yearTo]);

  const handleYearToChange = useCallback((y: number) => {
    setYearTo(y);
    if (y < yearFrom) setYearFrom(y);
  }, [yearFrom]);

  const { bdrData, bddsData, loading, error } = useDashboard(yearFrom, yearTo, selectedProjectId);

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
        yearFrom={yearFrom}
        yearTo={yearTo}
        onYearFromChange={handleYearFromChange}
        onYearToChange={handleYearToChange}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />
      <Tabs items={items} defaultActiveKey="bdr" />
    </Card>
  );
};
