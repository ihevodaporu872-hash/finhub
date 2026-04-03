import { supabase } from '../config/supabase';
import type { BdrSubType } from '../types/bdr';
import { BDR_SUB_TYPES, DIRECT_COST_ROW_CODES } from '../utils/bdrConstants';

/** Результат проверки бюджетного лимита */
export interface IBudgetCheckResult {
  allowed: boolean;
  planTotal: number;
  factTotal: number;
  remaining: number;
  message?: string;
}

/** Результат проверки опережающего закрытия */
export interface IReadinessCheckResult {
  allowed: boolean;
  paymentPercent: number;
  readinessPercent: number;
  message?: string;
}

const DIRECT_COST_SUB_TYPES: BdrSubType[] = ['materials', 'labor', 'subcontract', 'design', 'rental'];

/**
 * Strict Limits: проверка остатка плана по строке узла II перед созданием записи.
 * Возвращает allowed=false если сумма превышает остаток.
 */
export async function checkBudgetLimit(
  subType: BdrSubType,
  amount: number,
  projectId: string | null,
  excludeEntryId?: string
): Promise<IBudgetCheckResult> {
  // Проверяем только прямую себестоимость (узел II)
  if (!DIRECT_COST_SUB_TYPES.includes(subType)) {
    return { allowed: true, planTotal: 0, factTotal: 0, remaining: 0 };
  }

  const rowCode = BDR_SUB_TYPES[subType]?.rowCode;
  if (!rowCode) {
    return { allowed: true, planTotal: 0, factTotal: 0, remaining: 0 };
  }

  // Получаем суммарный план по строке (все годы)
  let planQuery = supabase
    .from('bdr_entries')
    .select('amount')
    .eq('row_code', rowCode)
    .eq('entry_type', 'plan');

  if (projectId) {
    planQuery = planQuery.eq('project_id', projectId);
  }

  const { data: planData, error: planError } = await planQuery;
  if (planError) throw planError;

  const planTotal = planData.reduce((sum, e) => sum + Number(e.amount), 0);

  // Если план = 0, пропускаем проверку (план не заведён)
  if (planTotal === 0) {
    return { allowed: true, planTotal: 0, factTotal: 0, remaining: 0 };
  }

  // Получаем суммарный факт из sub_entries
  let factQuery = supabase
    .from('bdr_sub_entries')
    .select('id, amount')
    .eq('sub_type', subType);

  if (projectId) {
    factQuery = factQuery.eq('project_id', projectId);
  }

  const { data: factData, error: factError } = await factQuery;
  if (factError) throw factError;

  const factTotal = factData
    .filter((e) => e.id !== excludeEntryId)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const remaining = planTotal - factTotal;
  const allowed = amount <= remaining;

  return {
    allowed,
    planTotal,
    factTotal,
    remaining,
    message: allowed
      ? undefined
      : `Сумма ${amount.toLocaleString('ru-RU')} превышает остаток бюджета ${remaining.toLocaleString('ru-RU')} (план: ${planTotal.toLocaleString('ru-RU')}, факт: ${factTotal.toLocaleString('ru-RU')})`,
  };
}

/**
 * Hard Block: проверка % оплат по статье vs % физической готовности.
 * Блокирует если % оплат опережает % готовности.
 */
export async function checkReadinessBlock(
  subType: BdrSubType,
  amount: number,
  projectId: string,
  excludeEntryId?: string
): Promise<IReadinessCheckResult> {
  if (!DIRECT_COST_SUB_TYPES.includes(subType)) {
    return { allowed: true, paymentPercent: 0, readinessPercent: 0 };
  }

  const rowCode = BDR_SUB_TYPES[subType]?.rowCode;
  if (!rowCode) {
    return { allowed: true, paymentPercent: 0, readinessPercent: 0 };
  }

  // План по статье
  const { data: planData } = await supabase
    .from('bdr_entries')
    .select('amount')
    .eq('row_code', rowCode)
    .eq('entry_type', 'plan')
    .eq('project_id', projectId);

  const planTotal = (planData || []).reduce((sum, e) => sum + Number(e.amount), 0);
  if (planTotal === 0) {
    return { allowed: true, paymentPercent: 0, readinessPercent: 0 };
  }

  // Факт по статье
  let factQuery = supabase
    .from('bdr_sub_entries')
    .select('id, amount')
    .eq('sub_type', subType)
    .eq('project_id', projectId);

  const { data: factData } = await factQuery;
  const factTotal = (factData || [])
    .filter((e) => e.id !== excludeEntryId)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const paymentPercent = ((factTotal + amount) / planTotal) * 100;

  // Получаем % физической готовности из трекера КС-6а
  const { data: readinessData } = await supabase
    .from('ks6a_entries')
    .select('readiness_percent')
    .eq('project_id', projectId)
    .order('entry_date', { ascending: false })
    .limit(1);

  const readinessPercent = readinessData?.[0]?.readiness_percent || 0;

  // Если нет данных о готовности — не блокируем (трекер не заполнен)
  if (readinessPercent === 0) {
    return { allowed: true, paymentPercent, readinessPercent: 0 };
  }

  const allowed = paymentPercent <= readinessPercent;

  return {
    allowed,
    paymentPercent,
    readinessPercent,
    message: allowed
      ? undefined
      : `Оплата ${paymentPercent.toFixed(1)}% опережает физическую готовность ${readinessPercent.toFixed(1)}%. Операция заблокирована.`,
  };
}

/**
 * Проверка бюджета для договоров (Soft Commit).
 * Возвращает остаток по статье с учётом зарезервированных сумм.
 */
export async function checkContractBudget(
  subType: BdrSubType,
  contractAmount: number,
  projectId: string,
  excludeContractId?: string
): Promise<IBudgetCheckResult> {
  const rowCode = BDR_SUB_TYPES[subType]?.rowCode;
  if (!rowCode) {
    return { allowed: true, planTotal: 0, factTotal: 0, remaining: 0 };
  }

  // План
  const { data: planData } = await supabase
    .from('bdr_entries')
    .select('amount')
    .eq('row_code', rowCode)
    .eq('entry_type', 'plan')
    .eq('project_id', projectId);

  const planTotal = (planData || []).reduce((sum, e) => sum + Number(e.amount), 0);

  // Факт (оплаченные)
  const { data: factData } = await supabase
    .from('bdr_sub_entries')
    .select('amount')
    .eq('sub_type', subType)
    .eq('project_id', projectId);

  const factTotal = (factData || []).reduce((sum, e) => sum + Number(e.amount), 0);

  // Зарезервированные суммы из договоров (soft commit)
  let commitQuery = supabase
    .from('bdr_contracts')
    .select('id, amount')
    .eq('bdr_sub_type', subType)
    .eq('project_id', projectId)
    .eq('status', 'active');

  const { data: commitData } = await commitQuery;
  const committedTotal = (commitData || [])
    .filter((c) => c.id !== excludeContractId)
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const remaining = planTotal - factTotal - committedTotal;
  const allowed = contractAmount <= remaining;

  return {
    allowed,
    planTotal,
    factTotal,
    remaining,
    message: allowed
      ? undefined
      : `Сумма договора ${contractAmount.toLocaleString('ru-RU')} превышает свободный остаток ${remaining.toLocaleString('ru-RU')} (план: ${planTotal.toLocaleString('ru-RU')}, факт: ${factTotal.toLocaleString('ru-RU')}, резерв: ${committedTotal.toLocaleString('ru-RU')})`,
  };
}
