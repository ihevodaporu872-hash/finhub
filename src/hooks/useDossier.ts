import { useState, useCallback } from 'react';
import { message } from 'antd';
import type {
  ContractDossier,
  ContractDossierFormData,
  IEffectiveDossier,
} from '../types/dossier';
import * as dossierService from '../services/dossierService';

/** Глубокое слияние: ДС перезаписывает только заполненные поля поверх базового договора */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mergeJson = <T extends Record<string, any>>(base: T, amendment: T): T => {
  const result = { ...base };
  for (const key of Object.keys(amendment) as (keyof T)[]) {
    const val = amendment[key];
    if (val !== undefined && val !== null && val !== '' && val !== 0) {
      result[key] = val;
    }
  }
  return result;
};

const buildEffective = (docs: ContractDossier[]): IEffectiveDossier | null => {
  const base = docs.find((d) => d.document_type === 'contract');
  if (!base) return null;

  const amendments = docs
    .filter((d) => d.document_type === 'amendment' && d.is_active)
    .sort((a, b) => (a.document_date ?? '').localeCompare(b.document_date ?? ''));

  let header = { ...base.header_data };
  let bdds = { ...base.bdds_data };
  let bdr = { ...base.bdr_data };
  let penalties = { ...base.penalties_data };

  for (const am of amendments) {
    header = mergeJson(header, am.header_data);
    bdds = mergeJson(bdds, am.bdds_data);
    bdr = mergeJson(bdr, am.bdr_data);
    // Для штрафов: если ДС содержит penalties массив, заменяем полностью
    if (am.penalties_data.penalties?.length > 0) {
      penalties = { ...penalties, ...am.penalties_data };
    } else {
      penalties = mergeJson(penalties, am.penalties_data);
    }
  }

  return { base, amendments, effective: { header, bdds, bdr, penalties } };
};

export const useDossier = () => {
  const [documents, setDocuments] = useState<ContractDossier[]>([]);
  const [effective, setEffective] = useState<IEffectiveDossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadDossier = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      const docs = await dossierService.getDossiersByProject(projectId);
      setDocuments(docs);
      setEffective(buildEffective(docs));
    } catch (err) {
      message.error('Ошибка загрузки досье');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearDossier = useCallback(() => {
    setDocuments([]);
    setEffective(null);
  }, []);

  const saveDossier = useCallback(async (formData: ContractDossierFormData) => {
    setSaving(true);
    try {
      const created = await dossierService.createDossier(formData);
      setDocuments((prev) => {
        const next = [...prev, created];
        setEffective(buildEffective(next));
        return next;
      });
      message.success(
        formData.document_type === 'contract'
          ? 'Базовый договор сохранён'
          : `ДС ${formData.document_number} сохранено`,
      );
      return created;
    } catch (err) {
      message.error('Ошибка сохранения');
      console.error(err);
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateDossier = useCallback(async (id: string, formData: Partial<ContractDossierFormData>) => {
    setSaving(true);
    try {
      const updated = await dossierService.updateDossier(id, formData);
      setDocuments((prev) => {
        const next = prev.map((d) => (d.id === id ? updated : d));
        setEffective(buildEffective(next));
        return next;
      });
      message.success('Документ обновлён');
      return updated;
    } catch (err) {
      message.error('Ошибка обновления');
      console.error(err);
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteDossier = useCallback(async (id: string) => {
    setSaving(true);
    try {
      await dossierService.deleteDossier(id);
      setDocuments((prev) => {
        const next = prev.filter((d) => d.id !== id);
        setEffective(buildEffective(next));
        return next;
      });
      message.success('Документ удалён');
    } catch (err) {
      message.error('Ошибка удаления');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    documents,
    effective,
    loading,
    saving,
    loadDossier,
    clearDossier,
    saveDossier,
    updateDossier,
    deleteDossier,
  };
};
