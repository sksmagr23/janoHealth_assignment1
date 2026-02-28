import mongoose, { Schema, Document } from 'mongoose';

export interface IVitals {
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  heartRate?: number; // bpm
  temperature?: number; // Celsius
}

export interface ISession extends Document {
  patientId: string;
  scheduledDate: Date; // Date the session was scheduled for
  startTime: Date;
  endTime?: Date;
  preWeight: number; // kg
  postWeight?: number; // kg
  vitals: {
    pre?: IVitals;
    post?: IVitals;
  };
  machineId: string;
  nurseNotes?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  anomalies: string[]; // Array of anomaly descriptions
  createdAt: Date;
  updatedAt: Date;
}

const VitalsSchema = new Schema<IVitals>(
  {
    systolicBP: { type: Number, required: true, min: 0 },
    diastolicBP: { type: Number, required: true, min: 0 },
    heartRate: { type: Number, min: 0 },
    temperature: { type: Number, min: 0 },
  },
  { _id: false }
);

const SessionSchema = new Schema<ISession>(
  {
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    preWeight: {
      type: Number,
      required: true,
      min: 0,
    },
    postWeight: {
      type: Number,
      min: 0,
    },
    vitals: {
      pre: VitalsSchema,
      post: VitalsSchema,
    },
    machineId: {
      type: String,
      required: true,
    },
    nurseNotes: {
      type: String,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
      index: true,
    },
    anomalies: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
SessionSchema.index({ scheduledDate: 1, status: 1 });
SessionSchema.index({ patientId: 1, scheduledDate: -1 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);
