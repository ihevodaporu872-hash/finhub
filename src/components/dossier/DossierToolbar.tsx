import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Space, Tag, Typography, Button } from 'antd';
import { PlusOutlined, FileAddOutlined } from '@ant-design/icons';
import type { Project } from '../../types/projects';
import type { ContractDossier } from '../../types/dossier';
import * as projectsService from '../../services/projectsService';

interface IProps {
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null, project: Project | null) => void;
  documents: ContractDossier[];
  hasBaseContract: boolean;
  onAddContract: () => void;
  onAddAmendment: () => void;
}

export const DossierToolbar: FC<IProps> = ({
  selectedProjectId,
  onProjectChange,
  documents,
  hasBaseContract,
  onAddContract,
  onAddAmendment,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    projectsService.getProjects().then((data) => {
      setProjects(data.filter((p) => p.is_active));
    });
  }, []);

  const amendments = documents.filter((d) => d.document_type === 'amendment');

  return (
    <div className="dossier-toolbar-section">
      <div className="dashboard-project-tags">
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

      {selectedProjectId && (
        <Space className="dossier-toolbar-actions" wrap>
          {!hasBaseContract && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAddContract}
              size="small"
            >
              Создать базовый договор
            </Button>
          )}
          {hasBaseContract && (
            <Button
              icon={<FileAddOutlined />}
              onClick={onAddAmendment}
              size="small"
            >
              Добавить ДС
            </Button>
          )}
          {amendments.length > 0 && (
            <Typography.Text type="secondary" className="dossier-amendments-count">
              Доп. соглашений: {amendments.length}
            </Typography.Text>
          )}
        </Space>
      )}
    </div>
  );
};
