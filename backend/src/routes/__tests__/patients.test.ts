import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import patientRoutes from '../patients.js';
import { Patient } from '../../models/Patient.js';

const app = express();
app.use(express.json());
app.use('/api/patients', patientRoutes);

describe('Patients API', () => {
  beforeAll(async () => {
    try {
      const testUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dialysis-center-test';
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(testUri);
      }
      await Patient.deleteMany({});
    } catch (error) {
      console.warn('MongoDB not available for tests. Some tests may be skipped.');
    }
  });

  afterAll(async () => {
    try {
      await Patient.deleteMany({});
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
    } catch (error) {
    }
  });

  describe('POST /api/patients', () => {
    it('should create a new patient', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.warn('Skipping test - MongoDB not connected');
        return;
      }
      const patientData = {
        patientId: 'TEST001',
        firstName: 'Test',
        lastName: 'Patient',
        dateOfBirth: '1990-01-01',
        dryWeight: 70.5,
        unit: 'Unit-Test',
      };

      const response = await request(app)
        .post('/api/patients')
        .send(patientData)
        .expect(201);

      expect(response.body.message).toBe('Patient registered successfully');
      expect(response.body.patient.patientId).toBe(patientData.patientId);
      expect(response.body.patient.firstName).toBe(patientData.firstName);
      expect(response.body.patient.dryWeight).toBe(patientData.dryWeight);
    });

    it('should return 400 for missing required fields', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.warn('Skipping test - MongoDB not connected');
        return;
      }
      const incompleteData = {
        patientId: 'TEST002',
        firstName: 'Test',
      };

      const response = await request(app)
        .post('/api/patients')
        .send(incompleteData)
        .expect(400);

      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid dry weight', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.warn('Skipping test - MongoDB not connected');
        return;
      }
      const patientData = {
        patientId: 'TEST003',
        firstName: 'Test',
        lastName: 'Patient',
        dateOfBirth: '1990-01-01',
        dryWeight: -10,
        unit: 'Unit-Test',
      };

      const response = await request(app)
        .post('/api/patients')
        .send(patientData)
        .expect(400);

      expect(response.body.error).toContain('Dry weight must be greater than 0');
    });

    it('should return 409 for duplicate patient ID', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.warn('Skipping test - MongoDB not connected');
        return;
      }
      const patientData = {
        patientId: 'TEST004',
        firstName: 'Test',
        lastName: 'Patient',
        dateOfBirth: '1990-01-01',
        dryWeight: 70.5,
        unit: 'Unit-Test',
      };
 
      await request(app).post('/api/patients').send(patientData).expect(201);

      const response = await request(app)
        .post('/api/patients')
        .send(patientData)
        .expect(409);

      expect(response.body.error).toContain('Patient ID already exists');
    });
  });

  describe('GET /api/patients', () => {
    it('should return all patients', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.warn('Skipping test - MongoDB not connected');
        return;
      }
      const response = await request(app).get('/api/patients').expect(200);

      expect(response.body.patients).toBeInstanceOf(Array);
      expect(response.body.patients.length).toBeGreaterThan(0);
    });

    it('should filter patients by unit', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.warn('Skipping test - MongoDB not connected');
        return;
      }
      const response = await request(app)
        .get('/api/patients')
        .query({ unit: 'Unit-Test' })
        .expect(200);

      expect(response.body.patients).toBeInstanceOf(Array);
      response.body.patients.forEach((patient: any) => {
        expect(patient.unit).toBe('Unit-Test');
      });
    });
  });
});
