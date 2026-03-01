import { useState } from 'react';
import type { Session, Patient, CreateSessionRequest, UpdateSessionRequest } from '../types/index.js';
import { api } from '../api/client.js';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from './Toast.js';

interface SessionFormProps {
  session?: Session | null;
  patients: Patient[];
  onSuccess: () => void;
  onCancel: () => void;
}

type SessionFormData = CreateSessionRequest & Partial<UpdateSessionRequest>;

const VALIDATION_RULES = [
  { field: 'Weight', rule: 'Must be greater than 0 kg' },
  { field: 'Blood Pressure', rule: 'Systolic and Diastolic must be ≥ 0 mmHg' },
  { field: 'Heart Rate', rule: 'Must be ≥ 0 bpm' },
  { field: 'Session Duration', rule: 'Should be between 150-300 minutes (2.5-5 hours)' },
  { field: 'Post-Dialysis BP', rule: 'Systolic BP > 140 mmHg will trigger an anomaly alert' },
  { field: 'Weight Gain', rule: 'Weight gain > 5% of dry weight will trigger an anomaly alert' },
];

export const SessionForm = ({ session, patients, onSuccess, onCancel }: SessionFormProps) => {
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const [showRules, setShowRules] = useState(false);
  
  const [formData, setFormData] = useState<SessionFormData>({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (session) {
        await api.updateSession(session.id, formData as UpdateSessionRequest);
        showSuccess('Session updated successfully!');
      } else {
        await api.createSession(formData as CreateSessionRequest);
        showSuccess('Session created successfully!');
      }
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (err: unknown) {
      let errorMessage = 'Failed to save session';
      
      if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
        const errorLines = errorMessage.split('\n');
        errorLines.forEach((line) => {
          if (line.trim()) {
            showError(line.trim());
          }
        });
      } else {
        showError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateVitals = (timing: 'pre' | 'post', field: string, value: number) => {
    const safeValue = Math.max(0, value || 0);
    setFormData((prev) => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [timing]: {
          ...(prev.vitals?.[timing] || {}),
          [field]: safeValue,
        },
      },
    }));
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-green-600 shadow-2xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-green-400">
                {session ? 'Edit Session' : 'Add New Session'}
              </h2>
              <button
                onClick={() => setShowRules(!showRules)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
              >
                {showRules ? 'Hide' : 'Show'} Rules
              </button>
            </div>

            {showRules && (
              <div className="mb-6 p-4 bg-green-900/50 border-2 border-green-600 rounded-lg">
                <h3 className="text-lg font-bold text-green-400 mb-3">📋 Validation Rules & Guidelines</h3>
                <ul className="space-y-2 text-sm text-green-100">
                  {VALIDATION_RULES.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-400 font-bold">•</span>
                      <span>
                        <strong className="text-green-300">{rule.field}:</strong> {rule.rule}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-green-400 mb-2">
                  Patient *
                </label>
                <select
                  required
                  value={formData.patientId}
                  onChange={(e) => updateField('patientId', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-green-600 rounded-lg text-white focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={!!session}
                >
                  <option value="" className="bg-gray-800">Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.patientId} className="bg-gray-800">
                      {patient.firstName} {patient.lastName} ({patient.patientId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-green-400 mb-2">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => updateField('scheduledDate', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-green-600 rounded-lg text-white focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-green-400 mb-2">
                    Machine ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.machineId}
                    onChange={(e) => updateField('machineId', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-green-600 rounded-lg text-white focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-green-400 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={(e) => updateField('startTime', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-green-600 rounded-lg text-white focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-green-400 mb-2">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime || ''}
                    onChange={(e) => updateField('endTime', e.target.value || undefined)}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-green-600 rounded-lg text-white focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-green-400 mb-2">
                    Pre Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formData.preWeight}
                    onChange={(e) => updateField('preWeight', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-green-600 rounded-lg text-white focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-green-400 mb-2">
                    Post Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.postWeight || ''}
                    onChange={(e) =>
                      updateField('postWeight', e.target.value ? Math.max(0, parseFloat(e.target.value)) : undefined)
                    }
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-green-600 rounded-lg text-white focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-green-400 mb-3">Vitals</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 border-2 border-green-600 p-4 rounded-lg">
                    <h4 className="font-bold text-green-400 mb-3">Pre-Dialysis</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-green-300 block mb-1">Systolic BP (mmHg)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.vitals?.pre?.systolicBP || ''}
                          onChange={(e) =>
                            updateVitals('pre', 'systolicBP', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 bg-gray-900 border border-green-600 rounded text-white text-sm focus:border-green-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-green-300 block mb-1">Diastolic BP (mmHg)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.vitals?.pre?.diastolicBP || ''}
                          onChange={(e) =>
                            updateVitals('pre', 'diastolicBP', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 bg-gray-900 border border-green-600 rounded text-white text-sm focus:border-green-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-green-300 block mb-1">Heart Rate (bpm)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.vitals?.pre?.heartRate || ''}
                          onChange={(e) =>
                            updateVitals('pre', 'heartRate', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 bg-gray-900 border border-green-600 rounded text-white text-sm focus:border-green-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800 border-2 border-green-600 p-4 rounded-lg">
                    <h4 className="font-bold text-green-400 mb-3">Post-Dialysis</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-green-300 block mb-1">Systolic BP (mmHg)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.vitals?.post?.systolicBP || ''}
                          onChange={(e) =>
                            updateVitals('post', 'systolicBP', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 bg-gray-900 border border-green-600 rounded text-white text-sm focus:border-green-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-green-300 block mb-1">Diastolic BP (mmHg)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.vitals?.post?.diastolicBP || ''}
                          onChange={(e) =>
                            updateVitals('post', 'diastolicBP', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 bg-gray-900 border border-green-600 rounded text-white text-sm focus:border-green-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-green-300 block mb-1">Heart Rate (bpm)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.vitals?.post?.heartRate || ''}
                          onChange={(e) =>
                            updateVitals('post', 'heartRate', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 bg-gray-900 border border-green-600 rounded text-white text-sm focus:border-green-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-green-400 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-green-600 rounded-lg text-white focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="not_started" className="bg-gray-800">Not Started</option>
                  <option value="in_progress" className="bg-gray-800">In Progress</option>
                  <option value="completed" className="bg-gray-800">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-green-400 mb-2">Nurse Notes</label>
                <textarea
                  value={formData.nurseNotes || ''}
                  onChange={(e) => updateField('nurseNotes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-green-600 rounded-lg text-white focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/50"
                >
                  {loading ? 'Saving...' : session ? 'Update Session' : 'Create Session'}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-red-500/50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
