import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database.js';
import { Patient } from '../src/models/Patient.js';
import { Session } from '../src/models/Session.js';

const seedData = async () => {
  try {
    await connectDatabase();

    await Patient.deleteMany({});
    await Session.deleteMany({});
    console.log('Cleared existing data');

    const patients = [
      {
        patientId: 'P001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-05-15'),
        dryWeight: 70.0,
        unit: 'Unit-A',
      },
      {
        patientId: 'P002',
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: new Date('1975-08-22'),
        dryWeight: 65.5,
        unit: 'Unit-A',
      },
      {
        patientId: 'P003',
        firstName: 'Robert',
        lastName: 'Johnson',
        dateOfBirth: new Date('1990-03-10'),
        dryWeight: 80.0,
        unit: 'Unit-B',
      },
      {
        patientId: 'P004',
        firstName: 'Maria',
        lastName: 'Garcia',
        dateOfBirth: new Date('1985-11-30'),
        dryWeight: 58.0,
        unit: 'Unit-B',
      },
    ];

    const createdPatients = await Patient.insertMany(patients);
    console.log(`created ${createdPatients.length} patients`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = [
      {
        patientId: 'P001',
        scheduledDate: today,
        startTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8 AM
        endTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12 PM (4 hours)
        preWeight: 72.0, // Normal weight gain (2.8% of dry weight)
        postWeight: 70.5,
        vitals: {
          pre: { systolicBP: 135, diastolicBP: 85, heartRate: 72 },
          post: { systolicBP: 130, diastolicBP: 80, heartRate: 70 },
        },
        machineId: 'M001',
        nurseNotes: 'Session completed normally',
        status: 'completed',
        anomalies: [],
      },
      {
        patientId: 'P002',
        scheduledDate: today,
        startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM
        endTime: new Date(today.getTime() + 13 * 60 * 60 * 1000), // 1 PM
        preWeight: 70.0, // 6.9% weight gain (exceeds 5% threshold)
        postWeight: 66.0,
        vitals: {
          pre: { systolicBP: 140, diastolicBP: 90, heartRate: 78 },
          post: { systolicBP: 135, diastolicBP: 85, heartRate: 75 },
        },
        machineId: 'M002',
        nurseNotes: 'Patient reported fluid retention',
        status: 'completed',
        anomalies: [
          'Excess interdialytic weight gain: 4.50 kg (6.9% of dry weight)',
        ],
      },
      {
        patientId: 'P003',
        scheduledDate: today,
        startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10 AM
        endTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2 PM
        preWeight: 82.0, // Normal weight gain
        postWeight: 80.5,
        vitals: {
          pre: { systolicBP: 145, diastolicBP: 95, heartRate: 80 },
          post: { systolicBP: 145, diastolicBP: 90, heartRate: 78 }, // High post-BP
        },
        machineId: 'M003',
        nurseNotes: 'Monitor BP closely',
        status: 'completed',
        anomalies: [
          'High post-dialysis systolic BP: 145 mmHg (threshold: 140 mmHg)',
        ],
      },
      {
        patientId: 'P004',
        scheduledDate: today,
        startTime: new Date(today.getTime() + 11 * 60 * 60 * 1000), // 11 AM
        endTime: new Date(today.getTime() + 13 * 30 * 60 * 1000), // 1:30 PM (2.5 hours - too short)
        preWeight: 60.0,
        postWeight: 59.0,
        vitals: {
          pre: { systolicBP: 125, diastolicBP: 75, heartRate: 68 },
          post: { systolicBP: 120, diastolicBP: 70, heartRate: 65 },
        },
        machineId: 'M004',
        nurseNotes: 'Session ended early due to patient discomfort',
        status: 'completed',
        anomalies: [
          'Short session duration: 150 minutes (minimum: 150 minutes)',
        ],
      },
      {
        patientId: 'P001',
        scheduledDate: today,
        startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2 PM
        preWeight: 72.5,
        vitals: {
          pre: { systolicBP: 138, diastolicBP: 88, heartRate: 74 },
        },
        machineId: 'M001',
        status: 'in_progress',
        anomalies: [],
      },
      {
        patientId: 'P002',
        scheduledDate: today,
        startTime: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 3 PM
        preWeight: 69.5,
        vitals: {
          pre: { systolicBP: 142, diastolicBP: 88, heartRate: 76 },
        },
        machineId: 'M002',
        status: 'not_started',
        anomalies: [],
      },
    ];

    for (const sessionData of sessions) {
      const patient = createdPatients.find((p) => p.patientId === sessionData.patientId);
      if (patient && sessionData.endTime && sessionData.postWeight) {
        const session = new Session(sessionData);
      }
    }

    const createdSessions = await Session.insertMany(sessions);
    console.log(`✅ Created ${createdSessions.length} sessions`);

    for (const session of createdSessions) {
      if (session.status === 'completed' && session.endTime && session.postWeight) {
        const patient = createdPatients.find((p) => p.patientId === session.patientId);
        if (patient) {
          const { detectAnomalies } = await import('../src/services/anomalyDetection.js');
          const result = await detectAnomalies(session, { dryWeight: patient.dryWeight });
          session.anomalies = result.anomalies;
          await session.save();
        }
      }
    }

    console.log('Seed data created successfully');
    console.log('Summary:');
    console.log(`Patients: ${createdPatients.length}`);
    console.log(`Sessions: ${createdSessions.length}`);
    console.log(`Today's date: ${today.toISOString().split('T')[0]}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
