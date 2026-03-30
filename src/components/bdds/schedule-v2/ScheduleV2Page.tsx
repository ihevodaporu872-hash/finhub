import { useState, useCallback, useEffect } from 'react';
import { Card, Spin, Alert, Tabs, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useScheduleV2 } from '../../../hooks/useScheduleV2';
import { ScheduleV2Toolbar } from './ScheduleV2Toolbar';
import { ScheduleV2CostTable } from './ScheduleV2CostTable';
import { ScheduleV2MonthlyTable } from './ScheduleV2MonthlyTable';
import type { Project } from '../../../types/projects';

export const ScheduleV2Page = () => {
  const navigate = useNavigate();
  const [yearFrom, setYearFrom] = useState(2026);
  const [yearTo, setYearTo] = useState(2028);
  const [activeTab, setActiveTab] = useState('cost');

  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    costRows,
    monthlyRows,
    monthKeys,
    loading,
    error,
  } = useScheduleV2(yearFrom, yearTo);

  // Автоподстройка годов при автовыборе проекта
  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find((p) => p.id === selectedProjectId);
      if (project?.start_date) setYearFrom(new Date(project.start_date).getFullYear());
      if (project?.gu_return_date) setYearTo(new Date(project.gu_return_date).getFullYear());
    }
  }, [selectedProjectId, projects]);

  const handleYearFromChange = useCallback((y: number) => {
    setYearFrom(y);
    if (y > yearTo) setYearTo(y);
  }, [yearTo]);

  const handleYearToChange = useCallback((y: number) => {
    setYearTo(y);
    if (y < yearFrom) setYearFrom(y);
  }, [yearFrom]);

  const handleProjectChange = useCallback((projectId: string | null, project: Project | null) => {
    setSelectedProjectId(projectId);
    if (project?.start_date) {
      setYearFrom(new Date(project.start_date).getFullYear());
    }
    if (project?.gu_return_date) {
      setYearTo(new Date(project.gu_return_date).getFullYear());
    } else if (project?.start_date) {
      setYearTo(new Date(project.start_date).getFullYear() + 2);
    }
  }, [setSelectedProjectId]);

  if (error) {
    return <Alert type="error" message="Ошибка" description={error} showIcon />;
  }

  const costContent = (
    <>
      <ScheduleV2Toolbar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={handleProjectChange}
        yearFrom={yearFrom}
        yearTo={yearTo}
        onYearFromChange={handleYearFromChange}
        onYearToChange={handleYearToChange}
      />
      {loading ? (
        <div className="page-center"><Spin size="large" /></div>
      ) : (
        <ScheduleV2CostTable rows={costRows} />
      )}
    </>
  );

  const monthlyContent = (
    <>
      <div className="bdds-income-toolbar">
        <ScheduleV2Toolbar
          projects={projects}
          selectedProjectId={selectedProjectId}
          onProjectChange={handleProjectChange}
          yearFrom={yearFrom}
          yearTo={yearTo}
          onYearFromChange={handleYearFromChange}
          onYearToChange={handleYearToChange}
        />
      </div>
      {loading ? (
        <div className="page-center"><Spin size="large" /></div>
      ) : (
        <ScheduleV2MonthlyTable rows={monthlyRows} monthKeys={monthKeys} />
      )}
    </>
  );

  return (
    <Card
      title={
        <span>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/bdds')}
            className="mr-8"
          />
          Плановый график 2.0
        </span>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'cost', label: 'Расчёт стоимости', children: costContent },
          { key: 'monthly', label: 'Помесячный план', children: monthlyContent },
        ]}
      />
    </Card>
  );
};
