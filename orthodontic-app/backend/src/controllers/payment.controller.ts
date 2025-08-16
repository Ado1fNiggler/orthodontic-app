import { PaymentMethod, PaymentStatus } from '@prisma/client'; // <-- ΠΡΟΣΘΗΚΗ ΤΟΥ PaymentStatus
import { NotFoundError, BadRequestError } from '../utils/error.handler.js';
import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/error.js'; // <-- ΔΙΟΡΘΩΣΗ ΤΗΣ ΔΙΑΔΡΟΜΗΣ
import { logger } from '../utils/logger.js';

export class PaymentController {
  /**
   * Create new payment
   */
  static createPayment = asyncHandler(async (req: Request, res: Response) => {
    const paymentData = {
      ...req.body,
      createdBy: req.user!.id,
      paymentMethod: req.body.paymentMethod as PaymentMethod,
      status: req.body.status as PaymentStatus, // <-- ΔΙΟΡΘΩΣΗ ΤΥΠΟΥ
    };

    const payment = await prisma.payment.create({
      data: paymentData,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        treatmentPlan: { select: { id: true, title: true } }
      }
    });

    logger.info('Payment created', {
      paymentId: payment.id,
      patientId: payment.patientId,
      amount: payment.amount.toString(),
      createdBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: { payment }
    });
  });

  /**
   * Get payment by ID
   */
  static getPaymentById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        treatmentPlan: { select: { id: true, title: true, totalCost: true } }
      }
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    res.json({
      success: true,
      message: 'Payment retrieved successfully',
      data: { payment }
    });
  });

  /**
   * Update payment
   */
  static updatePayment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.paymentMethod) {
      updateData.paymentMethod = updateData.paymentMethod as PaymentMethod;
    }
    if (updateData.status) {
      updateData.status = updateData.status as PaymentStatus; // <-- ΔΙΟΡΘΩΣΗ ΤΥΠΟΥ
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        treatmentPlan: { select: { id: true, title: true } }
      }
    });

    logger.info('Payment updated', {
      paymentId: id,
      updatedFields: Object.keys(updateData),
      updatedBy: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: { payment: updatedPayment }
    });
  });

  /**
   * Update payment status
   */
  static updatePaymentStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, paidDate } = req.body;

    const updateData: any = { status: status as PaymentStatus }; // <-- ΔΙΟΡΘΩΣΗ ΤΥΠΟΥ
    if (paidDate) {
      updateData.paidDate = new Date(paidDate);
    } else if (status === 'PAID' && !paidDate) {
      updateData.paidDate = new Date();
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updateData,
    });

    logger.info('Payment status updated', {
      paymentId: id,
      newStatus: status,
      updatedBy: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: { payment: updatedPayment }
    });
  });

  /**
   * Get payments by patient ID
   */
  static getPaymentsByPatientId = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: any = { patientId };
    if (status) {
      where.status = status as PaymentStatus; // <-- ΔΙΟΡΘΩΣΗ ΤΥΠΟΥ
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          creator: { select: { id: true, firstName: true, lastName: true } },
          treatmentPlan: { select: { id: true, title: true } }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where })
    ]);

    res.json({
      success: true,
      message: 'Patient payments retrieved successfully',
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        }
      }
    });
  });

  // ... (Ο υπόλοιπος κώδικας παραμένει ο ίδιος)
  /**
   * Get payments by treatment plan ID
   */
  static getPaymentsByTreatmentPlanId = asyncHandler(async (req: Request, res: Response) => {
    const { treatmentPlanId } = req.params;

    const payments = await prisma.payment.findMany({
      where: { treatmentPlanId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate payment summary
    const summary = {
      totalAmount: payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
      paidAmount: payments
        .filter(payment => payment.status === 'PAID')
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
      pendingAmount: payments
        .filter(payment => payment.status === 'PENDING')
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
      overdueAmount: payments
        .filter(payment => payment.status === 'OVERDUE')
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
      totalPayments: payments.length,
      paidPayments: payments.filter(payment => payment.status === 'PAID').length,
      pendingPayments: payments.filter(payment => payment.status === 'PENDING').length,
      overduePayments: payments.filter(payment => payment.status === 'OVERDUE').length,
    };

    res.json({
      success: true,
      message: 'Treatment plan payments retrieved successfully',
      data: { 
        payments,
        summary
      }
    });
  });

  /**
   * Delete payment
   */
  static deletePayment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.payment.delete({
      where: { id },
    });

    logger.info('Payment deleted', {
      paymentId: id,
      deletedBy: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  });

  /**
   * Get payment statistics
   */
  static getPaymentStats = asyncHandler(async (req: Request, res: Response) => {
    const [
      totalPayments,
      paidPayments,
      pendingPayments,
      overduePayments,
      totalRevenue,
      monthlyRevenue,
      averagePayment,
    ] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'PAID' } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'OVERDUE' } }),
      prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'PAID',
          paidDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'PAID' },
        _avg: { amount: true },
      }),
    ]);

    const stats = {
      totalPayments,
      paymentsByStatus: {
        paid: paidPayments,
        pending: pendingPayments,
        overdue: overduePayments,
        cancelled: totalPayments - paidPayments - pendingPayments - overduePayments,
      },
      revenue: {
        total: Number(totalRevenue._sum.amount || 0),
        monthly: Number(monthlyRevenue._sum.amount || 0),
        average: Number(averagePayment._avg.amount || 0),
      }
    };

    res.json({
      success: true,
      message: 'Payment statistics retrieved successfully',
      data: { stats }
    });
  });

  /**
   * Get payment methods summary
   */
  static getPaymentMethodsStats = asyncHandler(async (req: Request, res: Response) => {
    const paymentMethods = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: { status: 'PAID' },
      _count: { paymentMethod: true },
      _sum: { amount: true },
    });

    const methodsStats = paymentMethods.map(method => ({
      method: method.paymentMethod,
      count: method._count.paymentMethod,
      totalAmount: Number(method._sum.amount || 0),
    }));

    res.json({
      success: true,
      message: 'Payment methods statistics retrieved successfully',
      data: { paymentMethods: methodsStats }
    });
  });

  /**
   * Get overdue payments
   */
  static getOverduePayments = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [overduePayments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          OR: [
            { status: 'OVERDUE' },
            {
              status: 'PENDING',
              dueDate: { lt: new Date() },
            },
          ],
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          treatmentPlan: { select: { id: true, title: true } }
        },
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
      }),
      prisma.payment.count({
        where: {
          OR: [
            { status: 'OVERDUE' },
            {
              status: 'PENDING',
              dueDate: { lt: new Date() },
            },
          ],
        },
      })
    ]);

    res.json({
      success: true,
      message: 'Overdue payments retrieved successfully',
      data: {
        overduePayments,
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
   * Get upcoming payments (due soon)
   */
  static getUpcomingPayments = asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 7;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const upcomingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: new Date(),
          lte: futureDate,
        },
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        treatmentPlan: { select: { id: true, title: true } }
      },
      orderBy: { dueDate: 'asc' },
    });

    res.json({
      success: true,
      message: 'Upcoming payments retrieved successfully',
      data: { upcomingPayments }
    });
  });

  /**
   * Generate payment report
   */
  static generatePaymentReport = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, patientId, treatmentPlanId, status } = req.query;

    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (treatmentPlanId) {
      where.treatmentPlanId = treatmentPlanId;
    }

    if (status) {
      where.status = status as PaymentStatus; // <-- ΔΙΟΡΘΩΣΗ ΤΥΠΟΥ
    }

    const [payments, summary] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          treatmentPlan: { select: { id: true, title: true } }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
        _avg: { amount: true },
      }),
    ]);

    const report = {
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time',
      },
      summary: {
        totalPayments: summary._count,
        totalAmount: Number(summary._sum.amount || 0),
        averageAmount: Number(summary._avg.amount || 0),
      },
      payments,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user!.id,
    };

    logger.info('Payment report generated', {
      reportPeriod: `${startDate || 'start'} to ${endDate || 'end'}`,
      totalPayments: summary._count,
      generatedBy: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Payment report generated successfully',
      data: { report }
    });
  });

  /**
   * Mark payment as paid
   */
  static markAsPaid = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { paidDate, transactionId } = req.body;

    const updateData: any = {
      status: 'PAID' as PaymentStatus, // <-- ΔΙΟΡΘΩΣΗ ΤΥΠΟΥ
      paidDate: paidDate ? new Date(paidDate) : new Date(),
    };

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updateData,
    });

    logger.info('Payment marked as paid', {
      paymentId: id,
      markedBy: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Payment marked as paid successfully',
      data: { payment: updatedPayment }
    });
  });

  /**
   * Create payment plan for treatment
   */
  static createPaymentPlan = asyncHandler(async (req: Request, res: Response) => {
    const { treatmentPlanId, totalAmount, numberOfPayments, firstPaymentDate } = req.body;

    if (!treatmentPlanId || !totalAmount || !numberOfPayments) {
      throw new BadRequestError('Treatment plan ID, total amount, and number of payments are required');
    }

    const paymentAmount = totalAmount / numberOfPayments;
    const payments = [];

    // Create individual payments
    for (let i = 0; i < numberOfPayments; i++) {
      const dueDate = new Date(firstPaymentDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      const paymentData = {
        patientId: req.body.patientId,
        treatmentPlanId,
        amount: paymentAmount,
        currency: 'EUR',
        paymentMethod: 'CASH' as PaymentMethod,
        description: `Payment ${i + 1} of ${numberOfPayments} for treatment plan`,
        status: 'PENDING' as PaymentStatus, // <-- ΔΙΟΡΘΩΣΗ ΤΥΠΟΥ
        dueDate,
        createdBy: req.user!.id,
      };

      const payment = await prisma.payment.create({
        data: paymentData,
      });

      payments.push(payment);
    }

    logger.info('Payment plan created', {
      treatmentPlanId,
      numberOfPayments,
      totalAmount,
      createdBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      message: `Payment plan created successfully with ${numberOfPayments} payments`,
      data: { payments }
    });
  });
}

export default PaymentController;