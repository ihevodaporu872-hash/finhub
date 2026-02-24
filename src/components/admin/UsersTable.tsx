import { useMemo, useState, useRef } from 'react';
import { Table, Switch, Button, Space, Popconfirm, Input } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType, ColumnType } from 'antd/es/table';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import type { PortalUser } from '../../types/users';

interface Props {
  users: PortalUser[];
  loading: boolean;
  onEdit: (user: PortalUser) => void;
  onDelete: (id: string) => void;
  onToggleAccess: (id: string, isActive: boolean) => void;
}

export function UsersTable({ users, loading, onEdit, onDelete, onToggleAccess }: Props) {
  const [searchTexts, setSearchTexts] = useState<Record<string, string>>({});
  const searchInputRef = useRef<ReturnType<typeof Input.Search> | null>(null);

  const getColumnSearchProps = (
    dataIndex: keyof PortalUser,
    placeholder: string
  ): Partial<ColumnType<PortalUser>> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInputRef as never}
          placeholder={placeholder}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => {
            confirm();
            setSearchTexts((prev) => ({ ...prev, [dataIndex]: String(selectedKeys[0] || '') }));
          }}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => {
              confirm();
              setSearchTexts((prev) => ({ ...prev, [dataIndex]: String(selectedKeys[0] || '') }));
            }}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 100 }}
          >
            Найти
          </Button>
          <Button
            onClick={() => {
              clearFilters?.();
              setSearchTexts((prev) => ({ ...prev, [dataIndex]: '' }));
              confirm();
            }}
            size="small"
            style={{ width: 100 }}
          >
            Сбросить
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
    onFilter: (value, record) => {
      const cellValue = record[dataIndex];
      return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
    },
  });

  void searchTexts; // used for highlighting if needed later

  const columns = useMemo((): ColumnsType<PortalUser> => [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
      ...getColumnSearchProps('email', 'Поиск по email'),
    },
    {
      title: 'ФИО',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 220,
      ...getColumnSearchProps('full_name', 'Поиск по ФИО'),
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      width: 160,
      ...getColumnSearchProps('role', 'Поиск по роли'),
    },
    {
      title: 'Проект',
      dataIndex: 'project',
      key: 'project',
      width: 180,
      ...getColumnSearchProps('project', 'Поиск по проекту'),
    },
    {
      title: 'Дата регистрации',
      dataIndex: 'registered_at',
      key: 'registered_at',
      width: 160,
      sorter: (a, b) => new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime(),
      render: (date: string) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      },
    },
    {
      title: 'Доступ',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 140,
      filters: [
        { text: 'Разрешен', value: true },
        { text: 'Запрещен', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
      render: (isActive: boolean, record: PortalUser) => (
        <Switch
          checked={isActive}
          checkedChildren="Разрешен"
          unCheckedChildren="Запрещен"
          onChange={(checked) => onToggleAccess(record.id, checked)}
        />
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_: unknown, record: PortalUser) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            title="Редактировать пользователя"
          />
          <Popconfirm
            title="Удалить пользователя?"
            description="Это действие нельзя отменить"
            onConfirm={() => onDelete(record.id)}
            okText="Удалить"
            cancelText="Отмена"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Удалить строку"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ], [onEdit, onDelete, onToggleAccess]);

  return (
    <Table
      dataSource={users}
      columns={columns}
      rowKey="id"
      loading={loading}
      bordered
      size="middle"
      pagination={{ pageSize: 20, showSizeChanger: true }}
      rowClassName={(record) => (record.is_active ? '' : 'user-row-disabled')}
    />
  );
}
