import { useState, useEffect, useCallback } from 'react';
import type { Session, Patient } from '../types/index.js';
import { api, type ApiError } from '../api/client.js';
import { SessionCard } from './SessionCard.js';
import { SessionForm } from './SessionForm.js';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from './Toast.js';

export const Dashboard = () => {
  const { toasts, showError, showSuccess, removeToast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [anomaliesOnly, setAnomaliesOnly] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [scheduleResponse, patientsResponse] = await Promise.all([
        api.getTodaySchedule(selectedUnit || undefined, anomaliesOnly),
        api.getPatients(),
      ]);
      setSessions(scheduleResponse.sessions);
      setPatients(patientsResponse.patients);
      if (scheduleResponse.sessions.length > 0) {
        showSuccess(`Loaded ${scheduleResponse.sessions.length} session(s)`);
      }
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'status' in err
        ? (err as ApiError).message
        : 'Failed to load data';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [anomaliesOnly, selectedUnit, showError, showSuccess]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (session: Session) => {
    setSelectedSession(session);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedSession(null);
    loadData();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedSession(null);
  };

  const handleAddSession = () => {
    setSelectedSession(null);
    setShowForm(true);
  };

  const uniqueUnits = Array.from(new Set(patients.map((p) => p.unit)));

  const getStatusCounts = () => {
    const counts = {
      not_started: 0,
      in_progress: 0,
      completed: 0,
    };
    sessions.forEach((s) => {
      counts[s.status]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-green-400 text-xl font-semibold">Loading today's schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950 p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-16 w-16"
          />
          <div>
            <h1 className="text-5xl font-bold text-green-400 mb-2 drop-shadow-lg">
              Dialysis Session Dashboard
            </h1>
            <p className="text-green-300 text-lg">
              Today's schedule and session management
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-5 bg-red-900/50 border-2 border-red-600 text-red-200 rounded-xl shadow-lg">
            <p className="font-bold text-lg mb-2">Error</p>
            <p>{error}</p>
            <button
              onClick={loadData}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mb-6 bg-gradient-to-r from-teal-900 to-teal-800 rounded-xl shadow-2xl p-6 border-2 border-green-600">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-bold text-green-400 mb-2">
                Filter by Unit
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-4 py-3 bg-green-900 border-2 border-green-600 rounded-lg text-white focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="" className="bg-green-900">All Units</option>
                {uniqueUnits.map((unit) => (
                  <option key={unit} value={unit} className="bg-green-900">
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="anomaliesOnly"
                checked={anomaliesOnly}
                onChange={(e) => setAnomaliesOnly(e.target.checked)}
                className="w-5 h-5 accent-green-600"
              />
              <label htmlFor="anomaliesOnly" className="text-sm font-semibold text-green-400 cursor-pointer">
                Show only anomalies
              </label>
            </div>
            <button
              onClick={handleAddSession}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-green-500/50"
            >
              + Add Session
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white rounded-lg font-bold transition-all disabled:opacity-50 shadow-lg cursor-pointer"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl shadow-xl p-6 border-2 border-green-600">
            <p className="text-sm text-gray-400 mb-2 font-semibold">Not Started</p>
            <p className="text-4xl font-bold text-green-400">{statusCounts.not_started}</p>
          </div>
          <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl shadow-xl p-6 border-2 border-green-600">
            <p className="text-sm text-green-400 mb-2 font-semibold">In Progress</p>
            <p className="text-4xl font-bold text-green-400">{statusCounts.in_progress}</p>
          </div>
          <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl shadow-xl p-6 border-2 border-green-600">
            <p className="text-sm text-green-400 mb-2 font-semibold">Completed</p>
            <p className="text-4xl font-bold text-green-400">{statusCounts.completed}</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl shadow-2xl p-12 text-center border-2 border-gray-600">
            <p className="text-gray-300 text-2xl mb-3 font-semibold">No sessions found</p>
            <p className="text-gray-400 text-lg mb-6">
              {anomaliesOnly
                ? 'No sessions with anomalies for today'
                : 'No sessions scheduled for today'}
            </p>
            <button
              onClick={handleAddSession}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-green-500/50"
            >
              Add First Session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} onEdit={handleEdit} />
            ))}
          </div>
        )}

        {showForm && (
          <SessionForm
            session={selectedSession}
            patients={patients}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}
      </div>
    </div>
  );
};
