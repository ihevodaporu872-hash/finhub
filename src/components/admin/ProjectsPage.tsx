import { useState } from 'react';
import { Card, Button, Alert, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useProjects } from '../../hooks/useProjects';
import { ProjectsTable } from './ProjectsTable';
import { ProjectEditModal } from './ProjectEditModal';
import type { Project, ProjectFormData } from '../../types/projects';

export function ProjectsPage() {
  const { projects, loading, error, createProject, updateProject, deleteProject } = useProjects();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const handleSave = async (data: ProjectFormData) => {
    try {
      setSaving(true);
      if (editingProject) {
        await updateProject(editingProject.id, data);
        message.success('Проект обновлён');
      } else {
        await createProject(data);
        message.success('Проект добавлен');
      }
      setModalOpen(false);
      setEditingProject(null);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id);
      message.success('Проект удалён');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  if (error) {
    return <Alert type="error" message="Ошибка" description={error} showIcon />;
  }

  return (
    <Card
      title="Проекты"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Добавить проект
        </Button>
      }
    >
      <ProjectsTable
        projects={projects}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <ProjectEditModal
        open={modalOpen}
        project={editingProject}
        loading={saving}
        onSave={handleSave}
        onCancel={() => {
          setModalOpen(false);
          setEditingProject(null);
        }}
      />
    </Card>
  );
}
