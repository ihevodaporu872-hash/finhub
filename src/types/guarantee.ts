export type GuaranteeStatus = 'pending' | 'overdue' | 'returned' | 'partial';

export interface GuaranteeFact {
  id: string;
  project_id: string;
  month_key: string;
  fact_amount: number;
  fact_date: string | null;
  note: string;
}

export interface GuaranteeRow {
  projectId: string;
  projectName: string;
  retentionTotal: number;
  planReturnTotal: number;
  factReturnTotal: number;
  status: GuaranteeStatus;
  months: GuaranteeMonthData[];
}

export interface GuaranteeMonthData {
  monthKey: string;
  retentionPlan: number;
  returnPlan: number;
  returnFact: number;
  factDate: string | null;
  status: GuaranteeStatus;
}

export interface GuaranteeFactFormData {
  project_id: string;
  month_key: string;
  fact_amount: number;
  fact_date: string | null;
  note: string;
}
