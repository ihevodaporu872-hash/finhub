import { useState } from 'react';
import { Card, Button, Alert, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useUsers } from '../../hooks/useUsers';
import { UsersTable } from './UsersTable';
import { UserEditModal } from './UserEditModal';
import type { PortalUser, PortalUserFormData } from '../../types/users';

export function UsersPage() {
  const { users, loading, error, createUser, updateUser, deleteUser, toggleAccess } = useUsers();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PortalUser | null>(null);
  const [saving, setSaving] = useState(false);

  const handleEdit = (user: PortalUser) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleSave = async (data: PortalUserFormData) => {
    try {
      setSaving(true);
      if (editingUser) {
        await updateUser(editingUser.id, data);
        message.success('Пользователь обновлён');
      } else {
        await createUser(data);
        message.success('Пользователь добавлен');
      }
      setModalOpen(false);
      setEditingUser(null);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      message.success('Пользователь удалён');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  const handleToggleAccess = async (id: string, isActive: boolean) => {
    try {
      await toggleAccess(id, isActive);
      message.success(isActive ? 'Доступ разрешён' : 'Доступ запрещён');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Ошибка изменения доступа');
    }
  };

  if (error) {
    return <Alert type="error" message="Ошибка" description={error} showIcon />;
  }

  return (
    <Card
      title="Пользователи"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Добавить пользователя
        </Button>
      }
    >
      <UsersTable
        users={users}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleAccess={handleToggleAccess}
      />
      <UserEditModal
        open={modalOpen}
        user={editingUser}
        loading={saving}
        onSave={handleSave}
        onCancel={() => {
          setModalOpen(false);
          setEditingUser(null);
        }}
      />
    </Card>
  );
}
