import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { connectDatabase } from '../../config/database.js';
import { MONGODB_URI } from '../../config/constants.js';
import patientRoutes from '../patients.js';
import { Patient } from '../../models/Patient.js';

const app = express();
app.use(express.json());
app.use('/api/patients', patientRoutes);

describe('Patients API', () => {
  beforeAll(async () => {
    await connectDatabase();
    // Clear test data
    await Patient.deleteMany({});
  });

  afterAll(async () => {
    await Patient.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/patients', () => {
    it('should create a new patient', async () => {
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
      const response = await request(app).get('/api/patients').expect(200);

      expect(response.body.patients).toBeInstanceOf(Array);
      expect(response.body.patients.length).toBeGreaterThan(0);
    });

    it('should filter patients by unit', async () => {
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
