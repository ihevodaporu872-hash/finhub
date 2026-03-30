import { Tag, Space } from 'antd';
import { YearSelect } from '../../common/YearSelect';
import type { Project } from '../../../types/projects';

interface IProps {
  projects: Project[];
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null, project: Project | null) => void;
  yearFrom: number;
  yearTo: number;
  onYearFromChange: (year: number) => void;
  onYearToChange: (year: number) => void;
}

export const ScheduleV2Toolbar = ({
  projects,
  selectedProjectId,
  onProjectChange,
  yearFrom,
  yearTo,
  onYearFromChange,
  onYearToChange,
}: IProps) => {
  return (
    <div className="bdds-income-toolbar">
      <Space wrap size="small">
        <span>Год с</span>
        <YearSelect value={yearFrom} onChange={onYearFromChange} />
        <span>Год по</span>
        <YearSelect value={yearTo} onChange={onYearToChange} />
      </Space>
      <div className="bdds-income-projects">
        <Tag
          color={!selectedProjectId ? 'blue' : undefined}
          onClick={() => onProjectChange(null, null)}
          className="bdds-income-project-tag"
        >
          Все проекты
        </Tag>
        {projects.map((p) => (
          <Tag
            key={p.id}
            color={selectedProjectId === p.id ? 'blue' : undefined}
            onClick={() => onProjectChange(p.id, p)}
            className="bdds-income-project-tag"
          >
            {p.name}
          </Tag>
        ))}
      </div>
    </div>
  );
};
