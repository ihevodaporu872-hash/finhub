import { useState, useEffect, useCallback } from 'react';
import type { IKs6aEntry, IKs6aFormData } from '../types/ks6a';
import * as ks6aService from '../services/ks6aService';

interface IUseKs6aResult {
  entries: IKs6aEntry[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  save: (data: IKs6aFormData) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useKs6a(projectId: string | null): IUseKs6aResult {
  const [entries, setEntries] = useState<IKs6aEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) {
      setEntries([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await ks6aService.getEntries(projectId);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки КС-6а');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (data: IKs6aFormData) => {
    try {
      setSaving(true);
      await ks6aService.upsertEntry(data);
      await load();
    } finally {
      setSaving(false);
    }
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await ks6aService.deleteEntry(id);
    await load();
  }, [load]);

  return { entries, loading, error, saving, save, remove, reload: load };
}
