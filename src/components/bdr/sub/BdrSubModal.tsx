import { useState } from 'react';
import { Modal, Alert, message } from 'antd';
import type { BdrSubEntry, BdrSubEntryFormData, BdrSubType } from '../../../types/bdr';
import { useBdrSub } from '../../../hooks/useBdrSub';
import { BDR_SUB_TYPES } from '../../../utils/bdrConstants';
import { BdrSubToolbar } from './BdrSubToolbar';
import { BdrSubTable } from './BdrSubTable';
import { BdrSubEntryForm } from './BdrSubEntryForm';

interface IProps {
  subType: BdrSubType;
  year: number;
  initialProjectId?: string | null;
  onClose: () => void;
}

export const BdrSubModal = ({ subType, year, initialProjectId, onClose }: IProps) => {
  const {
    entries,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    selectedMonth,
    setSelectedMonth,
    loading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    importFromExcel,
  } = useBdrSub(subType, year, initialProjectId);

  const [formVisible, setFormVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BdrSubEntry | null>(null);

  const title = BDR_SUB_TYPES[subType].title;

  const handleAdd = () => {
    setEditingEntry(null);
    setFormVisible(true);
  };

  const handleEdit = (entry: BdrSubEntry) => {
    setEditingEntry(entry);
    setFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id);
      message.success('Запись удалена');
    } catch {
      message.error('Ошибка удаления');
    }
  };

  const handleSave = async (data: BdrSubEntryFormData) => {
    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, data);
        message.success('Запись обновлена');
      } else {
        await createEntry(data);
        message.success('Запись добавлена');
      }
      setFormVisible(false);
      setEditingEntry(null);
    } catch {
      message.error('Ошибка сохранения');
    }
  };

  return (
    <Modal
      title={title}
      open
      onCancel={onClose}
      footer={null}
      width={1000}
      destroyOnHidden
    >
      {error && <Alert type="error" message={error} className="alert-mb" />}
      <BdrSubToolbar
        subType={subType}
        projects={projects}
        entries={entries}
        selectedProjectId={selectedProjectId}
        selectedMonth={selectedMonth}
        onProjectChange={setSelectedProjectId}
        onMonthChange={setSelectedMonth}
        onAdd={handleAdd}
        onImport={importFromExcel}
        year={year}
      />
      <BdrSubTable
        subType={subType}
        entries={entries}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <BdrSubEntryForm
        visible={formVisible}
        subType={subType}
        projects={projects}
        editingEntry={editingEntry}
        selectedProjectId={selectedProjectId}
        selectedMonth={selectedMonth}
        year={year}
        onSave={handleSave}
        onCancel={() => {
          setFormVisible(false);
          setEditingEntry(null);
        }}
      />
    </Modal>
  );
};
