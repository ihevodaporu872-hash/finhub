import { useState, useEffect, useCallback } from 'react';
import * as etlService from '../services/etlService';
import * as projectsService from '../services/projectsService';
import * as bankAccountsService from '../services/bankAccountsService';
import { getCategories } from '../services/bddsService';
import type { IEtlContractMap, IEtlPaymentMask, IBankAccount } from '../types/etl';
import type { Project } from '../types/projects';
import type { BddsCategory } from '../types/bdds';

interface IUseEtlMappingResult {
  contracts: IEtlContractMap[];
  paymentMasks: IEtlPaymentMask[];
  bankAccounts: IBankAccount[];
  projects: Project[];
  categories: BddsCategory[];
  loading: boolean;
  error: string | null;
  saveContract: (counterparty: string, contract: string, projectId: string, note?: string) => Promise<void>;
  removeContract: (id: string) => Promise<void>;
  saveMask: (mask: Omit<IEtlPaymentMask, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => Promise<void>;
  removeMask: (id: string) => Promise<void>;
  saveBankAccount: (account: Partial<IBankAccount> & { account_number: string; bank_name: string; bik: string }) => Promise<void>;
  removeBankAccount: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useEtlMapping(): IUseEtlMappingResult {
  const [contracts, setContracts] = useState<IEtlContractMap[]>([]);
  const [paymentMasks, setPaymentMasks] = useState<IEtlPaymentMask[]>([]);
  const [bankAccounts, setBankAccounts] = useState<IBankAccount[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<BddsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ct, pm, ba, proj, cats] = await Promise.all([
        etlService.getContractMaps(),
        etlService.getPaymentMasks(),
        bankAccountsService.getAll(),
        projectsService.getProjects(),
        getCategories(),
      ]);
      setContracts(ct);
      setPaymentMasks(pm);
      setBankAccounts(ba);
      setProjects(proj.filter((p) => p.is_active));
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveContract = useCallback(async (counterparty: string, contract: string, projectId: string, note?: string) => {
    await etlService.upsertContractMap(counterparty, contract, projectId, note);
    await loadData();
  }, [loadData]);

  const removeContract = useCallback(async (id: string) => {
    await etlService.deleteContractMap(id);
    await loadData();
  }, [loadData]);

  const saveMask = useCallback(async (mask: Omit<IEtlPaymentMask, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    await etlService.upsertPaymentMask(mask);
    await loadData();
  }, [loadData]);

  const removeMask = useCallback(async (id: string) => {
    await etlService.deletePaymentMask(id);
    await loadData();
  }, [loadData]);

  const saveBankAccount = useCallback(async (account: Partial<IBankAccount> & { account_number: string; bank_name: string; bik: string }) => {
    await bankAccountsService.upsert(account);
    await loadData();
  }, [loadData]);

  const removeBankAccount = useCallback(async (id: string) => {
    await bankAccountsService.remove(id);
    await loadData();
  }, [loadData]);

  return {
    contracts,
    paymentMasks,
    bankAccounts,
    projects,
    categories,
    loading,
    error,
    saveContract,
    removeContract,
    saveMask,
    removeMask,
    saveBankAccount,
    removeBankAccount,
    reload: loadData,
  };
}
