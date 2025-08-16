"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentController = void 0;
const error_handler_js_1 = require("../utils/error.handler.js");
const database_js_1 = require("../config/database.js");
const error_js_1 = require("../middleware/error.js");
const logger_js_1 = require("../utils/logger.js");
class TreatmentController {
}
exports.TreatmentController = TreatmentController;
_a = TreatmentController;
/**
 * Create new treatment plan
 */
TreatmentController.createTreatmentPlan = (0, error_js_1.asyncHandler)(async (req, res) => {
    const treatmentData = {
        ...req.body,
        createdBy: req.user.id,
    };
    const treatmentPlan = await database_js_1.prisma.treatmentPlan.create({
        data: treatmentData,
        include: {
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                }
            },
            creator: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                }
            }
        }
    });
    logger_js_1.logger.info('Treatment plan created', {
        treatmentPlanId: treatmentPlan.id,
        patientId: treatmentPlan.patientId,
        createdBy: req.user.id,
    });
    res.status(201).json({
        success: true,
        message: 'Treatment plan created successfully',
        data: { treatmentPlan }
    });
});
/**
 * Get treatment plan by ID
 */
TreatmentController.getTreatmentPlanById = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const treatmentPlan = await database_js_1.prisma.treatmentPlan.findUnique({
        where: { id },
        include: {
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                }
            },
            creator: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                }
            },
            phases: {
                orderBy: { phaseNumber: 'asc' },
                include: {
                    _count: {
                        select: {
                            photos: true,
                            clinicalNotes: true,
                            appointments: true,
                        }
                    }
                }
            },
            appointments: {
                orderBy: { appointmentDate: 'desc' },
                take: 5,
                select: {
                    id: true,
                    appointmentDate: true,
                    appointmentTime: true,
                    appointmentType: true,
                    status: true,
                }
            },
            payments: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    paymentMethod: true,
                    createdAt: true,
                }
            },
            _count: {
                select: {
                    phases: true,
                    appointments: true,
                    payments: true,
                    clinicalNotes: true,
                }
            }
        }
    });
    if (!treatmentPlan) {
        throw new error_handler_js_1.NotFoundError('Treatment plan not found');
    }
    res.json({
        success: true,
        message: 'Treatment plan retrieved successfully',
        data: { treatmentPlan }
    });
});
/**
 * Update treatment plan
 */
TreatmentController.updateTreatmentPlan = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const updatedTreatmentPlan = await database_js_1.prisma.treatmentPlan.update({
        where: { id },
        data: updateData,
        include: {
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                }
            },
            creator: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                }
            }
        }
    });
    logger_js_1.logger.info('Treatment plan updated', {
        treatmentPlanId: id,
        updatedFields: Object.keys(updateData),
        updatedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Treatment plan updated successfully',
        data: { treatmentPlan: updatedTreatmentPlan }
    });
});
/**
 * Get treatment plans by patient ID
 */
TreatmentController.getTreatmentPlansByPatientId = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [treatmentPlans, total] = await Promise.all([
        database_js_1.prisma.treatmentPlan.findMany({
            where: { patientId },
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                },
                _count: {
                    select: {
                        phases: true,
                        appointments: true,
                        payments: true,
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        database_js_1.prisma.treatmentPlan.count({ where: { patientId } })
    ]);
    res.json({
        success: true,
        message: 'Patient treatment plans retrieved successfully',
        data: {
            treatmentPlans,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            }
        }
    });
});
/**
 * Update treatment plan status
 */
TreatmentController.updateTreatmentStatus = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status, actualEndDate } = req.body;
    const updateData = { status };
    if (actualEndDate) {
        updateData.actualEndDate = new Date(actualEndDate);
    }
    const updatedTreatmentPlan = await database_js_1.prisma.treatmentPlan.update({
        where: { id },
        data: updateData,
    });
    logger_js_1.logger.info('Treatment plan status updated', {
        treatmentPlanId: id,
        newStatus: status,
        updatedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Treatment plan status updated successfully',
        data: { treatmentPlan: updatedTreatmentPlan }
    });
});
/**
 * Create treatment phase
 */
TreatmentController.createTreatmentPhase = (0, error_js_1.asyncHandler)(async (req, res) => {
    const phaseData = req.body;
    const treatmentPhase = await database_js_1.prisma.treatmentPhase.create({
        data: phaseData,
        include: {
            treatmentPlan: {
                select: {
                    id: true,
                    title: true,
                }
            },
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                }
            }
        }
    });
    logger_js_1.logger.info('Treatment phase created', {
        treatmentPhaseId: treatmentPhase.id,
        treatmentPlanId: treatmentPhase.treatmentPlanId,
        phaseNumber: treatmentPhase.phaseNumber,
        createdBy: req.user.id,
    });
    res.status(201).json({
        success: true,
        message: 'Treatment phase created successfully',
        data: { treatmentPhase }
    });
});
/**
 * Get treatment phase by ID
 */
TreatmentController.getTreatmentPhaseById = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const treatmentPhase = await database_js_1.prisma.treatmentPhase.findUnique({
        where: { id },
        include: {
            treatmentPlan: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                }
            },
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                }
            },
            photos: {
                orderBy: { uploadedAt: 'desc' },
                select: {
                    id: true,
                    filename: true,
                    cloudinaryUrl: true,
                    category: true,
                    uploadedAt: true,
                }
            },
            clinicalNotes: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    noteType: true,
                    createdAt: true,
                }
            },
            appointments: {
                orderBy: { appointmentDate: 'desc' },
                take: 5,
                select: {
                    id: true,
                    appointmentDate: true,
                    appointmentTime: true,
                    status: true,
                }
            }
        }
    });
    if (!treatmentPhase) {
        throw new error_handler_js_1.NotFoundError('Treatment phase not found');
    }
    res.json({
        success: true,
        message: 'Treatment phase retrieved successfully',
        data: { treatmentPhase }
    });
});
/**
 * Update treatment phase
 */
TreatmentController.updateTreatmentPhase = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const updatedTreatmentPhase = await database_js_1.prisma.treatmentPhase.update({
        where: { id },
        data: updateData,
    });
    logger_js_1.logger.info('Treatment phase updated', {
        treatmentPhaseId: id,
        updatedFields: Object.keys(updateData),
        updatedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Treatment phase updated successfully',
        data: { treatmentPhase: updatedTreatmentPhase }
    });
});
/**
 * Update treatment phase status and progress
 */
TreatmentController.updatePhaseStatus = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status, progress, actualEndDate } = req.body;
    const updateData = { status, progress };
    if (actualEndDate) {
        updateData.actualEndDate = new Date(actualEndDate);
    }
    const updatedPhase = await database_js_1.prisma.treatmentPhase.update({
        where: { id },
        data: updateData,
    });
    logger_js_1.logger.info('Treatment phase status updated', {
        treatmentPhaseId: id,
        newStatus: status,
        progress,
        updatedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Treatment phase status updated successfully',
        data: { treatmentPhase: updatedPhase }
    });
});
/**
 * Get treatment phases by treatment plan ID
 */
TreatmentController.getTreatmentPhasesByPlanId = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { treatmentPlanId } = req.params;
    const treatmentPhases = await database_js_1.prisma.treatmentPhase.findMany({
        where: { treatmentPlanId },
        include: {
            _count: {
                select: {
                    photos: true,
                    clinicalNotes: true,
                    appointments: true,
                }
            }
        },
        orderBy: { phaseNumber: 'asc' },
    });
    res.json({
        success: true,
        message: 'Treatment phases retrieved successfully',
        data: { treatmentPhases }
    });
});
/**
 * Create clinical note
 */
TreatmentController.createClinicalNote = (0, error_js_1.asyncHandler)(async (req, res) => {
    const noteData = {
        ...req.body,
        createdBy: req.user.id,
    };
    const clinicalNote = await database_js_1.prisma.clinicalNote.create({
        data: noteData,
        include: {
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                }
            },
            creator: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                }
            },
            treatmentPlan: {
                select: {
                    id: true,
                    title: true,
                }
            },
            treatmentPhase: {
                select: {
                    id: true,
                    title: true,
                    phaseNumber: true,
                }
            }
        }
    });
    logger_js_1.logger.info('Clinical note created', {
        clinicalNoteId: clinicalNote.id,
        patientId: clinicalNote.patientId,
        noteType: clinicalNote.noteType,
        createdBy: req.user.id,
    });
    res.status(201).json({
        success: true,
        message: 'Clinical note created successfully',
        data: { clinicalNote }
    });
});
/**
 * Get clinical notes by patient ID
 */
TreatmentController.getClinicalNotesByPatientId = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const noteType = req.query.noteType;
    const skip = (page - 1) * limit;
    const where = { patientId };
    if (noteType) {
        where.noteType = noteType;
    }
    const [clinicalNotes, total] = await Promise.all([
        database_js_1.prisma.clinicalNote.findMany({
            where,
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                },
                treatmentPlan: {
                    select: {
                        id: true,
                        title: true,
                    }
                },
                treatmentPhase: {
                    select: {
                        id: true,
                        title: true,
                        phaseNumber: true,
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        database_js_1.prisma.clinicalNote.count({ where })
    ]);
    res.json({
        success: true,
        message: 'Clinical notes retrieved successfully',
        data: {
            clinicalNotes,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            }
        }
    });
});
/**
 * Update clinical note
 */
TreatmentController.updateClinicalNote = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const updatedNote = await database_js_1.prisma.clinicalNote.update({
        where: { id },
        data: updateData,
    });
    logger_js_1.logger.info('Clinical note updated', {
        clinicalNoteId: id,
        updatedFields: Object.keys(updateData),
        updatedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Clinical note updated successfully',
        data: { clinicalNote: updatedNote }
    });
});
/**
 * Delete clinical note
 */
TreatmentController.deleteClinicalNote = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await database_js_1.prisma.clinicalNote.delete({
        where: { id },
    });
    logger_js_1.logger.info('Clinical note deleted', {
        clinicalNoteId: id,
        deletedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Clinical note deleted successfully'
    });
});
/**
 * Get treatment statistics
 */
TreatmentController.getTreatmentStats = (0, error_js_1.asyncHandler)(async (req, res) => {
    const [totalTreatmentPlans, activeTreatmentPlans, completedTreatmentPlans, totalPhases, activePhases, completedPhases, totalClinicalNotes,] = await Promise.all([
        database_js_1.prisma.treatmentPlan.count(),
        database_js_1.prisma.treatmentPlan.count({ where: { status: 'ACTIVE' } }),
        database_js_1.prisma.treatmentPlan.count({ where: { status: 'COMPLETED' } }),
        database_js_1.prisma.treatmentPhase.count(),
        database_js_1.prisma.treatmentPhase.count({ where: { status: 'ACTIVE' } }),
        database_js_1.prisma.treatmentPhase.count({ where: { status: 'COMPLETED' } }),
        database_js_1.prisma.clinicalNote.count(),
    ]);
    const stats = {
        treatmentPlans: {
            total: totalTreatmentPlans,
            active: activeTreatmentPlans,
            completed: completedTreatmentPlans,
            planning: totalTreatmentPlans - activeTreatmentPlans - completedTreatmentPlans,
        },
        treatmentPhases: {
            total: totalPhases,
            active: activePhases,
            completed: completedPhases,
        },
        clinicalNotes: {
            total: totalClinicalNotes,
        }
    };
    res.json({
        success: true,
        message: 'Treatment statistics retrieved successfully',
        data: { stats }
    });
});
/**
 * Get treatment plan progress summary
 */
TreatmentController.getTreatmentProgress = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const treatmentPlan = await database_js_1.prisma.treatmentPlan.findUnique({
        where: { id },
        include: {
            phases: {
                orderBy: { phaseNumber: 'asc' },
                select: {
                    id: true,
                    phaseNumber: true,
                    title: true,
                    status: true,
                    progress: true,
                    startDate: true,
                    estimatedEndDate: true,
                    actualEndDate: true,
                }
            }
        }
    });
    if (!treatmentPlan) {
        throw new error_handler_js_1.NotFoundError('Treatment plan not found');
    }
    // Calculate overall progress
    const totalPhases = treatmentPlan.phases.length;
    const completedPhases = treatmentPlan.phases.filter(phase => phase.status === 'COMPLETED').length;
    const overallProgress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;
    // Calculate estimated completion date based on current progress
    let estimatedCompletion = null;
    if (treatmentPlan.estimatedEndDate) {
        const totalDuration = treatmentPlan.estimatedDuration || 12; // months
        const progressRatio = overallProgress / 100;
        const elapsedMonths = totalDuration * progressRatio;
        const remainingMonths = totalDuration - elapsedMonths;
        if (remainingMonths > 0) {
            estimatedCompletion = new Date();
            estimatedCompletion.setMonth(estimatedCompletion.getMonth() + remainingMonths);
        }
    }
    const progressSummary = {
        treatmentPlanId: id,
        overallProgress,
        totalPhases,
        completedPhases,
        activePhases: treatmentPlan.phases.filter(phase => phase.status === 'ACTIVE').length,
        estimatedCompletion,
        phases: treatmentPlan.phases,
        status: treatmentPlan.status,
        startDate: treatmentPlan.startDate,
        estimatedEndDate: treatmentPlan.estimatedEndDate,
        actualEndDate: treatmentPlan.actualEndDate,
    };
    res.json({
        success: true,
        message: 'Treatment progress retrieved successfully',
        data: { progress: progressSummary }
    });
});
/**
 * Delete treatment plan (and all related data)
 */
TreatmentController.deleteTreatmentPlan = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Note: This will cascade delete phases, notes, etc. due to Prisma schema
    await database_js_1.prisma.treatmentPlan.delete({
        where: { id },
    });
    logger_js_1.logger.info('Treatment plan deleted', {
        treatmentPlanId: id,
        deletedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Treatment plan deleted successfully'
    });
});
/**
 * Delete treatment phase
 */
TreatmentController.deleteTreatmentPhase = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await database_js_1.prisma.treatmentPhase.delete({
        where: { id },
    });
    logger_js_1.logger.info('Treatment phase deleted', {
        treatmentPhaseId: id,
        deletedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Treatment phase deleted successfully'
    });
});
exports.default = TreatmentController;
