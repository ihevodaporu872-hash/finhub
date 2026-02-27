import { Button, Select, Space } from 'antd';
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import type { BdrSubEntry, BdrSubType } from '../../../types/bdr';
import type { Project } from '../../../types/projects';
import { BdrSubExcelImport } from './BdrSubExcelImport';
import type { BdrSubEntryFormData } from '../../../types/bdr';

interface IProps {
  subType: BdrSubType;
  projects: Project[];
  entries: BdrSubEntry[];
  selectedProjectId: string | null;
  onProjectChange: (id: string | null) => void;
  onAdd: () => void;
  onImport: (data: BdrSubEntryFormData[]) => Promise<void>;
}

export const BdrSubToolbar = ({
  subType,
  projects,
  entries,
  selectedProjectId,
  onProjectChange,
  onAdd,
  onImport,
}: IProps) => {
  const handleExport = () => {
    const exportData = entries.map((e, i) => ({
      '№п/п': i + 1,
      'Фирма': e.company,
      'Дата': new Date(e.entry_date).toLocaleDateString('ru-RU'),
      'Содержание': e.description,
      'Сумма': e.amount,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Данные');
    XLSX.writeFile(wb, `export_${subType}.xlsx`);
  };

  return (
    <Space className="mb-16" wrap>
      <Select
        value={selectedProjectId}
        onChange={onProjectChange}
        className="select-project-wide"
        allowClear
        placeholder="Все проекты"
      >
        {projects.map((p) => (
          <Select.Option key={p.id} value={p.id}>
            {p.name}
          </Select.Option>
        ))}
      </Select>
      <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
        Добавить
      </Button>
      <BdrSubExcelImport
        subType={subType}
        projectId={selectedProjectId}
        onImport={onImport}
      />
      <Button icon={<DownloadOutlined />} onClick={handleExport}>
        Экспорт Excel
      </Button>
    </Space>
  );
};
