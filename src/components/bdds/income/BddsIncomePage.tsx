import { Card, Spin, Alert, message, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useBddsIncome } from '../../../hooks/useBddsIncome';
import { BddsIncomeToolbar } from './BddsIncomeToolbar';
import { BddsIncomeTable } from './BddsIncomeTable';
import type { ExcelImportData } from '../../../types/bddsIncome';

export const BddsIncomePage = () => {
  const navigate = useNavigate();
  const {
    rows,
    monthKeys,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    loading,
    error,
    importData,
  } = useBddsIncome();

  const handleImport = async (data: ExcelImportData[]) => {
    if (!selectedProjectId) {
      message.error('Выберите проект для импорта');
      return;
    }
    try {
      await importData(selectedProjectId, data);
      message.success('Данные импортированы');
    } catch {
      message.error('Ошибка импорта данных');
    }
  };

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
            onClick={() => navigate('/bdds')}
            className="mr-8"
          />
          Плановый график выполнения и финансирования проектов
        </span>
      }
    >
      <BddsIncomeToolbar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        onImport={handleImport}
      />
      {loading ? (
        <div className="page-center">
          <Spin size="large" />
        </div>
      ) : (
        <BddsIncomeTable rows={rows} monthKeys={monthKeys} />
      )}
    </Card>
  );
}
