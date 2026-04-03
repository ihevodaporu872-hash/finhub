import type { BdrSubType } from './bdr';

export type ContractStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface IBdrContract {
  id: string;
  project_id: string;
  bdr_sub_type: BdrSubType;
  contract_number: string;
  contractor_name: string;
  subject: string | null;
  amount: number;
  amount_paid: number;
  status: ContractStatus;
  sign_date: string | null;
  start_date: string | null;
  end_date: string | null;
  overlimit_approved: boolean;
  overlimit_approved_by: string | null;
  overlimit_approved_at: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IBdrContractFormData {
  project_id: string;
  bdr_sub_type: BdrSubType;
  contract_number: string;
  contractor_name: string;
  subject?: string;
  amount: number;
  sign_date?: string;
  start_date?: string;
  end_date?: string;
  note?: string;
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Черновик',
  active: 'Действующий',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  draft: 'default',
  active: 'processing',
  completed: 'success',
  cancelled: 'error',
};

/** Статьи БДР для привязки договора (узел II) */
export const CONTRACT_BDR_TYPES: Array<{ value: BdrSubType; label: string }> = [
  { value: 'materials', label: 'Материальные расходы' },
  { value: 'labor', label: 'ФОТ основных рабочих' },
  { value: 'subcontract', label: 'Субподряд' },
  { value: 'design', label: 'Проектные работы' },
  { value: 'rental', label: 'Аренда БК и подъемников' },
];
