import { useState } from 'react';
import { Card, Spin, Alert, message } from 'antd';
import { useBdds } from '../../hooks/useBdds';
import { BddsToolbar } from './BddsToolbar';
import { BddsTable } from './BddsTable';

export function BddsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { sections, loading, saving, error, updateFactEntry, saveAll } = useBdds(year);

  const handleSave = async () => {
    try {
      await saveAll();
      message.success('Данные сохранены');
    } catch {
      message.error('Ошибка при сохранении');
    }
  };

  if (error) {
    return <Alert type="error" message="Ошибка" description={error} showIcon />;
  }

  return (
    <Card title="БДДС — Бюджет движения денежных средств">
      <BddsToolbar
        year={year}
        onYearChange={setYear}
        onSave={handleSave}
        saving={saving}
      />
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : (
        <BddsTable sections={sections} onUpdateFact={updateFactEntry} />
      )}
    </Card>
  );
}
