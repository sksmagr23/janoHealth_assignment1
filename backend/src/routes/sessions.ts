import express, { Request, Response } from 'express';
import { Session } from '../models/Session.js';
import { Patient } from '../models/Patient.js';
import { detectAnomalies } from '../services/anomalyDetection.js';

const router = express.Router();

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Record a new dialysis session
 *     tags: [Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - scheduledDate
 *               - startTime
 *               - preWeight
 *               - machineId
 *             properties:
 *               patientId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               preWeight:
 *                 type: number
 *               postWeight:
 *                 type: number
 *               vitals:
 *                 type: object
 *                 properties:
 *                   pre:
 *                     type: object
 *                   post:
 *                     type: object
 *               machineId:
 *                 type: string
 *               nurseNotes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [not_started, in_progress, completed]
 *     responses:
 *       201:
 *         description: Session recorded successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Patient not found
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      scheduledDate,
      startTime,
      endTime,
      preWeight,
      postWeight,
      vitals,
      machineId,
      nurseNotes,
      status,
    } = req.body;

    if (!patientId || !scheduledDate || !startTime || !preWeight || !machineId) {
      return res.status(400).json({
        error: 'Missing required fields: patientId, scheduledDate, startTime, preWeight, machineId',
      });
    }

    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const sessionData: any = {
      patientId,
      scheduledDate: new Date(scheduledDate),
      startTime: new Date(startTime),
      preWeight,
      machineId,
      status: status || 'in_progress',
    };

    if (endTime) sessionData.endTime = new Date(endTime);
    if (postWeight !== undefined) sessionData.postWeight = postWeight;
    if (vitals) sessionData.vitals = vitals;
    if (nurseNotes) sessionData.nurseNotes = nurseNotes;
    if (status) sessionData.status = status;

    const session = new Session(sessionData);

    const anomalyResult = await detectAnomalies(session, { dryWeight: patient.dryWeight });
    session.anomalies = anomalyResult.anomalies;

    await session.save();

    res.status(201).json({
      message: 'Session recorded successfully',
      session: {
        id: session._id,
        patientId: session.patientId,
        scheduledDate: session.scheduledDate,
        startTime: session.startTime,
        endTime: session.endTime,
        preWeight: session.preWeight,
        postWeight: session.postWeight,
        vitals: session.vitals,
        machineId: session.machineId,
        nurseNotes: session.nurseNotes,
        status: session.status,
        anomalies: session.anomalies,
        hasAnomalies: anomalyResult.hasAnomalies,
      },
    });
  } catch (error: any) {
    console.error('Error recording session:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors: Record<string, string> = {};
      Object.keys(error.errors || {}).forEach((key) => {
        validationErrors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        error: 'Validation failed',
        message: error.message,
        errors: validationErrors,
        details: Object.values(validationErrors).join(', '),
      });
    }
    
    res.status(500).json({ error: 'Failed to record session', details: error.message });
  }
});

/**
 * @swagger
 * /api/sessions/{id}:
 *   patch:
 *     summary: Update a session (notes, vitals, status, etc.)
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nurseNotes:
 *                 type: string
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               postWeight:
 *                 type: number
 *               vitals:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [not_started, in_progress, completed]
 *     responses:
 *       200:
 *         description: Session updated successfully
 *       404:
 *         description: Session not found
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (updates.nurseNotes !== undefined) session.nurseNotes = updates.nurseNotes;
    if (updates.endTime !== undefined) session.endTime = new Date(updates.endTime);
    if (updates.postWeight !== undefined) session.postWeight = updates.postWeight;
    if (updates.vitals !== undefined) session.vitals = { ...session.vitals, ...updates.vitals };
    if (updates.status !== undefined) session.status = updates.status;

    if (updates.postWeight !== undefined || updates.vitals?.post || updates.endTime) {
      const patient = await Patient.findOne({ patientId: session.patientId });
      if (patient) {
        const anomalyResult = await detectAnomalies(session, { dryWeight: patient.dryWeight });
        session.anomalies = anomalyResult.anomalies;
      }
    }

    await session.save();

    res.json({
      message: 'Session updated successfully',
      session: {
        id: session._id,
        patientId: session.patientId,
        scheduledDate: session.scheduledDate,
        startTime: session.startTime,
        endTime: session.endTime,
        preWeight: session.preWeight,
        postWeight: session.postWeight,
        vitals: session.vitals,
        machineId: session.machineId,
        nurseNotes: session.nurseNotes,
        status: session.status,
        anomalies: session.anomalies,
        hasAnomalies: session.anomalies.length > 0,
      },
    });
  } catch (error: any) {
    console.error('Error updating session:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors: Record<string, string> = {};
      Object.keys(error.errors || {}).forEach((key) => {
        validationErrors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        error: 'Validation failed',
        message: error.message,
        errors: validationErrors,
        details: Object.values(validationErrors).join(', '),
      });
    }
    
    res.status(500).json({ error: 'Failed to update session', details: error.message });
  }
});

/**
 * @swagger
 * /api/sessions/today:
 *   get:
 *     summary: Get today's schedule with patient details and anomalies
 *     tags: [Sessions]
 *     parameters:
 *       - in: query
 *         name: unit
 *         schema:
 *           type: string
 *         description: Filter by dialysis unit
 *       - in: query
 *         name: anomaliesOnly
 *         schema:
 *           type: string
 *         description: Filter to show only sessions with anomalies (set to "true")
 *     responses:
 *       200:
 *         description: Today's schedule with anomalies
 */
router.get('/today', async (req: Request, res: Response) => {
  try {
    const { unit, anomaliesOnly } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query: any = {
      scheduledDate: {
        $gte: today,
        $lt: tomorrow,
      },
    };

    if (unit) {
    }

    let sessions = await Session.find(query)
      .sort({ scheduledDate: 1, startTime: 1 })
      .lean();

    // Filter by unit and fetch patient details
    const sessionsWithPatients = await Promise.all(
      sessions.map(async (session) => {
        const patient = await Patient.findOne({ patientId: session.patientId }).lean();
        if (!patient) return null;

        if (unit && patient.unit !== unit) return null;

        if (anomaliesOnly === 'true' && session.anomalies.length === 0) return null;

        return {
          id: session._id,
          patientId: session.patientId,
          patient: {
            firstName: patient.firstName,
            lastName: patient.lastName,
            dryWeight: patient.dryWeight,
            unit: patient.unit,
          },
          scheduledDate: session.scheduledDate,
          startTime: session.startTime,
          endTime: session.endTime,
          preWeight: session.preWeight,
          postWeight: session.postWeight,
          vitals: session.vitals,
          machineId: session.machineId,
          nurseNotes: session.nurseNotes,
          status: session.status,
          anomalies: session.anomalies,
          hasAnomalies: session.anomalies.length > 0,
        };
      })
    );

    const filteredSessions = sessionsWithPatients.filter((s) => s !== null);

    res.json({
      date: today.toISOString().split('T')[0],
      count: filteredSessions.length,
      sessions: filteredSessions,
    });
  } catch (error) {
    console.error('Error fetching today\'s schedule:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s schedule' });
  }
});

export default router;
