export interface Project {
  id: string;
  code: string;
  name: string;
  related_names: string;
  description: string;
  is_active: boolean;
  start_date: string | null;
  gu_return_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectFormData {
  code: string;
  name: string;
  related_names: string;
  description: string;
  is_active: boolean;
}
