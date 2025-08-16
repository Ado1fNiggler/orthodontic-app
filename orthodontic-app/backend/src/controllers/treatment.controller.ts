import { NotFoundError } from '../utils/error.handler.js';
import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/error.js';

import { logger } from '../utils/logger.js';

export class TreatmentController {
  /**
   * Create new treatment plan
   */
  static createTreatmentPlan = asyncHandler(async (req: Request, res: Response) => {
    const treatmentData = {
      ...req.body,
      createdBy: req.user!.id,
    };

    const treatmentPlan = await prisma.treatmentPlan.create({
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

    logger.info('Treatment plan created', {
      treatmentPlanId: treatmentPlan.id,
      patientId: treatmentPlan.patientId,
      createdBy: req.user!.id,
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
  static getTreatmentPlanById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const treatmentPlan = await prisma.treatmentPlan.findUnique({
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
      throw new NotFoundError('Treatment plan not found');
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
  static updateTreatmentPlan = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const updatedTreatmentPlan = await prisma.treatmentPlan.update({
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

    logger.info('Treatment plan updated', {
      treatmentPlanId: id,
      updatedFields: Object.keys(updateData),
      updatedBy: req.user!.id,
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
  static getTreatmentPlansByPatientId = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [treatmentPlans, total] = await Promise.all([
      prisma.treatmentPlan.findMany({
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
      prisma.treatmentPlan.count({ where: { patientId } })
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
  static updateTreatmentStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, actualEndDate } = req.body;

    const updateData: any = { status };
    if (actualEndDate) {
      updateData.actualEndDate = new Date(actualEndDate);
    }

    const updatedTreatmentPlan = await prisma.treatmentPlan.update({
      where: { id },
      data: updateData,
    });

    logger.info('Treatment plan status updated', {
      treatmentPlanId: id,
      newStatus: status,
      updatedBy: req.user!.id,
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
  static createTreatmentPhase = asyncHandler(async (req: Request, res: Response) => {
    const phaseData = req.body;

    const treatmentPhase = await prisma.treatmentPhase.create({
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

    logger.info('Treatment phase created', {
      treatmentPhaseId: treatmentPhase.id,
      treatmentPlanId: treatmentPhase.treatmentPlanId,
      phaseNumber: treatmentPhase.phaseNumber,
      createdBy: req.user!.id,
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
  static getTreatmentPhaseById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const treatmentPhase = await prisma.treatmentPhase.findUnique({
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
      throw new NotFoundError('Treatment phase not found');
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
  static updateTreatmentPhase = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const updatedTreatmentPhase = await prisma.treatmentPhase.update({
      where: { id },
      data: updateData,
    });

    logger.info('Treatment phase updated', {
      treatmentPhaseId: id,
      updatedFields: Object.keys(updateData),
      updatedBy: req.user!.id,
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
  static updatePhaseStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, progress, actualEndDate } = req.body;

    const updateData: any = { status, progress };
    if (actualEndDate) {
      updateData.actualEndDate = new Date(actualEndDate);
    }

    const updatedPhase = await prisma.treatmentPhase.update({
      where: { id },
      data: updateData,
    });

    logger.info('Treatment phase status updated', {
      treatmentPhaseId: id,
      newStatus: status,
      progress,
      updatedBy: req.user!.id,
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
  static getTreatmentPhasesByPlanId = asyncHandler(async (req: Request, res: Response) => {
    const { treatmentPlanId } = req.params;

    const treatmentPhases = await prisma.treatmentPhase.findMany({
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
  static createClinicalNote = asyncHandler(async (req: Request, res: Response) => {
    const noteData = {
      ...req.body,
      createdBy: req.user!.id,
    };

    const clinicalNote = await prisma.clinicalNote.create({
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

    logger.info('Clinical note created', {
      clinicalNoteId: clinicalNote.id,
      patientId: clinicalNote.patientId,
      noteType: clinicalNote.noteType,
      createdBy: req.user!.id,
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
  static getClinicalNotesByPatientId = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const noteType = req.query.noteType as string;
    const skip = (page - 1) * limit;

    const where: any = { patientId };
    if (noteType) {
      where.noteType = noteType;
    }

    const [clinicalNotes, total] = await Promise.all([
      prisma.clinicalNote.findMany({
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
      prisma.clinicalNote.count({ where })
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
  static updateClinicalNote = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const updatedNote = await prisma.clinicalNote.update({
      where: { id },
      data: updateData,
    });

    logger.info('Clinical note updated', {
      clinicalNoteId: id,
      updatedFields: Object.keys(updateData),
      updatedBy: req.user!.id,
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
  static deleteClinicalNote = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.clinicalNote.delete({
      where: { id },
    });

    logger.info('Clinical note deleted', {
      clinicalNoteId: id,
      deletedBy: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Clinical note deleted successfully'
    });
  });

  /**
   * Get treatment statistics
   */
  static getTreatmentStats = asyncHandler(async (req: Request, res: Response) => {
    const [
      totalTreatmentPlans,
      activeTreatmentPlans,
      completedTreatmentPlans,
      totalPhases,
      activePhases,
      completedPhases,
      totalClinicalNotes,
    ] = await Promise.all([
      prisma.treatmentPlan.count(),
      prisma.treatmentPlan.count({ where: { status: 'ACTIVE' } }),
      prisma.treatmentPlan.count({ where: { status: 'COMPLETED' } }),
      prisma.treatmentPhase.count(),
      prisma.treatmentPhase.count({ where: { status: 'ACTIVE' } }),
      prisma.treatmentPhase.count({ where: { status: 'COMPLETED' } }),
      prisma.clinicalNote.count(),
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
  static getTreatmentProgress = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const treatmentPlan = await prisma.treatmentPlan.findUnique({
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
      throw new NotFoundError('Treatment plan not found');
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
  static deleteTreatmentPlan = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Note: This will cascade delete phases, notes, etc. due to Prisma schema
    await prisma.treatmentPlan.delete({
      where: { id },
    });

    logger.info('Treatment plan deleted', {
      treatmentPlanId: id,
      deletedBy: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Treatment plan deleted successfully'
    });
  });

  /**
   * Delete treatment phase
   */
  static deleteTreatmentPhase = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.treatmentPhase.delete({
      where: { id },
    });

    logger.info('Treatment phase deleted', {
      treatmentPhaseId: id,
      deletedBy: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Treatment phase deleted successfully'
    });
  });
}

export default TreatmentController;