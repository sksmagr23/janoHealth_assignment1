export interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  dryWeight: number;
  unit: string;
}

export interface Vitals {
  systolicBP: number;
  diastolicBP: number;
  heartRate?: number;
  temperature?: number;
}

export interface Session {
  id: string;
  patientId: string;
  patient?: {
    firstName: string;
    lastName: string;
    dryWeight: number;
    unit: string;
  };
  scheduledDate: string;
  startTime: string;
  endTime?: string;
  preWeight: number;
  postWeight?: number;
  vitals?: {
    pre?: Vitals;
    post?: Vitals;
  };
  machineId: string;
  nurseNotes?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  anomalies: string[];
  hasAnomalies: boolean;
}

export interface TodayScheduleResponse {
  date: string;
  count: number;
  sessions: Session[];
}

export interface CreatePatientRequest {
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  dryWeight: number;
  unit: string;
}

export interface CreateSessionRequest {
  patientId: string;
  scheduledDate: string;
  startTime: string;
  endTime?: string;
  preWeight: number;
  postWeight?: number;
  vitals?: {
    pre?: Vitals;
    post?: Vitals;
  };
  machineId: string;
  nurseNotes?: string;
  status?: 'not_started' | 'in_progress' | 'completed';
}

export interface UpdateSessionRequest {
  nurseNotes?: string;
  endTime?: string;
  postWeight?: number;
  vitals?: {
    pre?: Vitals;
    post?: Vitals;
  };
  status?: 'not_started' | 'in_progress' | 'completed';
}
