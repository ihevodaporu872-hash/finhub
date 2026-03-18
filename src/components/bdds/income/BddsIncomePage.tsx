import { useState, useCallback } from 'react';
import { Card, Spin, Alert, message, Button, Tabs } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useBddsIncome } from '../../../hooks/useBddsIncome';
import { useBddsIncomeSummary } from '../../../hooks/useBddsIncomeSummary';
import { BddsIncomeToolbar } from './BddsIncomeToolbar';
import { BddsIncomeTable } from './BddsIncomeTable';
import { BddsIncomeSummaryTable } from './BddsIncomeSummaryTable';
import { YearSelect } from '../../common/YearSelect';
import type { ExcelImportData } from '../../../types/bddsIncome';

const currentYear = new Date().getFullYear();

export const BddsIncomePage = () => {
  const navigate = useNavigate();
  const [yearFrom, setYearFrom] = useState(currentYear);
  const [yearTo, setYearTo] = useState(currentYear);
  const [activeTab, setActiveTab] = useState('schedule');

  const {
    rows,
    monthKeys,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    loading,
    error,
    importData,
  } = useBddsIncome(yearFrom, yearTo);

  const {
    summaryRows,
    monthKeys: summaryMonthKeys,
    loading: summaryLoading,
    error: summaryError,
  } = useBddsIncomeSummary(yearFrom, yearTo);

  const handleYearFromChange = useCallback((y: number) => {
    setYearFrom(y);
    if (y > yearTo) setYearTo(y);
  }, [yearTo]);

  const handleYearToChange = useCallback((y: number) => {
    setYearTo(y);
    if (y < yearFrom) setYearFrom(y);
  }, [yearFrom]);

  const handleImport = async (data: ExcelImportData[]) => {
    if (!selectedProjectId) {
      message.error('Выберите проект для импорта');
      return;
    }
    try {
      await importData(selectedProjectId, data);
      message.success('Данные импортированы');
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : (typeof err === 'object' && err !== null && 'message' in err)
          ? String((err as Record<string, unknown>).message)
          : JSON.stringify(err);
      console.error('Ошибка импорта:', err);
      message.error(`Ошибка импорта: ${msg}`, 10);
    }
  };

  if (error) {
    return <Alert type="error" message="Ошибка" description={error} showIcon />;
  }

  const scheduleContent = (
    <>
      <BddsIncomeToolbar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        yearFrom={yearFrom}
        yearTo={yearTo}
        onYearFromChange={handleYearFromChange}
        onYearToChange={handleYearToChange}
        onImport={handleImport}
      />
      {loading ? (
        <div className="page-center">
          <Spin size="large" />
        </div>
      ) : (
        <BddsIncomeTable rows={rows} monthKeys={monthKeys} />
      )}
    </>
  );

  const summaryContent = (
    <>
      <div className="bdds-income-toolbar">
        <span>Год с</span>
        <YearSelect value={yearFrom} onChange={handleYearFromChange} />
        <span>Год по</span>
        <YearSelect value={yearTo} onChange={handleYearToChange} />
      </div>
      {summaryError ? (
        <Alert type="error" message="Ошибка" description={summaryError} showIcon />
      ) : summaryLoading ? (
        <div className="page-center">
          <Spin size="large" />
        </div>
      ) : (
        <BddsIncomeSummaryTable rows={summaryRows} monthKeys={summaryMonthKeys} />
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
          Плановый график выполнения и финансирования проектов
        </span>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'schedule', label: 'Плановый график', children: scheduleContent },
          { key: 'summary', label: 'Сводные данные', children: summaryContent },
        ]}
      />
    </Card>
  );
};
