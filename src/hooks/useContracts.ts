import { useState, useEffect, useCallback } from 'react';
import type { IBdrContract, IBdrContractFormData } from '../types/contracts';
import * as contractsService from '../services/contractsService';

interface IUseContractsResult {
  contracts: IBdrContract[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  create: (data: IBdrContractFormData) => Promise<{ success: boolean; budgetMessage?: string }>;
  remove: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useContracts(projectId: string | null): IUseContractsResult {
  const [contracts, setContracts] = useState<IBdrContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contractsService.getContracts(projectId || undefined);
      setContracts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки договоров');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(async (data: IBdrContractFormData) => {
    try {
      setSaving(true);
      const result = await contractsService.createContract(data);
      if (result.success) await load();
      return result;
    } finally {
      setSaving(false);
    }
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await contractsService.deleteContract(id);
    await load();
  }, [load]);

  return { contracts, loading, error, saving, create, remove, reload: load };
}
