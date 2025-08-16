"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientController = void 0;
const patient_service_js_1 = require("../services/patient.service.js");
const error_js_1 = require("../middleware/error.js");
const logger_js_1 = require("../utils/logger.js");
class PatientController {
}
exports.PatientController = PatientController;
_a = PatientController;
/**
 * Create new patient
 */
PatientController.createPatient = (0, error_js_1.asyncHandler)(async (req, res) => {
    const patientData = {
        ...req.body,
        createdBy: req.user.id,
    };
    const patient = await patient_service_js_1.PatientService.createPatient(patientData);
    logger_js_1.logger.info('Patient created', {
        patientId: patient.id,
        createdBy: req.user.id,
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
PatientController.getPatientById = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const patient = await patient_service_js_1.PatientService.getPatientById(id);
    res.json({
        success: true,
        message: 'Patient retrieved successfully',
        data: { patient }
    });
});
/**
 * Update patient
 */
PatientController.updatePatient = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const updatedPatient = await patient_service_js_1.PatientService.updatePatient(id, updateData);
    logger_js_1.logger.info('Patient updated', {
        patientId: id,
        updatedBy: req.user.id,
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
PatientController.searchPatients = (0, error_js_1.asyncHandler)(async (req, res) => {
    const searchParams = {
        query: req.query.query,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'lastName',
        sortOrder: req.query.sortOrder || 'asc',
        isActive: req.query.isActive !== 'false', // Default to active patients
    };
    const result = await patient_service_js_1.PatientService.searchPatients(searchParams);
    res.json({
        success: true,
        message: 'Patients retrieved successfully',
        data: result
    });
});
/**
 * Get all patients (paginated)
 */
PatientController.getAllPatients = (0, error_js_1.asyncHandler)(async (req, res) => {
    const searchParams = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'lastName',
        sortOrder: req.query.sortOrder || 'asc',
        isActive: req.query.isActive !== 'false',
    };
    const result = await patient_service_js_1.PatientService.searchPatients(searchParams);
    res.json({
        success: true,
        message: 'All patients retrieved successfully',
        data: result
    });
});
/**
 * Deactivate patient (soft delete)
 */
PatientController.deactivatePatient = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await patient_service_js_1.PatientService.deactivatePatient(id);
    logger_js_1.logger.info('Patient deactivated', {
        patientId: id,
        deactivatedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Patient deactivated successfully'
    });
});
/**
 * Reactivate patient
 */
PatientController.reactivatePatient = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await patient_service_js_1.PatientService.reactivatePatient(id);
    logger_js_1.logger.info('Patient reactivated', {
        patientId: id,
        reactivatedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Patient reactivated successfully'
    });
});
/**
 * Import patient from booking system
 */
PatientController.importFromBookingSystem = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.body;
    const createdBy = req.user.id;
    const patient = await patient_service_js_1.PatientService.importFromBookingSystem(bookingId, createdBy);
    logger_js_1.logger.info('Patient imported from booking system', {
        patientId: patient.id,
        bookingId,
        importedBy: req.user.id,
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
PatientController.getPatientStats = (0, error_js_1.asyncHandler)(async (req, res) => {
    const stats = await patient_service_js_1.PatientService.getPatientStats();
    res.json({
        success: true,
        message: 'Patient statistics retrieved successfully',
        data: { stats }
    });
});
/**
 * Get recent patients
 */
PatientController.getRecentPatients = (0, error_js_1.asyncHandler)(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const recentPatients = await patient_service_js_1.PatientService.getRecentPatients(limit);
    res.json({
        success: true,
        message: 'Recent patients retrieved successfully',
        data: { patients: recentPatients }
    });
});
/**
 * Get patient summary (basic info + stats)
 */
PatientController.getPatientSummary = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const patient = await patient_service_js_1.PatientService.getPatientById(id);
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
PatientController.getPatientTimeline = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;
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
PatientController.getPatientDocuments = (0, error_js_1.asyncHandler)(async (req, res) => {
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
PatientController.advancedPatientSearch = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { firstName, lastName, email, phone, city, ageMin, ageMax, gender, hasActiveTreatment, hasUpcomingAppointments, createdAfter, createdBefore, page = 1, limit = 20, sortBy = 'lastName', sortOrder = 'asc', } = req.query;
    // Build advanced search parameters
    const searchParams = {
        query: '', // Advanced search doesn't use simple query
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy: sortBy,
        sortOrder: sortOrder,
        // Add advanced filters here when implementing
    };
    const result = await patient_service_js_1.PatientService.searchPatients(searchParams);
    res.json({
        success: true,
        message: 'Advanced patient search completed',
        data: result
    });
});
/**
 * Export patients data
 */
PatientController.exportPatients = (0, error_js_1.asyncHandler)(async (req, res) => {
    const format = req.query.format || 'json';
    const includeInactive = req.query.includeInactive === 'true';
    // Get all patients for export
    const result = await patient_service_js_1.PatientService.searchPatients({
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
    }
    else {
        // JSON export
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=patients-export.json');
        res.json({
            exportDate: new Date().toISOString(),
            totalPatients: result.pagination.total,
            patients: result.patients,
        });
    }
    logger_js_1.logger.info('Patients exported', {
        format,
        count: result.patients.length,
        exportedBy: req.user.id,
    });
});
/**
 * Bulk update patients
 */
PatientController.bulkUpdatePatients = (0, error_js_1.asyncHandler)(async (req, res) => {
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
        errors: [],
    };
    // Update each patient
    for (const patientId of patientIds) {
        try {
            await patient_service_js_1.PatientService.updatePatient(patientId, updateData);
            results.successful++;
        }
        catch (error) {
            results.failed++;
            results.errors.push(`${patientId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    logger_js_1.logger.info('Bulk patient update completed', {
        totalPatients: patientIds.length,
        successful: results.successful,
        failed: results.failed,
        updatedBy: req.user.id,
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
PatientController.getPatientAuditLog = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
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
// Helper function to convert patients to CSV
function convertPatientsToCSV(patients) {
    if (patients.length === 0)
        return '';
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
exports.default = PatientController;
