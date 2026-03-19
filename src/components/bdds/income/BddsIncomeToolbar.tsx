import { Space, Typography, Tag } from 'antd';
import { YearSelect } from '../../common/YearSelect';
import type { Project } from '../../../types/projects';
import type { ExcelImportData } from '../../../types/bddsIncome';
import { ExcelImportButton } from './ExcelImportButton';

interface IProps {
  projects: Project[];
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null, project: Project | null) => void;
  yearFrom: number;
  yearTo: number;
  onYearFromChange: (year: number) => void;
  onYearToChange: (year: number) => void;
  onImport: (data: ExcelImportData[]) => void;
}

export const BddsIncomeToolbar = ({
  projects,
  selectedProjectId,
  onProjectChange,
  yearFrom,
  yearTo,
  onYearFromChange,
  onYearToChange,
  onImport,
}: IProps) => {
  return (
    <div className="bdr-toolbar">
      <Space className="mb-8" wrap>
        <Typography.Text>с</Typography.Text>
        <YearSelect value={yearFrom} onChange={onYearFromChange} />
        <Typography.Text>по</Typography.Text>
        <YearSelect value={yearTo} onChange={onYearToChange} />
        <ExcelImportButton
          disabled={!selectedProjectId}
          onImport={onImport}
        />
      </Space>
      <div className="dashboard-project-tags">
        <Tag.CheckableTag
          checked={selectedProjectId === null}
          onChange={() => onProjectChange(null, null)}
        >
          Все проекты
        </Tag.CheckableTag>
        {projects.map((p) => (
          <Tag.CheckableTag
            key={p.id}
            checked={selectedProjectId === p.id}
            onChange={(checked) => onProjectChange(checked ? p.id : null, checked ? p : null)}
          >
            {p.name}
          </Tag.CheckableTag>
        ))}
      </div>
    </div>
  );
};
