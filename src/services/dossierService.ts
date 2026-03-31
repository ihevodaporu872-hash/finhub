import { supabase } from '../config/supabase';
import type { ContractDossier, ContractDossierFormData } from '../types/dossier';

export async function getDossiersByProject(projectId: string): Promise<ContractDossier[]> {
  const { data, error } = await supabase
    .from('contract_dossiers')
    .select('*')
    .eq('project_id', projectId)
    .order('document_type', { ascending: true })
    .order('document_date', { ascending: true });

  if (error) throw error;
  return data as ContractDossier[];
}

export async function createDossier(formData: ContractDossierFormData): Promise<ContractDossier> {
  const { data, error } = await supabase
    .from('contract_dossiers')
    .insert(formData)
    .select()
    .single();

  if (error) throw error;
  return data as ContractDossier;
}

export async function updateDossier(
  id: string,
  formData: Partial<ContractDossierFormData>,
): Promise<ContractDossier> {
  const { data, error } = await supabase
    .from('contract_dossiers')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ContractDossier;
}

export async function deleteDossier(id: string): Promise<void> {
  const { error } = await supabase
    .from('contract_dossiers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
