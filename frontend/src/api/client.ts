import type {
  Patient,
  Session,
  TodayScheduleResponse,
  CreatePatientRequest,
  CreateSessionRequest,
  UpdateSessionRequest,
} from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiError extends Error {
  status: number;
  details?: any;
}

function createApiError(message: string, status: number, details?: any): ApiError {
  const error = new Error(message) as ApiError;
  error.name = 'ApiError';
  error.status = status;
  error.details = details;
  return error;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      
      let errorMessage = errorData.error || `HTTP ${response.status}`;
      
      if (errorData.errors && typeof errorData.errors === 'object') {
        const validationErrors: string[] = [];
        Object.keys(errorData.errors).forEach((field) => {
          const fieldError = errorData.errors[field];
          if (typeof fieldError === 'string') {
            validationErrors.push(`${field}: ${fieldError}`);
          } else if (fieldError?.message) {
            validationErrors.push(`${field}: ${fieldError.message}`);
          }
        });
        if (validationErrors.length > 0) {
          errorMessage = validationErrors.join('\n');
        }
      } else if (errorData.details) {
        errorMessage = errorData.details;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
      
      throw createApiError(errorMessage, response.status, errorData);
    }

    return await response.json();
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error) {
      throw error;
    }
    throw createApiError(
      error instanceof Error ? error.message : 'Network error',
      0,
      error
    );
  }
}

export const api = {
  // Patients
  async getPatients(unit?: string): Promise<{ patients: Patient[] }> {
    const query = unit ? `?unit=${encodeURIComponent(unit)}` : '';
    return fetchApi<{ patients: Patient[] }>(`/patients${query}`);
  },

  async createPatient(data: CreatePatientRequest): Promise<{ message: string; patient: Patient }> {
    return fetchApi<{ message: string; patient: Patient }>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Sessions
  async getTodaySchedule(unit?: string, anomaliesOnly?: boolean): Promise<TodayScheduleResponse> {
    const params = new URLSearchParams();
    if (unit) params.append('unit', unit);
    if (anomaliesOnly) params.append('anomaliesOnly', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<TodayScheduleResponse>(`/sessions/today${query}`);
  },

  async createSession(data: CreateSessionRequest): Promise<{ message: string; session: Session }> {
    return fetchApi<{ message: string; session: Session }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSession(
    id: string,
    data: UpdateSessionRequest
  ): Promise<{ message: string; session: Session }> {
    return fetchApi<{ message: string; session: Session }>(`/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

export { createApiError, type ApiError };
