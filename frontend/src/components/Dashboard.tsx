import { useState, useEffect } from 'react';
import { Session, Patient } from '../types/index';
import { api, createApiError, type ApiError } from '../api/client';
import { SessionCard } from './SessionCard';
import { SessionForm } from './SessionForm';

export const Dashboard = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [anomaliesOnly, setAnomaliesOnly] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [scheduleResponse, patientsResponse] = await Promise.all([
        api.getTodaySchedule(selectedUnit || undefined, anomaliesOnly),
        api.getPatients(),
      ]);
      setSessions(scheduleResponse.sessions);
      setPatients(patientsResponse.patients);
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err) {
        setError((err as ApiError).message);
      } else {
        setError('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [anomaliesOnly, selectedUnit]);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading today's schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dialysis Session Dashboard
          </h1>
          <p className="text-gray-600">Today's schedule and session management</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
            <button
              onClick={loadData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Unit
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Units</option>
                {uniqueUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anomaliesOnly"
                checked={anomaliesOnly}
                onChange={(e) => setAnomaliesOnly(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="anomaliesOnly" className="text-sm font-medium text-gray-700">
                Show only anomalies
              </label>
            </div>
            <button
              onClick={handleAddSession}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              + Add Session
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Not Started</p>
            <p className="text-2xl font-bold text-gray-800">{statusCounts.not_started}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{statusCounts.in_progress}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">{statusCounts.completed}</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg mb-2">No sessions found</p>
            <p className="text-gray-500 text-sm mb-4">
              {anomaliesOnly
                ? 'No sessions with anomalies for today'
                : 'No sessions scheduled for today'}
            </p>
            <button
              onClick={handleAddSession}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add First Session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
