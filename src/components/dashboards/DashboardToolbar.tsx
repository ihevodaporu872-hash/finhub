import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Space, Typography, Tag } from 'antd';
import { YearSelect } from '../common/YearSelect';
import type { Project } from '../../types/projects';
import * as projectsService from '../../services/projectsService';

interface IProps {
  yearFrom: number;
  yearTo: number;
  onYearFromChange: (year: number) => void;
  onYearToChange: (year: number) => void;
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null, project: Project | null) => void;
}

export const DashboardToolbar: FC<IProps> = ({
  yearFrom, yearTo, onYearFromChange, onYearToChange,
  selectedProjectId, onProjectChange,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    projectsService.getProjects().then((data) => {
      setProjects(data.filter((p) => p.is_active));
    });
  }, []);

  return (
    <div className="dashboard-toolbar">
      <Space className="mb-8" wrap>
        <Typography.Text>с</Typography.Text>
        <YearSelect value={yearFrom} onChange={onYearFromChange} />
        <Typography.Text>по</Typography.Text>
        <YearSelect value={yearTo} onChange={onYearToChange} />
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
