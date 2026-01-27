
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
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
