import { useState, useEffect, useCallback } from 'react';
import type { Project, ProjectFormData } from '../types/projects';
import * as projectsService from '../services/projectsService';

interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: string | null;
  createProject: (data: ProjectFormData) => Promise<void>;
  updateProject: (id: string, data: ProjectFormData) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectsService.getProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки проектов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProject = useCallback(async (data: ProjectFormData) => {
    const newProject = await projectsService.createProject(data);
    setProjects((prev) => [...prev, newProject].sort((a, b) => a.code.localeCompare(b.code)));
  }, []);

  const updateProject = useCallback(async (id: string, data: ProjectFormData) => {
    const updated = await projectsService.updateProject(id, data);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? updated : p)).sort((a, b) => a.code.localeCompare(b.code))
    );
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await projectsService.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { projects, loading, error, createProject, updateProject, deleteProject, reload: loadProjects };
}
