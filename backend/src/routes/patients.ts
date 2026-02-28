import express, { Request, Response } from 'express';
import { Patient } from '../models/Patient.js';

const router = express.Router();

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Register a new patient
 *     tags: [Patients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - firstName
 *               - lastName
 *               - dateOfBirth
 *               - dryWeight
 *               - unit
 *             properties:
 *               patientId:
 *                 type: string
 *                 example: "P001"
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1980-01-15"
 *               dryWeight:
 *                 type: number
 *                 example: 70.5
 *               unit:
 *                 type: string
 *                 example: "Unit-A"
 *     responses:
 *       201:
 *         description: Patient registered successfully
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Patient ID already exists
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { patientId, firstName, lastName, dateOfBirth, dryWeight, unit } = req.body;

    // Validation
    if (!patientId || !firstName || !lastName || !dateOfBirth || !dryWeight || !unit) {
      return res.status(400).json({
        error: 'Missing required fields: patientId, firstName, lastName, dateOfBirth, dryWeight, unit',
      });
    }

    if (dryWeight <= 0) {
      return res.status(400).json({ error: 'Dry weight must be greater than 0' });
    }

    const patient = new Patient({
      patientId,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      dryWeight,
      unit,
    });

    await patient.save();

    res.status(201).json({
      message: 'Patient registered successfully',
      patient: {
        id: patient._id,
        patientId: patient.patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        dryWeight: patient.dryWeight,
        unit: patient.unit,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Patient ID already exists' });
    }
    console.error('Error registering patient:', error);
    res.status(500).json({ error: 'Failed to register patient' });
  }
});

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Get all patients
 *     tags: [Patients]
 *     parameters:
 *       - in: query
 *         name: unit
 *         schema:
 *           type: string
 *         description: Filter by dialysis unit
 *     responses:
 *       200:
 *         description: List of patients
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { unit } = req.query;
    const query = unit ? { unit } : {};
    
    const patients = await Patient.find(query).sort({ lastName: 1, firstName: 1 });
    
    res.json({
      patients: patients.map(p => ({
        id: p._id,
        patientId: p.patientId,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dateOfBirth,
        dryWeight: p.dryWeight,
        unit: p.unit,
      })),
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

export default router;
