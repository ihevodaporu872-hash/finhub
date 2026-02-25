import { Select, Space } from 'antd';
import type { Project } from '../../../types/projects';
import type { ExcelImportData } from '../../../types/bddsIncome';
import { ExcelImportButton } from './ExcelImportButton';

interface Props {
  projects: Project[];
  selectedProjectId: string | null;
  onProjectChange: (id: string | null) => void;
  onImport: (data: ExcelImportData[]) => void;
}

export function BddsIncomeToolbar({
  projects,
  selectedProjectId,
  onProjectChange,
  onImport,
}: Props) {
  const options = [
    { value: '__all__', label: 'Все проекты' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <Space style={{ marginBottom: 16 }} wrap>
      <Select
        value={selectedProjectId ?? '__all__'}
        onChange={(val) => onProjectChange(val === '__all__' ? null : val)}
        options={options}
        style={{ minWidth: 250 }}
        placeholder="Выберите проект"
      />
      <ExcelImportButton
        disabled={!selectedProjectId}
        onImport={onImport}
      />
    </Space>
  );
}
