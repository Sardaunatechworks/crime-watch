
export enum UserRole {
  REPORTER = 'REPORTER',
  ADMIN = 'ADMIN'
}

export enum IncidentStatus {
  PENDING = 'PENDING',
  UNDER_INVESTIGATION = 'UNDER_INVESTIGATION',
  RESOLVED = 'RESOLVED'
}

export interface StatusUpdate {
  status: IncidentStatus;
  changed_at: string;
  note?: string;
}

export interface IncidentImage {
  id: string;
  incident_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  preview?: string; // Local preview URL (blob)
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface Incident {
  id: string;
  reporter_id: string;
  reporter_email?: string;
  title: string;
  category: string;
  location: string;
  description: string;
  status: IncidentStatus;
  created_at: string;
  last_updated_at: string;
  status_history: StatusUpdate[];
  images?: IncidentImage[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
