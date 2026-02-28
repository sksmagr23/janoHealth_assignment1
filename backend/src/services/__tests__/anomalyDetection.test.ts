import { describe, it, expect } from 'vitest';
import { detectAnomalies } from '../anomalyDetection.js';
import { Session } from '../../models/Session.js';
import { ANOMALY_THRESHOLDS } from '../../config/constants.js';

describe('Anomaly Detection', () => {
  const mockPatient = { dryWeight: 70.0 };

  describe('Excess interdialytic weight gain', () => {
    it('should detect excess weight gain above threshold', async () => {
      const session = {
        preWeight: 75.0, // 5.0 kg gain = 7.1% (exceeds 5% threshold)
        vitals: {},
        endTime: undefined,
        startTime: new Date(),
      } as Session;

      const result = await detectAnomalies(session, mockPatient);
      expect(result.hasAnomalies).toBe(true);
      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(result.anomalies[0]).toContain('Excess interdialytic weight gain');
    });

    it('should not detect anomaly for normal weight gain', async () => {
      const session = {
        preWeight: 72.0, // 2.0 kg gain = 2.9% (within threshold)
        vitals: {},
        endTime: undefined,
        startTime: new Date(),
      } as Session;

      const result = await detectAnomalies(session, mockPatient);
      expect(result.hasAnomalies).toBe(false);
    });
  });

  describe('High post-dialysis systolic BP', () => {
    it('should detect high post-dialysis BP', async () => {
      const session = {
        preWeight: 72.0,
        vitals: {
          post: {
            systolicBP: 145, // Exceeds 140 threshold
            diastolicBP: 90,
          },
        },
        endTime: undefined,
        startTime: new Date(),
      } as Session;

      const result = await detectAnomalies(session, mockPatient);
      expect(result.hasAnomalies).toBe(true);
      expect(result.anomalies.some((a) => a.includes('High post-dialysis systolic BP'))).toBe(true);
    });

    it('should not detect anomaly for normal post-dialysis BP', async () => {
      const session = {
        preWeight: 72.0,
        vitals: {
          post: {
            systolicBP: 130, // Within threshold
            diastolicBP: 80,
          },
        },
        endTime: undefined,
        startTime: new Date(),
      } as Session;

      const result = await detectAnomalies(session, mockPatient);
      const hasBPAnomaly = result.anomalies.some((a) => a.includes('High post-dialysis systolic BP'));
      expect(hasBPAnomaly).toBe(false);
    });
  });

  describe('Abnormal session duration', () => {
    it('should detect short session duration', async () => {
      const startTime = new Date('2024-01-01T08:00:00');
      const endTime = new Date('2024-01-01T10:00:00'); // 2 hours = 120 minutes (below 150 min threshold)

      const session = {
        preWeight: 72.0,
        vitals: {},
        startTime,
        endTime,
      } as Session;

      const result = await detectAnomalies(session, mockPatient);
      expect(result.hasAnomalies).toBe(true);
      expect(result.anomalies.some((a) => a.includes('Short session duration'))).toBe(true);
    });

    it('should detect long session duration', async () => {
      const startTime = new Date('2024-01-01T08:00:00');
      const endTime = new Date('2024-01-01T14:00:00'); // 6 hours = 360 minutes (exceeds 300 min threshold)

      const session = {
        preWeight: 72.0,
        vitals: {},
        startTime,
        endTime,
      } as Session;

      const result = await detectAnomalies(session, mockPatient);
      expect(result.hasAnomalies).toBe(true);
      expect(result.anomalies.some((a) => a.includes('Long session duration'))).toBe(true);
    });

    it('should not detect anomaly for normal duration', async () => {
      const startTime = new Date('2024-01-01T08:00:00');
      const endTime = new Date('2024-01-01T12:00:00'); // 4 hours = 240 minutes (within range)

      const session = {
        preWeight: 72.0,
        vitals: {},
        startTime,
        endTime,
      } as Session;

      const result = await detectAnomalies(session, mockPatient);
      const hasDurationAnomaly = result.anomalies.some(
        (a) => a.includes('duration')
      );
      expect(hasDurationAnomaly).toBe(false);
    });
  });

  describe('Multiple anomalies', () => {
    it('should detect multiple anomalies in one session', async () => {
      const startTime = new Date('2024-01-01T08:00:00');
      const endTime = new Date('2024-01-01T10:00:00'); // Short duration

      const session = {
        preWeight: 75.0, // Excess weight gain
        vitals: {
          post: {
            systolicBP: 145, // High BP
            diastolicBP: 90,
          },
        },
        startTime,
        endTime,
      } as Session;

      const result = await detectAnomalies(session, mockPatient);
      expect(result.hasAnomalies).toBe(true);
      expect(result.anomalies.length).toBeGreaterThanOrEqual(3);
    });
  });
});
