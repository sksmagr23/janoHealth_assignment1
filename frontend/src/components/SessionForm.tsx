import { useState, useEffect } from 'react';
import { Session, Patient, CreateSessionRequest, UpdateSessionRequest } from '../types/index';
import { api } from '../api/client';

interface SessionFormProps {
  session?: Session | null;
  patients: Patient[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const SessionForm = ({ session, patients, onSuccess, onCancel }: SessionFormProps) => {
  const [formData, setFormData] = useState<CreateSessionRequest | UpdateSessionRequest>({
    patientId: session?.patientId || '',
    scheduledDate: session?.scheduledDate
      ? new Date(session.scheduledDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    startTime: session?.startTime
      ? new Date(session.startTime).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    endTime: session?.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : undefined,
    preWeight: session?.preWeight || 0,
    postWeight: session?.postWeight,
    machineId: session?.machineId || '',
    nurseNotes: session?.nurseNotes || '',
    status: session?.status || 'in_progress',
    vitals: session?.vitals || {},
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (session) {
        // Update existing session
        await api.updateSession(session.id, formData as UpdateSessionRequest);
      } else {
        // Create new session
        await api.createSession(formData as CreateSessionRequest);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save session');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateVitals = (timing: 'pre' | 'post', field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [timing]: {
          ...(prev.vitals?.[timing] || {}),
          [field]: value,
        },
      },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {session ? 'Edit Session' : 'Add New Session'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient *
              </label>
              <select
                required
                value={formData.patientId}
                onChange={(e) => updateField('patientId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={!!session}
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.patientId}>
                    {patient.firstName} {patient.lastName} ({patient.patientId})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.scheduledDate}
                  onChange={(e) => updateField('scheduledDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Machine ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.machineId}
                  onChange={(e) => updateField('machineId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startTime}
                  onChange={(e) => updateField('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime || ''}
                  onChange={(e) => updateField('endTime', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pre Weight (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.preWeight}
                  onChange={(e) => updateField('preWeight', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Post Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.postWeight || ''}
                  onChange={(e) =>
                    updateField('postWeight', e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vitals</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="border p-3 rounded">
                  <h4 className="font-medium mb-2">Pre-Dialysis</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-600">Systolic BP</label>
                      <input
                        type="number"
                        value={formData.vitals?.pre?.systolicBP || ''}
                        onChange={(e) =>
                          updateVitals('pre', 'systolicBP', parseInt(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Diastolic BP</label>
                      <input
                        type="number"
                        value={formData.vitals?.pre?.diastolicBP || ''}
                        onChange={(e) =>
                          updateVitals('pre', 'diastolicBP', parseInt(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Heart Rate</label>
                      <input
                        type="number"
                        value={formData.vitals?.pre?.heartRate || ''}
                        onChange={(e) =>
                          updateVitals('pre', 'heartRate', parseInt(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="border p-3 rounded">
                  <h4 className="font-medium mb-2">Post-Dialysis</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-600">Systolic BP</label>
                      <input
                        type="number"
                        value={formData.vitals?.post?.systolicBP || ''}
                        onChange={(e) =>
                          updateVitals('post', 'systolicBP', parseInt(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Diastolic BP</label>
                      <input
                        type="number"
                        value={formData.vitals?.post?.diastolicBP || ''}
                        onChange={(e) =>
                          updateVitals('post', 'diastolicBP', parseInt(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Heart Rate</label>
                      <input
                        type="number"
                        value={formData.vitals?.post?.heartRate || ''}
                        onChange={(e) =>
                          updateVitals('post', 'heartRate', parseInt(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nurse Notes</label>
              <textarea
                value={formData.nurseNotes || ''}
                onChange={(e) => updateField('nurseNotes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : session ? 'Update Session' : 'Create Session'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
