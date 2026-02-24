export interface Project {
  id: string;
  code: string;
  name: string;
  related_names: string;
  description: string;
  is_active: boolean;
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
