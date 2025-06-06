import express from 'express';
import multer from 'multer';
import path from 'path';
import { authDoctor } from '../middlewares/authDoctor.js';
import authUser from '../middlewares/authUser.js';
import { saveMedicalRecord, getAllMedicalRecords, getRecentMedicalRecords, deleteMedicalRecord, updateMedicalRecord, getUserMedicalRecords } from '../controllers/medicalRecordController.js';
import upload from '../middlewares/multer.js';

const router = express.Router();

// Get all medical records
router.get('/', authDoctor, getAllMedicalRecords);

// Get recent medical records
router.get('/recent', authDoctor, getRecentMedicalRecords);

// Get user's medical records
router.get('/user', authUser, getUserMedicalRecords);

// Create new medical record
router.post('/', authDoctor, upload.single('record'), saveMedicalRecord);

// Update a medical record
router.put('/:id', authDoctor, updateMedicalRecord);

// Delete a medical record by ID
router.delete('/:id', authDoctor, deleteMedicalRecord);

export default router;