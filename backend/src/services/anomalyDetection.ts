import { ISession } from '../models/Session.js';
import { Patient } from '../models/Patient.js';
import { ANOMALY_THRESHOLDS } from '../config/constants.js';

export interface AnomalyResult {
  hasAnomalies: boolean;
  anomalies: string[];
}

/**
 * Detects anomalies in a dialysis session
 * @param session - The session to analyze
 * @param patient - The patient associated with the session
 * @returns AnomalyResult with detected anomalies
 */
export async function detectAnomalies(
  session: ISession,
  patient: { dryWeight: number }
): Promise<AnomalyResult> {
  const anomalies: string[] = [];

  // Check for excess interdialytic weight gain
  if (session.preWeight && patient.dryWeight) {
    const weightGain = session.preWeight - patient.dryWeight;
    const weightGainPercent = weightGain / patient.dryWeight;
    
    if (weightGainPercent > ANOMALY_THRESHOLDS.MAX_WEIGHT_GAIN_PERCENT) {
      anomalies.push(
        `Excess interdialytic weight gain: ${weightGain.toFixed(2)} kg (${(weightGainPercent * 100).toFixed(1)}% of dry weight)`
      );
    }
  }

  // Check for high post-dialysis systolic BP
  if (session.vitals?.post?.systolicBP) {
    if (session.vitals.post.systolicBP > ANOMALY_THRESHOLDS.HIGH_SYSTOLIC_BP) {
      anomalies.push(
        `High post-dialysis systolic BP: ${session.vitals.post.systolicBP} mmHg (threshold: ${ANOMALY_THRESHOLDS.HIGH_SYSTOLIC_BP} mmHg)`
      );
    }
  }

  // Check for abnormal session duration
  if (session.endTime && session.startTime) {
    const durationMinutes = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60);
    
    if (durationMinutes < ANOMALY_THRESHOLDS.MIN_SESSION_DURATION) {
      anomalies.push(
        `Short session duration: ${Math.round(durationMinutes)} minutes (minimum: ${ANOMALY_THRESHOLDS.MIN_SESSION_DURATION} minutes)`
      );
    } else if (durationMinutes > ANOMALY_THRESHOLDS.MAX_SESSION_DURATION) {
      anomalies.push(
        `Long session duration: ${Math.round(durationMinutes)} minutes (maximum: ${ANOMALY_THRESHOLDS.MAX_SESSION_DURATION} minutes)`
      );
    }
  }

  return {
    hasAnomalies: anomalies.length > 0,
    anomalies,
  };
}
