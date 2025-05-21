import MedicalRecord from '../models/MedicalRecordModel.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';
import Appointment from '../models/appointmentModel.js';
import fs from 'fs';
import User from '../models/userModel.js';

// Get all medical records
export const getAllMedicalRecords = async (req, res) => {
  try {
    console.log('Getting medical records for doctor:', req.doctor._id);
    
    const records = await MedicalRecord.find({ doctor: req.doctor._id })
      .populate('patient', 'name email')
      .populate('appointment', 'slotDate slotTime')
      .sort({ date: -1 });

    console.log('Found records:', records.length);
    console.log('First record sample:', records[0] ? {
      id: records[0]._id,
      patient: records[0].patient,
      recordType: records[0].recordType,
      date: records[0].date
    } : 'No records found');

    const formattedRecords = records.map(record => ({
      ...record.toObject(),
      appointmentDate: record.appointment?.slotDate,
      appointmentTime: record.appointment?.slotTime
    }));

    console.log('Sending response with formatted records:', formattedRecords.length);
    
    res.status(200).json({ success: true, records: formattedRecords });
  } catch (error) {
    console.error('Error in getAllMedicalRecords:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch medical records', 
      error: error.message 
    });
  }
};

export const saveMedicalRecord = async (req, res) => {
  try {
    console.log('Received medical record request:', {
      body: req.body,
      file: req.file
    });

    const { patient, appointment, doctor, recordType, date, notes } = req.body;

    // Validate required fields
    if (!patient || !appointment || !doctor || !recordType || !date) {
      console.log('Missing required fields:', { patient, appointment, doctor, recordType, date });
      return res.status(400).json({ message: 'All fields are required' });
    }

    let fileUrl = '';
    if (req.file) {
      try {
        console.log('Uploading file to Cloudinary...');
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'medical_records',
          resource_type: 'auto'
        });
        console.log('File uploaded successfully:', result);
        fileUrl = result.secure_url;

        // Delete the temporary file after upload
        fs.unlinkSync(req.file.path);
        console.log('Temporary file deleted');
      } catch (uploadError) {
        console.error('Error uploading file to Cloudinary:', uploadError);
        // Delete the temporary file if it exists
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ message: 'Error uploading file' });
      }
    } else {
      console.log('No file attached to the request');
      return res.status(400).json({ message: 'No file attached' });
    }

    // Create new medical record
    const newRecord = new MedicalRecord({
      patient,
      appointment,
      doctor,
      recordType,
      date,
      notes,
      attachmentUrl: fileUrl
    });

    await newRecord.save();
    console.log('Medical record saved successfully');

    // Update appointment status
    await Appointment.findByIdAndUpdate(appointment, { status: 'Completed' });
    console.log('Appointment status updated to Completed');

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      record: newRecord
    });
  } catch (error) {
    console.error('Error in saveMedicalRecord:', error);
    // Delete the temporary file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};

// Get recent medical records
export const getRecentMedicalRecords = async (req, res) => {
  try {
    // Get records from the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const records = await MedicalRecord.find({
      createdAt: { $gte: oneDayAgo }
    })
    .populate('patient', 'name')
    .sort({ createdAt: -1 });

    console.log('Recent records from database:', JSON.stringify(records, null, 2));
    
    // Process records to handle both string and ObjectId patient fields
    const processedRecords = records.map(record => {
      console.log('Processing record:', record._id);
      console.log('Patient field type:', typeof record.patient);
      console.log('Patient field value:', record.patient);
      
      // If patient is populated (ObjectId case)
      if (record.patient && typeof record.patient === 'object') {
        return {
          ...record.toObject(),
          patient: record.patient.name || 'Unknown Patient'
        };
      }
      
      // If patient is a string
      if (typeof record.patient === 'string') {
        return {
          ...record.toObject(),
          patient: record.patient
        };
      }
      
      // If patient is missing or undefined
      return {
        ...record.toObject(),
        patient: 'Unknown Patient'
      };
    });
    
    console.log('Final processed records:', JSON.stringify(processedRecords, null, 2));
    
    res.status(200).json({ success: true, records: processedRecords });
  } catch (error) {
    console.error('Error fetching recent medical records:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recent medical records', error: error.message });
  }
};

// Delete a medical record by ID
export const deleteMedicalRecord = async (req, res) => {
  try {
    const recordId = req.params.id;
    // Find and delete the record by ID
    const deletedRecord = await MedicalRecord.findByIdAndDelete(recordId);

    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    // Optionally delete the attachment from Cloudinary if needed
    // You would need to parse the public ID from the attachmentUrl
    // and use the cloudinary.uploader.destroy() method.
    // This part is commented out as it requires more specific implementation based on your Cloudinary setup.
    // if (deletedRecord.attachmentUrl) {
    //   // Extract public ID from URL (example: get 'medical_records/...' from the URL)
    //   const urlParts = deletedRecord.attachmentUrl.split('/');
    //   const filenameWithExtension = urlParts[urlParts.length - 1];
    //   const publicId = `medical_records/${filenameWithExtension.split('.')[0]}`;
    //   console.log('Attempting to delete Cloudinary asset with public ID:', publicId);
    //   cloudinary.uploader.destroy(publicId, (error, result) => {
    //     if (error) console.error('Error deleting Cloudinary asset:', error);
    //     else console.log('Cloudinary asset deleted result:', result);
    //   });
    // }

    res.status(200).json({ success: true, message: 'Medical record deleted successfully' });
  } catch (error) {
    console.error('Error deleting medical record:', error);
    res.status(500).json({ success: false, message: 'Failed to delete medical record', error: error.message });
  }
};
