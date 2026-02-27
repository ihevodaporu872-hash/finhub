import { useState } from 'react';
import { Card, Alert, message } from 'antd';
import { useBdr } from '../../hooks/useBdr';
import { BdrToolbar } from './BdrToolbar';
import { BdrTable } from './BdrTable';
import { BdrSubModal } from './sub/BdrSubModal';

export const BdrPage = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const {
    rows,
    loading,
    saving,
    error,
    overheadExpanded,
    toggleOverhead,
    updateEntry,
    saveAll,
    openSubType,
    setOpenSubType,
    reload,
  } = useBdr(year);

  const handleSave = async () => {
    try {
      await saveAll();
      message.success('Данные сохранены');
    } catch {
      message.error('Ошибка сохранения');
    }
  };

  const handleSubClose = () => {
    setOpenSubType(null);
    reload();
  };

  if (error) {
    return <Alert type="error" message="Ошибка" description={error} showIcon />;
  }

  return (
    <>
      <Card title="БДР — Бюджет Доходов и Расходов" loading={loading}>
        <BdrToolbar
          year={year}
          onYearChange={setYear}
          onSave={handleSave}
          saving={saving}
        />
        <BdrTable
          rows={rows}
          overheadExpanded={overheadExpanded}
          onToggleOverhead={toggleOverhead}
          onUpdatePlan={(code, month, amount) => updateEntry(code, month, amount, 'plan')}
          onUpdateFact={(code, month, amount) => updateEntry(code, month, amount, 'fact')}
          onOpenSub={setOpenSubType}
        />
      </Card>
      {openSubType && (
        <BdrSubModal
          subType={openSubType}
          year={year}
          onClose={handleSubClose}
        />
      )}
    </>
  );
};
