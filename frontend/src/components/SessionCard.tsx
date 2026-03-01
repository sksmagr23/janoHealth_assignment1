import type { Session } from '../types/index.js';
interface SessionCardProps {
  session: Session;
  onEdit: (session: Session) => void;
}

export const SessionCard = ({ session, onEdit }: SessionCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600 text-white border-green-500';
      case 'in_progress':
        return 'bg-green-500 text-white border-green-400';
      case 'not_started':
        return 'bg-gray-600 text-white border-gray-500';
      default:
        return 'bg-gray-600 text-white border-gray-500';
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDuration = () => {
    if (!session.startTime || !session.endTime) return null;
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div
      className={`rounded-xl p-5 shadow-xl transition-all hover:scale-105 ${
        session.hasAnomalies
          ? 'bg-gradient-to-br from-red-900/80 to-red-800/80 border-2 border-red-600'
          : 'bg-gradient-to-br from-lime-950 to-lime-900 border-2 border-green-600'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-xl text-white mb-1">
            {session.patient?.firstName} {session.patient?.lastName}
          </h3>
          <p className="text-sm text-gray-300">Patient ID: {session.patientId}</p>
          <p className="text-sm text-gray-300">Unit: {session.patient?.unit}</p>
        </div>
        <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${getStatusColor(session.status)}`}>
          {session.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {session.hasAnomalies && (
        <div className="mb-4 p-3 bg-red-900/50 border-2 border-red-500 rounded-lg">
          <p className="text-sm font-bold text-red-200 mb-2 flex items-center gap-2">
            <span className="text-xl">⚠️</span> Anomalies Detected:
          </p>
          <ul className="text-xs text-red-100 list-disc list-inside space-y-1">
            {session.anomalies.map((anomaly, idx) => (
              <li key={idx}>{anomaly}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <p className="text-gray-400 mb-1">Scheduled</p>
          <p className="font-semibold text-white">{formatDate(session.scheduledDate)}</p>
        </div>
        <div>
          <p className="text-gray-400 mb-1">Machine</p>
          <p className="font-semibold text-green-400">{session.machineId}</p>
        </div>
        <div>
          <p className="text-gray-400 mb-1">Start Time</p>
          <p className="font-semibold text-white">{formatTime(session.startTime)}</p>
        </div>
        {session.endTime && (
          <div>
            <p className="text-gray-400 mb-1">End Time</p>
            <p className="font-semibold text-white">{formatTime(session.endTime)}</p>
          </div>
        )}
        {calculateDuration() && (
          <div>
            <p className="text-gray-400 mb-1">Duration</p>
            <p className="font-semibold text-green-400">{calculateDuration()}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <p className="text-gray-400 mb-1">Pre Weight</p>
          <p className="font-semibold text-white">{session.preWeight} kg</p>
        </div>
        {session.postWeight !== undefined && (
          <div>
            <p className="text-gray-400 mb-1">Post Weight</p>
            <p className="font-semibold text-white">{session.postWeight} kg</p>
            {session.patient && (
              <p className="text-xs text-gray-400 mt-1">
                Target: {session.patient.dryWeight} kg
              </p>
            )}
          </div>
        )}
      </div>

      {session.vitals && (
        <div className="mb-4 text-sm">
          <p className="text-gray-400 mb-2 font-semibold">Vitals</p>
          <div className="grid grid-cols-2 gap-2">
            {session.vitals.pre && (
              <div className="bg-gray-900/50 p-2 rounded border border-green-600">
                <p className="text-xs text-green-400 font-semibold mb-1">Pre</p>
                <p className="font-semibold text-white text-xs">
                  BP: {session.vitals.pre.systolicBP}/{session.vitals.pre.diastolicBP}
                </p>
                {session.vitals.pre.heartRate && (
                  <p className="text-xs text-gray-300 mt-1">HR: {session.vitals.pre.heartRate} bpm</p>
                )}
              </div>
            )}
            {session.vitals.post && (
              <div className="bg-gray-900/50 p-2 rounded border border-green-600">
                <p className="text-xs text-green-400 font-semibold mb-1">Post</p>
                <p className="font-semibold text-white text-xs">
                  BP: {session.vitals.post.systolicBP}/{session.vitals.post.diastolicBP}
                </p>
                {session.vitals.post.heartRate && (
                  <p className="text-xs text-gray-300 mt-1">HR: {session.vitals.post.heartRate} bpm</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {session.nurseNotes && (
        <div className="mb-4 text-sm">
          <p className="text-gray-400 mb-1 font-semibold">Notes</p>
          <p className="text-gray-200 bg-gray-900/50 p-2 rounded border border-gray-600 text-xs">
            {session.nurseNotes}
          </p>
        </div>
      )}

      <button
        onClick={() => onEdit(session)}
        className="w-full mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-green-500/50"
      >
        Edit Session
      </button>
    </div>
  );
};
