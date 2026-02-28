import { Session } from '../types/index';
interface SessionCardProps {
  session: Session;
  onEdit: (session: Session) => void;
}

export const SessionCard = ({ session, onEdit }: SessionCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      className={`border rounded-lg p-4 ${
        session.hasAnomalies ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">
            {session.patient?.firstName} {session.patient?.lastName}
          </h3>
          <p className="text-sm text-gray-600">Patient ID: {session.patientId}</p>
          <p className="text-sm text-gray-600">Unit: {session.patient?.unit}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
          {session.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {session.hasAnomalies && (
        <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded">
          <p className="text-sm font-semibold text-red-800 mb-1">⚠️ Anomalies Detected:</p>
          <ul className="text-xs text-red-700 list-disc list-inside">
            {session.anomalies.map((anomaly, idx) => (
              <li key={idx}>{anomaly}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <p className="text-gray-600">Scheduled</p>
          <p className="font-medium">{formatDate(session.scheduledDate)}</p>
        </div>
        <div>
          <p className="text-gray-600">Machine</p>
          <p className="font-medium">{session.machineId}</p>
        </div>
        <div>
          <p className="text-gray-600">Start Time</p>
          <p className="font-medium">{formatTime(session.startTime)}</p>
        </div>
        {session.endTime && (
          <div>
            <p className="text-gray-600">End Time</p>
            <p className="font-medium">{formatTime(session.endTime)}</p>
          </div>
        )}
        {calculateDuration() && (
          <div>
            <p className="text-gray-600">Duration</p>
            <p className="font-medium">{calculateDuration()}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <p className="text-gray-600">Pre Weight</p>
          <p className="font-medium">{session.preWeight} kg</p>
        </div>
        {session.postWeight !== undefined && (
          <div>
            <p className="text-gray-600">Post Weight</p>
            <p className="font-medium">{session.postWeight} kg</p>
            {session.patient && (
              <p className="text-xs text-gray-500">
                Target: {session.patient.dryWeight} kg
              </p>
            )}
          </div>
        )}
      </div>

      {session.vitals && (
        <div className="mb-3 text-sm">
          <p className="text-gray-600 mb-1">Vitals</p>
          <div className="grid grid-cols-2 gap-2">
            {session.vitals.pre && (
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-600">Pre</p>
                <p className="font-medium">
                  BP: {session.vitals.pre.systolicBP}/{session.vitals.pre.diastolicBP}
                </p>
                {session.vitals.pre.heartRate && (
                  <p className="text-xs">HR: {session.vitals.pre.heartRate} bpm</p>
                )}
              </div>
            )}
            {session.vitals.post && (
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-600">Post</p>
                <p className="font-medium">
                  BP: {session.vitals.post.systolicBP}/{session.vitals.post.diastolicBP}
                </p>
                {session.vitals.post.heartRate && (
                  <p className="text-xs">HR: {session.vitals.post.heartRate} bpm</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {session.nurseNotes && (
        <div className="mb-3 text-sm">
          <p className="text-gray-600">Notes</p>
          <p className="text-gray-800 bg-gray-50 p-2 rounded">{session.nurseNotes}</p>
        </div>
      )}

      <button
        onClick={() => onEdit(session)}
        className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Edit Session
      </button>
    </div>
  );
};
