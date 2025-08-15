import { Request, Response } from 'express';
import { PatientService } from '../services/patient.service.js';
import { asyncHandler } from '../middleware/error.js';
import { logger } from '../utils/logger.js';

export class PatientController {
  /**
   * Create new patient
   */
  static createPatient = asyncHandler(async (req: Request, res: Response) => {
    const patientData = {
      ...req.body,
      createdBy: req.user!.id,
    };

    const patient = await PatientService.createPatient(patientData);

    logger.info('Patient created', {
      patientId: patient.id,
      createdBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: { patient }
    });
  });

  /**
   * Get patient by ID
   */
  static getPatientById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const patient = await PatientService.getPatientById(id);

    res.json({
      success: true,
      message: 'Patient retrieved successfully',
      data: { patient }
    });
  });

  /**
   * Update patient
   */
  static updatePatient = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const updatedPatient = await PatientService.updatePatient(id, updateData);

    logger.info('Patient updated', {
      patientId: id,
      updatedBy: req.user!.id,
      updatedFields: Object.keys(updateData),
    });

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: { patient: updatedPatient }
    });
  });

  /**
   * Search patients
   */
  static searchPatients = asyncHandler(async (req: Request, res: Response) => {
    const searchParams = {
      query: req.query.query as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: (req.query.sortBy as any) || 'lastName',
      sortOrder: (req.query.sortOrder as any) || 'asc',
      isActive: req.query.isActive !== 'false', // Default to active patients
    };

    const result = await PatientService.searchPatients(searchParams);

    res.json({
      success: true,
      message: 'Patients retrieved successfully',
      data: result
    });
  });

  /**
   * Get all patients (paginated)
   */
  static getAllPatients = asyncHandler(async (req: Request, res: Response) => {
    const searchParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: (req.query.sortBy as any) || 'lastName',
      sortOrder: (req.query.sortOrder as any) || 'asc',
      isActive: req.query.isActive !== 'false',
    };

    const result = await PatientService.searchPatients(searchParams);

    res.json({
      success: true,
      message: 'All patients retrieved successfully',
      data: result
    });
  });

  /**
   * Deactivate patient (soft delete)
   */
  static deactivatePatient = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await PatientService.deactivatePatient(id);

    logger.info('Patient deactivated', {
      patientId: id,
      deactivatedBy: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Patient deactivated successfully'
    });
  });

  /**
   * Reactivate patient
   */
  static reactivatePatient = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await PatientService.reactivatePatient(id);

    logger.info('Patient reactivated', {
      patientId: id,
      reactivatedBy: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Patient reactivated successfully'
    });
  });

  /**
   * Import patient from booking system
   */
  static importFromBookingSystem = asyncHandler(async (req: Request, res: Response) => {
    const { bookingId } = req.body;
    const createdBy = req.user!.id;

    const patient = await PatientService.importFromBookingSystem(bookingId, createdBy);

    logger.info('Patient imported from booking system', {
      patientId: patient.id,
      bookingId,
      importedBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      message: 'Patient imported successfully from booking system',
      data: { patient }
    });
  });

  /**
   * Get patient statistics
   */
  static getPatientStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await PatientService.getPatientStats();

    res.json({
      success: true,
      message: 'Patient statistics retrieved successfully',
      data: { stats }
    });
  });

  /**
   * Get recent patients
   */
  static getRecentPatients = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const recentPatients = await PatientService.getRecentPatients(limit);

    res.json({
      success: true,
      message: 'Recent patients retrieved successfully',
      data: { patients: recentPatients }
    });
  });

  /**
   * Get patient summary (basic info + stats)
   */
  static getPatientSummary = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const patient = await PatientService.getPatientById(id);

    // Get additional summary data
    const summary = {
      basicInfo: {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        email: patient.email,
        phone: patient.phone,
        age: patient.dateOfBirth ? 
          Math.floor((Date.now() - patient.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 
          null,
        city: patient.city,
      },
      stats: patient.stats,
      status: {
        isActive: patient.isActive,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      }
    };

    res.json({
      success: true,
      message: 'Patient summary retrieved successfully',
      data: { summary }
    });
  });

  /**
   * Get patient timeline (appointments, photos, notes)
   */
  static getPatientTimeline = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // This would require implementing a timeline service or complex query
    // For now, return a placeholder structure
    const timeline = {
      patientId: id,
      events: [], // Would contain mixed events from appointments, photos, notes, etc.
      totalEvents: 0,
    };

    res.json({
      success: true,
      message: 'Patient timeline retrieved successfully',
      data: { timeline }
    });
  });

  /**
   * Get patient documents/files summary
   */
  static getPatientDocuments = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // This would integrate with photo service and potentially document service
    const documents = {
      patientId: id,
      photos: {
        total: 0,
        byCategory: {},
      },
      documents: {
        total: 0,
        byType: {},
      },
    };

    res.json({
      success: true,
      message: 'Patient documents retrieved successfully',
      data: { documents }
    });
  });

  /**
   * Search patients by advanced criteria
   */
  static advancedPatientSearch = asyncHandler(async (req: Request, res: Response) => {
    const {
      firstName,
      lastName,
      email,
      phone,
      city,
      ageMin,
      ageMax,
      gender,
      hasActiveTreatment,
      hasUpcomingAppointments,
      createdAfter,
      createdBefore,
      page = 1,
      limit = 20,
      sortBy = 'lastName',
      sortOrder = 'asc',
    } = req.query;

    // Build advanced search parameters
    const searchParams = {
      query: '', // Advanced search doesn't use simple query
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      // Add advanced filters here when implementing
    };

    const result = await PatientService.searchPatients(searchParams);

    res.json({
      success: true,
      message: 'Advanced patient search completed',
      data: result
    });
  });

  /**
   * Export patients data
   */
  static exportPatients = asyncHandler(async (req: Request, res: Response) => {
    const format = req.query.format as string || 'json';
    const includeInactive = req.query.includeInactive === 'true';

    // Get all patients for export
    const result = await PatientService.searchPatients({
      page: 1,
      limit: 10000, // Large limit for export
      isActive: !includeInactive,
    });

    if (format === 'csv') {
      // Set CSV headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=patients-export.csv');
      
      // Convert to CSV format
      const csv = convertPatientsToCSV(result.patients);
      res.send(csv);
    } else {
      // JSON export
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=patients-export.json');
      
      res.json({
        exportDate: new Date().toISOString(),
        totalPatients: result.pagination.total,
        patients: result.patients,
      });
    }

    logger.info('Patients exported', {
      format,
      count: result.patients.length,
      exportedBy: req.user!.id,
    });
  });

  /**
   * Bulk update patients
   */
  static bulkUpdatePatients = asyncHandler(async (req: Request, res: Response) => {
    const { patientIds, updateData } = req.body;

    if (!Array.isArray(patientIds) || patientIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient IDs array is required'
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Update each patient
    for (const patientId of patientIds) {
      try {
        await PatientService.updatePatient(patientId, updateData);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${patientId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    logger.info('Bulk patient update completed', {
      totalPatients: patientIds.length,
      successful: results.successful,
      failed: results.failed,
      updatedBy: req.user!.id,
    });

    res.json({
      success: results.failed === 0,
      message: `Bulk update completed. ${results.successful} successful, ${results.failed} failed.`,
      data: results
    });
  });

  /**
   * Get patient audit log
   */
  static getPatientAuditLog = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // This would require implementing an audit log system
    // For now, return a placeholder
    const auditLog = {
      patientId: id,
      logs: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
      }
    };

    res.json({
      success: true,
      message: 'Patient audit log retrieved successfully',
      data: { auditLog }
    });
  });
}

// Helper function to convert patients to CSV
function convertPatientsToCSV(patients: any[]): string {
  if (patients.length === 0) return '';

  const headers = [
    'ID',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Date of Birth',
    'Gender',
    'City',
    'Created At',
    'Is Active'
  ];

  const csvRows = [headers.join(',')];

  patients.forEach(patient => {
    const row = [
      patient.id,
      `"${patient.firstName || ''}"`,
      `"${patient.lastName || ''}"`,
      `"${patient.email || ''}"`,
      `"${patient.phone || ''}"`,
      patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
      patient.gender || '',
      `"${patient.city || ''}"`,
      new Date(patient.createdAt).toISOString(),
      patient.isActive ? 'Yes' : 'No'
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

export default PatientController;