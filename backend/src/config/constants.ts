// Clinical thresholds for anomaly detection

declare const process: {
  env: {
    MONGODB_URI?: string;
    PORT?: string;
    CORS_ORIGIN?: string;
  };
};

export const ANOMALY_THRESHOLDS = {
  // Excess interdialytic weight gain threshold (kg)
  // Normal: 2-3% of dry weight. We use 5% as a conservative threshold
  MAX_WEIGHT_GAIN_PERCENT: 0.05, // 5% of dry weight
  
  // High post-dialysis systolic BP threshold (mmHg)
  // Normal post-dialysis BP should be < 140 mmHg systolic
  HIGH_SYSTOLIC_BP: 140,
  
  // Abnormal session duration thresholds (minutes)
  // Typical dialysis session: 3-4 hours (180-240 minutes)
  MIN_SESSION_DURATION: 150, // 2.5 hours minimum
  MAX_SESSION_DURATION: 300, // 5 hours maximum
  TARGET_SESSION_DURATION: 240, // 4 hours target
} as const;

export const MONGODB_URI = process.env.MONGODB_URI;
export const PORT = process.env.PORT || 3001;
export const CORS_ORIGIN = process.env.CORS_ORIGIN;
