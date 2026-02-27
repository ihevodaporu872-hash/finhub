import { useMemo, useState, useRef } from 'react';
import { Table, Button, Space, Popconfirm, Input, Tag } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType, ColumnType } from 'antd/es/table';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import type { Project } from '../../types/projects';

interface IProps {
  projects: Project[];
  loading: boolean;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

export const ProjectsTable = ({ projects, loading, onEdit, onDelete }: IProps) => {
  const [searchTexts, setSearchTexts] = useState<Record<string, string>>({});
  const searchInputRef = useRef<ReturnType<typeof Input.Search> | null>(null);

  const getColumnSearchProps = (
    dataIndex: keyof Project,
    placeholder: string
  ): Partial<ColumnType<Project>> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
      <div className="filter-dropdown" onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInputRef as never}
          placeholder={placeholder}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => {
            confirm();
            setSearchTexts((prev) => ({ ...prev, [dataIndex]: String(selectedKeys[0] || '') }));
          }}
          className="filter-input"
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
            className="w-100"
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
            className="w-100"
          >
            Сбросить
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined className={filtered ? 'filter-icon-active' : ''} />
    ),
    onFilter: (value, record) => {
      const cellValue = record[dataIndex];
      return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
    },
  });

  void searchTexts;

  const columns = useMemo((): ColumnsType<Project> => [
    {
      title: 'Код',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      sorter: (a, b) => a.code.localeCompare(b.code),
      ...getColumnSearchProps('code', 'Поиск по коду'),
    },
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      ...getColumnSearchProps('name', 'Поиск по наименованию'),
    },
    {
      title: 'Связанные наименования',
      dataIndex: 'related_names',
      key: 'related_names',
      width: 220,
      ...getColumnSearchProps('related_names', 'Поиск по связанным'),
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      ...getColumnSearchProps('description', 'Поиск по описанию'),
    },
    {
      title: 'Статус',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      align: 'center',
      filters: [
        { text: 'Активен', value: true },
        { text: 'Не активен', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Активен' : 'Не активен'}
        </Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_: unknown, record: Project) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            title="Редактировать проект"
          />
          <Popconfirm
            title="Удалить проект?"
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
  ], [onEdit, onDelete]);

  return (
    <Table
      dataSource={projects}
      columns={columns}
      rowKey="id"
      loading={loading}
      bordered
      size="middle"
      pagination={{ pageSize: 20, showSizeChanger: true }}
      rowClassName={(record) => (record.is_active ? '' : 'project-row-inactive')}
    />
  );
}
