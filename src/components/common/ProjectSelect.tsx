import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Select } from 'antd';
import type { Project } from '../../types/projects';
import * as projectsService from '../../services/projectsService';

interface IProps {
  value: string | null;
  onChange: (projectId: string | null) => void;
}

export const ProjectSelect: FC<IProps> = ({ value, onChange }) => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    projectsService.getProjects().then((data) => {
      setProjects(data.filter((p) => p.is_active));
    });
  }, []);

  const options = [
    { value: '__all__', label: 'Все проекты' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <Select
      value={value ?? '__all__'}
      onChange={(val) => onChange(val === '__all__' ? null : val)}
      options={options}
      className="select-project"
      placeholder="Выберите проект"
    />
  );
};
