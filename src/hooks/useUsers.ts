import { useState, useEffect, useCallback } from 'react';
import type { PortalUser, PortalUserFormData } from '../types/users';
import * as usersService from '../services/usersService';

interface UseUsersResult {
  users: PortalUser[];
  loading: boolean;
  error: string | null;
  createUser: (data: PortalUserFormData) => Promise<void>;
  updateUser: (id: string, data: PortalUserFormData) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  toggleAccess: (id: string, isActive: boolean) => Promise<void>;
  reload: () => Promise<void>;
}

export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const createUser = useCallback(async (data: PortalUserFormData) => {
    const newUser = await usersService.createUser(data);
    setUsers((prev) => [newUser, ...prev]);
  }, []);

  const updateUser = useCallback(async (id: string, data: PortalUserFormData) => {
    const updated = await usersService.updateUser(id, data);
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    await usersService.deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const toggleAccess = useCallback(async (id: string, isActive: boolean) => {
    await usersService.toggleUserAccess(id, isActive);
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_active: isActive } : u))
    );
  }, []);

  return { users, loading, error, createUser, updateUser, deleteUser, toggleAccess, reload: loadUsers };
}
