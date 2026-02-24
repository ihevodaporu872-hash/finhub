export interface PortalUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  project: string;
  registered_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortalUserFormData {
  email: string;
  full_name: string;
  role: string;
  project: string;
}
