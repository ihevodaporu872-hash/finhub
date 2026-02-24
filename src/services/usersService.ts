import { supabase } from '../config/supabase';
import type { PortalUser, PortalUserFormData } from '../types/users';

export async function getUsers(): Promise<PortalUser[]> {
  const { data, error } = await supabase
    .from('portal_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as PortalUser[];
}

export async function createUser(formData: PortalUserFormData): Promise<PortalUser> {
  const { data, error } = await supabase
    .from('portal_users')
    .insert({
      email: formData.email,
      full_name: formData.full_name,
      role: formData.role,
      project: formData.project,
      registered_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as PortalUser;
}

export async function updateUser(
  id: string,
  formData: PortalUserFormData
): Promise<PortalUser> {
  const { data, error } = await supabase
    .from('portal_users')
    .update({
      email: formData.email,
      full_name: formData.full_name,
      role: formData.role,
      project: formData.project,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as PortalUser;
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase
    .from('portal_users')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function toggleUserAccess(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('portal_users')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}
