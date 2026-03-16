import { useState, useCallback } from 'react';
import { Card, Tabs, Alert } from 'antd';
import { useDashboard } from '../../hooks/useDashboard';
import { useBdrBubbleData } from '../../hooks/useBdrBubbleData';
import { DashboardToolbar } from './DashboardToolbar';
import { BdrDashboard } from './bdr/BdrDashboard';
import { BdrDashboard2 } from './bdr2/BdrDashboard2';
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
  const { data: bubbleData, loading: bubbleLoading, error: bubbleError } = useBdrBubbleData(yearFrom, yearTo);

  if (error || bubbleError) {
    return <Alert type="error" message="Ошибка" description={error || bubbleError} showIcon />;
  }

  const items = [
    {
      key: 'bdr',
      label: 'БДР',
      children: <BdrDashboard data={bdrData} loading={loading} />,
    },
    {
      key: 'bdr2',
      label: 'БДР #2',
      children: <BdrDashboard2 data={bubbleData} loading={bubbleLoading} />,
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
