export type Role = 'USER' | 'MANAGER' | 'ADMIN';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED';

export type ActivityAction = 'CREATED' | 'ASSIGNED' | 'STATUS_CHANGED' | 'COMMENTED' | 'UPDATED';

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  name: string | null;
  email: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string | null;
  severity: Severity;
  status: IncidentStatus;
  createdById: string;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserSummary;
  assignedTo?: UserSummary | null;
  activities?: IncidentActivity[];
}

export interface IncidentActivity {
  id: string;
  action: ActivityAction;
  message: string;
  incidentId: string;
  createdById: string;
  createdAt: string;
  createdBy?: UserSummary;
}

export interface CreateIncidentInput {
  title: string;
  description?: string;
  severity: Severity;
  assignedToId?: string;
}

export interface UpdateIncidentInput {
  title?: string;
  description?: string;
  severity?: Severity;
  status?: IncidentStatus;
  assignedToId?: string;
}

export interface AddActivityInput {
  action: ActivityAction;
  message: string;
}

export interface IncidentStats {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  critical: number;
  assignedToMe: number;
}

export const SEVERITY_ORDER: Record<Severity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  LOW: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
};

export const STATUS_COLORS: Record<IncidentStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
  INVESTIGATING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300',
};

export const ACTIVITY_ICONS: Record<ActivityAction, string> = {
  CREATED: '📝',
  ASSIGNED: '👤',
  STATUS_CHANGED: '🔄',
  COMMENTED: '💬',
  UPDATED: '✏️',
};