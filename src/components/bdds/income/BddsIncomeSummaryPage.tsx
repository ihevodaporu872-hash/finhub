import { useState, useCallback } from 'react';
import { Card, Spin, Alert, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useBddsIncomeSummary } from '../../../hooks/useBddsIncomeSummary';
import { BddsIncomeSummaryTable } from './BddsIncomeSummaryTable';
import { YearSelect } from '../../common/YearSelect';

const currentYear = new Date().getFullYear();

export const BddsIncomeSummaryPage = () => {
  const navigate = useNavigate();
  const [yearFrom, setYearFrom] = useState(currentYear);
  const [yearTo, setYearTo] = useState(currentYear);

  const { summaryRows, monthKeys, loading, error } = useBddsIncomeSummary(yearFrom, yearTo);

  const handleYearFromChange = useCallback((y: number) => {
    setYearFrom(y);
    if (y > yearTo) setYearTo(y);
  }, [yearTo]);

  const handleYearToChange = useCallback((y: number) => {
    setYearTo(y);
    if (y < yearFrom) setYearFrom(y);
  }, [yearFrom]);

  if (error) {
    return <Alert type="error" message="Ошибка" description={error} showIcon />;
  }

  return (
    <Card
      title={
        <span>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/bdds/income')}
            className="mr-8"
          />
          Сводные данные
        </span>
      }
    >
      <div className="bdds-income-toolbar">
        <span>Год с</span>
        <YearSelect value={yearFrom} onChange={handleYearFromChange} />
        <span>Год по</span>
        <YearSelect value={yearTo} onChange={handleYearToChange} />
      </div>
      {loading ? (
        <div className="page-center">
          <Spin size="large" />
        </div>
      ) : (
        <BddsIncomeSummaryTable rows={summaryRows} monthKeys={monthKeys} />
      )}
    </Card>
  );
};
